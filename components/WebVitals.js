"use client";
import { useEffect } from 'react';

// Sayfa açılışındaki gerçek hız ölçümlerini toplar, sayfa gizlenince tek istekte gönderir.
// "İzlenmek istemiyorum" (DNT / GPC) açıksa hiçbir şey göndermez.
export default function WebVitals() {
    useEffect(() => {
        try { if (navigator.doNotTrack === '1' || window.globalPrivacyControl) return; } catch { /* yoksay */ }
        if (location.pathname.startsWith('/admin')) return;
        const path = location.pathname;
        const metrics = new Map();
        let sent = false;
        const flush = () => {
            if (sent || !metrics.size) return;
            sent = true;
            const body = JSON.stringify({ p: path, m: [...metrics.values()] });
            if (!navigator.sendBeacon?.('/api/v', new Blob([body], { type: 'text/plain' }))) fetch('/api/v', { method: 'POST', body, keepalive: true }).catch(() => {});
        };
        const add = ({ name, value }) => metrics.set(name, { n: name, v: Math.round(name === 'CLS' ? value * 1000 : value) / (name === 'CLS' ? 1000 : 1) });
        // Kütüphane yalnızca ölçüm için, sayfa yüklendikten sonra indirilir
        import('web-vitals').then(({ onLCP, onINP, onCLS, onFCP, onTTFB }) => {
            [onLCP, onINP, onCLS, onFCP, onTTFB].forEach((fn) => fn(add));
        });
        const onHide = () => { if (document.visibilityState === 'hidden') flush(); };
        document.addEventListener('visibilitychange', onHide);
        window.addEventListener('pagehide', flush);
        return () => { document.removeEventListener('visibilitychange', onHide); window.removeEventListener('pagehide', flush); };
    }, []);
    return null;
}
