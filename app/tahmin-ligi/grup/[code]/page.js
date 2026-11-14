import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { leaderboard } from '@/lib/predictions';
import JoinGroupButton from '@/components/JoinGroupButton';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Arkadaş Ligi | Gazetelerde Tahmin Ligi', robots: { index: false } };

export default async function GroupPage({ params, searchParams }) {
    const code = String((await params).code || '').toUpperCase();
    const period = (await searchParams).donem === 'hafta' ? 'hafta' : 'sezon';
    const g = await prisma.predictionGroup.findUnique({ where: { code }, include: { members: { select: { userId: true } } } });
    if (!g) notFound();
    const ids = g.members.map((m) => m.userId);
    const rows = await leaderboard(period, 200, ids);
    return (
        <div className="container" style={{ maxWidth: 820 }}>
            <header className="page-hero">
                <Link href="/tahmin-ligi" className="kicker">Tahmin Ligi</Link>
                <h1 className="page-hero-title" style={{ fontSize: 'clamp(40px, 7vw, 88px)' }}>{g.name}<span className="dot">.</span></h1>
                <p className="page-hero-desc">{ids.length} kişi · arkadaş ligi</p>
                <JoinGroupButton groupId={g.id} code={g.code} memberIds={ids} />
            </header>
            <nav className="league-tabs" aria-label="Dönem" style={{ marginBottom: 12 }}>
                <Link href={`/tahmin-ligi/grup/${code}?donem=hafta`} className={`article-tag ${period === 'hafta' ? 'is-active' : ''}`}>Bu hafta</Link>
                <Link href={`/tahmin-ligi/grup/${code}`} className={`article-tag ${period === 'sezon' ? 'is-active' : ''}`}>Sezon</Link>
            </nav>
            {!rows.length ? <p className="field-hint">Henüz sonuçlanmış tahmin yok. <Link href="/tahmin-ligi">Açık tahminlere</Link> göz atın.</p> : (
                <div className="table-scroll" tabIndex={0} role="region" aria-label={`${g.name} sıralaması`}>
                    <table className="standings">
                        <thead><tr><th scope="col">#</th><th scope="col" className="left">Okur</th><th scope="col">Doğru</th><th scope="col"><abbr title="Tam set skoru">Tam</abbr></th><th scope="col">Puan</th></tr></thead>
                        <tbody>{rows.map((r) => <tr key={r.userId}><td className="pos">{r.rank}</td><th scope="row" className="left">{r.rank <= 3 ? ['🥇', '🥈', '🥉'][r.rank - 1] : ''} {r.name}</th><td>{r.correct}/{r.total}</td><td>{r.exact}</td><td className="pts">{r.points}</td></tr>)}</tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
