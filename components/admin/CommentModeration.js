"use client";
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Trash2 } from 'lucide-react';
import { formatShortDate } from '@/lib/format';

export default function CommentModeration({ initial }) {
    const router = useRouter();
    const [busyId, setBusyId] = useState(null);
    const [error, setError] = useState('');

    const call = async (id, method, body) => {
        setBusyId(id);
        setError('');
        const res = await fetch(`/api/admin/comments/${id}`, {
            method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined,
        }).catch(() => null);
        const data = await res?.json().catch(() => null);
        setBusyId(null);
        if (!data?.success) return setError(data?.message || 'İşlem başarısız.');
        router.refresh();
    };

    const remove = (c) => {
        if (confirm(`${c.user} kullanıcısının yorumu kalıcı olarak silinsin mi? Bu işlem geri alınamaz.`)) call(c.id, 'DELETE');
    };

    if (!initial.length) return <div className="admin-panel"><p className="admin-empty">Yorum bulunamadı.</p></div>;

    return (
        <>
            {error && <div className="admin-msg error">{error}</div>}
            <div className="admin-panel" style={{ padding: 0 }}>
                <div className="admin-table-wrap">
                    <table className="admin-table">
                        <thead><tr><th>Yorum</th><th>Kullanıcı</th><th>Haber</th><th>Durum</th><th>Şikayet</th><th>Tarih</th><th></th></tr></thead>
                        <tbody>
                            {initial.map((c) => (
                                <tr key={c.id} style={{ opacity: c.status === 'HIDDEN' ? 0.6 : 1 }}>
                                    <td style={{ maxWidth: 360, overflowWrap: 'anywhere' }}>
                                        {c.isReply && <span className="badge" style={{ marginRight: 6 }}>Cevap</span>}
                                        {c.text}
                                        {c.reasons?.length > 0 && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>Gerekçe: {c.reasons.join(' · ')}</div>}
                                    </td>
                                    <td className="muted" title={c.email}>{c.user}</td>
                                    <td className="muted" style={{ maxWidth: 220, whiteSpace: 'normal' }}>
                                        <Link href={`/haber/${c.articleSlug}#yorumlar`} target="_blank">{c.articleTitle}</Link>
                                    </td>
                                    <td><span className={`badge ${c.status}`}>{c.status === 'HIDDEN' ? 'Gizli' : 'Yayında'}</span></td>
                                    <td>{c.reportCount > 0 ? <span className="badge DRAFT">{c.reportCount}</span> : <span className="muted">—</span>}</td>
                                    <td className="muted">{formatShortDate(c.createdAt)}</td>
                                    <td>
                                        <div className="admin-actions">
                                            {c.status === 'VISIBLE' ? (
                                                <button className="admin-icon-btn" title="Gizle" aria-label="Gizle" disabled={busyId === c.id} onClick={() => call(c.id, 'PATCH', { status: 'HIDDEN' })}><EyeOff size={15} /></button>
                                            ) : (
                                                <button className="admin-icon-btn" title="Yayına al" aria-label="Yayına al" disabled={busyId === c.id} onClick={() => call(c.id, 'PATCH', { status: 'VISIBLE' })}><Eye size={15} /></button>
                                            )}
                                            <button className="admin-icon-btn danger" title="Sil" aria-label="Sil" disabled={busyId === c.id} onClick={() => remove(c)}><Trash2 size={15} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}
