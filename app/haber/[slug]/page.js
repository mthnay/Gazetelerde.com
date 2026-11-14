import Link from 'next/link';
import { notFound } from 'next/navigation';
import NewsGrid from '@/components/NewsGrid';
import SectionHead from '@/components/SectionHead';
import ShareRail from '@/components/ShareRail';
import ReadingProgress from '@/components/motion/ReadingProgress';
import NewsInteractions from '@/components/NewsInteractions';
import MostRead from '@/components/MostRead';
import SmartImage from '@/components/SmartImage';
import PushOptIn from '@/components/PushOptIn';
import { prisma } from '@/lib/db';
import { getArticleBySlug, getRelatedNews, getMostRead } from '@/lib/news';
import { formatDate, readingTime, articleUrl } from '@/lib/format';
import { toArticleHtml } from '@/lib/html';
import { normalizeLayout } from '@/lib/layout';
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
            section: item.categoryLabel, authors: [item.author], tags: item.tags?.map((t) => t.name),
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
        keywords: item.tags?.map((t) => t.name).join(', ') || undefined,
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

    const bodyHtml = toArticleHtml(item.content);
    const layout = normalizeLayout(item.layout);
    const articleClass = ['article', layout.width === 'wide' && 'article--wide', !layout.aside && 'article--no-aside', !layout.dropcap && 'article--no-dropcap'].filter(Boolean).join(' ');
    const head = (align) => (
        <header className="article-head" style={align === 'left' ? { textAlign: 'left', margin: 0, maxWidth: 820 } : undefined}>
            <Link href={`/category/${item.category}`} className="kicker rise" style={{ justifyContent: align === 'left' ? 'flex-start' : 'center' }}>{item.categoryLabel}</Link>
            <h1 className="article-title rise" style={{ '--i': 1 }}>{item.title}</h1>
            <p className="article-standfirst rise" style={{ '--i': 2, ...(align === 'left' ? { margin: 0 } : {}) }}>{item.summary}</p>
            <div className="article-byline rise" style={{ '--i': 3, ...(align === 'left' ? { justifyContent: 'flex-start' } : {}) }}>
                <span className="avatar">{item.author.charAt(0).toLocaleUpperCase('tr')}</span>
                <span style={{ textAlign: 'left' }}>
                    <strong>{item.author}</strong>
                    <span className="meta" style={{ marginTop: 2 }}>
                        <time dateTime={item.publishedAt}>{formatDate(item.publishedAt)}</time>
                        <span className="meta-sep" />
                        <span>{readingTime(item)} dk okuma</span>
                    </span>
                </span>
            </div>
        </header>
    );

    return (
        <>
            <ReadingProgress />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, breadcrumb]).replace(/</g, '\\u003c') }} />

            <article className={articleClass}>
                {layout.hero === 'immersive' && item.img ? (
                    <section className="article-hero--immersive">
                        <div className="media">
                            <SmartImage src={item.img} alt={item.title} sizes="100vw" priority />
                        </div>
                        <div className="container" style={{ width: '100%' }}>{head('left')}</div>
                    </section>
                ) : layout.hero === 'split' && item.img ? (
                    <section className="article-hero--split">
                        {head('left')}
                        <div className="media">
                            <SmartImage src={item.img} alt={item.title} sizes="(max-width: 960px) 100vw, 640px" priority />
                        </div>
                    </section>
                ) : (
                    <>
                        <div className="container">{head('center')}</div>
                        {layout.hero !== 'minimal' && item.img && (
                            <figure className="container article-figure">
                                <div className="media">
                                    <SmartImage src={item.img} alt={item.title} sizes="(max-width: 1180px) 100vw, 1120px" priority />
                                </div>
                            </figure>
                        )}
                    </>
                )}

                <div className="container article-layout">
                    <aside className="article-rail" aria-label="Paylaş"><ShareRail title={item.title} /></aside>
                    <div>
                        {/* İçerik kaydedilirken sunucuda temizlendi (lib/html.js); burada tekrar temizlenir */}
                        <div id="haber-metni" className="article-body" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
                        {item.tags?.length > 0 && (
                            <nav className="article-tags" aria-label="Konular">
                                {item.tags.map((t) => <Link key={t.slug} href={`/etiket/${t.slug}`} className="article-tag">#{t.name}</Link>)}
                            </nav>
                        )}
                        {item.sourceUrl && (
                            <p className="article-source">Kaynak: <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer nofollow">{new URL(item.sourceUrl).hostname.replace(/^www\./, '')}</a></p>
                        )}
                        <div className="article-push"><PushOptIn /></div>
                        <NewsInteractions
                            articleId={item.id}
                            title={item.title}
                            initialLikeCount={item.likeCount}
                            initialComments={comments.map((c) => ({
                                ...toClientComment(c),
                                replies: c.replies.map(toClientComment),
                            }))}
                        />
                    </div>
                    {layout.aside && <aside className="article-aside" aria-label="Çok okunanlar">
                        <MostRead items={mostRead.filter((n) => n.id !== item.id).slice(0, 5)} />
                    </aside>}
                </div>
            </article>

            {related.length > 0 && (
                <section className="container section" aria-label="İlgili haberler">
                    <SectionHead title="Bunları da okuyun" kicker={item.categoryLabel} href={`/category/${item.category}`} />
                    <NewsGrid items={related} min={260} summary />
                </section>
            )}
        </>
    );
}
