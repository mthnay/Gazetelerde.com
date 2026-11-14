"use client";
import { useEffect } from 'react';

let sent = 0;
// Tarayıcıdaki yakalanmamış hataları sunucuya bildirir (sayfa başına en fazla 5)
export function reportError(error, extra = {}) {
    if (sent >= 5 || typeof window === 'undefined') return;
    sent++;
    const body = JSON.stringify({
        message: String(error?.message || error || ''), stack: String(error?.stack || ''),
        path: location.pathname, ...extra,
    });
    try {
        if (!navigator.sendBeacon?.('/api/errors', new Blob([body], { type: 'text/plain' }))) {
            fetch('/api/errors', { method: 'POST', body, keepalive: true }).catch(() => {});
        }
    } catch { /* yoksay */ }
}

export default function ErrorReporter() {
    useEffect(() => {
        const onError = (e) => {
            // Yalnızca kendi kodumuz: başka alan adlarındaki betiklerin hataları atlanır
            if (e.filename && !e.filename.startsWith(location.origin)) return;
            reportError(e.error || e.message);
        };
        const onRejection = (e) => reportError(e.reason);
        window.addEventListener('error', onError);
        window.addEventListener('unhandledrejection', onRejection);
        return () => { window.removeEventListener('error', onError); window.removeEventListener('unhandledrejection', onRejection); };
    }, []);
    return null;
}
