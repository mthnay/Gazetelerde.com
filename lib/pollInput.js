import { prisma } from '@/lib/db';

export async function parsePoll(b) {
    const question = String(b.question || '').trim().slice(0, 200);
    if (question.length < 5) return { error: 'Soru en az 5 karakter olmalı.' };
    const kind = b.kind === 'tahmin' ? 'tahmin' : 'anket';
    let options = String(b.options || '').split('\n').map((x) => x.trim()).filter(Boolean).slice(0, 8);
    let matchId = null;
    if (kind === 'tahmin' && b.matchId) {
        const m = await prisma.match.findUnique({ where: { id: Number(b.matchId) }, include: { home: true, away: true, league: true } });
        if (!m) return { error: 'Maç bulunamadı.' };
        matchId = m.id;
        // Maç tahmininde seçenekler maçtan oluşur (sıra: ev sahibi, deplasman, beraberlik) -> maç bitince otomatik sonuçlanır
        options = [`${m.home.name} kazanır`, `${m.away.name} kazanır`, ...(m.league.sport === 'futbol' ? ['Berabere'] : [])];
    }
    if (options.length < 2) return { error: 'En az iki seçenek yazın (her satıra bir seçenek).' };
    let articleId = null;
    if (b.articleSlug) {
        const slug = String(b.articleSlug).trim().replace(/^.*\/haber\//, '').replace(/[?#].*$/, '');
        const a = await prisma.article.findUnique({ where: { slug }, select: { id: true } });
        if (!a) return { error: 'Bağlanacak haber bulunamadı.' };
        articleId = a.id;
    }
    let closesAt = null;
    if (b.closesAt) {
        closesAt = new Date(b.closesAt);
        if (Number.isNaN(closesAt.getTime())) return { error: 'Geçersiz kapanış tarihi.' };
    }
    return {
        data: { question, kind, matchId, articleId, closesAt, showResults: b.showResults === 'kapaninca' ? 'kapaninca' : 'oy-sonrasi' },
        options,
    };
}
