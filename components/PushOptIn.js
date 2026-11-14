"use client";
import { useEffect, useState } from 'react';
import { Bell, BellOff } from 'lucide-react';

const KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const toKey = (b64) => {
    const pad = '='.repeat((4 - (b64.length % 4)) % 4);
    const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
    return Uint8Array.from(raw, (c) => c.charCodeAt(0));
};

// "Son dakika bildirimlerini aç" düğmesi. İzin yalnızca tıklamayla istenir.
export default function PushOptIn({ compact = false }) {
    const [state, setState] = useState('loading'); // unsupported | denied | off | on | busy
    const [err, setErr] = useState('');

    useEffect(() => {
        // Tarayıcı desteği yalnızca istemcide bilinebilir; ilk boyamada düğme gizli kalır
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (!KEY || !('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) { setState('unsupported'); return; }
        if (Notification.permission === 'denied') { setState('denied'); return; }
        navigator.serviceWorker.getRegistration('/').then(async (reg) => {
            const sub = await reg?.pushManager.getSubscription();
            setState(sub ? 'on' : 'off');
        }).catch(() => setState('off'));
    }, []);

    const enable = async () => {
        setState('busy'); setErr('');
        try {
            const perm = await Notification.requestPermission();
            if (perm !== 'granted') { setState(perm === 'denied' ? 'denied' : 'off'); return; }
            const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
            await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toKey(KEY) });
            const res = await fetch('/api/push', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sub.toJSON()) });
            if (!res.ok) throw new Error('Sunucu aboneliği kaydedemedi.');
            setState('on');
        } catch (e) {
            setErr(e?.message || 'Bildirimler açılamadı.');
            setState('off');
        }
    };

    const disable = async () => {
        setState('busy');
        const reg = await navigator.serviceWorker.getRegistration('/');
        const sub = await reg?.pushManager.getSubscription();
        if (sub) {
            await fetch('/api/push', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint: sub.endpoint }) }).catch(() => {});
            await sub.unsubscribe().catch(() => {});
        }
        setState('off');
    };

    if (state === 'loading' || state === 'unsupported') return null;
    if (state === 'denied') return compact ? null : <p className="push-note">Bildirimler tarayıcı ayarlarından engellenmiş.</p>;
    return (
        <div className={`push-optin ${compact ? 'compact' : ''}`}>
            {state === 'on'
                ? <button type="button" className="btn" onClick={disable}><BellOff size={16} /> Son dakika bildirimlerini kapat</button>
                : <button type="button" className="btn btn-primary" onClick={enable} disabled={state === 'busy'}>
                    {state === 'busy' ? <span className="spinner" /> : <Bell size={16} />} Son dakika bildirimlerini aç
                </button>}
            {err && <p className="push-note" role="status">{err}</p>}
        </div>
    );
}
