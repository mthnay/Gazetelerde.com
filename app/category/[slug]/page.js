import { notFound } from 'next/navigation';
import CategoryView from '@/components/CategoryView';
import FollowButton from '@/components/FollowButton';
import { getCategory, getLatestNews } from '@/lib/news';

// 60 saniyede bir arka planda yenilenir; yayın/düzenlemede anında tazelenir (revalidatePath)
export const revalidate = 60;

// Boş liste: build sırasında hiçbir sayfa önceden üretilmez, ilk ziyarette üretilip önbelleğe alınır
export function generateStaticParams() {
    return [];
}

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const cat = await getCategory(slug);
    if (!cat) return {};
    const title = `${cat.label} Haberleri | Gazetelerde`;
    return { title, description: cat.description, alternates: { canonical: `/category/${slug}` }, openGraph: { title, description: cat.description, url: `/category/${slug}` } };
}

export default async function CategoryPage({ params }) {
    const { slug } = await params;
    const cat = await getCategory(slug);
    if (!cat) notFound();
    const news = await getLatestNews({ category: slug, take: 40 });
    return (
        <CategoryView
            catInfo={cat}
            filteredNews={news}
            followButton={<FollowButton slug={slug} label={cat.label} />}
        />
    );
}
