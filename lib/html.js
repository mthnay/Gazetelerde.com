// Haber metni (zengin içerik) için güvenlik ve dönüştürme yardımcıları.
// Editörden gelen HTML kaydedilmeden önce burada temizlenir; sayfada yalnızca temizlenmiş HTML gösterilir.
import sanitizeHtml from 'sanitize-html';

const YOUTUBE = /^https:\/\/(www\.)?(youtube\.com|youtube-nocookie\.com)\/embed\/[\w-]{6,20}(\?[\w=&;%-]*)?$/;
const IMAGE_SRC = /^(\/media\/[\w-]+|https:\/\/[^\s"'<>]+)$/;

const OPTIONS = {
    allowedTags: ['p', 'h2', 'h3', 'strong', 'b', 'em', 'i', 's', 'u', 'a', 'ul', 'ol', 'li', 'blockquote', 'hr', 'br', 'figure', 'figcaption', 'img', 'div', 'iframe'],
    allowedAttributes: {
        a: ['href', 'target', 'rel'],
        img: ['src', 'alt', 'title', 'width', 'height'],
        div: ['data-youtube-video'],
        iframe: ['src', 'width', 'height', 'allowfullscreen', 'title'],
    },
    allowedSchemes: ['https', 'http', 'mailto'],
    allowedSchemesByTag: { img: ['https'] },
    allowProtocolRelative: false,
    exclusiveFilter: (frame) =>
        (frame.tag === 'iframe' && !YOUTUBE.test(frame.attribs.src || '')) ||
        (frame.tag === 'img' && !IMAGE_SRC.test(frame.attribs.src || '')) ||
        (frame.tag === 'div' && !('data-youtube-video' in frame.attribs)),
    transformTags: {
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

export function sanitizeArticleHtml(html) {
    return sanitizeHtml(String(html || ''), OPTIONS)
        .replace(/<p>(\s|&nbsp;|<br\s*\/?>)*<\/p>/g, '') // boş paragrafları at
        .trim();
}

const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export const isHtml = (s) => /<\/?(p|h2|h3|ul|ol|blockquote|figure|div)[\s>]/i.test(String(s || ''));

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
