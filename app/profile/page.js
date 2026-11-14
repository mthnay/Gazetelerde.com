import { redirect } from 'next/navigation';
import ProfileView from '@/components/ProfileView';
import { getCurrentUser } from '@/lib/auth';
import { getCategories } from '@/lib/news';
import { prisma } from '@/lib/db';
import { getSupport } from '@/lib/supporters';

export const metadata = { title: 'Profilim | Gazetelerde', robots: { index: false } };

const articleSel = { id: true, slug: true, title: true, publishedAt: true, category: { select: { label: true } } };
const toItem = (a) => ({ id: a.id, slug: a.slug, title: a.title, publishedAt: a.publishedAt?.toISOString(), categoryLabel: a.category.label });

export default async function ProfilePage({ searchParams }) {
    const user = await getCurrentUser();
    if (!user) redirect('/login?next=/profile');
    const { sekme } = await searchParams;

    const visible = { article: { status: 'PUBLISHED' } };
    const [bookmarks, likes, follows, categories, full, support] = await Promise.all([
        prisma.bookmark.findMany({ where: { userId: user.id, ...visible }, orderBy: { createdAt: 'desc' }, select: { article: { select: articleSel } } }),
        prisma.like.findMany({ where: { userId: user.id, ...visible }, orderBy: { createdAt: 'desc' }, select: { article: { select: articleSel } } }),
        prisma.categoryFollow.findMany({ where: { userId: user.id }, select: { category: { select: { slug: true } } } }),
        getCategories(),
        prisma.user.findUnique({ where: { id: user.id }, select: { totpEnabledAt: true, title: true, bio: true, slug: true } }),
        getSupport(user.id),
    ]);

    return (
        <ProfileView
            initialUser={{ name: user.name, email: user.email, title: full?.title ?? '', bio: full?.bio ?? '', slug: full?.slug ?? null }}
            twoFactor={Boolean(full?.totpEnabledAt)}
            support={support ? { tier: support.tier, until: support.until?.toISOString() ?? null } : null}
            staff={user.role !== 'READER'}
            initialTab={['general', 'security', 'bookmarks', 'likes', 'takip'].includes(sekme) ? sekme : 'general'}
            bookmarks={bookmarks.map((b) => toItem(b.article))}
            likes={likes.map((l) => toItem(l.article))}
            categories={categories.map((c) => ({ slug: c.slug, label: c.label }))}
            followed={follows.map((f) => f.category.slug)}
        />
    );
}
