import Link from 'next/link';
import { TrendingUp } from 'lucide-react';
import { articleUrl } from '@/lib/format';

export default function MostRead({ items, title = 'En Çok Okunanlar' }) {
    if (!items?.length) return null;
    return (
        <section className="most-read glass-panel" aria-labelledby="most-read-title">
            <h2 id="most-read-title" className="most-read-title"><TrendingUp size={18} /> {title}</h2>
            <ol>
                {items.map((n, i) => (
                    <li key={n.id}>
                        <span className="most-read-rank">{i + 1}</span>
                        <Link href={articleUrl(n)}>
                            <span className="most-read-cat">{n.categoryLabel}</span>
                            <span className="most-read-headline">{n.title}</span>
                        </Link>
                    </li>
                ))}
            </ol>
        </section>
    );
}
