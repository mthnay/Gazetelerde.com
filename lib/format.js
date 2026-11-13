// İstemci ve sunucuda ortak kullanılan biçimlendirme yardımcıları

export function formatDate(value) {
    if (!value) return '';
    return new Intl.DateTimeFormat('tr-TR', {
        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
        timeZone: 'Europe/Istanbul',
    }).format(new Date(value));
}

export function formatShortDate(value) {
    return new Intl.DateTimeFormat('tr-TR', {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul',
    }).format(new Date(value));
}

export function paragraphs(content) {
    return String(content || '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
}

export function readingTime(article) {
    const words = `${article.summary} ${article.content}`.split(/\s+/).length;
    return Math.max(1, Math.round(words / 200));
}

export const articleUrl = (a) => `/haber/${a.slug}`;
