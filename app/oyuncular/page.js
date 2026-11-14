import Link from 'next/link';
import { prisma, buildSafe } from '@/lib/db';
import { POSITIONS, SEASON } from '@/lib/volley';

export const revalidate = 300;
export const metadata = { title: 'Voleybol Oyuncuları | Gazetelerde', description: 'Sultanlar Ligi, Efeler Ligi ve milli takım voleybolcuları: mevki, boy, takım ve istatistikler.', alternates: { canonical: '/oyuncular' } };

export default async function Players({ searchParams }) {
    const sp = await searchParams;
    const pos = POSITIONS[sp.mevki] ? sp.mevki : undefined;
    const gender = ['kadin', 'erkek'].includes(sp.cins) ? sp.cins : undefined;
    const q = String(sp.q || '').trim().slice(0, 60);
    const players = await buildSafe(() => prisma.player.findMany({
        where: { active: true, ...(pos ? { position: pos } : {}), ...(gender ? { gender } : {}), ...(q ? { name: { contains: q, mode: 'insensitive' } } : {}) },
        orderBy: { name: 'asc' }, take: 300,
        select: { slug: true, name: true, position: true, height: true, gender: true, roster: { where: { season: SEASON() }, take: 1, select: { number: true, club: { select: { name: true } } } } },
    }), []);
    const href = (o) => { const p = new URLSearchParams({ ...(pos ? { mevki: pos } : {}), ...(gender ? { cins: gender } : {}), ...(q ? { q } : {}), ...o }); [...p].forEach(([k, v]) => !v && p.delete(k)); return `/oyuncular${p.size ? `?${p}` : ''}`; };
    return (
        <div className="container">
            <header className="page-hero">
                <Link href="/voleybol" className="kicker rise">Voleybol</Link>
                <h1 className="page-hero-title rise" style={{ '--i': 1, fontSize: 'clamp(44px, 8vw, 104px)' }}>Oyuncular<span className="dot">.</span></h1>
                <form action="/oyuncular" className="rise" style={{ '--i': 2, display: 'flex', gap: 10, maxWidth: 560 }} role="search">
                    {pos && <input type="hidden" name="mevki" value={pos} />}
                    {gender && <input type="hidden" name="cins" value={gender} />}
                    <input className="input input-pill" type="search" name="q" defaultValue={q} placeholder="Oyuncu ara…" aria-label="Oyuncu ara" />
                </form>
            </header>
            <nav className="league-tabs" aria-label="Filtreler" style={{ marginBottom: 24 }}>
                <Link href={href({ cins: '' })} className={`article-tag ${!gender ? 'is-active' : ''}`}>Tümü</Link>
                <Link href={href({ cins: 'kadin' })} className={`article-tag ${gender === 'kadin' ? 'is-active' : ''}`}>Kadın</Link>
                <Link href={href({ cins: 'erkek' })} className={`article-tag ${gender === 'erkek' ? 'is-active' : ''}`}>Erkek</Link>
                <span style={{ width: 12 }} />
                {Object.entries(POSITIONS).map(([k, v]) => <Link key={k} href={href({ mevki: pos === k ? '' : k })} className={`article-tag ${pos === k ? 'is-active' : ''}`}>{v}</Link>)}
            </nav>
            {!players.length ? <div className="empty"><p className="display">Oyuncu bulunamadı</p></div> : (
                <ul className="player-grid">
                    {players.map((p) => (
                        <li key={p.slug}><Link href={`/oyuncu/${p.slug}`}>
                            <strong>{p.name}</strong>
                            <small>{[POSITIONS[p.position], p.roster[0]?.club?.name, p.height && `${p.height} cm`].filter(Boolean).join(' · ')}</small>
                        </Link></li>
                    ))}
                </ul>
            )}
        </div>
    );
}
