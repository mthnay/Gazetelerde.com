import { prisma } from '@/lib/db';
import { requirePageUser } from '@/lib/adminPage';
import { canPublish } from '@/lib/permissions';
import { PLACEMENTS } from '@/lib/ads';
import AdManager from '@/components/admin/AdManager';

export const metadata = { title: 'Reklamlar | Yönetim' };

export default async function AdsPage() {
    const user = await requirePageUser(canPublish);
    const ads = await prisma.adSlot.findMany({ orderBy: [{ placement: 'asc' }, { createdAt: 'desc' }] });
    return (
        <>
            <header className="admin-header">
                <div>
                    <h1>Reklamlar</h1>
                    <p>Görsel reklamlar çerezsizdir ve herkese gösterilir. Reklam ağı kodları (AdSense vb.) yalnızca okur çerez bandında reklama izin verirse yüklenir. Destekçilere hiç reklam gösterilmez.</p>
                </div>
            </header>
            <AdManager
                isAdmin={user.role === 'ADMIN'}
                placements={PLACEMENTS}
                initial={ads.map((a) => ({ ...a, startsAt: a.startsAt?.toISOString() ?? null, endsAt: a.endsAt?.toISOString() ?? null, createdAt: a.createdAt.toISOString() }))}
            />
        </>
    );
}
