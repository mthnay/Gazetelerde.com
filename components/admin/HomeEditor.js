"use client";
import { useEffect, useId, useMemo, useState } from 'react';
import { ArrowUp, ArrowDown, GripVertical, Trash2, Plus, ChevronDown, ChevronRight, ExternalLink, RotateCcw, Save, Search, X, Copy } from 'lucide-react';
import { BLOCK_TYPES, newBlock } from '@/lib/homeLayout';

const api = async (url, method = 'GET', body) => {
    const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined }).catch(() => null);
    return r?.json().catch(() => null);
};

// Ana sayfa düzenleyici: bloklar sıralanır, açılıp kapanır, ayarları ve içerikleri düzenlenir
export default function HomeEditor({ initial, custom, categories, feedSources }) {
    const [blocks, setBlocks] = useState(initial);
    const [saved, setSaved] = useState(JSON.stringify(initial));
    const [open, setOpen] = useState(null);
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState(null);
    const [isCustom, setIsCustom] = useState(custom);
    const [drag, setDrag] = useState(null);
    const dirty = JSON.stringify(blocks) !== saved;

    // Kaydedilmemiş değişiklikle sayfadan çıkarken uyar
    useEffect(() => {
        const h = (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } };
        window.addEventListener('beforeunload', h);
        return () => window.removeEventListener('beforeunload', h);
    }, [dirty]);

    const update = (id, patch) => setBlocks((bs) => bs.map((b) => (b.id === id ? { ...b, ...patch } : b)));
    const setting = (id, key, value) => setBlocks((bs) => bs.map((b) => (b.id === id ? { ...b, settings: { ...b.settings, [key]: value } } : b)));
    const move = (i, to) => setBlocks((bs) => {
        if (to < 0 || to >= bs.length) return bs;
        const next = [...bs];
        const [x] = next.splice(i, 1);
        next.splice(to, 0, x);
        return next;
    });
    const remove = (b) => { if (confirm(`"${BLOCK_TYPES[b.type].label}" bloğu kaldırılsın mı? (Kaydedene kadar geri alabilirsiniz.)`)) setBlocks((bs) => bs.filter((x) => x.id !== b.id)); };
    const duplicate = (i) => setBlocks((bs) => { const c = { ...newBlock(bs[i].type), settings: { ...bs[i].settings } }; const n = [...bs]; n.splice(i + 1, 0, c); return n; });
    const add = (type) => { const b = newBlock(type); setBlocks((bs) => [...bs, b]); setOpen(b.id); };

    const save = async () => {
        setBusy(true); setMsg(null);
        const d = await api('/api/admin/home', 'PUT', { blocks });
        setBusy(false);
        if (!d?.success) return setMsg({ type: 'error', text: d?.message || 'Kaydedilemedi.' });
        setBlocks(d.blocks); setSaved(JSON.stringify(d.blocks)); setIsCustom(true);
        setMsg({ type: 'success', text: 'Kaydedildi. Ana sayfa güncellendi.' });
    };
    const reset = async () => {
        if (!confirm('Ana sayfa özgün düzenine dönsün mü? Yaptığınız tüm düzenlemeler silinir.')) return;
        setBusy(true); setMsg(null);
        const d = await api('/api/admin/home', 'DELETE');
        setBusy(false);
        if (!d?.success) return setMsg({ type: 'error', text: d?.message || 'İşlem yapılamadı.' });
        setBlocks(d.blocks); setSaved(JSON.stringify(d.blocks)); setIsCustom(false);
        setMsg({ type: 'success', text: 'Özgün düzene dönüldü.' });
    };

    const present = new Set(blocks.map((b) => b.type));
    const addable = Object.entries(BLOCK_TYPES).filter(([t, d]) => d.multiple || !present.has(t));

    return (
        <>
            <div className="admin-toolbar" style={{ position: 'sticky', top: 0, zIndex: 5, background: 'var(--bg, inherit)', paddingBottom: 8 }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <button className="admin-btn primary" onClick={save} disabled={busy || !dirty}><Save size={15} /> {busy ? 'Kaydediliyor…' : dirty ? 'Kaydet' : 'Kaydedildi'}</button>
                    <a className="admin-btn" href="/" target="_blank" rel="noopener"><ExternalLink size={15} /> Ana sayfayı aç</a>
                    {isCustom && <button className="admin-btn" onClick={reset} disabled={busy}><RotateCcw size={15} /> Özgün düzene dön</button>}
                    {dirty && <span style={{ fontSize: 13, color: 'var(--a-danger, #c0392b)' }}>Kaydedilmemiş değişiklik var</span>}
                </div>
            </div>
            {msg && <div className={`admin-msg ${msg.type}`} role="status">{msg.text}</div>}

            <ol style={{ listStyle: 'none', padding: 0, margin: '0 0 16px', display: 'grid', gap: 8 }}>
                {blocks.map((b, i) => {
                    const def = BLOCK_TYPES[b.type];
                    const isOpen = open === b.id;
                    const title = b.settings.title && b.settings.title !== def.defaults.title ? ` — ${b.settings.title}` : b.type === 'ad' ? ` — ${b.settings.place}` : '';
                    return (
                        <li key={b.id}
                            draggable onDragStart={() => setDrag(i)} onDragOver={(e) => e.preventDefault()}
                            onDrop={() => { if (drag !== null && drag !== i) move(drag, i); setDrag(null); }}
                            className="admin-panel" style={{ padding: 0, opacity: b.enabled ? 1 : 0.55, outline: drag === i ? '2px dashed var(--primary)' : 'none' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px' }}>
                                <GripVertical size={16} style={{ cursor: 'grab', color: 'var(--text-muted)', flex: 'none' }} aria-hidden />
                                <span style={{ width: 22, textAlign: 'right', color: 'var(--text-muted)', fontSize: 13 }}>{i + 1}</span>
                                <button type="button" onClick={() => setOpen(isOpen ? null : b.id)} style={{ flex: 1, textAlign: 'left', background: 'none', border: 0, color: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, font: 'inherit' }} aria-expanded={isOpen}>
                                    {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                    <strong>{def.label}</strong><span style={{ color: 'var(--text-muted)' }}>{title}</span>
                                    {b.settings.pinned?.length > 0 && <span className="badge" style={{ marginLeft: 6 }}>{b.settings.pinned.length} sabit haber</span>}
                                </button>
                                <label className="admin-check" title={b.enabled ? 'Ana sayfada görünüyor' : 'Gizli'}>
                                    <input type="checkbox" role="switch" checked={b.enabled} onChange={(e) => update(b.id, { enabled: e.target.checked })} /> {b.enabled ? 'Açık' : 'Kapalı'}
                                </label>
                                <button className="admin-icon-btn" title="Yukarı" aria-label="Yukarı taşı" disabled={i === 0} onClick={() => move(i, i - 1)}><ArrowUp size={15} /></button>
                                <button className="admin-icon-btn" title="Aşağı" aria-label="Aşağı taşı" disabled={i === blocks.length - 1} onClick={() => move(i, i + 1)}><ArrowDown size={15} /></button>
                                {def.multiple && <button className="admin-icon-btn" title="Kopyala" aria-label="Bloğu kopyala" onClick={() => duplicate(i)}><Copy size={15} /></button>}
                                <button className="admin-icon-btn danger" title="Kaldır" aria-label="Bloğu kaldır" onClick={() => remove(b)}><Trash2 size={15} /></button>
                            </div>
                            {isOpen && (
                                <div style={{ padding: '4px 16px 16px 58px', borderTop: '1px solid var(--border, #ddd)' }}>
                                    <p className="hint" style={{ fontSize: 13, color: 'var(--text-muted)', margin: '10px 0 14px' }}>{def.hint}</p>
                                    {def.fields.length === 0 && <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Bu bloğun ayarı yok; yalnızca yeri ve görünürlüğü değiştirilebilir.</p>}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0 16px' }}>
                                        {def.fields.filter((f) => !f.when || f.when(b.settings)).filter((f) => !['articles', 'categories'].includes(f.type)).map((f) => (
                                            <Field key={f.key} f={f} value={b.settings[f.key]} onChange={(v) => setting(b.id, f.key, v)} categories={categories} feedSources={feedSources} />
                                        ))}
                                    </div>
                                    {def.fields.filter((f) => f.type === 'categories').map((f) => (
                                        <CategoryPicker key={f.key} label={f.label} value={b.settings[f.key] || []} onChange={(v) => setting(b.id, f.key, v)} categories={categories} />
                                    ))}
                                    {def.fields.filter((f) => f.type === 'articles').map((f) => (
                                        <ArticlePicker key={f.key} label={f.label} value={b.settings[f.key] || []} onChange={(v) => setting(b.id, f.key, v)} />
                                    ))}
                                </div>
                            )}
                        </li>
                    );
                })}
            </ol>

            <div className="admin-panel">
                <h2 style={{ fontSize: '1rem', margin: '0 0 10px' }}><Plus size={15} style={{ verticalAlign: -2 }} /> Blok ekle</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 8 }}>
                    {addable.map(([t, d]) => (
                        <button key={t} type="button" className="admin-btn" style={{ justifyContent: 'flex-start', textAlign: 'left', height: 'auto', padding: '10px 12px', display: 'block' }} onClick={() => add(t)}>
                            <strong style={{ display: 'block' }}>{d.label}</strong>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 }}>{d.hint}</span>
                        </button>
                    ))}
                </div>
            </div>
        </>
    );
}

function Field({ f, value, onChange, categories, feedSources }) {
    const id = useId();
    let input;
    if (f.type === 'number') input = <input id={id} className="admin-input" type="number" min={f.min} max={f.max} value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))} />;
    else if (f.type === 'select') input = <select id={id} className="admin-select" value={value ?? ''} onChange={(e) => onChange(e.target.value)}>{f.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>;
    else if (f.type === 'category') input = <select id={id} className="admin-select" value={value ?? ''} onChange={(e) => onChange(e.target.value)}><option value="">Seçin…</option>{categories.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}</select>;
    else if (f.type === 'feedSource') input = <select id={id} className="admin-select" value={value ?? ''} onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}><option value="">Seçin…</option>{feedSources.map((s) => <option key={s.id} value={s.id}>{s.name}{s.active ? '' : ' (kapalı)'}</option>)}</select>;
    else input = <input id={id} className="admin-input" value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
    return <div className="admin-field"><label htmlFor={id}>{f.label}</label>{input}</div>;
}

function CategoryPicker({ label, value, onChange, categories }) {
    const toggle = (slug) => onChange(value.includes(slug) ? value.filter((x) => x !== slug) : [...value, slug]);
    return (
        <div className="admin-field">
            <label>{label}</label>
            <span className="hint">Hiçbiri seçili değilse haberi olan tüm kategoriler görünür. Seçtiklerin, seçme sırasına göre dizilir.</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {categories.map((c) => {
                    const n = value.indexOf(c.slug);
                    return (
                        <button key={c.slug} type="button" className={`admin-btn ${n >= 0 ? 'primary' : ''}`} style={{ padding: '6px 10px' }} onClick={() => toggle(c.slug)} aria-pressed={n >= 0}>
                            {n >= 0 && <span style={{ marginRight: 4 }}>{n + 1}.</span>}{c.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// Sabitlenecek haberler: başlıkta ara, ekle, sırala, çıkar
function ArticlePicker({ label, value, onChange }) {
    const [info, setInfo] = useState({});
    const [q, setQ] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const missing = useMemo(() => value.filter((id) => !info[id]), [value, info]);

    useEffect(() => {
        if (!missing.length) return;
        api(`/api/admin/home/articles?ids=${missing.join(',')}`).then((d) => {
            const next = {};
            for (const id of missing) next[id] = { id, title: `#${id} (bulunamadı)`, status: 'YOK' };
            (d?.articles || []).forEach((a) => { next[a.id] = a; });
            setInfo((x) => ({ ...x, ...next }));
        });
    }, [missing]);

    useEffect(() => {
        const t = setTimeout(async () => {
            setLoading(true);
            const d = await api(`/api/admin/home/articles?q=${encodeURIComponent(q)}`);
            setLoading(false);
            setResults(d?.articles || []);
            setInfo((x) => ({ ...x, ...Object.fromEntries((d?.articles || []).map((a) => [a.id, a])) }));
        }, 250);
        return () => clearTimeout(t);
    }, [q]);

    const move = (i, to) => { if (to < 0 || to >= value.length) return; const n = [...value]; const [x] = n.splice(i, 1); n.splice(to, 0, x); onChange(n); };
    const when = (d) => (d ? new Date(d).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '');

    return (
        <div className="admin-field" style={{ marginTop: 8 }}>
            <label>{label}</label>
            <span className="hint">Seçilen haberler blokta en üstte, bu sırayla gösterilir; kalan yer seçtiğin içerik kaynağından otomatik dolar. Yayından kalkan haber kendiliğinden düşer.</span>
            {value.length > 0 && (
                <ol style={{ margin: '4px 0 10px', paddingLeft: 0, listStyle: 'none', display: 'grid', gap: 4 }}>
                    {value.map((id, i) => {
                        const a = info[id];
                        return (
                            <li key={id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', border: '1px solid var(--border, #ddd)', borderRadius: 6 }}>
                                <span style={{ width: 18, color: 'var(--text-muted)', fontSize: 12 }}>{i + 1}.</span>
                                <span style={{ flex: 1, fontSize: 14 }}>{a?.title || '…'}{a && a.status && a.status !== 'PUBLISHED' && <span className="badge" style={{ marginLeft: 6 }}>yayında değil</span>}</span>
                                <button type="button" className="admin-icon-btn" aria-label="Yukarı" disabled={i === 0} onClick={() => move(i, i - 1)}><ArrowUp size={14} /></button>
                                <button type="button" className="admin-icon-btn" aria-label="Aşağı" disabled={i === value.length - 1} onClick={() => move(i, i + 1)}><ArrowDown size={14} /></button>
                                <button type="button" className="admin-icon-btn danger" aria-label="Çıkar" onClick={() => onChange(value.filter((x) => x !== id))}><X size={14} /></button>
                            </li>
                        );
                    })}
                </ol>
            )}
            <div style={{ position: 'relative', maxWidth: 520 }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: 11, color: 'var(--text-muted)' }} aria-hidden />
                <input className="admin-input" style={{ paddingLeft: 30 }} type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Haber başlığında ara…" aria-label="Sabitlenecek haberi ara" />
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '6px 0 0', maxWidth: 520, maxHeight: 240, overflow: 'auto', border: '1px solid var(--border, #ddd)', borderRadius: 6 }}>
                {loading && <li style={{ padding: 8, fontSize: 13, color: 'var(--text-muted)' }}>Aranıyor…</li>}
                {!loading && results.length === 0 && <li style={{ padding: 8, fontSize: 13, color: 'var(--text-muted)' }}>Sonuç yok.</li>}
                {results.map((a) => {
                    const chosen = value.includes(a.id);
                    return (
                        <li key={a.id}>
                            <button type="button" disabled={chosen} onClick={() => onChange([...value, a.id])} style={{ width: '100%', textAlign: 'left', padding: '7px 10px', background: 'none', border: 0, borderBottom: '1px solid var(--border, #eee)', color: 'inherit', cursor: chosen ? 'default' : 'pointer', opacity: chosen ? 0.5 : 1, font: 'inherit', fontSize: 14 }}>
                                {chosen ? '✓ ' : '+ '}{a.title}
                                <span style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)' }}>{a.category?.label} · {when(a.publishedAt)}{a.sourceName ? ` · ${a.sourceName}` : ''}</span>
                            </button>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
