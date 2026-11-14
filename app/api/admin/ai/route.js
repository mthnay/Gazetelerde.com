import { prisma } from '@/lib/db';
import { ok, fail, readJson, rateLimit } from '@/lib/api';
import { requireStaff } from '@/lib/adminApi';
import { runAi, articleText, AiError, AI_TASKS, MAX_CHARS, aiEnabled } from '@/lib/ai';

export const maxDuration = 120;

export async function GET() {
    const { error } = await requireStaff();
    if (error) return error;
    return ok({ enabled: aiEnabled() });
}

// { task, title, summary, content, sourceUrl } ya da mac-ozeti için { task, articleId }
export async function POST(request) {
    const { user, error } = await requireStaff();
    if (error) return error;
    if (!rateLimit(`ai:${user.id}`, 40, 60 * 60 * 1000)) return fail('Saatlik yapay zekâ kullanım sınırına ulaştınız.', 429);
    const b = (await readJson(request)) || {};
    if (!AI_TASKS.includes(b.task)) return fail('Bilinmeyen görev.');

    let text;
    const extra = {};
    if (b.task === 'mac-ozeti') {
        const id = Number(b.articleId);
        const [entries, match] = await Promise.all([
            prisma.liveEntry.findMany({ where: { articleId: id }, orderBy: { createdAt: 'asc' }, select: { text: true, kind: true, createdAt: true } }),
            prisma.match.findFirst({ where: { articleId: id }, select: { homeScore: true, awayScore: true, sets: true, home: { select: { name: true } }, away: { select: { name: true } }, league: { select: { name: true } } } }),
        ]);
        if (entries.length < 3) return fail('Özet için en az 3 canlı anlatım girişi gerekli.');
        const hm = (d) => new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' }).format(d);
        text = [
            match && `Maç: ${match.home.name} - ${match.away.name} (${match.league.name})${match.homeScore != null ? `, skor ${match.homeScore}-${match.awayScore}` : ''}${Array.isArray(match.sets) && match.sets.length ? `, setler ${match.sets.map((s) => s.join('-')).join(', ')}` : ''}`,
            'Canlı anlatım notları:', ...entries.map((e) => `[${hm(e.createdAt)}]${e.kind !== 'normal' ? ` (${e.kind})` : ''} ${e.text}`),
        ].filter(Boolean).join('\n');
    } else {
        text = articleText({ title: String(b.title || ''), summary: String(b.summary || ''), content: String(b.content || '') });
        if (text.length < 80) return fail('Önce biraz metin yazın; yapay zekâ boş haberle çalışamaz.');
        if (b.task === 'etiket') {
            const [cats, tags] = await Promise.all([
                prisma.category.findMany({ select: { slug: true, label: true } }),
                prisma.tag.findMany({ orderBy: { articles: { _count: 'desc' } }, take: 80, select: { name: true } }),
            ]);
            extra.categories = cats.map((c) => c.label);
            extra.knownTags = tags.map((t) => t.name);
            extra.catMap = Object.fromEntries(cats.map((c) => [c.label.toLocaleLowerCase('tr'), c.slug]));
        }
        if (b.task === 'taslak' && /^https?:\/\//.test(String(b.sourceUrl || ''))) extra.sourceUrl = String(b.sourceUrl).slice(0, 300);
    }
    if (text.length > MAX_CHARS) return fail(`Metin çok uzun (${text.length} karakter). En fazla ${MAX_CHARS} karakterlik bir bölümle deneyin.`, 413);

    try {
        const result = await runAi(b.task, { text, ...extra }, user.id);
        if (b.task === 'etiket') result.categorySlug = extra.catMap[String(result.category || '').toLocaleLowerCase('tr')] || null;
        return ok({ result });
    } catch (e) {
        if (e instanceof AiError) return fail(e.message, 502);
        throw e;
    }
}
