import Link from 'next/link';
import FollowTeamButton from '@/components/FollowTeamButton';

// Puan durumu tablosu (lig sayfası, grup tabloları, ana sayfa özeti)
export default function StandingsTable({ rows, sport = 'voleybol', compact = false, label = 'Puan durumu tablosu', follow = true }) {
    const volley = sport === 'voleybol';
    return (
        <div className="table-scroll" tabIndex={0} role="region" aria-label={label}>
            <table className={`standings ${compact ? 'is-compact' : ''}`}>
                <thead>
                    <tr>
                        <th scope="col">#</th><th scope="col" className="left">Takım</th>
                        <th scope="col"><abbr title="Oynanan">O</abbr></th><th scope="col"><abbr title="Galibiyet">G</abbr></th>{!compact && <th scope="col"><abbr title="Mağlubiyet">M</abbr></th>}
                        {!volley && !compact && <th scope="col"><abbr title="Beraberlik">B</abbr></th>}
                        {!compact && <th scope="col" className="hide-sm">{volley ? <abbr title="Alınan / verilen set">Set</abbr> : <abbr title="Atılan / yenilen">A/Y</abbr>}</th>}
                        <th scope="col"><abbr title="Puan">P</abbr></th>
                        {!compact && <th scope="col" className="hide-sm">Form</th>}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((r, i) => (
                        <tr key={r.team.id}>
                            <td className="pos">{i + 1}</td>
                            <th scope="row" className="left">
                                {follow && !compact && <FollowTeamButton teamId={r.team.id} teamName={r.team.name} />}
                                {r.team.club?.slug ? <Link href={`/takim/${r.team.club.slug}`} className="team-link">{r.team.name}</Link> : r.team.name}
                            </th>
                            <td>{r.played}</td><td>{r.won}</td>{!compact && <td>{r.lost}</td>}
                            {!volley && !compact && <td>{r.drawn}</td>}
                            {!compact && <td className="hide-sm">{r.for}:{r.against}</td>}
                            <td className="pts">{r.points}</td>
                            {!compact && <td className="hide-sm"><span className="form">{r.form.map((f, k) => <i key={k} className={`f-${f}`} title={f === 'G' ? 'Galibiyet' : f === 'M' ? 'Mağlubiyet' : 'Beraberlik'}>{f}</i>)}</span></td>}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
