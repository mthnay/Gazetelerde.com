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

// Maç bitince bağlı tahminleri sonuçlandır (seçenek sırası: 0 ev sahibi, 1 deplasman, 2 beraberlik)
export async function resolveMatchPolls(match) {
    if (match.status !== 'FINISHED' || match.homeScore == null || match.awayScore == null) return;
    const idx = match.homeScore > match.awayScore ? 0 : match.awayScore > match.homeScore ? 1 : 2;
    const polls = await prisma.poll.findMany({ where: { matchId: match.id, kind: 'tahmin', correctId: null }, include: { options: { orderBy: { sort: 'asc' } } } });
    for (const p of polls) {
        const opt = p.options.find((o) => o.sort === idx);
        if (opt) await prisma.poll.update({ where: { id: p.id }, data: { correctId: opt.id } });
    }
}
