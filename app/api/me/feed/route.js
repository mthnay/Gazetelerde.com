import { prisma } from '@/lib/db';
import { ok, fail } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import { toMatch } from '@/lib/matchCenter';

const cardSelect = {
    id: true, slug: true, title: true, summary: true, image: true, publishedAt: true, featured: true, sponsored: true, format: true,
    authorName: true, author: { select: { name: true } }, category: { select: { slug: true, label: true } },
};
const toCard = (a) => ({
    id: a.id, slug: a.slug, title: a.title, summary: a.summary, img: a.image, featured: a.featured, sponsored: a.sponsored, format: a.format,
    publishedAt: a.publishedAt?.toISOString() ?? null, author: a.authorName || a.author?.name || 'Gazetelerde', category: a.category.slug, categoryLabel: a.category.label,
});

// "Sizin için": takip edilen takımların maçları ve haberleri + takip edilen kategorilerin son haberleri
export async function GET() {
    const me = await getCurrentUser();
    if (!me) return fail('Giriş yapmalısınız.', 401);
    const [teams, cats] = await Promise.all([
        prisma.teamFollow.findMany({ where: { userId: me.id }, select: { team: { select: { id: true, name: true, shortName: true, league: { select: { slug: true, name: true } } } } } }),
        prisma.categoryFollow.findMany({ where: { userId: me.id }, select: { categoryId: true, category: { select: { slug: true, label: true } } } }),
    ]);
    const teamIds = teams.map((t) => t.team.id);
    const now = new Date();
    const pub = { status: 'PUBLISHED', publishedAt: { lte: now, gte: new Date(now.getTime() - 14 * 864e5) } };
    // Takım haberleri: başlık ya da özette takım adının ana kısmı geçenler (ör. "Fenerbahçe Medicana" -> "Fenerbahçe")
    const names = [...new Set(teams.map((t) => t.team.name.split(' ')[0]).filter((n) => n.length >= 4))].slice(0, 15);
    const [matches, teamNews, catNews] = await Promise.all([
        teamIds.length ? prisma.match.findMany({
            where: { OR: [{ homeId: { in: teamIds } }, { awayId: { in: teamIds } }], startAt: { gte: new Date(now.getTime() - 3 * 864e5), lte: new Date(now.getTime() + 10 * 864e5) } },
            orderBy: { startAt: 'asc' }, take: 8,
            select: {
                id: true, startAt: true, week: true, venue: true, status: true, homeScore: true, awayScore: true, sets: true,
                home: { select: { id: true, name: true, shortName: true, logo: true } }, away: { select: { id: true, name: true, shortName: true, logo: true } },
                league: { select: { slug: true, name: true, sport: true } }, article: { select: { slug: true, live: true, status: true } },
            },
        }) : [],
        names.length ? prisma.article.findMany({
            where: { ...pub, OR: names.flatMap((n) => [{ title: { contains: n, mode: 'insensitive' } }, { summary: { contains: n, mode: 'insensitive' } }]) },
            orderBy: { publishedAt: 'desc' }, take: 8, select: cardSelect,
        }) : [],
        cats.length ? prisma.article.findMany({ where: { ...pub, categoryId: { in: cats.map((c) => c.categoryId) } }, orderBy: { publishedAt: 'desc' }, take: 12, select: cardSelect }) : [],
    ]);
    const seen = new Set();
    const articles = [...teamNews, ...catNews].filter((a) => !seen.has(a.id) && seen.add(a.id)).slice(0, 12).map(toCard);
    return ok({
        teams: teams.map((t) => t.team), categories: cats.map((c) => c.category),
        matches: matches.map(toMatch), articles,
    });
}
