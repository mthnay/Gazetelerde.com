// Çerez / reklam onayı (tarayıcı). Zorunlu oturum çerezi dışında hiçbir şey onaysız yüklenmez.
export const CONSENT_COOKIE = 'gz_onay';
const VERSION = 1;

export function readConsent() {
    if (typeof document === 'undefined') return null;
    const m = document.cookie.match(new RegExp(`(?:^|; )${CONSENT_COOKIE}=([^;]*)`));
    if (!m) return null;
    try {
        const c = JSON.parse(decodeURIComponent(m[1]));
        return c.v === VERSION ? c : null;
    } catch { return null; }
}

export function saveConsent({ ads }) {
    const value = encodeURIComponent(JSON.stringify({ v: VERSION, ads: !!ads, t: Date.now() }));
    // 6 ay; sonra yeniden sorulur
    document.cookie = `${CONSENT_COOKIE}=${value}; Path=/; Max-Age=${60 * 60 * 24 * 182}; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
    window.dispatchEvent(new CustomEvent('gz-consent', { detail: { ads: !!ads } }));
}

export const openConsentSettings = () => window.dispatchEvent(new CustomEvent('gz-consent-open'));
