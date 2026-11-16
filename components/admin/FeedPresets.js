"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Hazır kaynaklar: tek tıkla aç / kapat
export default function FeedPresets({ presets, canManage }) {
    const router = useRouter();
    const [busy, setBusy] = useState(null);
    const [msg, setMsg] = useState(null);

    const toggle = async (p) => {
        const active = !p.active;
        if (active && !confirm(`${p.name} açılsın mı? Yeni haberleri otomatik yayımlanacak ve son dakika olarak işaretlenecek; ${p.keepDays || 7} günden eski olanlar arşivlenecek.`)) return;
        setBusy(p.key); setMsg(null);
        const r = await fetch('/api/admin/feeds/presets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: p.key, active }) }).catch(() => null);
        const d = await r?.json().catch(() => null);
        setBusy(null);
        setMsg(d?.success
            ? { type: 'success', text: active ? `${p.name} açıldı. İlk tarama arka planda başladı; haberler birkaç dakika içinde sitede görünür.` : `${p.name} kapatıldı. Yayımlanmış haberleri süresi dolunca arşivlenir.` }
            : { type: 'error', text: d?.message || 'İşlem yapılamadı.' });
        router.refresh();
    };

    return (
        <div className="admin-panel" style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: '1rem', margin: '0 0 4px' }}>Hazır kaynaklar</h2>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 12px' }}>
                Açık kaynakların yeni haberleri düzenli olarak çekilir, otomatik yayımlanır ve son dakika şeridine girer.
                Eskiyen haberler arşive kaldırılır. Ayrıntılı ayarlar aşağıdaki listede.
            </p>
            {msg && <div className={`admin-msg ${msg.type}`} role="status">{msg.text}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
                {presets.map((p) => (
                    <label key={p.key} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: 12, border: '1px solid var(--line, #ddd)', borderRadius: 8, cursor: canManage ? 'pointer' : 'default' }}>
                        <input type="checkbox" role="switch" checked={p.active} disabled={!canManage || busy === p.key} onChange={() => toggle(p)} style={{ marginTop: 3 }} aria-label={`${p.name} kaynağını ${p.active ? 'kapat' : 'aç'}`} />
                        <span>
                            <strong>{p.name}</strong> <span className={`badge ${p.active ? 'PUBLISHED' : 'ARCHIVED'}`} style={{ marginLeft: 6 }}>{busy === p.key ? '…' : p.active ? 'Açık' : 'Kapalı'}</span>
                            <span style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{p.description}</span>
                            {p.active && <span style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{p.published} haber yayında{p.lastError ? ` · Hata: ${p.lastError}` : ''}</span>}
                        </span>
                    </label>
                ))}
            </div>
        </div>
    );
}
