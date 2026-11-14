import Story from '@/components/Story';
import NewsGrid from '@/components/NewsGrid';
import LoadMore from '@/components/LoadMore';
import { getLatestNews } from '@/lib/news';
import { buildSafe } from '@/lib/db';

export const revalidate = 120;
export const metadata = { title: 'Video | Gazetelerde', description: 'Gazetelerde video haberleri: maç özetleri, röportajlar ve son dakika görüntüleri.', alternates: { canonical: '/video' } };

export default async function Page() {
    const news = await buildSafe(() => getLatestNews({ format: 'video', take: 24 }), []);
    const [lead, ...rest] = news;
    return (
        <div className="container">
            <header className="page-hero">
                <span className="kicker rise">Gazetelerde</span>
                <h1 className="page-hero-title rise" style={{ '--i': 1 }}>Video<span className="dot">.</span></h1>
            </header>
            {!lead ? <div className="empty"><p className="display">Yakında</p><p>İlk video haberi yayınlandığında burada görünecek.</p></div> : (
                <>
                    <div className="cat-block" style={{ marginBottom: 'clamp(36px, 5vw, 60px)' }}>
                        <Story item={lead} variant="feature" summary priority reveal={false} level={2} />
                        <div className="cat-block-list">{rest.slice(0, 4).map((n, i) => <Story key={n.id} item={n} variant="row" index={i} level={2} />)}</div>
                    </div>
                    {rest.length > 4 && <NewsGrid items={rest.slice(4)} summary level={2} />}
                    {news.length === 24 && <LoadMore query={{ tur: 'video' }} skip={24} />}
                </>
            )}
        </div>
    );
}
