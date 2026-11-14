import Link from 'next/link';
import { notFound } from 'next/navigation';
import MatchCard from '@/components/MatchCard';
import NewsGrid from '@/components/NewsGrid';
import SmartImage from '@/components/SmartImage';
import FollowTeamButton from '@/components/FollowTeamButton';
import { getClub, POSITIONS, TRANSFER_STATUS, SEASON } from '@/lib/volley';
import { absoluteUrl } from '@/lib/site';

export const revalidate = 120;
export function generateStaticParams() {
    return [];
}

export async function generateMetadata({ params }) {
    const d = await getClub((await params).slug);
    if (!d) return {};
    const c = d.club;
    const title = `${c.name} Voleybol: Kadro, Fikstür, Sonuçlar | Gazetelerde`;
    const description = c.bio?.slice(0, 160) || `${c.name} ${SEASON()} kadrosu, maç sonuçları, fikstürü, transferleri ve son haberleri.`;
    return { title, description, alternates: { canonical: `/takim/${c.slug}` }, openGraph: { title, description, images: c.logo ? [c.logo] : undefined } };
}

const ORDER = ['pasor', 'pasor-capraz', 'smacor', 'orta', 'libero', ''];

export default async function ClubPage({ params }) {
    const d = await getClub((await params).slug);
    if (!d) notFound();
    const { club: c, upcoming, results, transfers, news } = d;
    const roster = [...c.roster].sort((a, b) => ORDER.indexOf(a.player.position) - ORDER.indexOf(b.player.position) || (a.number ?? 99) - (b.number ?? 99));
    const followTeam = c.teams.find((t) => t.league.active);
    const jsonLd = {
        '@context': 'https://schema.org', '@type': 'SportsTeam', name: c.name, sport: 'Volleyball', url: absoluteUrl(`/takim/${c.slug}`),
        logo: c.logo ? absoluteUrl(c.logo) : undefined, coach: c.coach ? { '@type': 'Person', name: c.coach } : undefined,
        location: c.venue ? { '@type': 'Place', name: c.venue, address: c.city || undefined } : undefined,
        athlete: roster.map((r) => ({ '@type': 'Person', name: r.player.name, url: absoluteUrl(`/oyuncu/${r.player.slug}`) })),
    };
    return (
        <div className="container">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
            <header className="page-hero profile-hero">
                <div className="profile-photo is-logo">
                    {c.logo ? <SmartImage src={c.logo} alt={`${c.name} logosu`} sizes="200px" priority /> : <span aria-hidden="true">{(c.shortName || c.name).slice(0, 3).toLocaleUpperCase('tr')}</span>}
                </div>
                <div>
                    <nav className="kicker rise" aria-label="Konum"><Link href="/voleybol">Voleybol</Link> / {c.national ? 'Milli takım' : 'Takımlar'}</nav>
                    <h1 className="page-hero-title rise" style={{ '--i': 1, fontSize: 'clamp(40px, 7vw, 92px)' }}>{c.name}<span className="dot">.</span></h1>
                    <dl className="profile-facts rise" style={{ '--i': 2 }}>
                        {c.city && <div><dt>Şehir</dt><dd>{c.city}</dd></div>}
                        {c.venue && <div><dt>Salon</dt><dd>{c.venue}</dd></div>}
                        {c.coach && <div><dt>Başantrenör</dt><dd>{c.coach}</dd></div>}
                        {c.founded && <div><dt>Kuruluş</dt><dd>{c.founded}</dd></div>}
                        {c.colors && <div><dt>Renkler</dt><dd>{c.colors}</dd></div>}
                    </dl>
                    {followTeam && <p className="rise" style={{ '--i': 3, marginTop: 12 }}><FollowTeamButton teamId={followTeam.id} teamName={c.name} /> <span className="field-hint">Takip edin: maç başlayınca ve bitince bildirim, ana sayfada size özel akış.</span></p>}
                </div>
            </header>
            {c.bio && <p className="page-hero-desc" style={{ whiteSpace: 'pre-line', marginBottom: 32 }}>{c.bio}</p>}

            <div className="volley-layout">
                <div>
                    {upcoming.length > 0 && <section className="mc-section" aria-label="Sıradaki maçlar"><h2 className="mc-title">Sıradaki maçlar</h2><div className="match-grid">{upcoming.map((m) => <MatchCard key={m.id} m={m} showLeague />)}</div></section>}
                    {results.length > 0 && <section className="mc-section" aria-label="Son sonuçlar"><h2 className="mc-title">Son sonuçlar</h2><div className="match-grid">{results.map((m) => <MatchCard key={m.id} m={m} showLeague />)}</div></section>}
                    {news.length > 0 && <section className="mc-section" aria-label="Haberler"><h2 className="mc-title">{c.name} haberleri</h2><NewsGrid items={news} level={3} /></section>}
                </div>
                <aside>
                    <section className="mc-section" aria-labelledby="kadro">
                        <h2 id="kadro" className="mc-title">{SEASON()} kadrosu</h2>
                        {!roster.length ? <p className="field-hint">Kadro henüz girilmedi.</p> : (
                            <ul className="roster">
                                {roster.map((r) => (
                                    <li key={r.id}>
                                        <span className="roster-no">{r.number ?? '–'}</span>
                                        <Link href={`/oyuncu/${r.player.slug}`}><strong>{r.player.name}{r.captain && ' (K)'}</strong><small>{POSITIONS[r.player.position] || ''}{r.player.height ? ` · ${r.player.height} cm` : ''}</small></Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                    {c.teams.length > 0 && (
                        <section className="mc-section" aria-labelledby="ligler">
                            <h2 id="ligler" className="mc-title">Yarıştığı ligler</h2>
                            <ul className="timeline">{c.teams.map((t) => <li key={t.id}><Link href={`/mac-merkezi/${t.league.slug}`}>{t.league.name} {t.league.season}</Link></li>)}</ul>
                        </section>
                    )}
                    {transfers.length > 0 && (
                        <section className="mc-section" aria-labelledby="transfer">
                            <h2 id="transfer" className="mc-title">Transferler</h2>
                            <ul className="timeline">
                                {transfers.map((t) => (
                                    <li key={t.id}><span className={`transfer-status s-${t.status}`}>{TRANSFER_STATUS[t.status]}</span> <Link href={`/oyuncu/${t.player.slug}`}>{t.player.name}</Link>{' '}
                                        {t.toClubId === c.id ? `← ${t.fromClub?.name || t.fromName || '—'}` : `→ ${t.toClub?.name || t.toName || '—'}`}</li>
                                ))}
                            </ul>
                        </section>
                    )}
                </aside>
            </div>
        </div>
    );
}
