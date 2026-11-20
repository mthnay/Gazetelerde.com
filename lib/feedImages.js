import { load } from 'cheerio';

// Adresi sayfanın son adresine göre çöz; veri URI'leri çoğunlukla lazy-load yer tutucusudur.
function imageUrl(raw, base) {
    if (!raw?.trim() || raw.startsWith('#')) return null;
    try {
        const url = new URL(raw.trim(), base);
        if (url.protocol === 'https:' && url.href.length <= 1000) return url.href;
    } catch { /* sonraki görsel adayına geç */ }
    return null;
}

export function imageFromElement($img, base) {
    for (const attr of ['data-src', 'data-lazy-src', 'data-original']) {
        const url = imageUrl($img.attr(attr), base);
        if (url) return url;
    }
    for (const attr of ['data-srcset', 'srcset']) {
        const set = $img.attr(attr);
        if (!set || set.includes('data:')) continue;
        const candidates = set.split(',').reverse();
        for (const candidate of candidates) {
            const [src] = candidate.trim().split(/\s+/);
            const url = imageUrl(src, base);
            if (url) return url;
        }
    }
    return imageUrl($img.attr('src'), base);
}

export function articleCover($, base) {
    for (const key of ['og:image:secure_url', 'og:image', 'twitter:image']) {
        const url = imageUrl($(`meta[property="${key}"], meta[name="${key}"]`).first().attr('content'), base);
        if (url) return url;
    }
    for (const selector of ['.post-image img, img.wp-post-image', '[itemprop="articleBody"] img, .entry-content img, article figure img']) {
        for (const el of $(selector).toArray()) {
            const url = imageFromElement($(el), base);
            if (url) return url;
        }
    }
    return null;
}

export function feedCover($, $item, base) {
    for (const node of $item.find('enclosure, media\\:content, media\\:thumbnail').toArray()) {
        const el = $(node);
        const type = el.attr('type');
        const medium = el.attr('medium');
        if ((type && !type.startsWith('image/')) || (medium && medium !== 'image')) continue;
        if (node.name !== 'media:thumbnail' && !type && !medium && !/\.(avif|gif|jpe?g|png|webp)(?:[?#]|$)/i.test(el.attr('url') || '')) continue;
        const url = imageUrl(el.attr('url'), base);
        if (url) return url;
    }
    for (const el of $item.find('content\\:encoded, description, summary, content').toArray()) {
        const html = $(el).text();
        if (!/<img\b/i.test(html)) continue;
        const doc = load(html);
        for (const img of doc('img').toArray()) {
            const url = imageFromElement(doc(img), base);
            if (url) return url;
        }
    }
    return null;
}
