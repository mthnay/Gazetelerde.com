"use client";
import { useEffect, useRef, useState } from 'react';
import { useSession } from '@/components/SessionProvider';
import { readConsent } from '@/lib/consentClient';

const MIN_H = { 'ana-ust': 120, 'ana-orta': 250, 'haber-ici': 250, 'haber-yan': 250, 'kategori-ust': 90 };
const cache = new Map();

// Ağırlığa göre rastgele seçim
const pick = (ads) => {
    const total = ads.reduce((n, a) => n + a.weight, 0);
    let r = Math.random() * total;
    return ads.find((a) => (r -= a.weight) < 0) || ads[0];
};

// Kod reklamı: kayıtlı HTML'i ekler, içindeki <script>'leri çalıştırır (yalnızca yönetici girebilir)
function CodeAd({ code }) {
    const ref = useRef(null);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        el.innerHTML = code;
        el.querySelectorAll('script').forEach((old) => {
            const s = document.createElement('script');
            [...old.attributes].forEach((a) => s.setAttribute(a.name, a.value));
            s.text = old.text;
            old.replaceWith(s);
        });
        return () => { el.innerHTML = ''; };
    }, [code]);
    return <div ref={ref} className="ad-code" />;
}

/**
 * Reklam alanı. Yer önceden ayrılır (sayfa kayması olmaz).
 * Destekçilere reklam gösterilmez; üçüncü taraf kod yalnızca reklam onayı verilmişse yüklenir.
 */
export default function AdSlot({ place }) {
    const { user, loading } = useSession();
    const [ad, setAd] = useState(null);
    const [consent, setConsent] = useState(null);
    const seen = useRef(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- onay çerezi yalnızca istemcide okunur
        setConsent(readConsent());
        const on = (e) => setConsent({ ads: e.detail.ads });
        window.addEventListener('gz-consent', on);
        return () => window.removeEventListener('gz-consent', on);
    }, []);

    useEffect(() => {
        if (loading || user?.adFree) return;
        let alive = true;
        const p = cache.get(place) || fetch(`/api/ads?yer=${place}`).then((r) => r.json()).then((d) => d.ads || []).catch(() => []);
        cache.set(place, p);
        p.then((ads) => { if (alive && ads.length) setAd(pick(ads)); });
        return () => { alive = false; };
    }, [place, loading, user?.adFree]);

    const show = ad && !user?.adFree && (ad.kind === 'gorsel' || consent?.ads);
    useEffect(() => {
        if (!show || seen.current) return;
        seen.current = true;
        navigator.sendBeacon?.('/api/ads', new Blob([JSON.stringify({ id: ad.id })], { type: 'text/plain' }));
    }, [show, ad]);

    if (user?.adFree) return null;
    if (!show) return ad || loading ? <div className="ad-slot ad-slot--empty" style={{ minHeight: ad ? MIN_H[place] : 0 }} aria-hidden="true" /> : null;
    return (
        <aside className={`ad-slot ad-slot--${place}`} style={{ minHeight: MIN_H[place] }} aria-label={ad.label}>
            <span className="ad-label">{ad.label}</span>
            {ad.kind === 'kod' ? <CodeAd code={ad.code} /> : (
                <a href={ad.link ? `/api/ads/${ad.id}/click` : undefined} target="_blank" rel="sponsored noopener">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={ad.image} alt={ad.alt || ad.label} loading="lazy" />
                </a>
            )}
        </aside>
    );
}
