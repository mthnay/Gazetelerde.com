import Link from 'next/link';
import { notFound } from 'next/navigation';
import { after } from 'next/server';
import NewsCard from '@/components/NewsCard';
import NewsInteractions from '@/components/NewsInteractions';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { getArticleBySlug, getRelatedNews, incrementViews } from '@/lib/news';
import { formatDate, readingTime, paragraphs, articleUrl } from '@/lib/format';

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const item = await getArticleBySlug(slug);
    if (!item) return { title: 'Haber bulunamadı | Gazetelerde' };
    return {
        title: `${item.title} | Gazetelerde`,
        description: item.summary,
        alternates: { canonical: articleUrl(item) },
        openGraph: {
            title: item.title, description: item.summary, type: 'article',
            images: item.img ? [item.img] : [], publishedTime: item.publishedAt,
        },
    };
}

export default async function NewsDetail({ params }) {
    const { slug } = await params;
    const item = await getArticleBySlug(slug);
    if (!item) notFound();

    const user = await getCurrentUser();
    const [related, comments, liked, saved] = await Promise.all([
        getRelatedNews(item),
        prisma.comment.findMany({
            where: { articleId: item.id, status: 'VISIBLE' },
            orderBy: { createdAt: 'desc' },
            take: 100,
            select: { id: true, text: true, createdAt: true, user: { select: { name: true } } },
        }),
        user ? prisma.like.findUnique({ where: { userId_articleId: { userId: user.id, articleId: item.id } } }) : null,
        user ? prisma.bookmark.findUnique({ where: { userId_articleId: { userId: user.id, articleId: item.id } } }) : null,
    ]);

    // Okunma sayısını yanıt gönderildikten sonra artır
    after(() => incrementViews(item.id));

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        headline: item.title,
        description: item.summary,
        image: item.img ? [item.img] : undefined,
        datePublished: item.publishedAt,
        author: [{ '@type': 'Person', name: item.author }],
        publisher: { '@type': 'Organization', name: 'Gazetelerde' },
    };

    return (
        <div className="container" style={{ marginTop: '40px', maxWidth: '800px' }}>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
            <div style={{ marginBottom: '24px' }}>
                <Link href={`/category/${item.category}`} className="news-badge">{item.categoryLabel}</Link>
                <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', lineHeight: '1.2', marginTop: '16px', marginBottom: '16px' }}>
                    {item.title}
                </h1>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '14px' }}>
                    <span>{item.author} · <time dateTime={item.publishedAt}>{formatDate(item.publishedAt)}</time></span>
                    <span>{readingTime(item)} dk okuma</span>
                </div>
            </div>

            {item.img && (
                <div style={{ borderRadius: '12px', overflow: 'hidden', marginBottom: '32px' }}>
                    <img src={item.img.replace('w=800', 'w=1600')} style={{ width: '100%', height: 'auto' }} alt={item.title} />
                </div>
            )}

            <article style={{ fontSize: '1.1rem', lineHeight: '1.8', color: 'var(--text-secondary)', marginBottom: '40px' }}>
                <p style={{ marginBottom: '20px', fontWeight: 600, color: 'var(--text-main)' }}>{item.summary}</p>
                {paragraphs(item.content).map((p, i) => (
                    <p key={i} style={{ marginBottom: '20px' }}>{p}</p>
                ))}
            </article>

            <NewsInteractions
                articleId={item.id}
                title={item.title}
                isLoggedIn={!!user}
                initialLiked={!!liked}
                initialSaved={!!saved}
                initialLikeCount={item.likeCount}
                initialComments={comments.map((c) => ({ id: c.id, text: c.text, user: c.user.name, time: c.createdAt.toISOString() }))}
            />

            {related.length > 0 && (
                <section style={{ marginBottom: '80px' }}>
                    <h2 className="section-title" style={{ marginBottom: '24px' }}>İlgili Haberler</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '24px' }}>
                        {related.map((n) => (
                            <Link key={n.id} href={articleUrl(n)}>
                                <NewsCard news={n} />
                            </Link>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
