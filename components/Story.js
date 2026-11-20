import Link from 'next/link';
import SmartImage from '@/components/SmartImage';
import RelativeTime from '@/components/RelativeTime';
import { articleUrl } from '@/lib/format';

/**
 * Tek haber kartı, birkaç görünümde:
 *  lead    — manşet: tam görsel üzerine büyük başlık
 *  card    — görsel + başlık + (isteğe bağlı) özet
 *  feature — büyük kart
 *  row     — solda küçük kare görsel
 *  text    — görselsiz, üst çizgili
 */
export default function Story({ item, variant = 'card', summary = false, priority = false, sizes, reveal = true, index = 0, as: Tag = 'article', level = 3 }) {
    const href = articleUrl(item);
    const H = `h${level}`;
    const showImage = variant !== 'text';
    const defaultSizes = {
        lead: '(max-width: 860px) 100vw, 760px',
        feature: '(max-width: 860px) 100vw, 640px',
        card: '(max-width: 600px) 100vw, (max-width: 1100px) 50vw, 300px',
        row: '132px',
    }[variant];

    return (
        <Tag
            className={`story story--${variant}`}
            data-reveal={reveal ? '' : undefined}
            style={reveal ? { '--i': index } : undefined}
        >
            <Link href={href} aria-label={item.title}>
                {showImage && (
                    <div className="media story-media">
                        <SmartImage cover src={item.img} alt="" sizes={sizes || defaultSizes} priority={priority} />
                    </div>
                )}
                <div className="story-body">
                    <span className="kicker">{item.sponsored ? 'Sponsorlu' : item.categoryLabel}{item.format === 'video' ? ' · Video' : item.format === 'galeri' ? ' · Galeri' : ''}</span>
                    {/* Başlık düzeyi sayfaya göre: h1'in hemen altındaki listelerde h2, bölüm başlıklı alanlarda h3 */}
                    <H className="story-title"><span className="ink-link">{item.title}</span></H>
                    {summary && item.summary && <p className="story-summary">{item.summary}</p>}
                    {variant !== 'row' && (
                        <span className="meta">
                            <span>{item.author}</span>
                            {item.publishedAt && <><span className="meta-sep" /><RelativeTime iso={item.publishedAt} /></>}
                        </span>
                    )}
                </div>
            </Link>
        </Tag>
    );
}
