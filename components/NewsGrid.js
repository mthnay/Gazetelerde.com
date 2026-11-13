import Link from 'next/link';
import NewsCard from '@/components/NewsCard';
import { articleUrl } from '@/lib/format';

// Haber kartı ızgarası (arama sonuçları, ilgili haberler)
export default function NewsGrid({ items, min = 240 }) {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(min(${min}px, 100%), 1fr))`, gap: '24px' }}>
            {items.map((n) => (
                <Link key={n.id} href={articleUrl(n)}>
                    <NewsCard news={n} />
                </Link>
            ))}
        </div>
    );
}
