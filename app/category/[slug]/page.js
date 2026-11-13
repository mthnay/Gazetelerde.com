import { notFound } from 'next/navigation';
import Story from '@/components/Story';
import NewsGrid from '@/components/NewsGrid';
import FollowButton from '@/components/FollowButton';
import { getCategory, getLatestNews } from '@/lib/news';

// 60 saniyede bir arka planda yenilenir; yayın/düzenlemede anında tazelenir (revalidatePath)
export const revalidate = 60;

// Boş liste: build sırasında hiçbir sayfa önceden üretilmez, ilk ziyarette üretilip önbelleğe alınır
export function generateStaticParams() {
    return [];
}

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const cat = await getCategory(slug);
    if (!cat) return {};
    const title = `${cat.label} Haberleri | Gazetelerde`;
    return { title, description: cat.description, alternates: { canonical: `/category/${slug}` }, openGraph: { title, description: cat.description, url: `/category/${slug}` } };
}

const titleCase = (s) => s.charAt(0) + s.slice(1).toLocaleLowerCase('tr');

export default async function CategoryPage({ params }) {
    const { slug } = await params;
    const cat = await getCategory(slug);
    if (!cat) notFound();
    const news = await getLatestNews({ category: slug, take: 40 });
    const [lead, ...rest] = news;

    return (
        <div className="container">
            <header className="page-hero">
                <span className="kicker rise">Kategori · {news.length} haber</span>
                <div className="page-hero-row">
                    <h1 className="page-hero-title rise" style={{ '--i': 1 }}>{titleCase(cat.label)}<span className="dot">.</span></h1>
                    <div className="rise" style={{ '--i': 2, paddingBottom: 12 }}>
                        <FollowButton slug={slug} label={titleCase(cat.label)} />
                    </div>
                </div>
                <p className="page-hero-desc rise" style={{ '--i': 2 }}>{cat.description}</p>
            </header>

            {!lead ? (
                <div className="empty"><p className="display">Henüz haber yok</p><p>Bu kategoride yayınlanan ilk haber burada görünecek.</p></div>
            ) : (
                <>
                    <div className="cat-block" style={{ marginBottom: 'clamp(36px, 5vw, 60px)' }}>
                        <Story item={lead} variant="feature" summary priority reveal={false} />
                        <div className="cat-block-list">
                            {rest.slice(0, 4).map((n, i) => <Story key={n.id} item={n} variant="row" index={i} />)}
                        </div>
                    </div>
                    {rest.length > 4 && <NewsGrid items={rest.slice(4)} summary />}
                </>
            )}
        </div>
    );
}
