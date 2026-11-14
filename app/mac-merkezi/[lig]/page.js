import Link from 'next/link';
import { notFound } from 'next/navigation';
import MatchCard from '@/components/MatchCard';
import StandingsTable from '@/components/StandingsTable';
import Bracket from '@/components/Bracket';
import StatLeaders from '@/components/StatLeaders';
import { statLeaders } from '@/lib/volley';
import { getLeague, getLeagues } from '@/lib/matchCenter';
import { absoluteUrl } from '@/lib/site';

export const revalidate = 30;
export function generateStaticParams() {
    return [];
}

export async function generateMetadata({ params }) {
    const data = await getLeague((await params).lig);
    if (!data) return {};
    const name = `${data.league.name}${data.league.season ? ` ${data.league.season}` : ''}`;
    return {
        title: `${name} Puan Durumu ve Fikstür | Gazetelerde`,
        description: `${name}: güncel puan durumu, maç sonuçları ve fikstür.`,
        alternates: { canonical: `/mac-merkezi/${data.league.slug}` },
    };
}

export default async function LeaguePage({ params }) {
    const { lig } = await params;
    const [data, leagues] = await Promise.all([getLeague(lig), getLeagues()]);
    if (!data) notFound();
    const { league, matches, standings, groups, bracket } = data;
    const leaders = await statLeaders({ leagueId: league.id, season: league.season || undefined });
    const volley = league.sport === 'voleybol';
    const name = `${league.name}${league.season ? ` ${league.season}` : ''}`;

    // Haftalara göre grupla (hafta yoksa tarihe göre)
    const weeks = new Map();
    for (const m of matches) {
        const key = m.round ? m.round : m.group ? m.group : m.week ? `${m.week}. hafta` : new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', timeZone: 'Europe/Istanbul' }).format(new Date(m.startAt));
        if (!weeks.has(key)) weeks.set(key, []);
        weeks.get(key).push(m);
    }
    // Varsayılan olarak ilk oynanmamış haftaya odaklan
    const keys = [...weeks.keys()];
    const current = keys.find((k) => weeks.get(k).some((m) => m.status !== 'FINISHED')) || keys[keys.length - 1];

    const jsonLd = {
        '@context': 'https://schema.org', '@type': 'SportsOrganization', name, sport: volley ? 'Volleyball' : league.sport, url: absoluteUrl(`/mac-merkezi/${league.slug}`),
        event: matches.filter((m) => m.status !== 'POSTPONED').slice(0, 30).map((m) => ({
            '@type': 'SportsEvent', name: `${m.home.name} - ${m.away.name}`, startDate: m.startAt,
            homeTeam: { '@type': 'SportsTeam', name: m.home.name }, awayTeam: { '@type': 'SportsTeam', name: m.away.name },
            eventStatus: 'https://schema.org/EventScheduled', ...(m.venue ? { location: { '@type': 'Place', name: m.venue } } : {}),
        })),
    };

    return (
        <div className="container">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
            <header className="page-hero">
                <Link href="/mac-merkezi" className="kicker rise">Maç Merkezi</Link>
                <h1 className="page-hero-title rise" style={{ '--i': 1, fontSize: 'clamp(42px, 8vw, 110px)' }}>{league.name}<span className="dot">.</span></h1>
                {league.season && <p className="page-hero-desc rise" style={{ '--i': 2 }}>{league.season} sezonu</p>}
                {leagues.length > 1 && (
                    <nav className="league-tabs rise" style={{ '--i': 2 }} aria-label="Diğer ligler">
                        {leagues.map((l) => <Link key={l.slug} href={`/mac-merkezi/${l.slug}`} className={`article-tag ${l.slug === league.slug ? 'is-active' : ''}`} aria-current={l.slug === league.slug ? 'page' : undefined}>{l.name}</Link>)}
                    </nav>
                )}
            </header>

            <div className="league-layout">
                <section aria-labelledby="puan-durumu">
                    <h2 id="puan-durumu" className="mc-title">Puan durumu</h2>
                    {!standings.length && !groups.length ? <p className="field-hint">Takımlar eklendiğinde puan durumu burada görünecek.</p> : standings.length > 0 && <StandingsTable rows={standings} sport={league.sport} />}
                    {groups.map((g) => (
                        <div key={g.name} style={{ marginTop: 20 }}>
                            <h3 className="group-title">{g.name}</h3>
                            <StandingsTable rows={g.standings} sport={league.sport} label={`${g.name} puan durumu`} />
                        </div>
                    ))}
                    {volley && (standings.length > 0 || groups.length > 0) && <p className="field-hint" style={{ marginTop: 8 }}>3-0 ve 3-1 galibiyet 3 puan, 3-2 galibiyet 2 puan, 2-3 mağlubiyet 1 puan.</p>}
                </section>

                <section aria-labelledby="fikstur">
                    <Bracket rounds={bracket} />
                    <h2 id="fikstur" className="mc-title">Fikstür ve sonuçlar</h2>
                    {!matches.length ? <p className="field-hint">Henüz maç eklenmedi.</p> : keys.map((k) => (
                        <details key={k} className="week" open={k === current}>
                            <summary>{k}<span>{weeks.get(k).filter((m) => m.status === 'FINISHED').length}/{weeks.get(k).length} oynandı</span></summary>
                            <div className="match-list">{weeks.get(k).map((m) => <MatchCard key={m.id} m={m} />)}</div>
                        </details>
                    ))}
                </section>
            </div>
            <StatLeaders leaders={leaders} title={`${league.name} istatistik liderleri`} />
        </div>
    );
}
