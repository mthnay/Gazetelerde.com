import Link from 'next/link';
import { Search } from 'lucide-react';
import SmartImage from '@/components/SmartImage';
import RelativeTime from '@/components/RelativeTime';
import { searchNews } from '@/lib/news';
import { articleUrl } from '@/lib/format';

export const metadata = { title: 'Arama | Gazetelerde', robots: { index: false, follow: true } };

const PER_PAGE = 20;

export default async function SearchPage({ searchParams }) {
    const sp = await searchParams;
    const query = String(sp.q || '').slice(0, 100).trim();
    const page = Math.max(1, Math.min(50, Math.trunc(Number(sp.sayfa)) || 1));
    const { items, total } = await searchNews(query, { take: PER_PAGE, skip: (page - 1) * PER_PAGE });
    const pages = Math.ceil(total / PER_PAGE);
    const href = (p) => `/search?${new URLSearchParams({ q: query, ...(p > 1 ? { sayfa: String(p) } : {}) })}`;

    return (
        <div className="container">
            <header className="page-hero">
                <span className="kicker rise">Arşiv</span>
                <h1 className="page-hero-title rise" style={{ '--i': 1, fontSize: 'clamp(44px, 8vw, 110px)' }}>
                    {query ? <>“{query}”</> : <>Ne arıyorsunuz<span className="dot">?</span></>}
                </h1>
                <form action="/search" role="search" className="rise" style={{ '--i': 2, display: 'flex', gap: 10, maxWidth: 640 }}>
                    <input className="input input-pill" type="search" name="q" defaultValue={query} placeholder="Konu, kişi, takım ya da kelime…" aria-label="Haber ara" />
                    <button type="submit" className="btn btn-primary" style={{ height: 50 }}><Search size={16} /> Ara</button>
                </form>
                {!query && <p className="field-hint rise" style={{ '--i': 3, marginTop: 10 }}>İpucu: tam ifade için tırnak kullanın (“Sultanlar Ligi”), bir kelimeyi hariç tutmak için başına eksi koyun (voleybol -erkek).</p>}
            </header>

            {query && (
                <p className="kicker kicker--plain" style={{ marginBottom: 24 }}>
                    {total ? `${total} sonuç${pages > 1 ? ` · sayfa ${page}/${pages}` : ''}` : 'Sonuç yok'}
                </p>
            )}
            {query && total === 0 && (
                <div className="empty"><p className="display">Bu aramayla eşleşen haber yok</p><p>Daha kısa ya da farklı bir kelimeyle deneyin.</p></div>
            )}

            {items.length > 0 && (
                <ol className="search-results">
                    {items.map((n) => (
                        <li key={n.id}>
                            <Link href={articleUrl(n)} className="search-hit">
                                <span className="search-hit-text">
                                    <span className="meta"><span>{n.categoryLabel}</span><span className="meta-sep" /><RelativeTime iso={n.publishedAt} /></span>
                                    <strong>{n.title}</strong>
                                    {/* Vurgulu parça veritabanından gelir; lib/news.js'te <mark> dışındaki her şey kaçırılır */}
                                    <span className="search-snippet" dangerouslySetInnerHTML={{ __html: n.snippet || n.summary.replace(/&/g, '&amp;').replace(/</g, '&lt;') }} />
                                </span>
                                <span className="search-hit-img"><SmartImage cover src={n.img} alt="" sizes="160px" /></span>
                            </Link>
                        </li>
                    ))}
                </ol>
            )}

            {pages > 1 && (
                <nav className="pager" aria-label="Sayfalar">
                    {page > 1 && <Link className="btn" href={href(page - 1)}>← Önceki</Link>}
                    <span className="kicker kicker--plain">{page} / {pages}</span>
                    {page < pages && <Link className="btn" href={href(page + 1)}>Sonraki →</Link>}
                </nav>
            )}
        </div>
    );
}
