import Link from 'next/link';
import { notFound } from 'next/navigation';
import NewsGrid from '@/components/NewsGrid';
import SmartImage from '@/components/SmartImage';
import { getPlayer, POSITIONS, TRANSFER_STATUS, SEASON } from '@/lib/volley';
import { absoluteUrl } from '@/lib/site';

export const revalidate = 300;
export function generateStaticParams() {
    return [];
}

export async function generateMetadata({ params }) {
    const d = await getPlayer((await params).slug);
    if (!d) return {};
    const { player: p, current } = d;
    const title = `${p.name}${POSITIONS[p.position] ? ` · ${POSITIONS[p.position]}` : ''}${current ? ` · ${current.club.name}` : ''} | Gazetelerde Voleybol`;
    const description = p.bio?.slice(0, 160) || `${p.name} kimdir? Boyu, mevkisi, takımı, istatistikleri, transferleri ve son haberleri.`;
    return { title, description, alternates: { canonical: `/oyuncu/${p.slug}` }, openGraph: { title, description, type: 'profile', images: p.photo ? [p.photo] : undefined } };
}

const fmtDate = (d) => new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/Istanbul' }).format(d);

export default async function PlayerPage({ params }) {
    const d = await getPlayer((await params).slug);
    if (!d) notFound();
    const { player: p, current, total, recent, news } = d;
    const age = p.birthYear ? new Date().getFullYear() - p.birthYear : null;
    const jsonLd = {
        '@context': 'https://schema.org', '@type': 'Person', name: p.name, url: absoluteUrl(`/oyuncu/${p.slug}`),
        jobTitle: `Voleybolcu${POSITIONS[p.position] ? ` (${POSITIONS[p.position]})` : ''}`, nationality: p.nationality || undefined,
        height: p.height ? { '@type': 'QuantitativeValue', value: p.height, unitCode: 'CMT' } : undefined,
        image: p.photo ? absoluteUrl(p.photo) : undefined,
        memberOf: current ? { '@type': 'SportsTeam', name: current.club.name, url: absoluteUrl(`/takim/${current.club.slug}`), sport: 'Volleyball' } : undefined,
    };
    return (
        <div className="container">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
            <header className="page-hero profile-hero">
                <div className="profile-photo">
                    {p.photo ? <SmartImage src={p.photo} alt={p.name} sizes="200px" priority /> : <span aria-hidden="true">{p.name.split(' ').map((x) => x[0]).slice(0, 2).join('')}</span>}
                    {current?.number != null && <b className="profile-number">{current.number}</b>}
                </div>
                <div>
                    <nav className="kicker rise" aria-label="Konum"><Link href="/voleybol">Voleybol</Link> / <Link href="/oyuncular">Oyuncular</Link></nav>
                    <h1 className="page-hero-title rise" style={{ '--i': 1, fontSize: 'clamp(40px, 7vw, 92px)' }}>{p.name}<span className="dot">.</span></h1>
                    <dl className="profile-facts rise" style={{ '--i': 2 }}>
                        {POSITIONS[p.position] && <div><dt>Mevki</dt><dd>{POSITIONS[p.position]}</dd></div>}
                        {current && <div><dt>Takım</dt><dd><Link href={`/takim/${current.club.slug}`}>{current.club.name}</Link>{current.captain && ' (kaptan)'}</dd></div>}
                        {p.height && <div><dt>Boy</dt><dd>{p.height} cm</dd></div>}
                        {age && <div><dt>Yaş</dt><dd>{age} ({p.birthYear})</dd></div>}
                        {p.nationality && <div><dt>Uyruk</dt><dd>{p.nationality}</dd></div>}
                    </dl>
                </div>
            </header>

            {p.bio && <p className="page-hero-desc" style={{ whiteSpace: 'pre-line', marginBottom: 32 }}>{p.bio}</p>}

            <div className="volley-layout">
                <div>
                    <section className="mc-section" aria-labelledby="sezon">
                        <h2 id="sezon" className="mc-title">{SEASON()} sezonu</h2>
                        <div className="stat-tiles">
                            {[['Maç', total.matches], ['Sayı', total.points], ['Hücum', total.attack], ['Blok', total.block], ['Servis ası', total.ace], ['Maçın oyuncusu', total.mvp]].map(([l, v]) => (
                                <div key={l} className="stat-tile"><strong>{v}</strong><span>{l}</span></div>
                            ))}
                        </div>
                        {total.matches > 0 && <p className="field-hint">Maç başına {(total.points / total.matches).toFixed(1)} sayı</p>}
                    </section>

                    {recent.length > 0 && (
                        <section className="mc-section" aria-labelledby="son-maclar">
                            <h2 id="son-maclar" className="mc-title">Son maçlar</h2>
                            <div className="table-scroll" tabIndex={0} role="region" aria-label="Son maçlar tablosu">
                                <table className="standings">
                                    <thead><tr><th scope="col" className="left">Maç</th><th scope="col">Skor</th><th scope="col">Sayı</th><th scope="col">Blok</th><th scope="col">As</th></tr></thead>
                                    <tbody>
                                        {recent.map((s) => (
                                            <tr key={s.matchId}>
                                                <th scope="row" className="left"><Link href={`/mac/${s.matchId}`}>{s.match.home.name} - {s.match.away.name}</Link><small className="muted" style={{ display: 'block', fontWeight: 400 }}>{fmtDate(s.match.startAt)}{s.mvp && ' · 🏅 Maçın oyuncusu'}</small></th>
                                                <td>{s.match.homeScore ?? '-'}-{s.match.awayScore ?? '-'}</td>
                                                <td className="pts">{s.points}</td><td>{s.block}</td><td>{s.ace}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}

                    {news.length > 0 && (
                        <section className="mc-section" aria-labelledby="haberler">
                            <h2 id="haberler" className="mc-title">{p.name} haberleri</h2>
                            <NewsGrid items={news} level={3} />
                        </section>
                    )}
                </div>

                <aside>
                    {p.roster.length > 0 && (
                        <section className="mc-section" aria-labelledby="kariyer">
                            <h2 id="kariyer" className="mc-title">Kariyer</h2>
                            <ul className="timeline">
                                {p.roster.map((r) => <li key={r.id}><b>{r.season}</b> <Link href={`/takim/${r.club.slug}`}>{r.club.name}</Link>{r.number != null && ` · #${r.number}`}</li>)}
                            </ul>
                        </section>
                    )}
                    {p.transfers.length > 0 && (
                        <section className="mc-section" aria-labelledby="transferler">
                            <h2 id="transferler" className="mc-title">Transferler</h2>
                            <ul className="timeline">
                                {p.transfers.map((t) => (
                                    <li key={t.id}>
                                        <span className={`transfer-status s-${t.status}`}>{TRANSFER_STATUS[t.status]}</span> {fmtDate(t.date)}<br />
                                        {t.fromClub ? <Link href={`/takim/${t.fromClub.slug}`}>{t.fromClub.name}</Link> : t.fromName || '—'} → {t.toClub ? <Link href={`/takim/${t.toClub.slug}`}>{t.toClub.name}</Link> : t.toName || '—'}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}
                </aside>
            </div>
        </div>
    );
}
