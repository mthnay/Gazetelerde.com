"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Rss, ArrowUp } from 'lucide-react';

const titleCase = (s) => s.charAt(0) + s.slice(1).toLocaleLowerCase('tr');

export default function Footer({ categories = [] }) {
    const pathname = usePathname();
    if (pathname?.startsWith('/admin')) return null;

    return (
        <footer className="site-footer">
            <div className="container">
                <div className="footer-big" aria-hidden="true">Gazetelerde.</div>
            </div>
            <div className="container footer-grid">
                <div>
                    <span className="wordmark" style={{ fontSize: 28 }}>Gazetelerde<span className="wordmark-dot" /></span>
                    <p className="footer-tag">Doğru, tarafsız ve anlık. Günün haberleri, sakin bir okuma deneyimiyle.</p>
                    <a href="/rss.xml" className="footer-rss"><Rss size={14} /> RSS ile takip et</a>
                </div>
                <nav aria-label="Kategoriler">
                    <h2 className="footer-heading">Kategoriler</h2>
                    <ul>{categories.map((c) => <li key={c.slug}><Link href={`/category/${c.slug}`}>{titleCase(c.label)}</Link></li>)}</ul>
                </nav>
                <nav aria-label="Kurumsal">
                    <h2 className="footer-heading">Kurumsal</h2>
                    <ul style={{ gridTemplateColumns: '1fr' }}>
                        <li><Link href="/kunye">Künye</Link></li>
                        <li><Link href="/iletisim">İletişim</Link></li>
                        <li><Link href="/gizlilik">Gizlilik ve KVKK</Link></li>
                    </ul>
                </nav>
            </div>
            <div className="container footer-bottom">
                <span>© {new Date().getFullYear()} Gazetelerde.com · Tüm hakları saklıdır.</span>
                <button
                    onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })}
                    style={{ background: 'none', border: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600, color: 'inherit' }}
                >
                    Başa dön <ArrowUp size={14} />
                </button>
            </div>
        </footer>
    );
}
