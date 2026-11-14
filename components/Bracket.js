import Link from 'next/link';

const short = (t) => t.shortName || t.name;

// Eleme ağacı: tur sütunları, her seride iki takım ve seri skoru (ör. 2-1)
export default function Bracket({ rounds }) {
    if (!rounds.length) return null;
    return (
        <section className="mc-section" aria-labelledby="eleme">
            <h2 id="eleme" className="mc-title">Eleme turu</h2>
            <div className="bracket" role="list">
                {rounds.map((r) => (
                    <div key={r.name} className="bracket-round" role="listitem">
                        <h3>{r.name}</h3>
                        <ul>
                            {r.series.map((s) => {
                                const done = s.matches.every((m) => m.status === 'FINISHED');
                                const multi = s.matches.length > 1;
                                const winA = done && (multi ? s.wa > s.wb : s.wa === 1);
                                const winB = done && (multi ? s.wb > s.wa : s.wb === 1);
                                const one = !multi ? s.matches[0] : null;
                                const scoreA = multi ? s.wa : one?.homeScore != null ? (one.home.id === s.a.id ? one.homeScore : one.awayScore) : '';
                                const scoreB = multi ? s.wb : one?.homeScore != null ? (one.home.id === s.b.id ? one.homeScore : one.awayScore) : '';
                                return (
                                    <li key={`${s.a.id}-${s.b.id}`} className="bracket-tie">
                                        <Link href={`/mac/${s.matches[s.matches.length - 1].id}`} aria-label={`${s.a.name} ${scoreA}, ${s.b.name} ${scoreB}${multi ? ' (seri)' : ''}`}>
                                            <span className={winA ? 'is-win' : ''}><b>{short(s.a)}</b><em>{scoreA}</em></span>
                                            <span className={winB ? 'is-win' : ''}><b>{short(s.b)}</b><em>{scoreB}</em></span>
                                            {multi && <small>{s.matches.length} maçlık seri</small>}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </div>
        </section>
    );
}
