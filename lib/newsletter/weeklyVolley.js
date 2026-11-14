// Her pazartesi sabahı "Haftanın voleybol özeti" bülten taslağı (NEWSLETTER_VOLLEY=off ile kapatılır)
import { prisma } from '@/lib/db';
import { getFeaturedStandings } from '@/lib/matchCenter';

function istanbulNow() {
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Istanbul', weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' }).formatToParts(new Date()).map((x) => [x.type, x.value]));
    return { weekday: p.weekday, hour: Number(p.hour), day: `${p.year}-${p.month}-${p.day}` };
}

export async function maybeCreateWeeklyVolley() {
    if (process.env.NEWSLETTER_VOLLEY === 'off') return null;
    const now = istanbulNow();
    if (now.weekday !== 'Mon' || now.hour < 8) return null;
    const subject = `Haftanın voleybol özeti · ${new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', timeZone: 'Europe/Istanbul' }).format(new Date())}`;
    if (await prisma.newsletterIssue.findFirst({ where: { subject, }, select: { id: true } })) return null;

    const since = new Date(Date.now() - 7 * 864e5);
    const [articles, matches, standings] = await Promise.all([
        prisma.article.findMany({
            where: { status: 'PUBLISHED', publishedAt: { gte: since, lte: new Date() }, tags: { some: { tag: { slug: 'voleybol' } } } },
            orderBy: [{ viewCount: 'desc' }, { publishedAt: 'desc' }], take: 8, select: { id: true },
        }),
        prisma.match.count({ where: { status: 'FINISHED', startAt: { gte: since }, league: { sport: 'voleybol' } } }),
        getFeaturedStandings(2),
    ]);
    if (!articles.length && !matches) return null;
    // Giriş metni yalnızca veriden: oynanan maç sayısı ve liderler
    const leaders = standings.map((s) => `${s.league.name}'nde lider ${s.standings[0].team.name} (${s.standings[0].points} puan)`).join('; ');
    const intro = `Günaydın! Geçen hafta ${matches} voleybol maçı oynandı.${leaders ? ` ${leaders}.` : ''} Haftanın öne çıkan voleybol haberlerini ve puan durumlarını sizin için derledik.`;
    return prisma.newsletterIssue.create({
        data: { auto: true, subject, preheader: leaders.slice(0, 140), intro, articleIds: articles.map((a) => a.id), status: 'DRAFT' },
    });
}
