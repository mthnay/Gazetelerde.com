import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import NewsGrid from '@/components/NewsGrid';
import SectionHead from '@/components/SectionHead';
import ShareRail from '@/components/ShareRail';
import ReadingProgress from '@/components/motion/ReadingProgress';
import NewsInteractions from '@/components/NewsInteractions';
import MostRead from '@/components/MostRead';
import SourceCredit from '@/components/SourceCredit';
import SmartImage from '@/components/SmartImage';
import PushOptIn from '@/components/PushOptIn';
import LiveBlog from '@/components/LiveBlog';
import AdSlot from '@/components/AdSlot';
import VideoPlayer from '@/components/VideoPlayer';
import GalleryView from '@/components/GalleryView';
import { parseVideo } from '@/lib/video';
import PollWidget from '@/components/PollWidget';
import MatchCardStatic from '@/components/MatchCard';
import { getLiveEntries, getArticleMatches } from '@/lib/live';
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
    return {
        title: `${item.title} | Gazetelerde`,
        description: item.summary,
        alternates: { canonical: url },
        authors: [{ name: item.author }],
        openGraph: {
            title: item.title, description: item.summary, type: 'article', url,
            publishedTime: item.publishedAt, modifiedTime: item.updatedAt,
            section: item.categoryLabel, authors: [item.author], tags: item.tags?.map((t) => t.name),
        },
        twitter: { card: 'summary_large_image', title: item.title, description: item.summary },
    };
}

// Arşive kaldırılan haberin eski bağlantısı kırık kalmasın: kalıcı olarak kategorisine yönlendir
async function archivedTarget(slug) {
    const a = await prisma.article.findFirst({ where: { slug, status: 'ARCHIVED' }, select: { category: { select: { slug: true } } } });
    return a ? `/category/${a.category.slug}` : null;
}

export default async function NewsDetail({ params }) {
    const { slug } = await params;
    const item = await getArticleBySlug(slug);
    if (!item) {
        const to = await archivedTarget(slug);
        if (to) permanentRedirect(to);
        notFound();
    }

    const [related, mostRead, comments, liveEntries, matches, polls] = await Promise.all([
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
        getLiveEntries(item.id),
        getArticleMatches(item.id),
        prisma.poll.findMany({ where: { articleId: item.id }, orderBy: { createdAt: 'asc' }, select: { id: true } }),
    ]);
    const isLiveBlog = item.live || liveEntries.length > 0;
    const video = item.format === 'video' ? parseVideo(item.videoUrl) : null;
    const gallery = item.format === 'galeri' && item.gallery.length ? item.gallery : null;

    const jsonLd = {
        '@context': 'https://schema.org',
        // Canlı anlatımda Google "CANLI" etiketi için LiveBlogPosting
        '@type': isLiveBlog ? 'LiveBlogPosting' : 'NewsArticle',
        ...(isLiveBlog ? {
            coverageStartTime: liveEntries.at(-1)?.createdAt || item.publishedAt,
            ...(item.live ? {} : { coverageEndTime: item.liveEndedAt || liveEntries[0]?.createdAt }),
            liveBlogUpdate: liveEntries.slice(0, 20).map((e) => ({
                '@type': 'BlogPosting', headline: e.text.slice(0, 110), articleBody: e.text, datePublished: e.createdAt, dateModified: e.updatedAt,
                url: `${absoluteUrl(articleUrl(item))}#g-${e.id}`,
            })),
        } : {}),
        headline: item.title,
        description: item.summary,
        // Google: en az 1200 px genişlikte 16:9, 4:3 ve 1:1 oranlarında görseller önerilir
        image: item.img
            ? (item.img.startsWith('/media/') ? ['16x9', '4x3', '1x1'].map((r) => absoluteUrl(`${item.img}?ar=${r}&w=1200&f=jpg`)) : [item.img])
            : [absoluteUrl(`${articleUrl(item)}/opengraph-image`)],
        isAccessibleForFree: true,
        ...(video ? { video: {
            '@type': 'VideoObject', name: item.title, description: item.summary, uploadDate: item.publishedAt,
            thumbnailUrl: [item.img ? absoluteUrl(`${item.img}?w=1200&f=jpg`) : video.thumb].filter(Boolean),
            ...(video.provider === 'file' ? { contentUrl: video.src } : { embedUrl: video.embed.replace('autoplay=1', 'autoplay=0') }),
        } } : {}),
        ...(gallery ? { associatedMedia: gallery.slice(0, 30).map((g) => ({ '@type': 'ImageObject', contentUrl: g.src.startsWith('/') ? absoluteUrl(g.src) : g.src, caption: g.caption || undefined, creditText: g.credit || undefined })) } : {}),
        inLanguage: 'tr-TR',
        datePublished: item.publishedAt,
        dateModified: item.updatedAt,
        mainEntityOfPage: absoluteUrl(articleUrl(item)),
        articleSection: item.categoryLabel,
        keywords: item.tags?.map((t) => t.name).join(', ') || undefined,
        author: [{ '@type': item.authorSlug ? 'Person' : 'Organization', name: item.author, ...(item.authorSlug ? { url: absoluteUrl(`/yazar/${item.authorSlug}`) } : {}) }],
        publisher: { '@type': 'Organization', name: SITE_NAME, logo: { '@type': 'ImageObject', url: absoluteUrl('/icon'), width: 512, height: 512 } },
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
            {item.sponsored && <span className="sponsored-badge rise">Sponsorlu içerik</span>}
            <Link href={`/category/${item.category}`} className="kicker rise" style={{ justifyContent: align === 'left' ? 'flex-start' : 'center' }}>{item.categoryLabel}</Link>
            <h1 className="article-title rise" style={{ '--i': 1 }}>{item.title}</h1>
            <p className="article-standfirst rise" style={{ '--i': 2, ...(align === 'left' ? { margin: 0 } : {}) }}>{item.summary}</p>
            <div className="article-byline rise" style={{ '--i': 3, ...(align === 'left' ? { justifyContent: 'flex-start' } : {}) }}>
                <span className="avatar">{item.author.charAt(0).toLocaleUpperCase('tr')}</span>
                <span style={{ textAlign: 'left' }}>
                    <strong>{item.authorSlug ? <Link href={`/yazar/${item.authorSlug}`} className="byline-link">{item.author}</Link> : item.author}</strong>
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
                {layout.hero === 'immersive' && item.img && !video && !gallery ? (
                    <section className="article-hero--immersive">
                        <div className="media">
                            <SmartImage src={item.img} alt={item.title} sizes="100vw" priority />
                            {item.imageCredit && <span className="image-credit image-credit--overlay">Fotoğraf: {item.imageCredit}</span>}
                        </div>
                        <div className="container" style={{ width: '100%' }}>{head('left')}</div>
                    </section>
                ) : layout.hero === 'split' && item.img && !video && !gallery ? (
                    <section className="article-hero--split">
                        {head('left')}
                        <div className="media">
                            <SmartImage src={item.img} alt={item.title} sizes="(max-width: 960px) 100vw, 640px" priority />
                            {item.imageCredit && <span className="image-credit image-credit--overlay">Fotoğraf: {item.imageCredit}</span>}
                        </div>
                    </section>
                ) : (
                    <>
                        <div className="container">{head('center')}</div>
                        {(video || gallery) && (
                            <div className="container article-figure">
                                {video ? <VideoPlayer video={video} title={item.title} poster={item.img} /> : <GalleryView items={gallery} title={item.title} />}
                            </div>
                        )}
                        {!video && !gallery && layout.hero !== 'minimal' && item.img && (
                            <figure className="container article-figure">
                                <div className="media">
                                    <SmartImage src={item.img} alt={item.title} sizes="(max-width: 1180px) 100vw, 1120px" priority />
                                </div>
                                {item.imageCredit && <figcaption className="image-credit">Fotoğraf: {item.imageCredit}</figcaption>}
                            </figure>
                        )}
                    </>
                )}

                <div className="container article-layout">
                    <aside className="article-rail" aria-label="Paylaş"><ShareRail title={item.title} /></aside>
                    <div>
                        {/* İçerik kaydedilirken sunucuda temizlendi (lib/html.js); burada tekrar temizlenir */}
                        {isLiveBlog && <LiveBlog articleId={item.id} initialEntries={liveEntries} initialMatches={matches} initialLive={item.live} />}
                        {!isLiveBlog && matches.length > 0 && <div className="live-matches">{matches.map((m) => <MatchCardStatic key={m.id} m={m} />)}</div>}
                        <div id="haber-metni" className="article-body" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
                        {item.tags?.length > 0 && (
                            <nav className="article-tags" aria-label="Konular">
                                {item.tags.map((t) => <Link key={t.slug} href={`/etiket/${t.slug}`} className="article-tag">#{t.name}</Link>)}
                            </nav>
                        )}
                        {item.sourceUrl && (
                            <SourceCredit url={item.sourceUrl} name={item.sourceName} icon={item.sourceIcon} />
                        )}
                        {polls.map((p) => <PollWidget key={p.id} pollId={p.id} />)}
                        {!item.sponsored && <AdSlot place="haber-ici" />}
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
                        <div className="aside-sticky"><AdSlot place="haber-yan" /></div>
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
