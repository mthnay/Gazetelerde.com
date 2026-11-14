// Web push (tarayıcı bildirimleri). VAPID anahtarları yoksa sessizce kapalıdır.
import webpush from 'web-push';
import { prisma } from '@/lib/db';
import { absoluteUrl } from '@/lib/site';

export const pushEnabled = () => Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
let configured = false;
function setup() {
    if (configured) return;
    webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:iletisim@gazetelerde.com', process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
    configured = true;
}

// Son dakika olarak yayınlanan haber için bildirim kuyruğa alınır (her haber için en fazla bir kez)
export async function queueArticlePush(articleId) {
    if (!pushEnabled()) return null;
    const a = await prisma.article.findUnique({
        where: { id: articleId },
        select: { id: true, slug: true, title: true, summary: true, status: true, breaking: true, publishedAt: true },
    });
    if (!a || a.status !== 'PUBLISHED' || !a.breaking || !a.publishedAt || a.publishedAt > new Date()) return null;
    // Eski bir haber sonradan "son dakika" işaretlenirse bildirim gitmesin
    if (Date.now() - a.publishedAt.getTime() > 6 * 60 * 60 * 1000) return null;
    return prisma.pushMessage.upsert({
        where: { articleId: a.id }, update: {},
        create: { articleId: a.id, title: `Son dakika: ${a.title}`.slice(0, 120), body: a.summary.slice(0, 180), url: `/haber/${a.slug}` },
    });
}

// Gönderilmemiş (sent=0, failed=0) mesajları tüm abonelere yollar. Dakikada bir çağrılır.
export async function sendPendingPushes() {
    if (!pushEnabled()) return null;
    setup();
    const msg = await prisma.pushMessage.findFirst({ where: { sentAt: null, createdAt: { gte: new Date(Date.now() - 6 * 60 * 60 * 1000) } }, orderBy: { createdAt: 'asc' } });
    if (!msg) return null;
    // Koşullu işaretleme: aynı mesajı iki tur birden göndermesin
    const claimed = await prisma.pushMessage.updateMany({ where: { id: msg.id, sentAt: null }, data: { sentAt: new Date() } });
    if (!claimed.count) return null;
    // Takım bildirimi ise yalnızca o takımları takip eden üyelerin tarayıcılarına
    const subs = msg.teamIds?.length
        ? await prisma.pushSubscription.findMany({ where: { userId: { in: (await prisma.teamFollow.findMany({ where: { teamId: { in: msg.teamIds } }, select: { userId: true } })).map((f) => f.userId) } } })
        : await prisma.pushSubscription.findMany();
    const payload = JSON.stringify({ title: msg.title, body: msg.body, url: absoluteUrl(msg.url), tag: `haber-${msg.articleId ?? msg.id}` });
    let sent = 0, failed = 0;
    for (let i = 0; i < subs.length; i += 50) {
        await Promise.all(subs.slice(i, i + 50).map(async (s) => {
            try {
                await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 6 * 60 * 60, urgency: 'high' });
                sent++;
                await prisma.pushSubscription.update({ where: { id: s.id }, data: { failures: 0, lastSentAt: new Date() } });
            } catch (e) {
                failed++;
                // 404/410: abonelik tarayıcıda iptal edilmiş -> sil; diğer hatalarda 5 denemeden sonra sil
                if (e?.statusCode === 404 || e?.statusCode === 410 || s.failures >= 4) await prisma.pushSubscription.delete({ where: { id: s.id } }).catch(() => {});
                else await prisma.pushSubscription.update({ where: { id: s.id }, data: { failures: { increment: 1 } } });
            }
        }));
    }
    await prisma.pushMessage.update({ where: { id: msg.id }, data: { sent, failed } });
    return { id: msg.id, sent, failed };
}

// Maç başladı / bitti bildirimi (yalnızca takımları takip edenlere)
export async function queueMatchPush(match, before) {
    if (!pushEnabled() || before === match.status || !['LIVE', 'FINISHED'].includes(match.status)) return;
    const m = await prisma.match.findUnique({
        where: { id: match.id },
        select: { homeId: true, awayId: true, homeScore: true, awayScore: true, home: { select: { name: true } }, away: { select: { name: true } }, league: { select: { slug: true, name: true } }, article: { select: { slug: true, status: true } } },
    });
    if (!m) return;
    const live = match.status === 'LIVE';
    const score = m.homeScore != null ? ` ${m.homeScore}-${m.awayScore} ` : ' - ';
    const title = live ? `Maç başladı: ${m.home.name} - ${m.away.name}` : `Maç sonucu: ${m.home.name}${score}${m.away.name}`;
    // Editör son sayıyı geri alıp yeniden girerse aynı bildirim ikinci kez gitmesin
    if (await prisma.pushMessage.findFirst({ where: { title, createdAt: { gte: new Date(Date.now() - 6 * 3600e3) } }, select: { id: true } })) return;
    await prisma.pushMessage.create({
        data: {
            title,
            body: live ? `${m.league.name} · Canlı takip için dokunun.` : `${m.league.name} · Ayrıntılar ve puan durumu için dokunun.`,
            url: m.article?.status === 'PUBLISHED' ? `/haber/${m.article.slug}` : `/mac-merkezi/${m.league.slug}`,
            teamIds: [m.homeId, m.awayId],
        },
    });
}
