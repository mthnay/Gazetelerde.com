"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { formatShortDate } from '@/lib/format';

export default function SubscriberTable({ initial }) {
    const router = useRouter();
    const [busy, setBusy] = useState(null);
    const call = async (s, method, body) => {
        setBusy(s.id);
        await fetch(`/api/admin/subscribers/${s.id}`, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined }).catch(() => null);
        setBusy(null);
        router.refresh();
    };
    if (!initial.length) return <div className="admin-panel"><p className="admin-empty">Abone bulunamadı.</p></div>;
    return (
        <div className="admin-panel" style={{ padding: 0 }}>
            <div className="admin-table-wrap">
                <table className="admin-table">
                    <thead><tr><th>E-posta</th><th>Durum</th><th>Kayıt</th><th>Onay</th><th></th></tr></thead>
                    <tbody>
                        {initial.map((s) => (
                            <tr key={s.id}>
                                <td style={{ fontWeight: 600 }}>{s.email}</td>
                                <td>{!s.active ? <span className="badge danger">Ayrıldı</span> : s.confirmedAt ? <span className="badge ok">Onaylı</span> : <span className="badge warn">Onay bekliyor</span>}</td>
                                <td className="muted">{formatShortDate(s.createdAt)}</td>
                                <td className="muted">{s.confirmedAt ? formatShortDate(s.confirmedAt) : '—'}</td>
                                <td>
                                    <div className="admin-actions">
                                        {/* Ayrılan bir okur yönetimden yeniden eklenemez (açık rıza); formdan tekrar abone olup onaylaması gerekir */}
                                        {s.active && <button type="button" className="admin-btn" disabled={busy === s.id} onClick={() => call(s, 'PATCH', { active: false })}>Pasifleştir</button>}
                                        <button type="button" className="admin-icon-btn danger" disabled={busy === s.id} title="Kalıcı olarak sil" aria-label="Aboneyi sil"
                                            onClick={() => confirm(`${s.email} adresi ve gönderim kayıtları kalıcı olarak silinsin mi?`) && call(s, 'DELETE')}><Trash2 size={15} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
