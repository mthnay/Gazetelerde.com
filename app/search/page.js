import NewsGrid from '@/components/NewsGrid';
import { searchNews } from '@/lib/news';

export const metadata = { title: 'Arama | Gazetelerde', robots: { index: false, follow: true } };

export default async function SearchPage({ searchParams }) {
    const { q = '' } = await searchParams;
    const query = String(q).slice(0, 100);
    const results = await searchNews(query);

    return (
        <div className="container" style={{ paddingTop: '40px', paddingBottom: '80px' }}>
            <form action="/search" role="search" style={{ display: 'flex', gap: '12px', maxWidth: '640px', margin: '0 auto 40px' }}>
                <input
                    type="search"
                    name="q"
                    defaultValue={query}
                    placeholder="Haber ara..."
                    aria-label="Haber ara"
                    style={{ flex: 1, padding: '14px 20px', borderRadius: '99px', border: '1px solid var(--border)', background: 'var(--bg-hover)', color: 'var(--text-main)', outline: 'none', fontSize: '15px' }}
                />
                <button type="submit" className="btn btn-primary">Ara</button>
            </form>

            {query && (
                <h1 className="section-title" style={{ marginBottom: '24px' }}>
                    “{query}” için {results.length} sonuç
                </h1>
            )}

            {query && results.length === 0 && (
                <p style={{ color: 'var(--text-muted)' }}>Sonuç bulunamadı. Farklı bir kelime deneyin.</p>
            )}

            <NewsGrid items={results} min={260} />
        </div>
    );
}
