import { prisma } from '@/lib/db';
import { requirePageUser } from '@/lib/adminPage';
import { canPublish, canManageUsers } from '@/lib/permissions';
import SupportAdmin from '@/components/admin/SupportAdmin';

export const metadata = { title: 'Destekçiler | Yönetim' };

const isActive = (s) => !s.until || s.until.getTime() > Date.now();

export default async function SupportAdminPage() {
    const user = await requirePageUser(canPublish);
    const [tiers, supporters] = await Promise.all([
        prisma.supportTier.findMany({ orderBy: [{ sortOrder: 'asc' }, { amount: 'asc' }] }),
        prisma.supporter.findMany({ orderBy: { createdAt: 'desc' }, take: 300, include: { user: { select: { name: true } } } }),
    ]);
    const active = supporters.filter(isActive);
    return (
        <>
            <header className="admin-header">
                <div>
                    <h1>Destekçiler</h1>
                    <p>{active.length} aktif destekçi · {active.filter((s) => s.userId).length} tanesi üye hesabına bağlı (reklamsız okuma açık). Ödemeler sağlayıcının panelinden takip edilir; ödeme gelince destekçiyi buraya ekleyin.</p>
                </div>
                <a className="admin-btn" href="/destek" target="_blank" rel="noreferrer">Destek sayfası</a>
            </header>
            <SupportAdmin
                canEditTiers={canManageUsers(user)}
                tiers={tiers}
                supporters={supporters.map((s) => ({
                    id: s.id, email: s.email, name: s.name || s.user?.name || '', tier: s.tier, amount: s.amount, linked: Boolean(s.userId),
                    until: s.until?.toISOString() ?? null, createdAt: s.createdAt.toISOString(), note: s.note, active: isActive(s),
                }))}
            />
        </>
    );
}
