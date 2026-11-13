"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Rss } from 'lucide-react';

export default function Footer({ categories = [] }) {
    const pathname = usePathname();
    if (pathname?.startsWith('/admin')) return null;
    const year = new Date().getFullYear();

    return (
        <footer className="site-footer">
            <div className="container footer-grid">
                <div>
                    <Link href="/" className="footer-logo">GAZETELERDE</Link>
                    <p className="footer-tag">Doğru, tarafsız ve anlık haber akışı.</p>
                    <a href="/rss.xml" className="footer-rss"><Rss size={14} /> RSS akışı</a>
                </div>
                <nav aria-label="Kategoriler">
                    <h3>Kategoriler</h3>
                    <ul>{categories.map((c) => <li key={c.slug}><Link href={`/category/${c.slug}`}>{c.label}</Link></li>)}</ul>
                </nav>
                <nav aria-label="Kurumsal">
                    <h3>Kurumsal</h3>
                    <ul>
                        <li><Link href="/kunye">Künye</Link></li>
                        <li><Link href="/iletisim">İletişim</Link></li>
                        <li><Link href="/gizlilik">Gizlilik ve KVKK</Link></li>
                    </ul>
                </nav>
            </div>
            <div className="container footer-bottom">© {year} Gazetelerde.com · Tüm hakları saklıdır.</div>
        </footer>
    );
}
