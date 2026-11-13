import { prisma } from '@/lib/db';
import { requirePageUser } from '@/lib/adminPage';
import { canPublish } from '@/lib/permissions';
import ArticleForm from '@/components/admin/ArticleForm';

export const metadata = { title: 'Yeni Haber | Yönetim' };

export default async function NewArticlePage({ searchParams }) {
    const user = await requirePageUser();
    const sp = await searchParams;
    const categories = await prisma.category.findMany({ orderBy: { sortOrder: 'asc' }, select: { slug: true, label: true } });
    // İçerik Çek sayfasından gelindiyse kaynak link ve başlık önceden doldurulur
    const initial = { sourceUrl: typeof sp.kaynak === 'string' ? sp.kaynak : '', title: typeof sp.baslik === 'string' ? sp.baslik : '' };

    return (
        <>
            <header className="admin-header"><div><h1>Yeni Haber</h1></div></header>
            <ArticleForm categories={categories} canPublish={canPublish(user)} initial={initial} />
        </>
    );
}
