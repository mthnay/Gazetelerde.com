// Bülten iş mantığı: onay e-postası, sayı içeriği, kuyruk işleyici ve otomatik sabah bülteni.
// instrumentation.js ve route'lar tarafından kullanılır; Next'e özgü bir şey içermez.
import { prisma } from '@/lib/db';
import { absoluteUrl } from '@/lib/site';
import { sendMail, mailMode } from '@/lib/mail/mailer';
import { confirmEmail, newsletterEmail } from '@/lib/mail/templates';

export const MAX_ARTICLES = 12;
const unsubscribeUrl = (token) => absoluteUrl(`/bulten/iptal?t=${encodeURIComponent(token)}`);

function unsubscribeHeaders(token) {
    // Gmail / Yahoo toplu gönderim kuralları: tek tıkla abonelikten çıkma (RFC 8058)
    return {
        'List-Unsubscribe': `<${absoluteUrl(`/api/newsletter/unsubscribe?t=${encodeURIComponent(token)}`)}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    };
}

// ---------------------------------------------------------------- Abonelik onayı
export async function sendConfirmation(subscriber) {
    // Aynı adrese 10 dakikada bir onay e-postasından fazlası gitmesin
    if (subscriber.confirmSentAt && Date.now() - subscriber.confirmSentAt.getTime() < 10 * 60 * 1000) return false;
    const mail = confirmEmail({ confirmUrl: absoluteUrl(`/bulten/onay?t=${encodeURIComponent(subscriber.token)}`) });
    await sendMail({ to: subscriber.email, ...mail });
    await prisma.subscriber.update({ where: { id: subscriber.id }, data: { confirmSentAt: new Date() } });
    return true;
}

// ---------------------------------------------------------------- Sayı içeriği
export async function loadIssueArticles(ids) {
    if (!ids?.length) return [];
    const rows = await prisma.article.findMany({
        where: { id: { in: ids }, status: 'PUBLISHED' },
        select: { id: true, slug: true, title: true, summary: true, image: true, category: { select: { label: true } } },
    });
    const byId = new Map(rows.map((r) => [r.id, { ...r, category: r.category.label }]));
    return ids.map((id) => byId.get(id)).filter(Boolean); // editörün seçtiği sıra korunur
}

export async function renderIssue(issue, token = 'onizleme') {
    const articles = await loadIssueArticles(issue.articleIds);
    return newsletterEmail({ issue, articles, unsubscribeUrl: unsubscribeUrl(token), viewUrl: absoluteUrl(`/bulten/sayi/${issue.id}`) });
}

// Gündem önerisi: son 24 saatin manşetleri, çok okunanlar ve her kategoriden en yeni haber
export async function suggestArticleIds(limit = 8) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const base = { status: 'PUBLISHED', publishedAt: { lte: new Date() } };
    const recent = await prisma.article.findMany({
        where: { ...base, publishedAt: { gte: since, lte: new Date() } },
        orderBy: [{ featured: 'desc' }, { breaking: 'desc' }, { viewCount: 'desc' }, { publishedAt: 'desc' }],
        take: 40, select: { id: true, categoryId: true },
    });
    const pool = recent.length >= 4 ? recent : await prisma.article.findMany({
        where: base, orderBy: { publishedAt: 'desc' }, take: 40, select: { id: true, categoryId: true },
    });
    // Önce her kategoriden bir haber (çeşitlilik), sonra kalanlar sırayla
    const picked = [], seenCat = new Set();
    for (const a of pool) if (!seenCat.has(a.categoryId)) { seenCat.add(a.categoryId); picked.push(a.id); }
    const ordered = [pool[0]?.id, ...picked, ...pool.map((a) => a.id)].filter((id) => id != null);
    return [...new Set(ordered)].slice(0, limit);
}

// ---------------------------------------------------------------- Test gönderimi
export async function sendTest(issue, to) {
    const mail = await renderIssue(issue);
    await sendMail({ to, ...mail, subject: `[TEST] ${mail.subject}` });
}

// ---------------------------------------------------------------- Kuyruk işleyici
const perMinute = () => Math.max(1, Number(process.env.MAIL_RATE_PER_MINUTE) || 60);
const MAX_ATTEMPTS = 3;

// Zamanı gelen sayıyı SENDING'e alır ve alıcı listesini o anki onaylı abonelerden dondurur
async function startDueIssues() {
    const due = await prisma.newsletterIssue.findMany({
        where: { status: 'SCHEDULED', scheduledAt: { lte: new Date() } }, select: { id: true },
    });
    for (const { id } of due) {
        // Koşullu güncelleme: birden çok süreç olsa da yalnızca biri başlatır
        const claimed = await prisma.newsletterIssue.updateMany({
            where: { id, status: 'SCHEDULED' }, data: { status: 'SENDING', startedAt: new Date() },
        });
        if (!claimed.count) continue;
        const subs = await prisma.subscriber.findMany({
            where: { active: true, confirmedAt: { not: null } }, select: { id: true },
        });
        if (subs.length) {
            await prisma.newsletterDelivery.createMany({
                data: subs.map((s) => ({ issueId: id, subscriberId: s.id })), skipDuplicates: true,
            });
        }
        await prisma.newsletterIssue.update({ where: { id }, data: { recipients: subs.length } });
    }
}

async function sendBatch() {
    const issue = await prisma.newsletterIssue.findFirst({ where: { status: 'SENDING' }, orderBy: { startedAt: 'asc' } });
    if (!issue) return null;
    const articles = await loadIssueArticles(issue.articleIds);
    const batch = await prisma.newsletterDelivery.findMany({
        where: { issueId: issue.id, status: 'PENDING' },
        take: perMinute(),
        include: { subscriber: { select: { email: true, token: true, active: true } } },
    });
    let sent = 0, failed = 0;
    for (const d of batch) {
        const key = { issueId_subscriberId: { issueId: d.issueId, subscriberId: d.subscriberId } };
        if (!d.subscriber.active) { // gönderim sürerken abonelikten çıkanlar atlanır
            await prisma.newsletterDelivery.update({ where: key, data: { status: 'FAILED', error: 'Abonelikten çıktı' } });
            failed++;
            continue;
        }
        try {
            const mail = newsletterEmail({
                issue: { ...issue, sentAt: issue.startedAt }, articles,
                unsubscribeUrl: unsubscribeUrl(d.subscriber.token), viewUrl: absoluteUrl(`/bulten/sayi/${issue.id}`),
            });
            await sendMail({ to: d.subscriber.email, ...mail, headers: unsubscribeHeaders(d.subscriber.token) });
            await prisma.newsletterDelivery.update({ where: key, data: { status: 'SENT', sentAt: new Date(), attempts: { increment: 1 }, error: null } });
            sent++;
        } catch (e) {
            const attempts = d.attempts + 1;
            await prisma.newsletterDelivery.update({
                where: key,
                data: { attempts, error: String(e?.message || e).slice(0, 300), status: attempts >= MAX_ATTEMPTS ? 'FAILED' : 'PENDING' },
            });
            if (attempts >= MAX_ATTEMPTS) failed++;
        }
    }
    const [s, f, pending] = await Promise.all([
        prisma.newsletterDelivery.count({ where: { issueId: issue.id, status: 'SENT' } }),
        prisma.newsletterDelivery.count({ where: { issueId: issue.id, status: 'FAILED' } }),
        prisma.newsletterDelivery.count({ where: { issueId: issue.id, status: 'PENDING' } }),
    ]);
    await prisma.newsletterIssue.update({
        where: { id: issue.id },
        data: { sentCount: s, failedCount: f, ...(pending === 0 ? { status: 'SENT', sentAt: new Date() } : {}) },
    });
    return { issueId: issue.id, sent, failed, pending };
}

// ---------------------------------------------------------------- Otomatik sabah bülteni
// NEWSLETTER_AUTO=draft -> her sabah taslak hazırlar (editör onaylayıp gönderir)
// NEWSLETTER_AUTO=send  -> hazırlayıp doğrudan gönderir
// NEWSLETTER_DAILY_AT=08:00 (İstanbul saati)
function istanbulNow() {
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Istanbul', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(new Date()).map((p) => [p.type, p.value]));
    return { day: `${parts.year}-${parts.month}-${parts.day}`, minutes: Number(parts.hour) * 60 + Number(parts.minute) };
}

export async function maybeCreateDailyIssue() {
    const mode = process.env.NEWSLETTER_AUTO;
    if (mode !== 'draft' && mode !== 'send') return null;
    const [h, m] = String(process.env.NEWSLETTER_DAILY_AT || '08:00').split(':').map(Number);
    const now = istanbulNow();
    if (now.minutes < (h || 0) * 60 + (m || 0)) return null;
    // Bugün (İstanbul) için otomatik sayı zaten varsa yeniden oluşturma
    const startOfDay = new Date(`${now.day}T00:00:00+03:00`);
    const exists = await prisma.newsletterIssue.findFirst({ where: { auto: true, createdAt: { gte: startOfDay } }, select: { id: true } });
    if (exists) return null;
    const articleIds = await suggestArticleIds(8);
    if (!articleIds.length) return null;
    const date = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', weekday: 'long', timeZone: 'Europe/Istanbul' }).format(new Date());
    const lead = (await loadIssueArticles(articleIds.slice(0, 1)))[0];
    return prisma.newsletterIssue.create({
        data: {
            auto: true,
            subject: `Sabah bülteni · ${date}`,
            preheader: lead?.title?.slice(0, 140) || '',
            intro: 'Günaydın! Bugün gündemde öne çıkan haberleri sizin için derledik.',
            articleIds,
            status: mode === 'send' ? 'SCHEDULED' : 'DRAFT',
            scheduledAt: mode === 'send' ? new Date() : null,
        },
    });
}

// Dakikada bir çağrılır
export async function newsletterTick() {
    if (mailMode() === 'off') return null;
    await maybeCreateDailyIssue();
    await startDueIssues();
    return sendBatch();
}
