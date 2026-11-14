// Çerezsiz istatistik yardımcıları: kişisel veri (IP, kimlik) saklanmaz, yalnızca günlük sayaçlar tutulur.

const BOT = /bot|crawl|spider|slurp|facebookexternalhit|preview|headless|lighthouse|monitor|curl|wget|python|java\/|go-http/i;
export const isBot = (ua = '') => !ua || BOT.test(ua);

export const deviceOf = (ua = '') => (/mobile|android|iphone|ipad|ipod/i.test(ua) ? 'mobil' : 'masaustu');

// Yol -> sayfa türü
export function kindOf(path = '/') {
    if (path === '/') return 'anasayfa';
    if (path.startsWith('/haber/')) return 'haber';
    if (path.startsWith('/category/')) return 'kategori';
    if (path.startsWith('/etiket/')) return 'etiket';
    if (path.startsWith('/search')) return 'arama';
    return 'diger';
}

const SOURCES = [
    [/(^|\.)google\./, 'google'], [/(^|\.)bing\.com$/, 'bing'], [/yandex\./, 'yandex'], [/duckduckgo\.com$/, 'duckduckgo'],
    [/(^|\.)(facebook|fb)\.com$|^l\.facebook\.com$/, 'facebook'], [/(^|\.)instagram\.com$/, 'instagram'],
    [/(^|\.)(twitter|x)\.com$|^t\.co$/, 'x'], [/(^|\.)linkedin\.com$|^lnkd\.in$/, 'linkedin'], [/whatsapp/, 'whatsapp'],
    [/(^|\.)t\.me$|telegram/, 'telegram'], [/news\.google\.com$/, 'google-haberler'], [/(^|\.)reddit\.com$/, 'reddit'],
    [/(^|\.)(outlook|live|mail\.yahoo|mail\.google)\./, 'e-posta'],
];

// Gelinen kaynak: utm_source öncelikli, sonra referrer alan adı; site içi gezinme "site-ici"
export function sourceOf({ referrer = '', utm = '', host = '' } = {}) {
    if (utm) return String(utm).toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 30) || 'diger';
    if (!referrer) return 'dogrudan';
    let h;
    try { h = new URL(referrer).hostname.replace(/^www\./, '').toLowerCase(); } catch { return 'dogrudan'; }
    if (host && h === host.replace(/:\d+$/, '').replace(/^www\./, '').toLowerCase()) return 'site-ici';
    if (h === 'news.google.com') return 'google-haberler';
    for (const [re, name] of SOURCES) if (re.test(h)) return name;
    return h.slice(0, 40);
}

// İstanbul saatine göre bugünün tarihi (YYYY-MM-DD) -> Date (UTC gece yarısı, @db.Date için)
export function istanbulDay(d = new Date()) {
    const s = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
    return new Date(`${s}T00:00:00Z`);
}
