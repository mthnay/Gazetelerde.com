"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const MODE_TEXT = { PUBLISH: 'otomatik yayımlanır', REVIEW: 'onaya düşer', DRAFT: 'taslak olur', INBOX: 'gelen kutusuna düşer' };

// Tüm kaynaklar için tek tıkla aç / kapat (kaynaklar panelden eklenir, koda gerek yok)
export default function FeedToggles({ sources, canManage }) {
    const router = useRouter();
    const [busy, setBusy] = useState(null);
    const [msg, setMsg] = useState(null);

    const toggle = async (s) => {
        const active = !s.active;
        if (active && s.mode === 'PUBLISH' && !confirm(`${s.name} açılsın mı? Yeni haberleri onaysız yayımlanacak${s.breaking ? ', son dakika olarak işaretlenecek' : ''}${s.keepDays ? ` ve ${s.keepDays} gün sonra kalıcı silinecek` : ''}.`)) return;
        setBusy(s.id); setMsg(null);
        const r = await fetch(`/api/admin/feeds/${s.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active }) }).catch(() => null);
        const d = await r?.json().catch(() => null);
        setBusy(null);
        setMsg(d?.success
            ? { type: 'success', text: active ? `${s.name} açıldı. İlk tarama arka planda başladı; haberler birkaç dakika içinde görünür.` : `${s.name} kapatıldı. Yeni haber çekilmeyecek.` }
            : { type: 'error', text: d?.message || 'İşlem yapılamadı.' });
        router.refresh();
    };

    if (!sources.length) return null;
    return (
        <div className="admin-panel" style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: '1rem', margin: '0 0 4px' }}>Haber kaynakları</h2>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 12px' }}>
                Açık kaynaklar düzenli taranır. Yeni kaynak eklemek ve ayrıntılı ayarlar için aşağıdaki formu ve listeyi kullanın.
            </p>
            {msg && <div className={`admin-msg ${msg.type}`} role="status">{msg.text}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
                {sources.map((s) => (
                    <label key={s.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: 12, border: '1px solid var(--line, #ddd)', borderRadius: 8, cursor: canManage ? 'pointer' : 'default' }}>
                        <input type="checkbox" role="switch" checked={s.active} disabled={!canManage || busy === s.id} onChange={() => toggle(s)} style={{ marginTop: 3 }} aria-label={`${s.name} kaynağını ${s.active ? 'kapat' : 'aç'}`} />
                        <span>
                            <strong>{s.name}</strong> <span className={`badge ${s.active ? 'PUBLISHED' : 'ARCHIVED'}`} style={{ marginLeft: 6 }}>{busy === s.id ? '…' : s.active ? 'Açık' : 'Kapalı'}</span>
                            {s.note && <span style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{s.note}</span>}
                            <span style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                                Yeni haberler {MODE_TEXT[s.mode]}{s.breaking ? ' · son dakika' : ''}{s.keepDays ? ` · ${s.keepDays} gün sonra silinir` : ''}{s.active ? ` · ${s.published} haber yayında` : ''}
                            </span>
                            {s.active && s.lastError && <span style={{ display: 'block', fontSize: 12, color: 'var(--a-danger)', marginTop: 4 }}>Hata: {s.lastError}</span>}
                        </span>
                    </label>
                ))}
            </div>
        </div>
    );
}
