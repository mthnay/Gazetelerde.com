"use client";
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, RotateCcw, Trash2, ChevronDown } from 'lucide-react';
import { formatShortDate } from '@/lib/format';

const SOURCE = { sunucu: 'Sunucu', tarayici: 'Tarayıcı', is: 'Arka plan' };

export default function ErrorList({ errors, show }) {
    const router = useRouter();
    const [open, setOpen] = useState(null);
    const [busy, setBusy] = useState(false);
    const call = async (body) => {
        setBusy(true);
        await fetch('/api/admin/errors', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).catch(() => null);
        setBusy(false);
        router.refresh();
    };
    return (
        <section className="admin-panel" style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                <h2 style={{ margin: 0 }}>Hatalar</h2>
                <div style={{ display: 'flex', gap: 8 }}>
                    <nav className="admin-tabs">
                        <Link href="/admin/sistem" className={`admin-tab ${show === 'open' ? 'active' : ''}`}>Açık</Link>
                        <Link href="/admin/sistem?goster=tumu" className={`admin-tab ${show === 'all' ? 'active' : ''}`}>Tümü</Link>
                    </nav>
                    {show === 'open' && errors.length > 0 && <button type="button" className="admin-btn" disabled={busy} onClick={() => call({ all: true })}><Check size={15} /> Tümünü çözüldü say</button>}
                </div>
            </div>
            {!errors.length ? <p className="admin-empty">{show === 'open' ? 'Açık hata yok. 🎉' : 'Kayıtlı hata yok.'}</p> : (
                <ul className="err-list">
                    {errors.map((e) => (
                        <li key={e.id} className={e.resolved ? 'is-resolved' : ''}>
                            <button type="button" className="err-head" onClick={() => setOpen(open === e.id ? null : e.id)} aria-expanded={open === e.id}>
                                <span className={`badge ${e.source === 'sunucu' ? 'danger' : e.source === 'is' ? 'warn' : ''}`}>{SOURCE[e.source] || e.source}</span>
                                <span className="err-msg">{e.message}<small>{e.path || '—'} · ilk {formatShortDate(e.firstSeen)} · son {formatShortDate(e.lastSeen)}</small></span>
                                <strong className="err-count">×{e.count}</strong>
                                <ChevronDown size={16} style={{ transform: open === e.id ? 'rotate(180deg)' : undefined, transition: 'transform .2s' }} />
                            </button>
                            {open === e.id && (
                                <div className="err-body">
                                    {e.stack ? <pre>{e.stack}</pre> : <p className="hint">Yığın bilgisi yok.</p>}
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        {e.resolved
                                            ? <button type="button" className="admin-btn" disabled={busy} onClick={() => call({ id: e.id, resolved: false })}><RotateCcw size={14} /> Yeniden aç</button>
                                            : <button type="button" className="admin-btn primary" disabled={busy} onClick={() => call({ id: e.id, resolved: true })}><Check size={14} /> Çözüldü</button>}
                                        <button type="button" className="admin-btn danger" disabled={busy} onClick={() => call({ id: e.id, remove: true })}><Trash2 size={14} /> Sil</button>
                                    </div>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
