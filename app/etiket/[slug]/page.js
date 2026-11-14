import { notFound } from 'next/navigation';
import Story from '@/components/Story';
import NewsGrid from '@/components/NewsGrid';
import LoadMore from '@/components/LoadMore';
import { getTag, getLatestNews } from '@/lib/news';
import { absoluteUrl } from '@/lib/site';

// Konu sayfası: bir etiketin tüm haberleri. Kategori sayfası gibi önbellekten sunulur.
export const revalidate = 60;
export function generateStaticParams() {
    return [];
}

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const tag = await getTag(slug);
    if (!tag) return {};
    const title = `${tag.name} Haberleri | Gazetelerde`;
    const description = tag.description || `${tag.name} ile ilgili son dakika gelişmeleri ve tüm haberler.`;
    return { title, description, alternates: { canonical: `/etiket/${slug}` }, openGraph: { title, description, url: `/etiket/${slug}` } };
}

export default async function TagPage({ params }) {
    const { slug } = await params;
    const tag = await getTag(slug);
    if (!tag) notFound();
    const news = await getLatestNews({ tag: slug, take: 60 });
    const [lead, ...rest] = news;
    const jsonLd = {
        '@context': 'https://schema.org', '@type': 'CollectionPage', name: `${tag.name} haberleri`, url: absoluteUrl(`/etiket/${slug}`),
        mainEntity: { '@type': 'ItemList', itemListElement: news.slice(0, 20).map((n, i) => ({ '@type': 'ListItem', position: i + 1, url: absoluteUrl(`/haber/${n.slug}`) })) },
    };

    return (
        <div className="container">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
            <header className="page-hero">
                <span className="kicker rise">Konu · {news.length === 60 ? `${news.length}+` : news.length} haber</span>
                <div className="page-hero-row">
                    <h1 className="page-hero-title rise" style={{ '--i': 1 }}>#{tag.name}<span className="dot">.</span></h1>
                </div>
                {tag.description && <p className="page-hero-desc rise" style={{ '--i': 2 }}>{tag.description}</p>}
            </header>
            {!lead ? (
                <div className="empty"><p className="display">Henüz haber yok</p><p>Bu konuda yayınlanan ilk haber burada görünecek.</p></div>
            ) : (
                <>
                    <div className="cat-block" style={{ marginBottom: 'clamp(36px, 5vw, 60px)' }}>
                        <Story item={lead} variant="feature" summary priority reveal={false} />
                        <div className="cat-block-list">
                            {rest.slice(0, 4).map((n, i) => <Story key={n.id} item={n} variant="row" index={i} />)}
                        </div>
                    </div>
                    {rest.length > 4 && <NewsGrid items={rest.slice(4)} summary />}
                    {news.length === 60 && <LoadMore query={{ etiket: slug }} skip={60} />}
                </>
            )}
        </div>
    );
}
