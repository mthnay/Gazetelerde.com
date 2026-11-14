"use client";
import { useEffect, useState } from 'react';

// Maç skorbordu: canlıyken 8 sn'de bir yenilenir (sekme görünürken)
export default function LiveScoreboard({ initial, home, away }) {
    const [m, setM] = useState(initial);
    useEffect(() => {
        if (m.status !== 'LIVE' && m.status !== 'SCHEDULED') return;
        const tick = async () => {
            if (document.visibilityState !== 'visible') return;
            const d = await fetch(`/api/matches/${m.id}`, { cache: 'no-store' }).then((r) => r.json()).catch(() => null);
            if (d?.success) setM((x) => ({ ...x, ...d.match }));
        };
        const t = setInterval(tick, m.status === 'LIVE' ? 8000 : 60000);
        return () => clearInterval(t);
    }, [m.id, m.status]);

    const cur = m.status === 'LIVE' ? m.sets[m.sets.length - 1] : null;
    const done = m.sets.filter((s, i) => m.status !== 'LIVE' || i < m.sets.length - 1);
    return (
        <div className={`scoreboard status-${m.status.toLowerCase()}`} aria-live="polite">
            <div className="sb-team">{home}</div>
            <div className="sb-center">
                <div className="sb-score"><span>{m.homeScore ?? 0}</span><i>–</i><span>{m.awayScore ?? 0}</span></div>
                {m.status === 'LIVE' && <div className="sb-live"><span className="mc-live">●</span> CANLI{cur && <> · {m.sets.length}. set <b>{cur[0]}-{cur[1]}</b></>}</div>}
                {m.status === 'FINISHED' && <div className="sb-state">Maç sonucu</div>}
                {m.status === 'POSTPONED' && <div className="sb-state">Ertelendi</div>}
                {done.length > 0 && <div className="sb-sets" aria-label="Set skorları">{done.map((s, i) => <span key={i} title={`${i + 1}. set`}>{s[0]}-{s[1]}</span>)}</div>}
            </div>
            <div className="sb-team">{away}</div>
        </div>
    );
}
