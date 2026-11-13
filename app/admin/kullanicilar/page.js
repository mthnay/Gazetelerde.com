import Link from 'next/link';
import { prisma } from '@/lib/db';
import { requirePageUser } from '@/lib/adminPage';
import { canManageUsers, ROLE_LABELS } from '@/lib/permissions';
import UserManagement from '@/components/admin/UserManagement';

export const metadata = { title: 'Kullanıcılar | Yönetim' };

export default async function AdminUsers({ searchParams }) {
    const me = await requirePageUser(canManageUsers);
    const sp = await searchParams;
    const role = Object.keys(ROLE_LABELS).includes(sp.rol) ? sp.rol : undefined;
    const q = String(sp.q || '').trim().slice(0, 100);

    const where = {
        ...(role ? { role } : {}),
        ...(q ? { OR: [{ name: { contains: q, mode: 'insensitive' } }, { email: { contains: q, mode: 'insensitive' } }] } : {}),
    };
    const [rows, counts] = await Promise.all([
        prisma.user.findMany({
            where, orderBy: { createdAt: 'desc' }, take: 200,
            select: { id: true, name: true, email: true, role: true, createdAt: true, _count: { select: { comments: true, articles: true } } },
        }),
        prisma.user.groupBy({ by: ['role'], _count: true }),
    ]);
    const c = (r) => (r ? counts.find((x) => x.role === r)?._count ?? 0 : counts.reduce((n, x) => n + x._count, 0));

    const users = rows.map((u) => ({
        id: u.id, name: u.name, email: u.email, role: u.role, createdAt: u.createdAt.toISOString(),
        comments: u._count.comments, articles: u._count.articles,
    }));

    return (
        <>
            <header className="admin-header">
                <div><h1>Kullanıcılar</h1><p>Rol değiştirerek ekibe yazar veya editör ekleyebilirsiniz.</p></div>
            </header>
            <div className="admin-toolbar">
                <nav className="admin-tabs">
                    {[undefined, ...Object.keys(ROLE_LABELS)].map((r) => (
                        <Link key={r || 'all'} href={`/admin/kullanicilar${r ? `?rol=${r}` : ''}`} className={`admin-tab ${role === r ? 'active' : ''}`}>
                            {r ? ROLE_LABELS[r] : 'Tümü'}<span className="count">{c(r)}</span>
                        </Link>
                    ))}
                </nav>
                <form className="admin-search" action="/admin/kullanicilar">
                    {role && <input type="hidden" name="rol" value={role} />}
                    <input className="admin-input" type="search" name="q" defaultValue={q} placeholder="Ad veya e-posta..." aria-label="Kullanıcı ara" />
                </form>
            </div>
            <UserManagement initial={users} meId={me.id} />
        </>
    );
}
