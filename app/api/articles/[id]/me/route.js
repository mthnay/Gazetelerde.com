import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { findPublishedArticle } from '@/lib/articleApi';
import { fail } from '@/lib/api';

// Haber sayfasının kişiye özel kısmı: beğeni/kayıt durumu, güncel beğeni sayısı, hangi yorumlar benim
export async function GET(_request, { params }) {
    const article = await findPublishedArticle(params);
    if (!article) return fail('Haber bulunamadı.', 404);
    const user = await getCurrentUser();

    const [likeCount, liked, saved, mine] = await Promise.all([
        prisma.like.count({ where: { articleId: article.id } }),
        user ? prisma.like.findUnique({ where: { userId_articleId: { userId: user.id, articleId: article.id } } }) : null,
        user ? prisma.bookmark.findUnique({ where: { userId_articleId: { userId: user.id, articleId: article.id } } }) : null,
        user ? prisma.comment.findMany({ where: { articleId: article.id, userId: user.id }, select: { id: true } }) : [],
    ]);

    return NextResponse.json(
        { success: true, likeCount, liked: !!liked, saved: !!saved, mine: mine.map((c) => c.id) },
        { headers: { 'Cache-Control': 'private, no-store' } },
    );
}
