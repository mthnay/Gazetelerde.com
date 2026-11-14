"use client";
import { useRef, useState } from 'react';
import { ArrowUp, ArrowDown, Trash2, ImagePlus } from 'lucide-react';
import { uploadImage } from './uploadImage';

// Galeri haberinin fotoğrafları: çoklu yükleme, sıralama, altyazı ve fotoğraf kaynağı
export default function GalleryEditor({ value = [], onChange }) {
    const [busy, setBusy] = useState(0);
    const [err, setErr] = useState('');
    const fileRef = useRef(null);
    const upd = (i, patch) => onChange(value.map((g, k) => (k === i ? { ...g, ...patch } : g)));
    const move = (i, d) => { const j = i + d; if (j < 0 || j >= value.length) return; const c = [...value]; [c[i], c[j]] = [c[j], c[i]]; onChange(c); };

    const add = async (files) => {
        const list = [...files].filter((f) => f.type.startsWith('image/'));
        setBusy(list.length); setErr('');
        const added = [];
        for (const f of list) {
            try { added.push({ src: (await uploadImage(f, '')).url, caption: '', credit: '' }); } catch (e) { setErr(e.message); }
            setBusy((n) => n - 1);
        }
        onChange([...value, ...added]);
    };

    return (
        <div className="gal-editor">
            {value.map((g, i) => (
                <div key={g.src + i} className="gal-row">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={g.src.startsWith('/media/') ? `${g.src}?w=200` : g.src} alt="" />
                    <div className="gal-fields">
                        <textarea className="admin-textarea" rows={2} value={g.caption} onChange={(e) => upd(i, { caption: e.target.value })} placeholder={`${i + 1}. fotoğraf altyazısı`} aria-label={`${i + 1}. fotoğraf altyazısı`} />
                        <input className="admin-input" value={g.credit} onChange={(e) => upd(i, { credit: e.target.value })} placeholder="Fotoğraf: AA / Ad Soyad" aria-label="Fotoğraf kaynağı" />
                    </div>
                    <div className="gal-actions">
                        <button type="button" className="admin-icon-btn" onClick={() => move(i, -1)} disabled={!i} aria-label="Yukarı"><ArrowUp size={14} /></button>
                        <button type="button" className="admin-icon-btn" onClick={() => move(i, 1)} disabled={i === value.length - 1} aria-label="Aşağı"><ArrowDown size={14} /></button>
                        <button type="button" className="admin-icon-btn danger" onClick={() => onChange(value.filter((_, k) => k !== i))} aria-label="Çıkar"><Trash2 size={14} /></button>
                    </div>
                </div>
            ))}
            {err && <div className="admin-msg error">{err}</div>}
            <button type="button" className="admin-btn" onClick={() => fileRef.current?.click()} disabled={busy > 0} style={{ width: '100%', justifyContent: 'center' }}>
                <ImagePlus size={15} /> {busy ? `${busy} fotoğraf yükleniyor…` : 'Fotoğraf ekle (çoklu seçilebilir)'}
            </button>
            <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => { add(e.target.files); e.target.value = ''; }} />
            <p className="st-hint">İlk fotoğraf kapak olarak kullanılır (ayrı kapak seçmediyseniz). En az 2 fotoğraf gerekir.</p>
        </div>
    );
}
