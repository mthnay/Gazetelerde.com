import Link from 'next/link';
import { notFound } from 'next/navigation';
import NewsGrid from '@/components/NewsGrid';
import NewsInteractions from '@/components/NewsInteractions';
import MostRead from '@/components/MostRead';
import SmartImage from '@/components/SmartImage';
import { prisma } from '@/lib/db';
import { getArticleBySlug, getRelatedNews, getMostRead } from '@/lib/news';
import { formatDate, readingTime, paragraphs, articleUrl } from '@/lib/format';
import { absoluteUrl, SITE_NAME } from '@/lib/site';

// Yorumu istemciye gönderirken kullanıcı kimliği yerine sadece "benim mi" bilgisi gider
const toClientComment = (c) => ({
    id: c.id, text: c.text, user: c.user.name, time: c.createdAt.toISOString(),
});

// Sayfa önbellekten sunulur, 60 sn'de bir arka planda yenilenir.
// Haber düzenlenince / yorum gelince revalidatePath ile anında tazelenir.
export const revalidate = 60;

// Boş liste: build sırasında hiçbir sayfa önceden üretilmez, ilk ziyarette üretilip önbelleğe alınır
export function generateStaticParams() {
    return [];
}

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const item = await getArticleBySlug(slug);
    if (!item) return { title: 'Haber bulunamadı | Gazetelerde' };
    const url = articleUrl(item);
    const images = item.img ? [{ url: item.img, alt: item.title }] : undefined;
    return {
        title: `${item.title} | Gazetelerde`,
        description: item.summary,
        alternates: { canonical: url },
        authors: [{ name: item.author }],
        openGraph: {
            title: item.title, description: item.summary, type: 'article', url,
            images, publishedTime: item.publishedAt, modifiedTime: item.updatedAt,
            section: item.categoryLabel, authors: [item.author],
        },
        twitter: { card: 'summary_large_image', title: item.title, description: item.summary, images: item.img ? [item.img] : undefined },
    };
}

export default async function NewsDetail({ params }) {
    const { slug } = await params;
    const item = await getArticleBySlug(slug);
    if (!item) notFound();

    const [related, mostRead, comments] = await Promise.all([
        getRelatedNews(item),
        getMostRead(5),
        prisma.comment.findMany({
            where: { articleId: item.id, status: 'VISIBLE', parentId: null },
            orderBy: { createdAt: 'desc' },
            take: 100,
            select: {
                id: true, text: true, createdAt: true, user: { select: { name: true } },
                replies: {
                    where: { status: 'VISIBLE' }, orderBy: { createdAt: 'asc' },
                    select: { id: true, text: true, createdAt: true, user: { select: { name: true } } },
                },
            },
        }),
    ]);

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        headline: item.title,
        description: item.summary,
        image: item.img ? [item.img] : undefined,
        datePublished: item.publishedAt,
        dateModified: item.updatedAt,
        mainEntityOfPage: absoluteUrl(articleUrl(item)),
        articleSection: item.categoryLabel,
        author: [{ '@type': 'Person', name: item.author }],
        publisher: { '@type': 'Organization', name: SITE_NAME, logo: { '@type': 'ImageObject', url: absoluteUrl('/icon') } },
    };

    const breadcrumb = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: absoluteUrl('/') },
            { '@type': 'ListItem', position: 2, name: item.categoryLabel, item: absoluteUrl(`/category/${item.category}`) },
            { '@type': 'ListItem', position: 3, name: item.title },
        ],
    };

    return (
        <div className="container" style={{ marginTop: '40px', maxWidth: '800px' }}>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, breadcrumb]).replace(/</g, '\\u003c') }} />
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
                <div style={{ position: 'relative', aspectRatio: '16 / 9', borderRadius: '12px', overflow: 'hidden', marginBottom: '32px', background: 'var(--bg-hover)' }}>
                    <SmartImage src={item.img} alt={item.title} sizes="(max-width: 840px) 100vw, 800px" priority />
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
                initialLikeCount={item.likeCount}
                initialComments={comments.map((c) => ({
                    ...toClientComment(c),
                    replies: c.replies.map(toClientComment),
                }))}
            />

            {related.length > 0 && (
                <section style={{ marginBottom: '80px' }}>
                    <h2 className="section-title" style={{ marginBottom: '24px' }}>İlgili Haberler</h2>
                    <NewsGrid items={related} min={220} />
                </section>
            )}

            <div style={{ marginBottom: '80px' }}>
                <MostRead items={mostRead.filter((n) => n.id !== item.id).slice(0, 5)} />
            </div>
        </div>
    );
}
