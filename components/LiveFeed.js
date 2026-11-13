import Link from 'next/link';
import RelativeTime from '@/components/RelativeTime';
import { articleUrl } from '@/lib/format';

// Dikey zaman çizelgesi: en son yayınlanan haberler
export default function LiveFeed({ items }) {
    if (!items?.length) return null;
    return (
        <section className="live-feed" aria-labelledby="live-feed-title" data-reveal>
            <span className="kicker kicker--live">Canlı akış</span>
            <h2 id="live-feed-title" className="most-read-title">Dakika dakika</h2>
            <ol>
                {items.map((n) => (
                    <li key={n.id}>
                        <span className="live-feed-time"><RelativeTime iso={n.publishedAt} /></span>
                        <Link href={articleUrl(n)}><span className="ink-link">{n.title}</span></Link>
                    </li>
                ))}
            </ol>
        </section>
    );
}
