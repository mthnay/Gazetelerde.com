import 'server-only';
import * as cheerio from 'cheerio';
import { prisma } from '@/lib/db';
import { fetchPublic } from '@/lib/safeFetch';
import { passesFilter } from '@/lib/classify';

const MAX_ITEMS = 40;

const KINDS = ['RSS', 'HTML'];
const MODES = ['INBOX', 'DRAFT', 'REVIEW', 'PUBLISH'];
// İstek gövdesindeki ayarları doğrular (eklerken ve güncellerken)
export function feedSettings(body) {
    const data = {};
    if (KINDS.includes(body?.kind)) data.kind = body.kind;
    if (MODES.includes(body?.mode)) data.mode = body.mode;
    if (['voleybol', 'spor'].includes(body?.sport)) data.sport = body.sport;
    for (const k of ['linkPattern', 'include', 'exclude']) if (typeof body?.[k] === 'string') data[k] = body[k].trim().slice(0, 300);
    for (const k of ['breaking', 'rewrite', 'active']) if (typeof body?.[k] === 'boolean') data[k] = body[k];
    return data;
}

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

const TR_MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

// Akışı olmayan siteler (ör. TVF): liste sayfasındaki haber bağlantılarını toplar.
// pattern: bağlantının içermesi gereken yol parçası (ör. "/icerik/"); boşsa aynı sitedeki tüm derin bağlantılar.
export async function parseHtmlList(url, pattern = '') {
    const { res } = await fetchPublic(url, { timeoutMs: 15000 });
    const base = res.url || url;
    const $ = cheerio.load(await res.text());
    const host = new URL(base).hostname.replace(/^www\./, '');
    const seen = new Map();
    $('a[href]').each((_, el) => {
        const $a = $(el);
        let href;
        try { href = new URL($a.attr('href'), base); } catch { return; }
        if (!/^https?:$/.test(href.protocol) || href.hostname.replace(/^www\./, '') !== host) return;
        href.hash = '';
        const link = href.href;
        if (pattern ? !link.includes(pattern) : href.pathname.split('/').filter(Boolean).length < 2) return;
        const raw = clean($a.attr('title') || $a.find('h1,h2,h3,h4,[class*="title"]').first().text() || $a.text());
        // Liste kartlarında başlığa yapışan tarih ("… 16 Kasım 2026") ayrılır
        const dm = clean($a.text()).match(/(\d{1,2}) (Ocak|Şubat|Mart|Nisan|Mayıs|Haziran|Temmuz|Ağustos|Eylül|Ekim|Kasım|Aralık) (\d{4})/);
        const title = raw.replace(/\s+\d{1,2}( (Ocak|Şubat|Mart|Nisan|Mayıs|Haziran|Temmuz|Ağustos|Eylül|Ekim|Kasım|Aralık) \d{4})?$/, '').trim();
        if (title.length < 15) return; // menü / "devamı" bağlantıları
        const prev = seen.get(link);
        let image = $a.find('img').attr('src') || ($a.find('[style*="background-image"]').attr('style') || '').match(/url\(['"]?([^'")]+)/)?.[1] || '';
        try { image = image ? new URL(image, base).href : ''; } catch { image = ''; }
        if (!prev || (!prev.image && image) || title.length > prev.title.length) {
            const publishedAt = dm ? new Date(Date.UTC(+dm[3], TR_MONTHS.indexOf(dm[2]), +dm[1], 9)) : prev?.publishedAt || null;
            seen.set(link, { guid: link.slice(0, 500), title: title.slice(0, 300), link: link.slice(0, 1000), summary: '', image: /^https:\/\//.test(image) ? encodeURI(decodeURI(image)).slice(0, 1000) : (prev?.image || null), publishedAt });
        }
    });
    return [...seen.values()].slice(0, MAX_ITEMS);
}

// Haber sayfasından başlık, özet, görsel, tarih ve metin paragraflarını çıkarır
export async function fetchArticlePage(url) {
    const { res } = await fetchPublic(url, { timeoutMs: 15000 });
    const $ = cheerio.load(await res.text());
    const meta = (k) => $(`meta[property="${k}"]`).attr('content') || $(`meta[name="${k}"]`).attr('content') || '';
    let image = meta('og:image');
    try { image = image ? new URL(image, res.url || url).href : ''; } catch { image = ''; }
    const d = new Date(meta('article:published_time') || $('time[datetime]').attr('datetime') || '');
    $('script,style,nav,header,footer,aside,form,noscript').remove();
    let paragraphs = [];
    for (const sel of ['article', '[itemprop="articleBody"]', '.article-body', '.news-detail', '.content', 'main', 'body']) {
        paragraphs = $(sel).first().find('p').map((_, p) => clean($(p).text())).get().filter((t) => t.length > 40);
        if (paragraphs.join(' ').length > 300) break;
    }
    return {
        title: clean(meta('og:title') || $('h1').first().text() || $('title').text()),
        summary: clean(meta('og:description') || meta('description')),
        image: /^https:\/\//.test(image) ? encodeURI(decodeURI(image)) : null,
        publishedAt: Number.isNaN(d.getTime()) ? null : d,
        paragraphs: paragraphs.slice(0, 40),
    };
}

const readSource = (source) => (source.kind === 'HTML' ? parseHtmlList(source.url, source.linkPattern) : parseFeed(source.url));

// Bir kaynağı tarar, yeni öğeleri gelen kutusuna ekler; kaynak otomatik moddaysa haberleştirir
export async function pollSource(source) {
    try {
        const items = (await readSource(source)).filter((i) => passesFilter(`${i.title} ${i.summary}`, source));
        const res = await prisma.feedItem.createMany({
            data: items.map((i) => ({ ...i, sourceId: source.id })),
            skipDuplicates: true,
        });
        await prisma.feedSource.update({ where: { id: source.id }, data: { lastFetchedAt: new Date(), lastError: null } });
        const auto = source.mode && source.mode !== 'INBOX' ? await processNewItems(source) : null;
        return { id: source.id, added: res.count, found: items.length, ...(auto ? { published: auto.done, failed: auto.failed } : {}) };
    } catch (e) {
        const msg = String(e?.message || e).slice(0, 300);
        await prisma.feedSource.update({ where: { id: source.id }, data: { lastFetchedAt: new Date(), lastError: msg } }).catch(() => { });
        return { id: source.id, added: 0, error: msg };
    }
}

// Tek tarama turunda bir kaynaktan en fazla bu kadar haber işlenir (yapay zekâ maliyeti / hedef siteye yük)
const AUTO_PER_RUN = Number(process.env.FEED_AUTO_PER_RUN || 8);
// Akış ilk eklendiğinde geçmiş haberler toplu yayımlanmasın: yalnızca son 2 günün haberleri
const MAX_AGE_MS = 2 * 864e5;

// Kaynağın NEW durumdaki öğelerini habere dönüştürür (mode: DRAFT / REVIEW / PUBLISH)
export async function processNewItems(source) {
    const { upsertExternalArticle } = await import('@/lib/publisher');
    const { aiEnabled, runAi } = await import('@/lib/ai');
    const items = await prisma.feedItem.findMany({
        where: { sourceId: source.id, status: 'NEW', articleId: null, error: null },
        orderBy: { createdAt: 'asc' }, take: AUTO_PER_RUN,
        include: { source: { select: { category: { select: { slug: true } } } } },
    });
    let done = 0, failed = 0;
    for (const item of items) {
        const age = Date.now() - (item.publishedAt || item.createdAt).getTime();
        if (age > MAX_AGE_MS) { await prisma.feedItem.update({ where: { id: item.id }, data: { status: 'IGNORED', error: 'Eski haber: otomatik yayınlanmadı.' } }); continue; }
        try {
            let page = null;
            try { page = await fetchArticlePage(item.link); } catch { /* sayfa okunamazsa akıştaki özetle devam */ }
            // og:description çoğu federasyon sitesinde sitenin genel tanıtımıdır; metnin ilk paragrafı daha güvenilir
            const lead = page?.paragraphs?.[0] ? page.paragraphs[0].slice(0, 300) : '';
            const summary = item.summary || lead || page?.summary || '';
            const title = (page?.title && page.title.length >= 15 ? page.title : item.title).slice(0, 200);
            let draft = { title, summary, paragraphs: page?.paragraphs?.length ? page.paragraphs.slice(0, 3) : [summary || title] };
            if (source.rewrite && aiEnabled()) {
                const text = [`Başlık: ${title}`, summary && `Özet: ${summary}`, `Metin:\n${(page?.paragraphs || []).join('\n\n') || summary}`].filter(Boolean).join('\n\n');
                const r = await runAi('taslak', { text: text.slice(0, 20000), sourceUrl: item.link }, null);
                draft = { title: r.title, summary: r.summary, paragraphs: r.paragraphs };
            } else if (source.mode === 'PUBLISH') {
                // Yapay zekâ yokken başka sitenin metni birebir yayımlanmaz: kısa özet + kaynak bağlantısı
                draft.paragraphs = [summary || title];
            }
            const article = await upsertExternalArticle({
                ...draft,
                image: item.image || page?.image || null,
                sport: source.sport, fallbackCategory: item.source?.category?.slug || null,
                breaking: source.breaking || undefined,
                status: source.mode, sourceName: source.name, sourceUrl: item.link,
                externalId: `feed:${source.id}:${item.guid}`,
                publishedAt: item.publishedAt || page?.publishedAt,
            });
            await prisma.feedItem.update({ where: { id: item.id }, data: { articleId: article.id, status: 'DRAFTED' } });
            done++;
        } catch (e) {
            failed++;
            await prisma.feedItem.update({ where: { id: item.id }, data: { error: String(e?.message || e).slice(0, 300) } }).catch(() => { });
        }
    }
    return { done, failed };
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
