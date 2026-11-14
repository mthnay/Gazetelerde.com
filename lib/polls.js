// Anket ve tahminler
import { createHash } from 'node:crypto';
import { prisma } from '@/lib/db';

// Oy veren kimliği: üye ise kullanıcı kimliği, değilse tarayıcıdaki rastgele kimlik; tuzlanıp özetlenir
export const voterHash = ({ userId, anonId }) =>
    createHash('sha256').update(`${process.env.AUTH_SECRET || 'gazetelerde'}:oy:${userId ? `u:${userId}` : `a:${anonId}`}`).digest('hex').slice(0, 40);

export const isClosed = (p) => Boolean(p.closesAt && p.closesAt <= new Date()) || p.correctId != null;

// İstemciye giden görünüm; sonuçlar yalnızca uygun durumda gösterilir
export async function pollView(id, voter) {
    const p = await prisma.poll.findUnique({
        where: { id },
        include: { options: { orderBy: [{ sort: 'asc' }, { id: 'asc' }] }, article: { select: { slug: true, title: true } } },
    });
    if (!p) return null;
    const vote = voter ? await prisma.pollVote.findUnique({ where: { pollId_voterHash: { pollId: id, voterHash: voter } }, select: { optionId: true } }) : null;
    const closed = isClosed(p);
    const total = p.options.reduce((n, o) => n + o.votes, 0);
    const reveal = closed || (p.showResults === 'oy-sonrasi' && Boolean(vote));
    return {
        id: p.id, question: p.question, kind: p.kind, closed, closesAt: p.closesAt?.toISOString() ?? null,
        total: reveal ? total : null, myVote: vote?.optionId ?? null, correctId: p.correctId,
        article: p.article, matchId: p.matchId,
        options: p.options.map((o) => ({ id: o.id, text: o.text, votes: reveal ? o.votes : null })),
    };
}

// Voleybol set skoru tahmini seçenekleri (ev sahibi açısından)
export const SCORE_OPTIONS = ['3-0', '3-1', '3-2', '2-3', '1-3', '0-3'];

// Maç bitince bağlı tahminleri sonuçlandır.
//   tahmin: seçenek sırası 0 ev sahibi, 1 deplasman, 2 beraberlik
//   skor  : seçenek sırası SCORE_OPTIONS dizisindeki sıra
export async function resolveMatchPolls(match) {
    if (match.status !== 'FINISHED' || match.homeScore == null || match.awayScore == null) return;
    const winnerIdx = match.homeScore > match.awayScore ? 0 : match.awayScore > match.homeScore ? 1 : 2;
    const scoreIdx = SCORE_OPTIONS.indexOf(`${match.homeScore}-${match.awayScore}`);
    const polls = await prisma.poll.findMany({ where: { matchId: match.id, kind: { in: ['tahmin', 'skor'] }, correctId: null }, include: { options: { orderBy: { sort: 'asc' } } } });
    for (const p of polls) {
        const opt = p.options.find((o) => o.sort === (p.kind === 'skor' ? scoreIdx : winnerIdx));
        if (opt) await prisma.poll.update({ where: { id: p.id }, data: { correctId: opt.id } });
    }
}

// Maç için tahmin soruları (kazanan + voleybolda set skoru); varsa dokunmaz
export async function ensureMatchPolls(m) {
    const existing = await prisma.poll.findMany({ where: { matchId: m.id }, select: { kind: true } });
    const has = new Set(existing.map((p) => p.kind));
    let created = 0;
    if (!has.has('tahmin')) {
        const options = [`${m.home.name} kazanır`, `${m.away.name} kazanır`, ...(m.league?.sport === 'futbol' ? ['Berabere'] : [])];
        await prisma.poll.create({ data: { question: `${m.home.name} - ${m.away.name}: kim kazanır?`, kind: 'tahmin', matchId: m.id, articleId: m.articleId ?? null, closesAt: m.startAt, options: { create: options.map((text, sort) => ({ text, sort })) } } });
        created++;
    }
    if (!has.has('skor') && (m.league?.sport ?? 'voleybol') === 'voleybol') {
        await prisma.poll.create({
            data: {
                question: `${m.home.name} - ${m.away.name}: set skoru kaç olur?`, kind: 'skor', matchId: m.id, closesAt: m.startAt, showResults: 'oy-sonrasi',
                options: { create: SCORE_OPTIONS.map((text, sort) => ({ text: `${text} (${Number(text[0]) > Number(text[2]) ? m.home.name : m.away.name})`, sort })) },
            },
        });
        created++;
    }
    return created;
}
