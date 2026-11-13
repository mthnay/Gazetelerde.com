"use client";
import { useCallback, useEffect, useRef, useState } from 'react';
import { Upload, Crop, Images, X } from 'lucide-react';
import { uploadImage } from './uploadImage';

const RATIO = 16 / 9;
const OUT_W = 1920;

// 16:9 çerçevede sürükle + yakınlaştır ile kırp, sonra yükle
function Cropper({ file, onDone, onCancel }) {
    const [img, setImg] = useState(null);
    const [zoom, setZoom] = useState(1);
    const [pos, setPos] = useState({ x: 0, y: 0 }); // görselin çerçeveye göre kayması (piksel)
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState('');
    const frame = useRef(null);
    const drag = useRef(null);
    const [frameW, setFrameW] = useState(640);

    useEffect(() => {
        // İptal edilen (ör. React'in efekti yeniden çalıştırdığı) yüklemelerin sonucu yok sayılır
        let alive = true;
        const url = URL.createObjectURL(file);
        const i = new window.Image();
        i.onload = () => { if (alive) { setErr(''); setImg(i); } };
        i.onerror = () => { if (alive) setErr('Görsel açılamadı; dosya bozuk ya da desteklenmeyen biçimde olabilir.'); };
        i.src = url;
        return () => { alive = false; URL.revokeObjectURL(url); };
    }, [file]);

    useEffect(() => {
        const el = frame.current;
        if (!el) return;
        const ro = new ResizeObserver(() => setFrameW(el.clientWidth));
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const frameH = frameW / RATIO;
    // Çerçeveyi tamamen kaplayacak temel ölçek
    const base = img ? Math.max(frameW / img.width, frameH / img.height) : 1;
    const scale = base * zoom;
    const w = img ? img.width * scale : 0;
    const h = img ? img.height * scale : 0;

    const clamp = useCallback((p) => ({
        x: Math.min(0, Math.max(frameW - w, p.x)),
        y: Math.min(0, Math.max(frameH - h, p.y)),
    }), [frameW, frameH, w, h]);

    // Görsel ilk yüklendiğinde / yakınlaştırma değişince ortala ve sınırla
    useEffect(() => {
        if (!img) return;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPos((p) => clamp(p.x === 0 && p.y === 0 ? { x: (frameW - w) / 2, y: (frameH - h) / 2 } : p));
    }, [img, zoom, frameW, clamp, w, h, frameH]);

    const onDown = (e) => { drag.current = { sx: e.clientX, sy: e.clientY, p: pos }; e.currentTarget.setPointerCapture(e.pointerId); };
    const onMove = (e) => {
        if (!drag.current) return;
        const { sx, sy, p } = drag.current;
        setPos(clamp({ x: p.x + e.clientX - sx, y: p.y + e.clientY - sy }));
    };
    const onUp = () => { drag.current = null; };

    const save = async () => {
        if (!img) return;
        setBusy(true); setErr('');
        try {
            const c = document.createElement('canvas');
            const outW = Math.min(OUT_W, Math.round(frameW / scale)); // kaynak çözünürlüğünden büyütme
            c.width = outW; c.height = Math.round(outW / RATIO);
            const k = c.width / frameW;
            c.getContext('2d').drawImage(img, pos.x * k, pos.y * k, w * k, h * k);
            const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.92));
            const m = await uploadImage(blob, '', 'kapak.jpg');
            onDone(m.url);
        } catch (ex) {
            setErr(ex.message || 'Kırpılamadı.');
            setBusy(false);
        }
    };

    return (
        <div className="cropper">
            <div ref={frame} className="cropper-frame" style={{ height: frameH }}
                onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
                {img && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img.src} alt="" draggable={false} style={{ width: w, height: h, transform: `translate(${pos.x}px, ${pos.y}px)` }} />
                )}
                <div className="cropper-grid" aria-hidden="true" />
            </div>
            <label className="admin-field" style={{ marginTop: 10, marginBottom: 8 }}>
                <span>Yakınlaştır</span>
                <input type="range" min="1" max="3" step="0.01" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} />
            </label>
            <span className="hint">Görseli sürükleyerek konumlandırın. Kapak 16:9 oranında kırpılır.</span>
            {err && <div className="admin-msg error" style={{ marginTop: 8 }}>{err}</div>}
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button type="button" className="admin-btn primary" onClick={save} disabled={busy || !img}>
                    {busy ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Crop size={15} />} Kırp ve yükle
                </button>
                <button type="button" className="admin-btn" onClick={onCancel} disabled={busy}>Vazgeç</button>
            </div>
        </div>
    );
}

function Library({ onPick, onClose }) {
    const [items, setItems] = useState(null);
    useEffect(() => {
        fetch('/api/admin/media').then((r) => r.json()).then((d) => setItems(d.media || [])).catch(() => setItems([]));
    }, []);
    return (
        <div className="media-lib">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <strong>Görsel kitaplığı</strong>
                <button type="button" className="admin-icon-btn" onClick={onClose} aria-label="Kapat"><X size={15} /></button>
            </div>
            {!items ? <p className="hint">Yükleniyor…</p> : items.length === 0 ? <p className="hint">Henüz yüklenmiş görsel yok.</p> : (
                <div className="media-grid">
                    {items.map((m) => (
                        <button type="button" key={m.id} onClick={() => onPick(m.url)} title={m.alt || 'Görseli seç'}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={m.url} alt={m.alt} loading="lazy" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// Kapak görseli alanı: yükle+kırp, kitaplıktan seç ya da URL yapıştır
export default function CoverImage({ value, onChange }) {
    const [file, setFile] = useState(null);
    const [lib, setLib] = useState(false);
    const fileRef = useRef(null);

    if (file) return <Cropper file={file} onDone={(url) => { setFile(null); onChange(url); }} onCancel={() => setFile(null)} />;

    return (
        <div>
            {value && (
                <div className="cover-preview">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={value} alt="Kapak önizleme" className="admin-preview-img" />
                    <button type="button" className="admin-icon-btn danger" onClick={() => onChange('')} aria-label="Kapağı kaldır" title="Kapağı kaldır"><X size={15} /></button>
                </div>
            )}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '8px 0' }}>
                <button type="button" className="admin-btn" onClick={() => fileRef.current?.click()}><Upload size={15} /> Yükle ve kırp</button>
                <button type="button" className="admin-btn" onClick={() => setLib(!lib)}><Images size={15} /> Kitaplık</button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) setFile(f); }} />
            {lib && <Library onPick={(url) => { onChange(url); setLib(false); }} onClose={() => setLib(false)} />}
            <input className="admin-input" type="url" value={value.startsWith('/media/') ? '' : value} onChange={(e) => onChange(e.target.value)} placeholder="…ya da görsel adresi yapıştırın (https://)" aria-label="Kapak görseli adresi" />
        </div>
    );
}
