"use client";
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

// Her sayfa geçişinde tek bir sayaç isteği gönderir. Çerez ve kimlik kullanılmaz.
export default function Analytics() {
    const pathname = usePathname();
    const prev = useRef(null);
    useEffect(() => {
        if (!pathname || pathname.startsWith('/admin')) return;
        try { if (navigator.doNotTrack === '1' || window.globalPrivacyControl) return; } catch { /* yoksay */ }
        // İlk sayfada gerçek referrer, site içi geçişlerde bir önceki sayfa
        const referrer = prev.current ? location.origin + prev.current : document.referrer;
        prev.current = pathname;
        const utm = new URLSearchParams(location.search).get('utm_source') || '';
        const body = JSON.stringify({ p: pathname, r: referrer, u: utm });
        if (!navigator.sendBeacon?.('/api/t', new Blob([body], { type: 'text/plain' }))) {
            fetch('/api/t', { method: 'POST', body, keepalive: true }).catch(() => {});
        }
    }, [pathname]);
    return null;
}
