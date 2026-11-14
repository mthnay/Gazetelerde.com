import Link from 'next/link';
import { notFound } from 'next/navigation';
import LiveScoreboard from '@/components/LiveScoreboard';
import PollWidget from '@/components/PollWidget';
import { prisma } from '@/lib/db';
import { POSITIONS } from '@/lib/volley';
import { absoluteUrl } from '@/lib/site';

export const revalidate = 30;
export function generateStaticParams() {
    return [];
}

const load = (id) => prisma.match.findUnique({
    where: { id },
    include: {
        home: { include: { club: { select: { slug: true, name: true } } } }, away: { include: { club: { select: { slug: true, name: true } } } },
        league: { select: { slug: true, name: true, season: true, sport: true } }, article: { select: { slug: true, title: true, status: true, live: true } },
        stats: { orderBy: { points: 'desc' }, include: { player: { select: { slug: true, name: true, position: true } } } },
    },
});
const fmt = (d) => new Intl.DateTimeFormat('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' }).format(d);

export async function generateMetadata({ params }) {
    const id = Number((await params).id);
    const m = Number.isInteger(id) && (await load(id));
    if (!m) return {};
    const score = m.homeScore != null && m.status !== 'SCHEDULED' ? ` ${m.homeScore}-${m.awayScore}` : '';
    const title = `${m.home.name}${score || ' -'} ${m.away.name} | ${m.league.name} | Gazetelerde`;
    return { title, description: `${m.league.name} ${m.round || (m.week ? `${m.week}. hafta` : '')}: ${m.home.name} - ${m.away.name} maçı ${m.status === 'FINISHED' ? 'sonucu, set skorları ve istatistikleri' : 'canlı skor, saat ve yayın bilgisi'}.`, alternates: { canonical: `/mac/${m.id}` } };
}

function StatTable({ title, rows }) {
    if (!rows.length) return null;
    return (
        <section aria-label={`${title} istatistikleri`}>
            <h3 className="group-title">{title}</h3>
            <div className="table-scroll" tabIndex={0} role="region" aria-label={`${title} oyuncu istatistikleri`}>
                <table className="standings">
                    <thead><tr><th scope="col" className="left">Oyuncu</th><th scope="col">Sayı</th><th scope="col">Hücum</th><th scope="col">Blok</th><th scope="col">As</th></tr></thead>
                    <tbody>{rows.map((s) => (
                        <tr key={s.playerId}>
                            <th scope="row" className="left"><Link href={`/oyuncu/${s.player.slug}`} className="team-link">{s.player.name}</Link>{s.mvp && ' 🏅'}<small className="muted" style={{ display: 'block', fontWeight: 400 }}>{POSITIONS[s.player.position] || ''}</small></th>
                            <td className="pts">{s.points}</td><td>{s.attack}</td><td>{s.block}</td><td>{s.ace}</td>
                        </tr>
                    ))}</tbody>
                </table>
            </div>
        </section>
    );
}

export default async function MatchPage({ params }) {
    const id = Number((await params).id);
    const m = Number.isInteger(id) && (await load(id));
    if (!m) notFound();
    const poll = await prisma.poll.findFirst({ where: { matchId: m.id }, select: { id: true } });
    const mvp = m.stats.find((s) => s.mvp);
    const name = (t) => (t.club ? <Link href={`/takim/${t.club.slug}`} className="team-link">{t.name}</Link> : t.name);
    const jsonLd = {
        '@context': 'https://schema.org', '@type': 'SportsEvent', name: `${m.home.name} - ${m.away.name}`, sport: m.league.sport === 'voleybol' ? 'Volleyball' : m.league.sport,
        startDate: m.startAt.toISOString(), url: absoluteUrl(`/mac/${m.id}`),
        eventStatus: m.status === 'POSTPONED' ? 'https://schema.org/EventPostponed' : 'https://schema.org/EventScheduled',
        homeTeam: { '@type': 'SportsTeam', name: m.home.name }, awayTeam: { '@type': 'SportsTeam', name: m.away.name },
        superEvent: { '@type': 'SportsEvent', name: `${m.league.name} ${m.league.season}`, url: absoluteUrl(`/mac-merkezi/${m.league.slug}`) },
        ...(m.venue ? { location: { '@type': 'Place', name: m.venue } } : {}),
    };
    return (
        <div className="container" style={{ maxWidth: 980 }}>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
            <nav className="kicker" style={{ marginTop: 32 }} aria-label="Konum"><Link href="/voleybol">Voleybol</Link> / <Link href={`/mac-merkezi/${m.league.slug}`}>{m.league.name}</Link>{m.round ? ` / ${m.round}` : m.group ? ` / ${m.group}` : m.week ? ` / ${m.week}. hafta` : ''}</nav>
            <h1 className="sr-only">{m.home.name} - {m.away.name}</h1>
            <LiveScoreboard
                initial={{ id: m.id, status: m.status, homeScore: m.homeScore, awayScore: m.awayScore, sets: Array.isArray(m.sets) ? m.sets : [] }}
                home={name(m.home)} away={name(m.away)}
            />
            <ul className="match-meta">
                <li><b>Tarih</b>{fmt(m.startAt)}</li>
                {m.venue && <li><b>Salon</b>{m.venue}</li>}
                {m.broadcaster && <li><b>Yayın</b>{m.broadcaster}</li>}
                {mvp && <li><b>Maçın oyuncusu</b><Link href={`/oyuncu/${mvp.player.slug}`}>{mvp.player.name}</Link></li>}
            </ul>
            {m.article?.status === 'PUBLISHED' && <p><Link href={`/haber/${m.article.slug}`} className="btn btn-primary">{m.article.live ? 'Canlı anlatımı izle' : 'Maç haberini oku'} →</Link></p>}
            {poll && <PollWidget pollId={poll.id} />}
            {m.stats.length > 0 && (
                <section className="mc-section" aria-labelledby="istatistik">
                    <h2 id="istatistik" className="mc-title">Oyuncu istatistikleri</h2>
                    <div className="volley-standings">
                        <StatTable title={m.home.name} rows={m.stats.filter((s) => s.side === 'home')} />
                        <StatTable title={m.away.name} rows={m.stats.filter((s) => s.side === 'away')} />
                    </div>
                </section>
            )}
        </div>
    );
}
