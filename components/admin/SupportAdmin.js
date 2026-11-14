"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';
import { formatShortDate } from '@/lib/format';

const PERIOD = { tek: 'Tek seferlik', aylik: 'Aylık', yillik: 'Yıllık' };
async function api(url, method, body) {
    const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined }).catch(() => null);
    return (await r?.json().catch(() => null)) || { success: false, message: 'Sunucuya ulaşılamadı.' };
}

export default function SupportAdmin({ tiers, supporters, canEditTiers }) {
    const router = useRouter();
    const [msg, setMsg] = useState(null);
    const [tier, setTier] = useState({ name: '', amount: '', period: 'aylik', paymentUrl: '', description: '' });
    const [sup, setSup] = useState({ email: '', tierId: tiers[0]?.id ?? '', until: '', note: '' });
    const done = (text) => { setMsg(text ? { type: 'success', text } : null); router.refresh(); };

    const addTier = async (e) => {
        e.preventDefault();
        const d = await api('/api/admin/support/tiers', 'POST', tier);
        if (!d.success) return setMsg({ type: 'error', text: d.message });
        setTier({ name: '', amount: '', period: 'aylik', paymentUrl: '', description: '' }); done('Paket eklendi.');
    };
    const addSupporter = async (e) => {
        e.preventDefault();
        const d = await api('/api/admin/support/supporters', 'POST', { ...sup, until: sup.until ? new Date(sup.until).toISOString() : '' });
        if (!d.success) return setMsg({ type: 'error', text: d.message });
        setSup({ ...sup, email: '', note: '', until: '' });
        done(d.linked ? 'Destekçi eklendi; üye hesabında reklamsız okuma açıldı.' : 'Destekçi eklendi. Bu e-postayla henüz üye yok; üye olduğunda bağlamak için kaydı yeniden ekleyin.');
    };

    return (
        <>
            {msg && <div className={`admin-msg ${msg.type}`} role="status">{msg.text}</div>}
            <div className="admin-grid-2">
                <section className="admin-panel" style={{ padding: 0 }}>
                    <h2 style={{ margin: 16 }}>Destekçiler</h2>
                    {!supporters.length ? <p className="admin-empty">Henüz destekçi yok.</p> : (
                        <div className="admin-table-wrap">
                            <table className="admin-table">
                                <thead><tr><th>Destekçi</th><th>Paket</th><th>Bitiş</th><th>Durum</th><th></th></tr></thead>
                                <tbody>
                                    {supporters.map((s) => (
                                        <tr key={s.id}>
                                            <td style={{ fontWeight: 600 }}>{s.name || s.email}<small className="muted" style={{ display: 'block' }}>{s.email}{s.note && ` · ${s.note}`}</small></td>
                                            <td className="muted">{s.tier || '—'}{s.amount ? ` · ${s.amount} TL` : ''}</td>
                                            <td className="muted">{s.until ? formatShortDate(s.until) : 'Süresiz'}</td>
                                            <td>{!s.active ? <span className="badge">Süresi doldu</span> : s.linked ? <span className="badge ok">Reklamsız</span> : <span className="badge warn">Üye değil</span>}</td>
                                            <td><button type="button" className="admin-icon-btn danger" aria-label="Kaydı sil" onClick={async () => { if (confirm(`${s.email} kaydı silinsin mi?`)) { await api(`/api/admin/support/supporters/${s.id}`, 'DELETE'); done(); } }}><Trash2 size={14} /></button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
                    <form className="admin-panel" onSubmit={addSupporter}>
                        <h2 style={{ marginTop: 0 }}>Destekçi ekle</h2>
                        <label className="admin-field"><span>E-posta (ödemedeki)</span><input className="admin-input" type="email" required value={sup.email} onChange={(e) => setSup({ ...sup, email: e.target.value })} /></label>
                        <label className="admin-field"><span>Paket</span>
                            <select className="admin-select" value={sup.tierId} onChange={(e) => setSup({ ...sup, tierId: e.target.value })}>
                                <option value="">— Paket dışı —</option>{tiers.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.amount} TL, {PERIOD[t.period]})</option>)}
                            </select></label>
                        <label className="admin-field"><span>Bitiş (boşsa pakete göre: aylık 1 ay, yıllık 1 yıl)</span><input className="admin-input" type="date" value={sup.until} onChange={(e) => setSup({ ...sup, until: e.target.value })} /></label>
                        <label className="admin-field"><span>Not</span><input className="admin-input" value={sup.note} onChange={(e) => setSup({ ...sup, note: e.target.value })} placeholder="ör. iyzico işlem no" /></label>
                        <button className="admin-btn primary"><Plus size={15} /> Ekle</button>
                    </form>

                    <section className="admin-panel">
                        <h2 style={{ marginTop: 0 }}>Destek paketleri</h2>
                        <ul className="admin-list">
                            {tiers.map((t) => (
                                <li key={t.id} className="admin-list-row">
                                    <span style={{ flex: 1 }}>{t.name} · {t.amount} TL · {PERIOD[t.period]}{!t.active && ' (gizli)'}<small className="muted" style={{ display: 'block', overflowWrap: 'anywhere' }}>{t.paymentUrl}</small></span>
                                    {canEditTiers && <button type="button" className="admin-icon-btn danger" aria-label="Paketi sil" onClick={async () => { if (confirm(`${t.name} paketi silinsin mi?`)) { await api(`/api/admin/support/tiers/${t.id}`, 'DELETE'); done(); } }}><Trash2 size={14} /></button>}
                                </li>
                            ))}
                        </ul>
                        {canEditTiers ? (
                            <form onSubmit={addTier} style={{ marginTop: 12 }}>
                                <label className="admin-field"><span>Paket adı</span><input className="admin-input" required value={tier.name} onChange={(e) => setTier({ ...tier, name: e.target.value })} placeholder="ör. Destekçi" /></label>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <label className="admin-field" style={{ flex: 1 }}><span>Tutar (TL)</span><input className="admin-input" type="number" min="1" required value={tier.amount} onChange={(e) => setTier({ ...tier, amount: e.target.value })} /></label>
                                    <label className="admin-field" style={{ flex: 1 }}><span>Dönem</span>
                                        <select className="admin-select" value={tier.period} onChange={(e) => setTier({ ...tier, period: e.target.value })}>{Object.entries(PERIOD).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
                                </div>
                                <label className="admin-field"><span>Ödeme bağlantısı</span><input className="admin-input" type="url" required value={tier.paymentUrl} onChange={(e) => setTier({ ...tier, paymentUrl: e.target.value })} placeholder="https://iyzi.link/… ya da Shopier / Papara bağlantısı" /></label>
                                <label className="admin-field"><span>Açıklama</span><input className="admin-input" value={tier.description} onChange={(e) => setTier({ ...tier, description: e.target.value })} /></label>
                                <button className="admin-btn"><Plus size={15} /> Paket ekle</button>
                            </form>
                        ) : <p className="hint">Paketleri ve ödeme bağlantılarını yalnızca yönetici değiştirebilir.</p>}
                    </section>
                </div>
            </div>
        </>
    );
}
