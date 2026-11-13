import { notFound } from 'next/navigation';
import CategoryView from '@/components/CategoryView';
import { getCategory, getLatestNews } from '@/lib/news';

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const cat = await getCategory(slug);
    return cat ? { title: `${cat.label} Haberleri | Gazetelerde`, description: cat.description } : {};
}

export default async function CategoryPage({ params }) {
    const { slug } = await params;
    const cat = await getCategory(slug);
    if (!cat) notFound();
    const news = await getLatestNews({ category: slug, take: 40 });
    return <CategoryView catInfo={cat} filteredNews={news} />;
}
