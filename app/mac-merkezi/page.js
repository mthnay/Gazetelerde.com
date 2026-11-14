import Link from 'next/link';
import MatchCard from '@/components/MatchCard';
import { getLeagues, getMatchDay } from '@/lib/matchCenter';
import { buildSafe } from '@/lib/db';

export const revalidate = 30;
export const metadata = {
    title: 'Maç Merkezi: Canlı Skorlar, Fikstür ve Puan Durumu | Gazetelerde',
    description: 'Sultanlar Ligi, Efeler Ligi ve diğer ligler: canlı skorlar, maç sonuçları, fikstür ve güncel puan durumu.',
    alternates: { canonical: '/mac-merkezi' },
};

export default async function MatchCenter() {
    const [leagues, day] = await buildSafe(() => Promise.all([getLeagues(), getMatchDay()]), [[], { live: [], upcoming: [], results: [] }]);
    const empty = !day.live.length && !day.upcoming.length && !day.results.length;
    return (
        <div className="container">
            <header className="page-hero">
                <span className="kicker rise">Spor</span>
                <h1 className="page-hero-title rise" style={{ '--i': 1, fontSize: 'clamp(48px, 9vw, 120px)' }}>Maç Merkezi<span className="dot">.</span></h1>
                {leagues.length > 0 && (
                    <nav className="league-tabs rise" style={{ '--i': 2 }} aria-label="Ligler">
                        {leagues.map((l) => <Link key={l.slug} href={`/mac-merkezi/${l.slug}`} className="article-tag">{l.name}{l.season ? ` ${l.season}` : ''}</Link>)}
                    </nav>
                )}
            </header>

            {empty && <div className="empty"><p className="display">Yakında</p><p>Fikstür ve sonuçlar eklendiğinde burada görünecek.</p></div>}

            {day.live.length > 0 && (
                <section className="mc-section" aria-label="Canlı maçlar">
                    <h2 className="mc-title"><span className="mc-live">●</span> Şu an oynanıyor</h2>
                    <div className="match-grid">{day.live.map((m) => <MatchCard key={m.id} m={m} showLeague />)}</div>
                </section>
            )}
            {day.upcoming.length > 0 && (
                <section className="mc-section" aria-label="Yaklaşan maçlar">
                    <h2 className="mc-title">Yaklaşan maçlar</h2>
                    <div className="match-grid">{day.upcoming.map((m) => <MatchCard key={m.id} m={m} showLeague />)}</div>
                </section>
            )}
            {day.results.length > 0 && (
                <section className="mc-section" aria-label="Son sonuçlar">
                    <h2 className="mc-title">Son sonuçlar</h2>
                    <div className="match-grid">{day.results.map((m) => <MatchCard key={m.id} m={m} showLeague />)}</div>
                </section>
            )}
        </div>
    );
}
