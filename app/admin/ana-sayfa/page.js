import { prisma } from '@/lib/db';
import { requirePageUser } from '@/lib/adminPage';
import { canPublish } from '@/lib/permissions';
import { getHomeLayout } from '@/lib/homeData';
import HomeEditor from '@/components/admin/HomeEditor';

export const metadata = { title: 'Ana Sayfa Düzeni | Yönetim' };
export const dynamic = 'force-dynamic';

export default async function HomeLayoutPage() {
    await requirePageUser(canPublish);
    const [{ blocks, custom, updatedAt }, categories, feedSources] = await Promise.all([
        getHomeLayout(),
        prisma.category.findMany({ orderBy: { sortOrder: 'asc' }, select: { slug: true, label: true } }),
        prisma.feedSource.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, active: true } }),
    ]);
    return (
        <>
            <header className="admin-header">
                <div>
                    <h1>Ana Sayfa Düzeni</h1>
                    <p>
                        Ana sayfadaki blokları sürükleyerek ya da oklarla sıralayın, açıp kapatın, yeni blok ekleyin.
                        Bir bloğa tıklayıp başlığını, haber sayısını, içerik kaynağını ve en üstte sabitlenecek haberleri seçin.
                        {custom && updatedAt ? ` Son kayıt: ${updatedAt.toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' })}.` : ' Şu an özgün düzen kullanılıyor.'}
                    </p>
                </div>
            </header>
            <HomeEditor initial={blocks} custom={custom} categories={categories} feedSources={feedSources} />
        </>
    );
}
