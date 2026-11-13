import Link from 'next/link';
import { notFound } from 'next/navigation';
import NewsCard from '@/components/NewsCard';
import NewsInteractions from '@/components/NewsInteractions';
import { getAllNews, getNewsById, getRelatedNews, formatDate, readingTime } from '@/lib/news';

export function generateStaticParams() {
    return getAllNews().map((n) => ({ id: String(n.id) }));
}

export async function generateMetadata({ params }) {
    const { id } = await params;
    const item = getNewsById(id);
    if (!item) return { title: 'Haber bulunamadı | Gazetelerde' };
    return {
        title: `${item.title} | Gazetelerde`,
        description: item.summary,
        openGraph: { title: item.title, description: item.summary, images: [item.img], type: 'article' },
    };
}

export default async function NewsDetail({ params }) {
    const { id } = await params;
    const item = getNewsById(id);
    if (!item) notFound();

    const related = getRelatedNews(item);

    return (
        <div className="container" style={{ marginTop: '40px', maxWidth: '800px' }}>
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

            <div style={{ borderRadius: '12px', overflow: 'hidden', marginBottom: '32px' }}>
                <img src={item.img.replace('w=800', 'w=1600')} style={{ width: '100%', height: 'auto' }} alt={item.title} />
            </div>

            <article style={{ fontSize: '1.1rem', lineHeight: '1.8', color: 'var(--text-secondary)', marginBottom: '40px' }}>
                <p style={{ marginBottom: '20px', fontWeight: 600, color: 'var(--text-main)' }}>{item.summary}</p>
                {item.content.map((p, i) => (
                    <p key={i} style={{ marginBottom: '20px' }}>{p}</p>
                ))}
            </article>

            <NewsInteractions newsId={item.id} title={item.title} />

            {related.length > 0 && (
                <section style={{ marginBottom: '80px' }}>
                    <h2 className="section-title" style={{ marginBottom: '24px' }}>İlgili Haberler</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '24px' }}>
                        {related.map((n) => (
                            <Link key={n.id} href={`/news/${n.id}`}>
                                <NewsCard news={n} />
                            </Link>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
