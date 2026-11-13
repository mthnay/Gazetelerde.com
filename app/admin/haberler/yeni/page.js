import { prisma } from '@/lib/db';
import { requirePageUser } from '@/lib/adminPage';
import { canPublish } from '@/lib/permissions';
import ArticleStudio from '@/components/admin/ArticleStudio';

export const metadata = { title: 'Yeni Haber | Yönetim' };

export default async function NewArticlePage({ searchParams }) {
    const user = await requirePageUser();
    const sp = await searchParams;
    const categories = await prisma.category.findMany({ orderBy: { sortOrder: 'asc' }, select: { slug: true, label: true } });
    // İçerik Çek / gelen kutusundan gelindiyse alanlar önceden doldurulur
    const str = (v, n) => (typeof v === 'string' ? v.slice(0, n) : '');
    const feedItemId = Number(sp.oge) || undefined;
    const item = feedItemId ? await prisma.feedItem.findFirst({ where: { id: feedItemId, articleId: null }, select: { id: true } }) : null;
    const initial = {
        sourceUrl: /^https?:\/\//.test(str(sp.kaynak, 1000)) ? str(sp.kaynak, 1000) : '',
        title: str(sp.baslik, 200),
        summary: str(sp.ozet, 500),
        image: /^https:\/\//.test(str(sp.gorsel, 1000)) ? str(sp.gorsel, 1000) : '',
        category: categories.some((c) => c.slug === sp.kategori) ? sp.kategori : undefined,
        feedItemId: item?.id,
    };

    return (
        <>
            <ArticleStudio categories={categories} canPublish={canPublish(user)} initial={initial} />
        </>
    );
}
