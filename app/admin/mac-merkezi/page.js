import Link from 'next/link';
import { prisma } from '@/lib/db';
import { requirePageUser } from '@/lib/adminPage';
import { canPublish } from '@/lib/permissions';
import { SPORTS } from '@/lib/standings';
import NewLeagueForm from '@/components/admin/matches/NewLeagueForm';

export const metadata = { title: 'Maç Merkezi | Yönetim' };

export default async function AdminLeagues() {
    await requirePageUser(canPublish);
    const leagues = await prisma.league.findMany({
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        select: { id: true, slug: true, name: true, season: true, sport: true, active: true, _count: { select: { teams: true, matches: true } } },
    });
    return (
        <>
            <header className="admin-header">
                <div><h1>Maç Merkezi</h1><p>Ligleri, takımları ve maçları buradan yönetin. Puan durumu sonuçlardan otomatik hesaplanır.</p></div>
                <a href="/mac-merkezi" target="_blank" rel="noreferrer" className="admin-btn">Sitede gör</a>
            </header>
            <div className="admin-grid-2">
                <div className="admin-panel" style={{ padding: 0 }}>
                    {!leagues.length ? <p className="admin-empty">Henüz lig yok. Yandan ilk ligi ekleyin (ör. Sultanlar Ligi, 2025-26).</p> : (
                        <div className="admin-table-wrap">
                            <table className="admin-table">
                                <thead><tr><th>Lig</th><th>Spor</th><th>Takım</th><th>Maç</th><th>Durum</th></tr></thead>
                                <tbody>
                                    {leagues.map((l) => (
                                        <tr key={l.id}>
                                            <td style={{ fontWeight: 600 }}><Link href={`/admin/mac-merkezi/${l.id}`}>{l.name} {l.season}</Link></td>
                                            <td className="muted">{SPORTS[l.sport] || l.sport}</td>
                                            <td className="muted">{l._count.teams}</td>
                                            <td className="muted">{l._count.matches}</td>
                                            <td>{l.active ? <span className="badge ok">Yayında</span> : <span className="badge">Gizli</span>}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
                <NewLeagueForm sports={SPORTS} />
            </div>
        </>
    );
}
