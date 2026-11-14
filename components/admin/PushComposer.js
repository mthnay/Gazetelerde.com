"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send } from 'lucide-react';

export default function PushComposer({ articles }) {
    const router = useRouter();
    const [articleId, setArticleId] = useState('');
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [url, setUrl] = useState('/');
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState(null);
    const picked = articles.find((a) => String(a.id) === articleId);

    const send = async (e) => {
        e.preventDefault();
        if (!confirm('Bildirim tüm abonelere gönderilsin mi? Geri alınamaz.')) return;
        setBusy(true); setMsg(null);
        const res = await fetch('/api/admin/push', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(articleId ? { articleId: Number(articleId), title, body } : { title, body, url }),
        }).catch(() => null);
        const d = await res?.json().catch(() => null);
        setBusy(false);
        setMsg({ type: d?.success ? 'success' : 'error', text: d?.message || 'Gönderilemedi.' });
        if (d?.success) { setArticleId(''); setTitle(''); setBody(''); setUrl('/'); router.refresh(); }
    };

    return (
        <form className="admin-panel" onSubmit={send}>
            <h2 style={{ marginTop: 0 }}>Yeni bildirim</h2>
            {msg && <div className={`admin-msg ${msg.type}`} role="status">{msg.text}</div>}
            <label className="admin-field"><span>Haber (son 48 saat)</span>
                <select className="admin-select" value={articleId} onChange={(e) => setArticleId(e.target.value)}>
                    <option value="">— Haber seçmeden, elle yaz —</option>
                    {articles.map((a) => <option key={a.id} value={a.id}>{a.breaking ? '● ' : ''}{a.title}</option>)}
                </select>
            </label>
            <label className="admin-field"><span>Başlık {picked && <small className="hint">(boşsa haber başlığı)</small>}</span>
                <input className="admin-input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder={picked?.title || 'Son dakika: …'} required={!picked} />
            </label>
            <label className="admin-field"><span>Metin {picked && <small className="hint">(boşsa haber özeti)</small>}</span>
                <textarea className="admin-textarea" rows={3} value={body} onChange={(e) => setBody(e.target.value)} maxLength={180} />
            </label>
            {!picked && (
                <label className="admin-field"><span>Açılacak sayfa</span>
                    <input className="admin-input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="/haber/..." />
                </label>
            )}
            <div className="push-preview" aria-label="Önizleme">
                <strong>{title || picked?.title || 'Bildirim başlığı'}</strong>
                <span>{body || (picked ? 'Haber özeti' : 'Bildirim metni')}</span>
                <small>gazetelerde.com</small>
            </div>
            <button className="admin-btn primary" disabled={busy}>{busy ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Send size={15} />} Gönder</button>
        </form>
    );
}
