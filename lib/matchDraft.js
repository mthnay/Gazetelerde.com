// Maç bitince yapay zekâyla maç sonu haber taslağı (yayınlanmaz; editör onaylar)
import { prisma } from '@/lib/db';
import { aiEnabled, runAi } from '@/lib/ai';
import { getLeague } from '@/lib/matchCenter';
import { slugify } from '@/lib/slug';

const esc = (x) => String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Maçın ligine göre haberin düşeceği kategori: ilk bulunan kullanılır, en sonda 'spor'
export function categorySlugsFor(league) {
    const out = [];
    if ((league?.sport || 'voleybol') === 'voleybol') {
        if (league?.kind === 'avrupa') out.push('avrupa-kupalari');
        else if (league?.kind === 'milli') out.push('milli-takimlar');
        else if (league?.gender === 'erkek') out.push('efeler-ligi');
        else out.push('sultanlar-ligi');
    }
    out.push('spor');
    return out;
}

async function findCategory(slugs) {
    const found = await prisma.category.findMany({ where: { slug: { in: slugs } }, select: { id: true, slug: true } });
    return slugs.map((x) => found.find((c) => c.slug === x)).find(Boolean)
        || await prisma.category.findFirst({ orderBy: { sortOrder: 'asc' }, select: { id: true } });
}

export async function draftMatchReport(matchId) {
    if (!aiEnabled()) return null;
    // Aynı maç için iki kez taslak oluşmasın (koşullu işaretleme)
    const claimed = await prisma.match.updateMany({ where: { id: matchId, draftedAt: null, status: 'FINISHED' }, data: { draftedAt: new Date() } });
    if (!claimed.count) return null;
    const m = await prisma.match.findUnique({
        where: { id: matchId },
        include: {
            home: true, away: true, league: true, article: { select: { status: true } },
            stats: { orderBy: { points: 'desc' }, include: { player: { select: { name: true } } } },
        },
    });
    if (!m || m.article?.status === 'PUBLISHED') return null; // zaten yayımlanmış maç haberi var
    const table = (await getLeague(m.league.slug))?.standings || [];
    const pos = (id) => { const i = table.findIndex((r) => r.team.id === id); return i < 0 ? 'bilinmiyor' : `${i + 1}. sıra, ${table[i].points} puan (${table[i].won}G ${table[i].lost}M)`; };
    const sets = Array.isArray(m.sets) ? m.sets : [];
    const text = [
        `Lig: ${m.league.name} ${m.league.season}${m.round ? `, ${m.round}` : m.week ? `, ${m.week}. hafta` : ''}`,
        `Maç: ${m.home.name} (ev sahibi) - ${m.away.name}`,
        `Sonuç: ${m.homeScore}-${m.awayScore}`,
        sets.length ? `Setler: ${sets.map((x, i) => `${i + 1}. set ${x[0]}-${x[1]}`).join(', ')}` : '',
        m.venue ? `Salon: ${m.venue}` : '',
        m.stats.length ? `İstatistikler: ${m.stats.slice(0, 8).map((x) => `${x.player.name} (${x.side === 'home' ? m.home.name : m.away.name}) ${x.points} sayı, ${x.block} blok, ${x.ace} servis ası${x.mvp ? ', maçın oyuncusu' : ''}`).join('; ')}` : 'Oyuncu istatistiği girilmedi.',
        `Maç sonrası puan durumu: ${m.home.name} ${pos(m.homeId)}; ${m.away.name} ${pos(m.awayId)}`,
    ].filter(Boolean).join('\n');

    let r;
    try {
        r = await runAi('mac-sonu', { text }, null);
    } catch (e) {
        await prisma.match.update({ where: { id: matchId }, data: { draftedAt: null } }); // sonra tekrar denenebilsin
        console.error('[maç sonu taslağı]', e?.message);
        return null;
    }
    const category = await findCategory(categorySlugsFor(m.league));
    const base = slugify(r.title) || `mac-${matchId}`;
    const slug = (await prisma.article.findUnique({ where: { slug: base }, select: { id: true } })) ? `${base}-${matchId}` : base;
    const article = await prisma.article.create({
        data: {
            title: r.title.slice(0, 200), summary: r.summary.slice(0, 500), slug, status: 'REVIEW', categoryId: category.id,
            content: r.paragraphs.map((p) => `<p>${esc(p)}</p>`).join(''),
            authorName: 'Gazetelerde Spor',
            reviewNote: 'Yapay zekâ taslağıdır: maç verilerinden üretildi. Yayından önce skorları ve isimleri kontrol edin.',
        },
        select: { id: true, title: true },
    });
    if (!m.articleId) await prisma.match.update({ where: { id: matchId }, data: { articleId: article.id } });
    // Etiketler: voleybol + takımlar
    for (const name of ['Voleybol', m.home.name, m.away.name]) {
        const tslug = slugify(name);
        const tag = await prisma.tag.upsert({ where: { slug: tslug }, update: {}, create: { slug: tslug, name } });
        await prisma.articleTag.upsert({ where: { articleId_tagId: { articleId: article.id, tagId: tag.id } }, update: {}, create: { articleId: article.id, tagId: tag.id } });
    }
    const editors = await prisma.user.findMany({ where: { role: { in: ['EDITOR', 'ADMIN'] } }, select: { id: true } });
    await prisma.userNotification.createMany({ data: editors.map((e) => ({ userId: e.id, type: 'onay', text: `Maç sonu haber taslağı hazır: “${article.title.slice(0, 70)}”`, url: `/admin/haberler/${article.id}` })) });
    return article;
}
