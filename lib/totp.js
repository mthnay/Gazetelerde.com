// İki adımlı doğrulama: RFC 6238 TOTP (Google Authenticator, Microsoft Authenticator, 1Password, Authy uyumlu).
// Dış bağımlılık yok; yalnızca node:crypto.
import { createHmac, createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from 'node:crypto';

const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32Encode(buf) {
    let bits = 0, value = 0, out = '';
    for (const byte of buf) {
        value = (value << 8) | byte; bits += 8;
        while (bits >= 5) { out += B32[(value >>> (bits - 5)) & 31]; bits -= 5; }
    }
    if (bits > 0) out += B32[(value << (5 - bits)) & 31];
    return out;
}

export function base32Decode(str) {
    const clean = String(str).toUpperCase().replace(/[^A-Z2-7]/g, '');
    let bits = 0, value = 0;
    const out = [];
    for (const ch of clean) {
        value = (value << 5) | B32.indexOf(ch); bits += 5;
        if (bits >= 8) { out.push((value >>> (bits - 8)) & 255); bits -= 8; }
    }
    return Buffer.from(out);
}

export const generateSecret = () => base32Encode(randomBytes(20));

export function totp(secret, time = Date.now(), step = 30, digits = 6) {
    const counter = Math.floor(time / 1000 / step);
    const buf = Buffer.alloc(8);
    buf.writeBigUInt64BE(BigInt(counter));
    const h = createHmac('sha1', base32Decode(secret)).update(buf).digest();
    const o = h[h.length - 1] & 15;
    const code = ((h.readUInt32BE(o) & 0x7fffffff) % 10 ** digits).toString();
    return code.padStart(digits, '0');
}

// Saat kaymasına karşı ±1 adım (±30 sn) tolerans
export function verifyTotp(secret, code, time = Date.now(), window = 1) {
    const c = String(code || '').replace(/\s/g, '');
    if (!/^\d{6}$/.test(c)) return false;
    for (let w = -window; w <= window; w++) {
        const expected = totp(secret, time + w * 30000);
        if (timingSafeEqual(Buffer.from(expected), Buffer.from(c))) return true;
    }
    return false;
}

export const otpauthUrl = (secret, account, issuer = 'Gazetelerde') =>
    `otpauth://totp/${encodeURIComponent(`${issuer}:${account}`)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;

// ---------------------------------------------------------------- Gizli anahtarın şifrelenmesi (AES-256-GCM)
// Veritabanı sızsa bile 2FA anahtarları AUTH_SECRET olmadan okunamaz.
const key = () => {
    const s = process.env.AUTH_SECRET;
    if (!s || s.length < 16) throw new Error('AUTH_SECRET tanımlı değil; iki adımlı doğrulama kullanılamaz.');
    return createHash('sha256').update(`totp:${s}`).digest();
};

export function encryptSecret(plain) {
    const iv = randomBytes(12);
    const c = createCipheriv('aes-256-gcm', key(), iv);
    const enc = Buffer.concat([c.update(plain, 'utf8'), c.final()]);
    return `v1.${iv.toString('base64url')}.${c.getAuthTag().toString('base64url')}.${enc.toString('base64url')}`;
}

export function decryptSecret(stored) {
    const [v, iv, tag, enc] = String(stored).split('.');
    if (v !== 'v1') throw new Error('Bilinmeyen anahtar biçimi');
    const d = createDecipheriv('aes-256-gcm', key(), Buffer.from(iv, 'base64url'));
    d.setAuthTag(Buffer.from(tag, 'base64url'));
    return Buffer.concat([d.update(Buffer.from(enc, 'base64url')), d.final()]).toString('utf8');
}

// Kurtarma kodları: "abcd-efgh" biçiminde 10 adet; veritabanında yalnızca özetleri tutulur
export const hashCode = (c) => createHash('sha256').update(String(c).toLowerCase().replace(/[^a-z0-9]/g, '')).digest('hex');
export function generateRecoveryCodes(n = 10) {
    return Array.from({ length: n }, () => {
        const s = base32Encode(randomBytes(5)).toLowerCase();
        return `${s.slice(0, 4)}-${s.slice(4, 8)}`;
    });
}
