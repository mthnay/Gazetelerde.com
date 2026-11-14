import Link from 'next/link';
import { notFound } from 'next/navigation';
import MatchCard from '@/components/MatchCard';
import FollowTeamButton from '@/components/FollowTeamButton';
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
    const { league, matches, standings } = data;
    const volley = league.sport === 'voleybol';
    const name = `${league.name}${league.season ? ` ${league.season}` : ''}`;

    // Haftalara göre grupla (hafta yoksa tarihe göre)
    const groups = new Map();
    for (const m of matches) {
        const key = m.week ? `${m.week}. hafta` : new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', timeZone: 'Europe/Istanbul' }).format(new Date(m.startAt));
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(m);
    }
    // Varsayılan olarak ilk oynanmamış haftaya odaklan
    const keys = [...groups.keys()];
    const current = keys.find((k) => groups.get(k).some((m) => m.status !== 'FINISHED')) || keys[keys.length - 1];

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
                    {!standings.length ? <p className="field-hint">Takımlar eklendiğinde puan durumu burada görünecek.</p> : (
                        <div className="table-scroll" tabIndex={0} role="region" aria-label="Puan durumu tablosu">
                            <table className="standings">
                                <thead>
                                    <tr>
                                        <th scope="col">#</th><th scope="col" className="left">Takım</th>
                                        <th scope="col"><abbr title="Oynanan">O</abbr></th><th scope="col"><abbr title="Galibiyet">G</abbr></th><th scope="col"><abbr title="Mağlubiyet">M</abbr></th>
                                        {!volley && <th scope="col"><abbr title="Beraberlik">B</abbr></th>}
                                        <th scope="col" className="hide-sm">{volley ? <abbr title="Alınan / verilen set">Set</abbr> : <abbr title="Atılan / yenilen">A/Y</abbr>}</th>
                                        <th scope="col"><abbr title="Puan">P</abbr></th>
                                        <th scope="col" className="hide-sm">Form</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {standings.map((r, i) => (
                                        <tr key={r.team.id}>
                                            <td className="pos">{i + 1}</td>
                                            <th scope="row" className="left"><FollowTeamButton teamId={r.team.id} teamName={r.team.name} />{r.team.name}</th>
                                            <td>{r.played}</td><td>{r.won}</td><td>{r.lost}</td>
                                            {!volley && <td>{r.drawn}</td>}
                                            <td className="hide-sm">{r.for}:{r.against}</td>
                                            <td className="pts">{r.points}</td>
                                            <td className="hide-sm"><span className="form">{r.form.map((f, k) => <i key={k} className={`f-${f}`} title={f === 'G' ? 'Galibiyet' : f === 'M' ? 'Mağlubiyet' : 'Beraberlik'}>{f}</i>)}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {volley && standings.length > 0 && <p className="field-hint" style={{ marginTop: 8 }}>3-0 ve 3-1 galibiyet 3 puan, 3-2 galibiyet 2 puan, 2-3 mağlubiyet 1 puan.</p>}
                </section>

                <section aria-labelledby="fikstur">
                    <h2 id="fikstur" className="mc-title">Fikstür ve sonuçlar</h2>
                    {!matches.length ? <p className="field-hint">Henüz maç eklenmedi.</p> : keys.map((k) => (
                        <details key={k} className="week" open={k === current}>
                            <summary>{k}<span>{groups.get(k).filter((m) => m.status === 'FINISHED').length}/{groups.get(k).length} oynandı</span></summary>
                            <div className="match-list">{groups.get(k).map((m) => <MatchCard key={m.id} m={m} />)}</div>
                        </details>
                    ))}
                </section>
            </div>
        </div>
    );
}
