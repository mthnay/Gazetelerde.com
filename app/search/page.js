import { Search } from 'lucide-react';
import NewsGrid from '@/components/NewsGrid';
import { searchNews } from '@/lib/news';

export const metadata = { title: 'Arama | Gazetelerde', robots: { index: false, follow: true } };

export default async function SearchPage({ searchParams }) {
    const { q = '' } = await searchParams;
    const query = String(q).slice(0, 100);
    const results = await searchNews(query);

    return (
        <div className="container">
            <header className="page-hero">
                <span className="kicker rise">Arşiv</span>
                <h1 className="page-hero-title rise" style={{ '--i': 1, fontSize: 'clamp(44px, 8vw, 110px)' }}>
                    {query ? <>“{query}”</> : <>Ne arıyorsunuz<span className="dot">?</span></>}
                </h1>
                <form action="/search" role="search" className="rise" style={{ '--i': 2, display: 'flex', gap: 10, maxWidth: 640 }}>
                    <input className="input input-pill" type="search" name="q" defaultValue={query} placeholder="Başlık, konu veya kelime…" aria-label="Haber ara" />
                    <button type="submit" className="btn btn-primary" style={{ height: 50 }}><Search size={16} /> Ara</button>
                </form>
            </header>

            {query && (
                <p className="kicker kicker--plain" style={{ marginBottom: 24 }}>
                    {results.length ? `${results.length} sonuç bulundu` : 'Sonuç yok'}
                </p>
            )}
            {query && results.length === 0 && (
                <div className="empty"><p className="display">Bu aramayla eşleşen haber yok</p><p>Daha kısa ya da farklı bir kelimeyle deneyin.</p></div>
            )}
            {results.length > 0 && <NewsGrid items={results} min={270} summary />}
        </div>
    );
}
