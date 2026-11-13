import Link from 'next/link';
import { articleUrl } from '@/lib/format';

export default function MostRead({ items, title = 'Çok Okunanlar' }) {
    if (!items?.length) return null;
    return (
        <section className="most-read" aria-labelledby="most-read-title" data-reveal>
            <span className="kicker">Son 30 gün</span>
            <h2 id="most-read-title" className="most-read-title">{title}</h2>
            <ol>
                {items.map((n, i) => (
                    <li key={n.id}>
                        <span className="most-read-rank" aria-hidden="true">{i + 1}</span>
                        <Link href={articleUrl(n)}>
                            <span className="most-read-cat">{n.categoryLabel}</span>
                            <span className="most-read-headline"><span className="ink-link">{n.title}</span></span>
                        </Link>
                    </li>
                ))}
            </ol>
        </section>
    );
}
