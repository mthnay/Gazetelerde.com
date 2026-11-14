import Link from 'next/link';
import PollWidget from '@/components/PollWidget';
import MyPredictionRank from '@/components/MyPredictionRank';
import { prisma, buildSafe } from '@/lib/db';
import { leaderboard, predictorOfLastWeek, POINTS, SCORE_POINTS } from '@/lib/predictions';
import FriendLeagues from '@/components/FriendLeagues';

export const revalidate = 120;
export const metadata = {
    title: 'Tahmin Ligi: Voleybol Maç Tahminleri ve Sıralama | Gazetelerde',
    description: 'Sultanlar Ligi ve Efeler Ligi maçlarını tahmin edin, her doğru tahmine puan kazanın, haftalık ve sezonluk sıralamada yerinizi alın.',
    alternates: { canonical: '/tahmin-ligi' },
};

export default async function PredictionLeague({ searchParams }) {
    const period = (await searchParams).donem === 'hafta' ? 'hafta' : 'sezon';
    const [rows, open, star] = await buildSafe(() => Promise.all([
        leaderboard(period),
        prisma.poll.findMany({
            where: { kind: { in: ['tahmin', 'skor'] }, correctId: null, OR: [{ closesAt: null }, { closesAt: { gt: new Date() } }] },
            orderBy: [{ closesAt: 'asc' }, { matchId: 'asc' }, { kind: 'desc' }], take: 24, select: { id: true },
        }),
        predictorOfLastWeek(),
    ]), [[], [], null]);
    return (
        <div className="container">
            <header className="page-hero">
                <Link href="/voleybol" className="kicker rise">Voleybol</Link>
                <h1 className="page-hero-title rise" style={{ '--i': 1, fontSize: 'clamp(46px, 9vw, 120px)' }}>Tahmin Ligi<span className="dot">.</span></h1>
                <p className="page-hero-desc rise" style={{ '--i': 2 }}>Kazananı bilin {POINTS} puan, tam set skorunu bilin {SCORE_POINTS} puan kazanın. Sıralama her hafta ve sezon boyunca tutulur; arkadaşlarınızla kendi liginizi de kurabilirsiniz.</p>
                <MyPredictionRank period={period} />
                {star && <p className="star-predictor">🏆 Geçen haftanın tahmincisi: <b>{star.name}</b> · {star.points} puan</p>}
            </header>
            <div className="volley-layout">
                <section aria-labelledby="acik">
                    <h2 id="acik" className="mc-title">Açık tahminler</h2>
                    {!open.length ? <p className="field-hint">Şu an açık tahmin yok; yeni haftanın maçları eklendiğinde burada olacak.</p> : open.map((p) => <PollWidget key={p.id} pollId={p.id} />)}
                </section>
                <aside aria-labelledby="siralama">
                    <FriendLeagues />
                    <h2 id="siralama" className="mc-title">Sıralama</h2>
                    <nav className="league-tabs" aria-label="Dönem" style={{ marginBottom: 12 }}>
                        <Link href="/tahmin-ligi?donem=hafta" className={`article-tag ${period === 'hafta' ? 'is-active' : ''}`} aria-current={period === 'hafta' ? 'page' : undefined}>Bu hafta</Link>
                        <Link href="/tahmin-ligi" className={`article-tag ${period === 'sezon' ? 'is-active' : ''}`} aria-current={period === 'sezon' ? 'page' : undefined}>Sezon</Link>
                    </nav>
                    {!rows.length ? <p className="field-hint">Henüz sonuçlanmış tahmin yok.</p> : (
                        <div className="table-scroll" tabIndex={0} role="region" aria-label="Tahmin ligi sıralaması">
                            <table className="standings">
                                <thead><tr><th scope="col">#</th><th scope="col" className="left">Okur</th><th scope="col">Doğru</th><th scope="col"><abbr title="Tam set skoru">Tam</abbr></th><th scope="col">Puan</th></tr></thead>
                                <tbody>{rows.map((r) => (
                                    <tr key={r.userId}><td className="pos">{r.rank}</td><th scope="row" className="left">{r.rank <= 3 ? ['🥇', '🥈', '🥉'][r.rank - 1] : ''} {r.name}{star?.userId === r.userId && <span title="Geçen haftanın tahmincisi"> 🏆</span>}</th><td>{r.correct}/{r.total}</td><td>{r.exact}</td><td className="pts">{r.points}</td></tr>
                                ))}</tbody>
                            </table>
                        </div>
                    )}
                    <p className="field-hint" style={{ marginTop: 10 }}>Gizliliğiniz için sıralamada yalnızca adınız ve soyadınızın baş harfi görünür.</p>
                </aside>
            </div>
        </div>
    );
}
