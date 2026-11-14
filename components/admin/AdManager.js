"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Pencil } from 'lucide-react';
import CoverImage from './CoverImage';

const EMPTY = { name: '', placement: 'haber-ici', kind: 'gorsel', image: '', link: '', alt: '', code: '', label: 'Reklam', weight: 1, startsAt: '', endsAt: '', active: true };
const toLocal = (iso) => { if (!iso) return ''; const d = new Date(iso); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };
const pct = (c, v) => (v ? `%${((c / v) * 100).toFixed(2)}` : '—');

async function api(url, method, body) {
    const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined }).catch(() => null);
    return (await r?.json().catch(() => null)) || { success: false, message: 'Sunucuya ulaşılamadı.' };
}

export default function AdManager({ initial, placements, isAdmin }) {
    const router = useRouter();
    const [form, setForm] = useState(null); // düzenlenen / yeni reklam
    const [msg, setMsg] = useState(null);
    const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

    const save = async (e) => {
        e.preventDefault();
        const body = { ...form, startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null, endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null };
        const d = form.id ? await api(`/api/admin/ads/${form.id}`, 'PATCH', body) : await api('/api/admin/ads', 'POST', body);
        if (!d.success) return setMsg({ type: 'error', text: d.message });
        setForm(null); setMsg({ type: 'success', text: 'Kaydedildi.' }); router.refresh();
    };
    const toggle = async (a) => { const d = await api(`/api/admin/ads/${a.id}`, 'PATCH', { active: !a.active }); if (d.success) router.refresh(); else setMsg({ type: 'error', text: d.message }); };
    const remove = async (a) => { if (!confirm(`“${a.name}” silinsin mi?`)) return; const d = await api(`/api/admin/ads/${a.id}`, 'DELETE'); if (d.success) router.refresh(); else setMsg({ type: 'error', text: d.message }); };

    return (
        <>
            {msg && <div className={`admin-msg ${msg.type}`} role="status">{msg.text}</div>}
            {!form && <button type="button" className="admin-btn primary" style={{ marginBottom: 16 }} onClick={() => setForm(EMPTY)}><Plus size={15} /> Yeni reklam</button>}

            {form && (
                <form className="admin-panel" onSubmit={save} style={{ marginBottom: 16 }}>
                    <h2 style={{ marginTop: 0 }}>{form.id ? 'Reklamı düzenle' : 'Yeni reklam'}</h2>
                    <div className="admin-grid-2" style={{ gridTemplateColumns: '1fr 1fr' }}>
                        <div>
                            <label className="admin-field"><span>Ad (yalnızca panelde görünür)</span><input className="admin-input" required value={form.name} onChange={set('name')} placeholder="ör. Kasım — X Market kampanyası" /></label>
                            <label className="admin-field"><span>Yerleşim</span>
                                <select className="admin-select" value={form.placement} onChange={set('placement')}>
                                    {Object.entries(placements).map(([k, p]) => <option key={k} value={k}>{p.label} ({p.size})</option>)}
                                </select></label>
                            <label className="admin-field"><span>Tür</span>
                                <select className="admin-select" value={form.kind} onChange={set('kind')}>
                                    <option value="gorsel">Görsel + bağlantı (çerezsiz, doğrudan sponsor)</option>
                                    <option value="kod" disabled={!isAdmin}>Reklam ağı kodu (AdSense vb.){isAdmin ? '' : ' — yalnızca yönetici'}</option>
                                </select></label>
                            <label className="admin-field"><span>Etiket</span>
                                <select className="admin-select" value={form.label} onChange={set('label')}><option>Reklam</option><option>Sponsorlu</option></select></label>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <label className="admin-field" style={{ flex: 1 }}><span>Başlangıç</span><input className="admin-input" type="datetime-local" value={toLocal(form.startsAt) || form.startsAt} onChange={set('startsAt')} /></label>
                                <label className="admin-field" style={{ flex: 1 }}><span>Bitiş</span><input className="admin-input" type="datetime-local" value={toLocal(form.endsAt) || form.endsAt} onChange={set('endsAt')} /></label>
                            </div>
                            <label className="admin-field"><span>Ağırlık (aynı yerdeki reklamlar arasında gösterim payı, 1-10)</span><input className="admin-input" type="number" min="1" max="10" value={form.weight} onChange={set('weight')} /></label>
                        </div>
                        <div>
                            {form.kind === 'gorsel' ? (
                                <>
                                    <div className="admin-field"><span>Görsel</span><CoverImage value={form.image || ''} onChange={(v) => setForm({ ...form, image: v })} /></div>
                                    <label className="admin-field"><span>Hedef adres</span><input className="admin-input" type="url" value={form.link || ''} onChange={set('link')} placeholder="https://" /></label>
                                    <label className="admin-field"><span>Görsel açıklaması</span><input className="admin-input" value={form.alt} onChange={set('alt')} /></label>
                                </>
                            ) : (
                                <label className="admin-field"><span>Reklam kodu</span>
                                    <textarea className="admin-textarea" rows={10} value={form.code} onChange={set('code')} style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '.8rem' }} placeholder="<ins class=&quot;adsbygoogle&quot; …></ins><script>…</script>" />
                                    <span className="hint">Bu kod yalnızca okur reklam çerezlerine izin verirse çalışır. Güvenilmeyen kaynaklardan kod yapıştırmayın.</span>
                                </label>
                            )}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button className="admin-btn primary">Kaydet</button>
                        <button type="button" className="admin-btn" onClick={() => setForm(null)}>Vazgeç</button>
                    </div>
                </form>
            )}

            <div className="admin-panel" style={{ padding: 0 }}>
                {!initial.length ? <p className="admin-empty">Henüz reklam yok.</p> : (
                    <div className="admin-table-wrap">
                        <table className="admin-table">
                            <thead><tr><th>Reklam</th><th>Yerleşim</th><th>Gösterim</th><th>Tıklama</th><th>Oran</th><th>Durum</th><th></th></tr></thead>
                            <tbody>
                                {initial.map((a) => (
                                    <tr key={a.id}>
                                        <td style={{ fontWeight: 600 }}>{a.name}<small className="muted" style={{ display: 'block' }}>{a.kind === 'kod' ? 'Reklam ağı kodu' : 'Görsel'} · {a.label}</small></td>
                                        <td className="muted">{placements[a.placement]?.label || a.placement}</td>
                                        <td className="muted">{a.views}</td>
                                        <td className="muted">{a.clicks}</td>
                                        <td className="muted">{a.kind === 'gorsel' ? pct(a.clicks, a.views) : '—'}</td>
                                        <td><button type="button" className={`badge ${a.active ? 'ok' : ''}`} onClick={() => toggle(a)} style={{ cursor: 'pointer' }}>{a.active ? 'Yayında' : 'Durduruldu'}</button></td>
                                        <td><div className="admin-actions">
                                            <button type="button" className="admin-icon-btn" onClick={() => setForm(a)} aria-label="Düzenle"><Pencil size={14} /></button>
                                            <button type="button" className="admin-icon-btn danger" onClick={() => remove(a)} aria-label="Sil"><Trash2 size={14} /></button>
                                        </div></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
}
