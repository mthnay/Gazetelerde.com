import Link from 'next/link';
import MatchCard from '@/components/MatchCard';
import NewsGrid from '@/components/NewsGrid';
import StandingsTable from '@/components/StandingsTable';
import StatLeaders from '@/components/StatLeaders';
import SmartImage from '@/components/SmartImage';
import { prisma, buildSafe } from '@/lib/db';
import { getMatchDay, getLeagues, getFeaturedStandings } from '@/lib/matchCenter';
import { statLeaders, TRANSFER_STATUS, SEASON } from '@/lib/volley';
import { getLatestNews } from '@/lib/news';
import { GUIDES } from '@/lib/guides';

export const revalidate = 60;
export const metadata = {
    title: 'Voleybol: Canlı Skor, Puan Durumu, Transfer, Filenin Sultanları | Gazetelerde',
    description: 'Sultanlar Ligi, Efeler Ligi, CEV kupaları ve milli takımlar: canlı skorlar, puan durumu, fikstür, oyuncu istatistikleri, transferler ve son dakika voleybol haberleri.',
    alternates: { canonical: '/voleybol' },
};

const KIND = { lig: 'Türkiye ligleri', kupa: 'Kupalar', avrupa: 'Avrupa kupaları', milli: 'Milli takım turnuvaları' };

export default async function VolleyHub() {
    const [day, leagues, featured, leaders, transfers, nationals, news] = await buildSafe(() => Promise.all([
        getMatchDay(), getLeagues(), getFeaturedStandings(2), statLeaders(),
        prisma.transfer.findMany({ orderBy: { date: 'desc' }, take: 6, include: { player: { select: { slug: true, name: true } }, fromClub: { select: { name: true } }, toClub: { select: { name: true } } } }),
        prisma.club.findMany({ where: { national: true }, orderBy: { gender: 'asc' }, select: { slug: true, name: true, logo: true, coach: true, gender: true } }),
        getLatestNews({ tag: 'voleybol', take: 8 }),
    ]), [{ live: [], upcoming: [], results: [] }, [], [], { points: [], block: [], ace: [] }, [], [], []]);
    const volleyLeagues = leagues.filter((l) => l.sport === 'voleybol');
    const strip = [...day.live, ...day.upcoming].filter((m) => m.league.sport === 'voleybol').slice(0, 8);
    const results = day.results.filter((m) => m.league.sport === 'voleybol').slice(0, 6);

    return (
        <div className="container">
            <header className="page-hero">
                <span className="kicker rise">Gazetelerde</span>
                <h1 className="page-hero-title rise" style={{ '--i': 1, fontSize: 'clamp(52px, 10vw, 140px)' }}>Voleybol<span className="dot">.</span></h1>
                <nav className="league-tabs rise" style={{ '--i': 2 }} aria-label="Voleybol bölümleri">
                    <Link href="/mac-merkezi" className="article-tag">Maç Merkezi</Link>
                    <Link href="/oyuncular" className="article-tag">Oyuncular</Link>
                    <Link href="/transfer" className="article-tag">Transfer</Link>
                    <Link href="/tahmin-ligi" className="article-tag">Tahmin Ligi</Link>
                    <Link href="/rehber" className="article-tag">Voleybol rehberi</Link>
                </nav>
            </header>

            {strip.length > 0 && (
                <section className="mc-section" aria-labelledby="maclar">
                    <h2 id="maclar" className="mc-title">{day.live.length ? <><span className="mc-live">●</span> Canlı ve yaklaşan maçlar</> : 'Yaklaşan maçlar'}</h2>
                    <div className="match-grid">{strip.map((m) => <MatchCard key={m.id} m={m} showLeague />)}</div>
                </section>
            )}

            {featured.length > 0 && (
                <div className="volley-standings">
                    {featured.map((f) => (
                        <section key={f.league.slug} aria-label={`${f.league.name} puan durumu`}>
                            <h2 className="mc-title"><Link href={`/mac-merkezi/${f.league.slug}`}>{f.league.name}</Link></h2>
                            <StandingsTable rows={f.standings} compact label={`${f.league.name} puan durumu`} />
                            <Link href={`/mac-merkezi/${f.league.slug}`} className="more-link">Tam puan durumu ve fikstür →</Link>
                        </section>
                    ))}
                </div>
            )}

            {nationals.length > 0 && (
                <section className="mc-section" aria-labelledby="milli">
                    <h2 id="milli" className="mc-title">Milli takımlar</h2>
                    <div className="national-cards">
                        {nationals.map((n) => (
                            <Link key={n.slug} href={`/takim/${n.slug}`} className="national-card">
                                {n.logo ? <span className="national-logo"><SmartImage src={n.logo} alt="" sizes="64px" /></span> : <span className="national-logo" aria-hidden="true">🇹🇷</span>}
                                <span><strong>{n.name}</strong><small>{n.gender === 'erkek' ? 'Erkek' : 'Kadın'} milli takımı{n.coach ? ` · ${n.coach}` : ''}</small></span>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {results.length > 0 && <section className="mc-section" aria-labelledby="sonuclar"><h2 id="sonuclar" className="mc-title">Son sonuçlar</h2><div className="match-grid">{results.map((m) => <MatchCard key={m.id} m={m} showLeague />)}</div></section>}

            <StatLeaders leaders={leaders} title={`${SEASON()} istatistik liderleri`} />

            <div className="volley-layout">
                <div>
                    {news.length > 0 && <section className="mc-section" aria-labelledby="vhaber"><h2 id="vhaber" className="mc-title"><Link href="/etiket/voleybol">Voleybol haberleri</Link></h2><NewsGrid items={news} summary level={3} /></section>}
                </div>
                <aside>
                    {volleyLeagues.length > 0 && (
                        <section className="mc-section" aria-labelledby="ligler">
                            <h2 id="ligler" className="mc-title">Ligler ve turnuvalar</h2>
                            {Object.entries(KIND).map(([k, label]) => {
                                const list = volleyLeagues.filter((l) => l.kind === k);
                                return list.length > 0 && (
                                    <div key={k} style={{ marginBottom: 14 }}>
                                        <h3 className="group-title">{label}</h3>
                                        <ul className="timeline">{list.map((l) => <li key={l.slug}><Link href={`/mac-merkezi/${l.slug}`}>{l.name}</Link> <small className="muted">{l.season} · {l.gender === 'erkek' ? 'Erkek' : 'Kadın'}</small></li>)}</ul>
                                    </div>
                                );
                            })}
                        </section>
                    )}
                    {transfers.length > 0 && (
                        <section className="mc-section" aria-labelledby="transfer">
                            <h2 id="transfer" className="mc-title"><Link href="/transfer">Transfer</Link></h2>
                            <ul className="timeline">
                                {transfers.map((t) => <li key={t.id}><span className={`transfer-status s-${t.status}`}>{TRANSFER_STATUS[t.status]}</span> <Link href={`/oyuncu/${t.player.slug}`}>{t.player.name}</Link> → {t.toClub?.name || t.toName}</li>)}
                            </ul>
                        </section>
                    )}
                    <section className="mc-section" aria-labelledby="rehber">
                        <h2 id="rehber" className="mc-title"><Link href="/rehber">Voleybol rehberi</Link></h2>
                        <ul className="timeline">{GUIDES.map((g) => <li key={g.slug}><Link href={`/rehber/${g.slug}`}>{g.title}</Link></li>)}</ul>
                    </section>
                </aside>
            </div>
        </div>
    );
}
