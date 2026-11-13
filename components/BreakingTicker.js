import Link from 'next/link';
import { articleUrl } from '@/lib/format';

// Saf CSS ile kayan son dakika şeridi (JS gerektirmez, hareket azaltma tercihine uyar)
export default function BreakingTicker({ items, flagged }) {
    if (!items?.length) return null;
    const loop = [...items, ...items]; // kesintisiz kayma için iki kez
    return (
        <div className="ticker" role="region" aria-label={flagged ? 'Son dakika' : 'Son haberler'}>
            <span className="ticker-label">{flagged ? 'SON DAKİKA' : 'SON HABERLER'}</span>
            <div className="ticker-viewport">
                <ul className="ticker-track" style={{ animationDuration: `${items.length * 8}s` }}>
                    {loop.map((n, i) => (
                        <li key={`${n.id}-${i}`} aria-hidden={i >= items.length ? 'true' : undefined}>
                            <Link href={articleUrl(n)} tabIndex={i >= items.length ? -1 : undefined}>
                                <span className="ticker-cat">{n.categoryLabel}</span> {n.title}
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
