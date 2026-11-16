// Haber metni (zengin içerik) için güvenlik ve dönüştürme yardımcıları.
// Editörden gelen HTML kaydedilmeden önce burada temizlenir; sayfada yalnızca temizlenmiş HTML gösterilir.
import sanitizeHtml from 'sanitize-html';
import * as cheerio from 'cheerio';

const YOUTUBE = /^https:\/\/(www\.)?(youtube\.com|youtube-nocookie\.com)\/embed\/[\w-]{6,20}(\?[\w=&;%-]*)?$/;
const IMAGE_SRC = /^(\/media\/[\w-]+|https:\/\/[^\s"'<>]+)$/;

const ALIGNS = ['center', 'wide', 'full', 'left', 'right'];
const TONES = ['info', 'highlight', 'warning'];
const SCORE_DATA = ['data-meta', 'data-home', 'data-away', 'data-home-score', 'data-away-score', 'data-sets'];

const DIV_CLASSES = ['cols', 'cols-2', 'cols-3', 'col', 'gallery', 'gallery-2', 'gallery-3', 'score', 'score-meta', 'score-row', 'score-sets'];
const dropInvalid = (attribs, name, values) => {
    const a = { ...attribs };
    if (name in a && !values.includes(a[name])) delete a[name];
    return a;
};

const OPTIONS = {
    allowedTags: ['p', 'h2', 'h3', 'strong', 'b', 'em', 'i', 's', 'u', 'a', 'ul', 'ol', 'li', 'blockquote', 'hr', 'br', 'figure', 'figcaption', 'img', 'div', 'iframe', 'aside', 'span'],
    allowedAttributes: {
        a: ['href', 'target', 'rel'],
        img: ['src', 'alt', 'title', 'width', 'height'],
        figure: ['class', { name: 'data-align', values: ALIGNS }],
        div: ['data-youtube-video', 'class', ...SCORE_DATA],
        aside: ['class', { name: 'data-tone', values: TONES }],
        span: ['class'],
        iframe: ['src', 'width', 'height', 'allowfullscreen', 'title'],
    },
    // Stüdyo bloklarının sınıfları dışında sınıf kabul edilmez
    allowedClasses: {
        div: DIV_CLASSES,
        span: ['score-team', 'score-num'],
        figure: ['gallery-item'],
        aside: ['callout'],
    },
    allowedSchemes: ['https', 'http', 'mailto'],
    allowedSchemesByTag: { img: ['https'] },
    allowProtocolRelative: false,
    exclusiveFilter: (frame) =>
        (frame.tag === 'iframe' && !YOUTUBE.test(frame.attribs.src || '')) ||
        (frame.tag === 'img' && !IMAGE_SRC.test(frame.attribs.src || '')) ||
        false,
    transformTags: {
        figure: (tag, attribs) => ({ tagName: 'figure', attribs: dropInvalid(attribs, 'data-align', ALIGNS) }),
        aside: (tag, attribs) => ({ tagName: 'aside', attribs: dropInvalid(attribs, 'data-tone', TONES) }),
        b: 'strong',
        i: 'em',
        // Dış bağlantılar yeni sekmede ve güvenli açılır
        a: (tag, attribs) => {
            const external = /^https?:\/\//.test(attribs.href || '');
            return { tagName: 'a', attribs: { href: attribs.href, ...(external ? { target: '_blank', rel: 'noopener noreferrer nofollow' } : {}) } };
        },
        iframe: (tag, attribs) => ({
            tagName: 'iframe',
            attribs: { src: (attribs.src || '').replace('youtube.com/embed', 'youtube-nocookie.com/embed'), title: attribs.title || 'Video', allowfullscreen: 'true', width: '640', height: '360' },
        }),
    },
};

// 2. aşama: temizlikten sonra sınıfı kalmayan kutular (div/span/aside) silinmez, içerikleri korunarak açılır
function unwrapBareContainers(html) {
    if (!/<(div|span|aside)[\s>]/.test(html)) return html;
    const $ = cheerio.load(html, null, false);
    $('div, span, aside').each((_, el) => {
        const e = $(el);
        if (!e.attr('class') && e.attr('data-youtube-video') === undefined) e.replaceWith(e.contents());
    });
    return $.html();
}

export function sanitizeArticleHtml(html) {
    return unwrapBareContainers(sanitizeHtml(String(html || ''), OPTIONS))
        .replace(/<p>(\s|&nbsp;|<br\s*\/?>)*<\/p>/g, '') // boş paragrafları at
        .trim();
}

const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export const isHtml = (s) => /<\/?(p|h2|h3|ul|ol|blockquote|figure|div|aside)[\s>]/i.test(String(s || ''));

// Eski düz metin içerik (paragraflar boş satırla ayrılmış) -> HTML
export function toArticleHtml(content) {
    const s = String(content || '');
    if (isHtml(s)) return sanitizeArticleHtml(s);
    return s.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean).map((p) => `<p>${escape(p).replace(/\n/g, '<br>')}</p>`).join('');
}

export function plainText(content) {
    return String(content || '')
        .replace(/<(br|\/p|\/h[23]|\/li|\/blockquote)[^>]*>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

// HTML karakter kodlarını gerçek karaktere çevirir: &#8217; → ’, &amp;quot; → " (iç içe kodlananlar dahil).
// RSS akışları başlık/özetleri çoğu zaman bu kodlarla gönderir.
const NAMED = {
    amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', hellip: '…', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“',
    ndash: '–', mdash: '—', laquo: '«', raquo: '»', bull: '•', middot: '·', deg: '°', euro: '€', copy: '©', reg: '®', trade: '™',
    ccedil: 'ç', Ccedil: 'Ç', ouml: 'ö', Ouml: 'Ö', uuml: 'ü', Uuml: 'Ü', iacute: 'í', eacute: 'é', aacute: 'á', oacute: 'ó', uacute: 'ú',
};
export function decodeEntities(input) {
    let s = String(input ?? '');
    for (let i = 0; i < 3 && /&(#\d+|#x[\da-f]+|[a-z]+\d*);/i.test(s); i++) {
        s = s.replace(/&(#(\d+)|#x([\da-f]+)|([a-z]+\d*));/gi, (m, _, dec, hex, name) => {
            const code = dec ? Number(dec) : hex ? parseInt(hex, 16) : null;
            if (code !== null) return code > 0 && code < 0x110000 ? String.fromCodePoint(code) : m;
            return NAMED[name] ?? NAMED[name.toLowerCase()] ?? m;
        });
    }
    return s;
}
