import 'server-only';
import * as cheerio from 'cheerio';
import { prisma } from '@/lib/db';
import { fetchPublic } from '@/lib/safeFetch';

const MAX_ITEMS = 40;
const clean = (s) => String(s || '').replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

// RSS 2.0 ve Atom akışlarını ortak biçime çevirir
export async function parseFeed(url) {
    const { res } = await fetchPublic(url, { timeoutMs: 15000 });
    const $ = cheerio.load(await res.text(), { xmlMode: true });
    const items = [];
    $('item, entry').slice(0, MAX_ITEMS).each((_, el) => {
        const $el = $(el);
        const title = clean($el.find('title').first().text());
        const link = ($el.find('link').first().text() || $el.find('link[rel="alternate"]').attr('href') || $el.find('link').attr('href') || '').trim();
        if (!title || !/^https?:\/\//.test(link)) return;
        const guid = ($el.find('guid').first().text() || $el.find('id').first().text() || link).trim().slice(0, 500);
        const descRaw = $el.find('description').first().text() || $el.find('summary').first().text() || $el.find('content').first().text();
        let image = $el.find('enclosure[type^="image"]').attr('url') || $el.find('media\\:content, content').attr('url') || $el.find('media\\:thumbnail').attr('url') || '';
        if (!image) image = (descRaw.match(/<img[^>]+src="([^"]+)"/) || [])[1] || '';
        const dateRaw = $el.find('pubDate, published, updated').first().text();
        const d = dateRaw ? new Date(dateRaw) : null;
        items.push({
            guid, title: title.slice(0, 300), link: link.slice(0, 1000),
            summary: clean(descRaw).slice(0, 600),
            image: /^https:\/\//.test(image) ? image.slice(0, 1000) : null,
            publishedAt: d && !Number.isNaN(d.getTime()) ? d : null,
        });
    });
    return items;
}

// Bir kaynağı tarar, yeni öğeleri gelen kutusuna ekler
export async function pollSource(source) {
    try {
        const items = await parseFeed(source.url);
        const res = await prisma.feedItem.createMany({
            data: items.map((i) => ({ ...i, sourceId: source.id })),
            skipDuplicates: true,
        });
        await prisma.feedSource.update({ where: { id: source.id }, data: { lastFetchedAt: new Date(), lastError: null } });
        return { id: source.id, added: res.count, found: items.length };
    } catch (e) {
        const msg = String(e?.message || e).slice(0, 300);
        await prisma.feedSource.update({ where: { id: source.id }, data: { lastFetchedAt: new Date(), lastError: msg } }).catch(() => { });
        return { id: source.id, added: 0, error: msg };
    }
}

// Tüm etkin kaynakları tarar; 30 günden eski, işlenmemiş öğeleri temizler
export async function pollAll() {
    const sources = await prisma.feedSource.findMany({ where: { active: true } });
    const results = [];
    for (const s of sources) results.push(await pollSource(s)); // sırayla: hedef sitelere yük bindirme
    const cutoff = new Date(Date.now() - 30 * 864e5);
    await prisma.feedItem.deleteMany({ where: { status: { in: ['NEW', 'IGNORED'] }, createdAt: { lt: cutoff } } });
    return results;
}
