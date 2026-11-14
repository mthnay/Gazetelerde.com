import Link from 'next/link';
import { prisma, buildSafe } from '@/lib/db';
import { TRANSFER_STATUS, POSITIONS } from '@/lib/volley';

export const revalidate = 120;
export const metadata = {
    title: 'Voleybol Transfer Merkezi: Resmi Transferler ve Söylentiler | Gazetelerde',
    description: 'Sultanlar Ligi ve Efeler Ligi transferleri: resmileşenler, görüşmeler ve söylentiler tek sayfada.',
    alternates: { canonical: '/transfer' },
};

const fmt = (d) => new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Istanbul' }).format(d);

export default async function TransferCenter({ searchParams }) {
    const sp = await searchParams;
    const status = TRANSFER_STATUS[sp.durum] ? sp.durum : undefined;
    const gender = ['kadin', 'erkek'].includes(sp.cins) ? sp.cins : undefined;
    const rows = await buildSafe(() => prisma.transfer.findMany({
        where: { ...(status ? { status } : {}), ...(gender ? { player: { gender } } : {}) },
        orderBy: { date: 'desc' }, take: 200,
        include: { player: { select: { slug: true, name: true, position: true, gender: true } }, fromClub: { select: { slug: true, name: true } }, toClub: { select: { slug: true, name: true } } },
    }), []);
    const href = (o) => { const p = new URLSearchParams({ ...(status ? { durum: status } : {}), ...(gender ? { cins: gender } : {}), ...o }); [...p].forEach(([k, v]) => !v && p.delete(k)); return `/transfer${p.size ? `?${p}` : ''}`; };
    const club = (c, n) => (c ? <Link href={`/takim/${c.slug}`}>{c.name}</Link> : n || '—');
    return (
        <div className="container">
            <header className="page-hero">
                <Link href="/voleybol" className="kicker rise">Voleybol</Link>
                <h1 className="page-hero-title rise" style={{ '--i': 1, fontSize: 'clamp(46px, 9vw, 120px)' }}>Transfer<span className="dot">.</span></h1>
                <p className="page-hero-desc rise" style={{ '--i': 2 }}>Söylentiler kesinleşmemiş haberlerdir; resmi açıklama geldiğinde “Resmi” olarak işaretlenir.</p>
            </header>
            <nav className="league-tabs" aria-label="Filtreler" style={{ marginBottom: 24 }}>
                <Link href={href({ durum: '' })} className={`article-tag ${!status ? 'is-active' : ''}`}>Tümü</Link>
                {Object.entries(TRANSFER_STATUS).map(([k, v]) => <Link key={k} href={href({ durum: k })} className={`article-tag ${status === k ? 'is-active' : ''}`}>{v}</Link>)}
                <span style={{ width: 12 }} />
                <Link href={href({ cins: gender === 'kadin' ? '' : 'kadin' })} className={`article-tag ${gender === 'kadin' ? 'is-active' : ''}`}>Kadın</Link>
                <Link href={href({ cins: gender === 'erkek' ? '' : 'erkek' })} className={`article-tag ${gender === 'erkek' ? 'is-active' : ''}`}>Erkek</Link>
            </nav>
            {!rows.length ? <div className="empty"><p className="display">Henüz transfer yok</p></div> : (
                <ul className="transfer-list">
                    {rows.map((t) => (
                        <li key={t.id}>
                            <span className={`transfer-status s-${t.status}`}>{TRANSFER_STATUS[t.status]}</span>
                            <div>
                                <Link href={`/oyuncu/${t.player.slug}`} className="transfer-player">{t.player.name}</Link>
                                <small>{POSITIONS[t.player.position] || ''}</small>
                            </div>
                            <div className="transfer-move">{club(t.fromClub, t.fromName)} <span aria-label="kulübünden">→</span> {club(t.toClub, t.toName)}</div>
                            <div className="transfer-meta">{fmt(t.date)}{t.note && ` · ${t.note}`}{t.sourceUrl && <> · <a href={t.sourceUrl} target="_blank" rel="noopener noreferrer nofollow">kaynak</a></>}</div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
