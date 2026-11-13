import { redirect } from 'next/navigation';
import ProfileView from '@/components/ProfileView';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const metadata = { title: 'Profilim | Gazetelerde', robots: { index: false } };

export default async function ProfilePage() {
    const user = await getCurrentUser();
    if (!user) redirect('/login?next=/profile');

    const rows = await prisma.bookmark.findMany({
        where: { userId: user.id, article: { status: 'PUBLISHED' } },
        orderBy: { createdAt: 'desc' },
        select: { article: { select: { id: true, slug: true, title: true, publishedAt: true, category: { select: { label: true } } } } },
    });
    const bookmarks = rows.map(({ article: a }) => ({
        id: a.id, slug: a.slug, title: a.title, publishedAt: a.publishedAt?.toISOString(), categoryLabel: a.category.label,
    }));

    return <ProfileView initialUser={{ name: user.name, email: user.email }} bookmarks={bookmarks} />;
}
