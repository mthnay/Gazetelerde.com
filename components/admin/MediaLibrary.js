"use client";
import { useCallback, useEffect, useRef, useState } from 'react';
import { Upload, Trash2, Copy, Search, AlertTriangle, Check } from 'lucide-react';
import { uploadImage } from './uploadImage';

const FILTERS = { '': 'Tümü', altsiz: 'Alt metni eksik', kullanilmayan: 'Kullanılmayan' };
const kb = (n) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`);

function Tile({ m, canDelete, onChanged, onError }) {
    const [alt, setAlt] = useState(m.alt);
    const [savedAlt, setSavedAlt] = useState(m.alt);
    const [saved, setSaved] = useState(false);
    const saveAlt = async () => {
        if (alt === savedAlt) return;
        const res = await fetch(`/api/admin/media/${m.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ alt }) }).then((r) => r.json()).catch(() => null);
        if (res?.success) { setSaved(true); setSavedAlt(alt); setTimeout(() => setSaved(false), 1500); } else onError(res?.message || 'Kaydedilemedi.');
    };
    const remove = async () => {
        if (!confirm('Görsel kalıcı olarak silinsin mi?')) return;
        const res = await fetch(`/api/admin/media/${m.id}`, { method: 'DELETE' }).then((r) => r.json()).catch(() => null);
        if (res?.success) onChanged(); else onError(res?.message || 'Silinemedi.');
    };
    return (
        <figure className="ml-tile">
            <a href={m.url} target="_blank" rel="noreferrer" className="ml-thumb">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`${m.url}?w=400`} alt={m.alt} loading="lazy" width={m.width} height={m.height} />
                {!savedAlt && <span className="ml-flag" title="Alternatif metin eksik"><AlertTriangle size={13} /> Alt metin yok</span>}
            </a>
            <figcaption>
                <label className="sr-only" htmlFor={`alt-${m.id}`}>Alternatif metin</label>
                <input id={`alt-${m.id}`} className="admin-input" value={alt} maxLength={200} placeholder="Görseli tarif edin…"
                    onChange={(e) => setAlt(e.target.value)} onBlur={saveAlt} onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()} />
                <div className="ml-meta">
                    <span>{m.width}×{m.height} · {kb(m.size)}</span>
                    <span className={m.uses ? '' : 'ml-unused'}>{m.uses ? `${m.uses} yerde` : 'kullanılmıyor'}</span>
                </div>
                <div className="ml-actions">
                    {saved && <span className="ml-saved"><Check size={13} /> kaydedildi</span>}
                    <button type="button" className="admin-icon-btn" title="Adresi kopyala" aria-label="Görsel adresini kopyala" onClick={() => navigator.clipboard?.writeText(location.origin + m.url)}><Copy size={14} /></button>
                    {canDelete && !m.uses && <button type="button" className="admin-icon-btn danger" title="Sil" aria-label="Görseli sil" onClick={remove}><Trash2 size={14} /></button>}
                </div>
            </figcaption>
        </figure>
    );
}

export default function MediaLibrary({ canDelete }) {
    const [items, setItems] = useState(null);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [q, setQ] = useState('');
    const [filter, setFilter] = useState('');
    const [msg, setMsg] = useState(null);
    const [uploading, setUploading] = useState(0);
    const [drag, setDrag] = useState(false);
    const fileRef = useRef(null);

    const load = useCallback(async (p = 1) => {
        const params = new URLSearchParams({ sayfa: String(p), ...(q ? { q } : {}), ...(filter ? { filtre: filter } : {}) });
        const d = await fetch(`/api/admin/media?${params}`).then((r) => r.json()).catch(() => null);
        if (!d?.success) return setMsg({ type: 'error', text: 'Görseller yüklenemedi.' });
        setTotal(d.total);
        setPage(p);
        setItems((cur) => (p === 1 ? d.media : [...(cur || []), ...d.media]));
    }, [q, filter]);

    useEffect(() => {
        const t = setTimeout(() => load(1), 250);
        return () => clearTimeout(t);
    }, [load]);

    const upload = async (files) => {
        const list = [...files].filter((f) => f.type.startsWith('image/'));
        if (!list.length) return;
        setUploading(list.length); setMsg(null);
        let ok = 0;
        for (const f of list) {
            try { await uploadImage(f, f.name.replace(/\.[a-z0-9]+$/i, '').replace(/[-_]+/g, ' ').slice(0, 120)); ok++; } catch (e) { setMsg({ type: 'error', text: `${f.name}: ${e.message}` }); }
            setUploading((n) => n - 1);
        }
        if (ok) setMsg({ type: 'success', text: `${ok} görsel yüklendi. Alternatif metinleri dosya adından dolduruldu; lütfen kontrol edin.` });
        load(1);
    };

    return (
        <>
            <div className={`ml-drop ${drag ? 'is-drag' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
                onDrop={(e) => { e.preventDefault(); setDrag(false); upload(e.dataTransfer.files); }}>
                <Upload size={20} aria-hidden="true" />
                <span>Görselleri buraya sürükleyin ya da</span>
                <button type="button" className="admin-btn primary" onClick={() => fileRef.current?.click()} disabled={uploading > 0}>
                    {uploading ? `${uploading} görsel yükleniyor…` : 'Bilgisayardan seçin'}
                </button>
                <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => { upload(e.target.files); e.target.value = ''; }} />
                <span className="hint">JPG, PNG, WebP · en fazla 12 MB · otomatik WebP biçimine çevrilir, konum bilgisi silinir</span>
            </div>

            <div className="admin-toolbar">
                <nav className="admin-tabs">
                    {Object.entries(FILTERS).map(([k, v]) => <button key={k} type="button" className={`admin-tab ${filter === k ? 'active' : ''}`} onClick={() => setFilter(k)}>{v}</button>)}
                </nav>
                <div className="admin-search" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Search size={15} aria-hidden="true" />
                    <input className="admin-input" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Alt metinde ara…" aria-label="Görsel ara" />
                </div>
            </div>
            {msg && <div className={`admin-msg ${msg.type}`} role="status">{msg.text}</div>}

            {!items ? <p className="hint">Yükleniyor…</p> : !items.length ? <div className="admin-panel"><p className="admin-empty">Bu filtrede görsel yok.</p></div> : (
                <>
                    <p className="hint">{total} görsel</p>
                    <div className="ml-grid">{items.map((m) => <Tile key={m.id} m={m} canDelete={canDelete} onChanged={() => load(1)} onError={(t) => setMsg({ type: 'error', text: t })} />)}</div>
                    {items.length < total && <div style={{ textAlign: 'center', margin: 20 }}><button type="button" className="admin-btn" onClick={() => load(page + 1)}>Daha fazla</button></div>}
                </>
            )}
        </>
    );
}
