import Link from 'next/link';

// İstatistik liderleri: sayı / blok / servis ası
export default function StatLeaders({ leaders, title = 'İstatistik liderleri' }) {
    const cols = [['points', 'Sayı'], ['block', 'Blok'], ['ace', 'Servis ası']];
    if (!cols.some(([k]) => leaders[k]?.length)) return null;
    return (
        <section className="leaders" aria-labelledby="leaders-title">
            <h2 id="leaders-title" className="mc-title">{title}</h2>
            <div className="leaders-grid">
                {cols.map(([k, label]) => (
                    <div key={k} className="leaders-col">
                        <h3>{label}</h3>
                        <ol>
                            {leaders[k].slice(0, 5).map((r, i) => (
                                <li key={r.player.id}>
                                    <span className="leaders-rank">{i + 1}</span>
                                    <Link href={`/oyuncu/${r.player.slug}`}><strong>{r.player.name}</strong><small>{r.player.roster?.[0]?.club?.name || ''}</small></Link>
                                    <b>{r.value}</b>
                                </li>
                            ))}
                        </ol>
                    </div>
                ))}
            </div>
        </section>
    );
}
