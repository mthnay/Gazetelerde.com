import Link from 'next/link';

const d = (iso) => new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short', timeZone: 'Europe/Istanbul' }).format(new Date(iso));

function Form({ title, side }) {
    return (
        <div className="pv-side">
            <h3 className="group-title">{title}</h3>
            {side.table && <p className="pv-table"><b>{side.table.rank}.</b> sırada · {side.table.points} puan · {side.table.won}G {side.table.lost}M</p>}
            {side.form.length > 0 ? (
                <>
                    <span className="form pv-form" aria-label={`Son ${side.form.length} maç: ${side.form.map((f) => (f.result === 'G' ? 'galibiyet' : 'mağlubiyet')).join(', ')}`}>
                        {[...side.form].reverse().map((f) => <i key={f.id} className={`f-${f.result}`}>{f.result}</i>)}
                    </span>
                    <ul className="pv-list">
                        {side.form.map((f) => (
                            <li key={f.id}><Link href={`/mac/${f.id}`}><span>{d(f.date)} · {f.home ? 'İç saha' : 'Deplasman'} · {f.opponent}</span><b className={`r-${f.result}`}>{f.score}</b></Link></li>
                        ))}
                    </ul>
                </>
            ) : <p className="field-hint">Bu sezon henüz maçı yok.</p>}
        </div>
    );
}

// Maç önü eşleşme kartı
export default function MatchPreview({ preview, home, away }) {
    const { h2h } = preview;
    return (
        <section className="mc-section preview" aria-labelledby="mac-onu">
            <h2 id="mac-onu" className="mc-title">Maç öncesi</h2>
            <div className="pv-grid">
                <Form title={home} side={preview.home} />
                <Form title={away} side={preview.away} />
            </div>
            <div className="pv-h2h">
                <h3 className="group-title">Aralarındaki son maçlar</h3>
                {!h2h.matches.length ? <p className="field-hint">Sitemizde iki takım arasında kayıtlı maç yok.</p> : (
                    <>
                        <p className="pv-h2h-score"><b>{home}</b> {h2h.homeWins} – {h2h.awayWins} <b>{away}</b></p>
                        <ul className="pv-list">
                            {h2h.matches.map((m) => <li key={m.id}><Link href={`/mac/${m.id}`}><span>{d(m.date)} · {m.home} – {m.away} · {m.league}</span><b>{m.score}</b></Link></li>)}
                        </ul>
                    </>
                )}
            </div>
        </section>
    );
}
