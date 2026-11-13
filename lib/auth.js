// Basit, imzalı admin oturumu. Hem Node (API route) hem Edge (middleware)
// ortamında çalışması için yalnızca Web Crypto API kullanılır.
// Gerçek kullanıcı sistemi (veritabanı + şifre hash) gelene kadar geçicidir.

export const ADMIN_COOKIE = 'admin_token';
export const SESSION_MAX_AGE = 60 * 60 * 24; // 1 gün (saniye)

function getSecret() {
    const secret = process.env.AUTH_SECRET;
    if (!secret) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('AUTH_SECRET ortam değişkeni tanımlı değil.');
        }
        return 'dev-only-insecure-secret-change-me';
    }
    return secret;
}

const enc = new TextEncoder();

async function hmac(data) {
    const key = await crypto.subtle.importKey(
        'raw', enc.encode(getSecret()), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
    return btoa(String.fromCharCode(...new Uint8Array(sig)))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// token = "<sonGeçerlilikZamanı>.<imza>"
export async function createAdminToken() {
    const exp = Date.now() + SESSION_MAX_AGE * 1000;
    return `${exp}.${await hmac(`admin:${exp}`)}`;
}

export async function verifyAdminToken(token) {
    if (!token || typeof token !== 'string') return false;
    const [expStr, sig] = token.split('.');
    const exp = Number(expStr);
    if (!exp || !sig || exp < Date.now()) return false;
    const expected = await hmac(`admin:${exp}`);
    if (expected.length !== sig.length) return false;
    let diff = 0;
    for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
    return diff === 0;
}

export function getAdminCredentials() {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    if (!email || !password) {
        if (process.env.NODE_ENV === 'production') return null; // prod'da varsayılan şifre yok
        return { email: 'admin@gazetelerde.com', password: 'admin12345' };
    }
    return { email, password };
}

export async function isAdminRequest(request) {
    return verifyAdminToken(request.cookies.get(ADMIN_COOKIE)?.value);
}
