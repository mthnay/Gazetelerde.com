import { prisma } from '@/lib/db';
import { requirePageUser } from '@/lib/adminPage';
import { canPublish } from '@/lib/permissions';
import MediaLibrary from '@/components/admin/MediaLibrary';

export const metadata = { title: 'Görseller | Yönetim' };

export default async function MediaPage() {
    const user = await requirePageUser();
    const [stats, noAlt] = await Promise.all([
        prisma.media.aggregate({ _count: true, _sum: { size: true } }),
        prisma.media.count({ where: { alt: '' } }),
    ]);
    return (
        <>
            <header className="admin-header">
                <div>
                    <h1>Görseller</h1>
                    <p>{stats._count} görsel · {Math.round((stats._sum.size || 0) / 1048576)} MB · {noAlt} görselin alternatif metni eksik</p>
                </div>
            </header>
            <MediaLibrary canDelete={canPublish(user)} />
        </>
    );
}
