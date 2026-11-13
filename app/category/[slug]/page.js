import { notFound } from 'next/navigation';
import CategoryView from '@/components/CategoryView';
import FollowButton from '@/components/FollowButton';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
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
    const user = await getCurrentUser();
    const [news, follow] = await Promise.all([
        getLatestNews({ category: slug, take: 40 }),
        user ? prisma.categoryFollow.findFirst({ where: { userId: user.id, category: { slug } } }) : null,
    ]);
    return (
        <CategoryView
            catInfo={cat}
            filteredNews={news}
            followButton={<FollowButton slug={slug} label={cat.label} initialFollowing={!!follow} isLoggedIn={!!user} />}
        />
    );
}
