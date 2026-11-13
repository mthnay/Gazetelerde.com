"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { ROLE_LABELS } from '@/lib/permissions';
import { formatShortDate } from '@/lib/format';

export default function UserManagement({ initial, meId }) {
    const router = useRouter();
    const [busyId, setBusyId] = useState(null);
    const [msg, setMsg] = useState(null);

    const call = async (u, method, body) => {
        setBusyId(u.id);
        setMsg(null);
        const res = await fetch(`/api/admin/users/${u.id}`, {
            method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined,
        }).catch(() => null);
        const data = await res?.json().catch(() => null);
        setBusyId(null);
        if (!data?.success) {
            setMsg({ type: 'error', text: data?.message || 'İşlem başarısız.' });
        } else {
            setMsg({ type: 'success', text: method === 'DELETE' ? `${u.name} silindi.` : `${u.name} artık ${ROLE_LABELS[body.role]}.` });
        }
        router.refresh();
    };

    const changeRole = (u, role) => {
        if (role === u.role) return;
        if (role === 'ADMIN' && !confirm(`${u.name} kullanıcısına tam yönetici yetkisi verilsin mi? Kullanıcıları ve rolleri yönetebilecek.`)) {
            router.refresh();
            return;
        }
        call(u, 'PATCH', { role });
    };

    const remove = (u) => {
        if (confirm(`${u.name} (${u.email}) hesabı kalıcı olarak silinsin mi? Yorumları, beğenileri ve kayıtları da silinir. Yazdığı haberler kalır ama yazarsız görünür. Bu işlem geri alınamaz.`)) {
            call(u, 'DELETE');
        }
    };

    if (!initial.length) return <div className="admin-panel"><p className="admin-empty">Kullanıcı bulunamadı.</p></div>;

    return (
        <>
            {msg && <div className={`admin-msg ${msg.type}`} role="status">{msg.text}</div>}
            <div className="admin-panel" style={{ padding: 0 }}>
                <div className="admin-table-wrap">
                    <table className="admin-table">
                        <thead><tr><th>Kullanıcı</th><th>E-posta</th><th>Rol</th><th>Katkı</th><th>Kayıt</th><th></th></tr></thead>
                        <tbody>
                            {initial.map((u) => {
                                const isMe = u.id === meId;
                                return (
                                    <tr key={u.id}>
                                        <td style={{ fontWeight: 600 }}>{u.name}{isMe && <span className="badge" style={{ marginLeft: 8 }}>Siz</span>}</td>
                                        <td className="muted">{u.email}</td>
                                        <td>
                                            {isMe ? <span className={`badge ${u.role}`}>{ROLE_LABELS[u.role]}</span> : (
                                                <select
                                                    key={u.role}
                                                    className="admin-select"
                                                    style={{ width: 'auto', padding: '6px 10px' }}
                                                    defaultValue={u.role}
                                                    disabled={busyId === u.id}
                                                    onChange={(e) => changeRole(u, e.target.value)}
                                                    aria-label={`${u.name} rolü`}
                                                >
                                                    {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                                </select>
                                            )}
                                        </td>
                                        <td className="muted">{u.articles} haber · {u.comments} yorum</td>
                                        <td className="muted">{formatShortDate(u.createdAt)}</td>
                                        <td>
                                            {!isMe && (
                                                <div className="admin-actions">
                                                    <button className="admin-icon-btn danger" title="Sil" aria-label="Sil" disabled={busyId === u.id} onClick={() => remove(u)}><Trash2 size={15} /></button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}
