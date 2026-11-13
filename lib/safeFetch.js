// Sunucunun dışarıdan verilen URL'lere istek attığı yerlerde (scrape / RSS)
// iç ağa erişimi (SSRF) engellemek ve takılan istekleri kesmek için yardımcı.

const PRIVATE_HOST = /^(localhost|.*\.local|.*\.internal|0\.0\.0\.0|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|\[?::1\]?|\[?f[cd][0-9a-f]{2}:)/i;

export function validatePublicUrl(raw) {
    let u;
    try {
        u = new URL(String(raw || '').trim());
    } catch {
        throw new Error('Geçersiz URL');
    }
    if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error('Yalnızca http/https desteklenir');
    if (PRIVATE_HOST.test(u.hostname)) throw new Error('Bu adrese erişime izin verilmiyor');
    return u;
}

export async function fetchPublic(raw, { timeoutMs = 10000, headers = {} } = {}) {
    const url = validatePublicUrl(raw);
    const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; GazetelerdeBot/1.0)', ...headers },
        redirect: 'follow',
        signal: AbortSignal.timeout(timeoutMs),
    });
    // Yönlendirme sonrası adres de kontrol edilir
    validatePublicUrl(res.url || url.href);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return { res, url };
}
