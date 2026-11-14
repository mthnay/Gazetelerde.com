import Link from 'next/link';

const STATUS = { SCHEDULED: '', LIVE: 'CANLI', FINISHED: 'MS', POSTPONED: 'Ertelendi' };
const time = (iso) => new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' }).format(new Date(iso));
const day = (iso) => new Intl.DateTimeFormat('tr-TR', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Europe/Istanbul' }).format(new Date(iso));

function Team({ t, score, win, align }) {
    return (
        <span className={`mc-team ${align} ${win ? 'is-win' : ''}`}>
            {t.logo
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={t.logo} alt="" width={28} height={28} loading="lazy" />
                : <span className="mc-logo" aria-hidden="true">{(t.shortName || t.name).slice(0, 3).toLocaleUpperCase('tr')}</span>}
            <span className="mc-name">{t.name}</span>
            {score != null && <strong className="mc-score">{score}</strong>}
        </span>
    );
}

// Tek maç satırı: takımlar, skor / saat, set skorları; haberi ya da canlı anlatımı varsa bağlantı
export default function MatchCard({ m, showLeague = false, showDate = true }) {
    const played = m.homeScore != null && m.awayScore != null && m.status !== 'SCHEDULED';
    const body = (
        <>
            <span className="mc-meta">
                {m.status === 'LIVE' ? <span className="mc-live">● CANLI</span> : m.status === 'FINISHED' ? <span>MS</span> : m.status === 'POSTPONED' ? <span>Ertelendi</span> : <span>{showDate ? `${day(m.startAt)} · ` : ''}{time(m.startAt)}</span>}
                {showLeague && <span className="mc-league">{m.league.name}</span>}
            </span>
            <span className="mc-teams" aria-label={`${m.home.name} ${played ? `${m.homeScore} - ${m.awayScore}` : 'ile'} ${m.away.name}${STATUS[m.status] ? `, ${STATUS[m.status]}` : ''}`}>
                <Team t={m.home} score={played ? m.homeScore : null} win={played && m.homeScore > m.awayScore} align="home" />
                <Team t={m.away} score={played ? m.awayScore : null} win={played && m.awayScore > m.homeScore} align="away" />
            </span>
            {m.sets?.length > 0 && <span className="mc-sets" aria-label="Set skorları">{m.sets.map((s) => s.join('-')).join('  ')}</span>}
            {(m.articleSlug || m.venue) && (
                <span className="mc-foot">
                    {m.venue && <span>{m.venue}</span>}
                    {m.articleSlug && <span className="mc-link">{m.live ? 'Canlı anlatım →' : 'Maç haberi →'}</span>}
                </span>
            )}
        </>
    );
    return m.articleSlug
        ? <Link href={`/haber/${m.articleSlug}`} className={`match-card status-${m.status.toLowerCase()}`}>{body}</Link>
        : <div className={`match-card status-${m.status.toLowerCase()}`}>{body}</div>;
}
