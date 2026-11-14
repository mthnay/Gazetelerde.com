import { notFound } from 'next/navigation';
import Story from '@/components/Story';
import NewsGrid from '@/components/NewsGrid';
import LoadMore from '@/components/LoadMore';
import { getAuthor, getAuthorNews } from '@/lib/news';
import { absoluteUrl, SITE_NAME } from '@/lib/site';

// Yazar sayfası: biyografi + yazarın haberleri. Google, haber sitelerinde yazar bilgisini (E-E-A-T) önemser.
export const revalidate = 300;
export function generateStaticParams() {
    return [];
}

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const a = await getAuthor(slug);
    if (!a) return {};
    const title = `${a.name}${a.title ? ` · ${a.title}` : ''} | Gazetelerde`;
    const description = a.bio?.slice(0, 160) || `${a.name} tarafından yazılan haberler.`;
    return { title, description, alternates: { canonical: `/yazar/${slug}` }, openGraph: { title, description, url: `/yazar/${slug}`, type: 'profile' } };
}

export default async function AuthorPage({ params }) {
    const { slug } = await params;
    const author = await getAuthor(slug);
    if (!author) notFound();
    const news = await getAuthorNews(author.id);
    const [lead, ...rest] = news;
    const jsonLd = {
        '@context': 'https://schema.org', '@type': 'ProfilePage',
        mainEntity: {
            '@type': 'Person', name: author.name, jobTitle: author.title || undefined, description: author.bio || undefined,
            url: absoluteUrl(`/yazar/${slug}`), worksFor: { '@type': 'NewsMediaOrganization', name: SITE_NAME, url: absoluteUrl('/') },
        },
    };

    return (
        <div className="container">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
            <header className="page-hero author-hero">
                <span className="avatar avatar--xl rise" aria-hidden="true">{author.name.charAt(0).toLocaleUpperCase('tr')}</span>
                <div>
                    <span className="kicker rise">{author.title || 'Yazar'} · {news.length === 40 ? '40+' : news.length} haber</span>
                    <h1 className="page-hero-title rise" style={{ '--i': 1, fontSize: 'clamp(42px, 7vw, 96px)' }}>{author.name}<span className="dot">.</span></h1>
                    {author.bio && <p className="page-hero-desc rise" style={{ '--i': 2, whiteSpace: 'pre-line' }}>{author.bio}</p>}
                </div>
            </header>
            {!lead ? (
                <div className="empty"><p className="display">Henüz haber yok</p><p>Yazarın yayınlanan ilk haberi burada görünecek.</p></div>
            ) : (
                <>
                    <div className="cat-block" style={{ marginBottom: 'clamp(36px, 5vw, 60px)' }}>
                        <Story item={lead} variant="feature" summary priority reveal={false} level={2} />
                        <div className="cat-block-list">{rest.slice(0, 4).map((n, i) => <Story key={n.id} item={n} variant="row" index={i} level={2} />)}</div>
                    </div>
                    {rest.length > 4 && <NewsGrid items={rest.slice(4)} summary level={2} />}
                    {news.length === 40 && <LoadMore query={{ yazar: slug }} skip={40} />}
                </>
            )}
        </div>
    );
}
