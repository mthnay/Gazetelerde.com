"use client";
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send, Pin, PinOff, Trash2, Radio, Square, ExternalLink, ImagePlus, X, Sparkles } from 'lucide-react';
import { uploadImage } from './uploadImage';

const KINDS = { normal: 'Gelişme', onemli: 'Önemli', skor: 'Skor', son: 'Son durum' };
const hm = (iso) => new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }).format(new Date(iso));

async function call(id, method, body, q = '') {
    const res = await fetch(`/api/admin/articles/${id}/live${q}`, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined }).catch(() => null);
    return (await res?.json().catch(() => null)) || { success: false, message: 'Sunucuya ulaşılamadı.' };
}

// Canlı anlatım masası: hızlı giriş (Ctrl/⌘+Enter), tür, görsel, bildirim; düzenle / sabitle / sil
export default function LiveComposer({ article, initial, canPush }) {
    const router = useRouter();
    const [entries, setEntries] = useState(initial);
    const [text, setText] = useState('');
    const [kind, setKind] = useState('normal');
    const [image, setImage] = useState('');
    const [notify, setNotify] = useState(false);
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState(null);
    const [live, setLive] = useState(article.live);
    const [edit, setEdit] = useState(null);

    const post = async () => {
        if (text.trim().length < 2 || busy) return;
        setBusy(true); setMsg(null);
        const d = await call(article.id, 'POST', { text, kind, image, notify });
        setBusy(false);
        if (!d.success) return setMsg({ type: 'error', text: d.message });
        setEntries((x) => [d.entry, ...x]);
        setText(''); setImage(''); setNotify(false); setKind('normal');
    };
    const toggleLive = async () => {
        if (live && !confirm('Canlı anlatım sona erdirilsin mi? Okurların sayfası artık kendiliğinden yenilenmez.')) return;
        const d = await call(article.id, 'POST', { live: !live });
        if (d.success) { setLive(!live); router.refresh(); } else setMsg({ type: 'error', text: d.message });
    };
    const patch = async (e, body) => {
        const d = await call(article.id, 'PATCH', { entryId: e.id, ...body });
        if (!d.success) return setMsg({ type: 'error', text: d.message });
        setEntries((x) => x.map((y) => (y.id === e.id ? { ...y, ...body } : body.pinned ? { ...y, pinned: false } : y)));
        setEdit(null);
    };
    const remove = async (e) => {
        if (!confirm('Bu giriş silinsin mi?')) return;
        const d = await call(article.id, 'DELETE', null, `?entry=${e.id}`);
        if (d.success) setEntries((x) => x.filter((y) => y.id !== e.id));
    };
    // Canlı anlatım notlarından yapay zekâ ile maç sonu haberi taslağı oluşturur (taslak olarak kaydedilir, yayınlanmaz)
    const summarize = async () => {
        setBusy(true); setMsg(null);
        const d = await fetch('/api/admin/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ task: 'mac-ozeti', articleId: article.id }) }).then((r) => r.json()).catch(() => null);
        if (!d?.success) { setBusy(false); return setMsg({ type: 'error', text: d?.message || 'Özet oluşturulamadı.' }); }
        const esc = (x) => String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;');
        const c = await fetch('/api/admin/articles', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: d.result.title, summary: d.result.summary, content: d.result.paragraphs.map((p) => `<p>${esc(p)}</p>`).join(''), category: article.category, status: 'DRAFT' }),
        }).then((r) => r.json()).catch(() => null);
        setBusy(false);
        if (!c?.success) return setMsg({ type: 'error', text: c?.message || 'Taslak kaydedilemedi.' });
        router.push(`/admin/haberler/${c.article.id}`);
    };

    const pickImage = async (f) => {
        if (!f) return;
        try { setImage((await uploadImage(f, '')).url); } catch (ex) { setMsg({ type: 'error', text: ex.message }); }
    };

    return (
        <>
            <header className="admin-header">
                <div>
                    <Link href={`/admin/haberler/${article.id}`} className="hint" style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}><ArrowLeft size={14} /> Habere dön</Link>
                    <h1>{article.title}</h1>
                    <p>{live ? <span className="badge danger">● Canlı</span> : <span className="badge">Canlı değil</span>} · {entries.length} giriş{article.status !== 'PUBLISHED' && ' · haber henüz yayında değil'}</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    {article.status === 'PUBLISHED' && <a href={`/haber/${article.slug}`} target="_blank" rel="noreferrer" className="admin-btn"><ExternalLink size={15} /> Sayfayı aç</a>}
                    {entries.length >= 3 && <button type="button" className="admin-btn" onClick={summarize} disabled={busy} title="Canlı anlatım notlarından maç sonu haberi taslağı"><Sparkles size={15} /> Maç özeti taslağı</button>}
                    <button type="button" className={`admin-btn ${live ? 'danger' : 'primary'}`} onClick={toggleLive}>{live ? <><Square size={15} /> Anlatımı bitir</> : <><Radio size={15} /> Canlı anlatımı başlat</>}</button>
                </div>
            </header>
            {msg && <div className={`admin-msg ${msg.type}`} role="status">{msg.text}</div>}

            <div className="admin-panel live-composer">
                <textarea className="admin-textarea" rows={4} value={text} autoFocus maxLength={2000} placeholder="Gelişmeyi yazın… (Ctrl/⌘ + Enter ile gönder)" aria-label="Canlı anlatım girişi"
                    onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); post(); } }} />
                {image && (
                    <div className="live-composer-img">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={image} alt="" />
                        <button type="button" className="admin-icon-btn" onClick={() => setImage('')} aria-label="Görseli kaldır"><X size={14} /></button>
                    </div>
                )}
                <div className="live-composer-bar">
                    <div className="admin-tabs" role="radiogroup" aria-label="Giriş türü">
                        {Object.entries(KINDS).map(([k, v]) => <button key={k} type="button" role="radio" aria-checked={kind === k} className={`admin-tab ${kind === k ? 'active' : ''}`} onClick={() => setKind(k)}>{v}</button>)}
                    </div>
                    <label className="admin-btn" style={{ cursor: 'pointer' }}><ImagePlus size={15} /> Görsel<input type="file" accept="image/*" hidden onChange={(e) => { pickImage(e.target.files?.[0]); e.target.value = ''; }} /></label>
                    {canPush && <label className="admin-check"><input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} /> Bildirim gönder</label>}
                    <span style={{ flex: 1 }} />
                    <span className="hint">{text.length}/2000</span>
                    <button type="button" className="admin-btn primary" onClick={post} disabled={busy || text.trim().length < 2}><Send size={15} /> Yayınla</button>
                </div>
            </div>

            <ol className="live-admin-list">
                {entries.map((e) => (
                    <li key={e.id} className={e.pinned ? 'is-pinned' : ''}>
                        <time>{hm(e.createdAt)}</time>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            {e.kind !== 'normal' && <span className="badge warn" style={{ marginBottom: 6 }}>{KINDS[e.kind]}</span>}
                            {edit?.id === e.id
                                ? <textarea className="admin-textarea" rows={3} value={edit.text} onChange={(x) => setEdit({ ...edit, text: x.target.value })} aria-label="Girişi düzenle" />
                                : <p style={{ margin: 0, whiteSpace: 'pre-line' }}>{e.text}</p>}
                        </div>
                        <div className="admin-actions">
                            {edit?.id === e.id
                                ? <><button type="button" className="admin-btn primary" onClick={() => patch(e, { text: edit.text })}>Kaydet</button><button type="button" className="admin-btn" onClick={() => setEdit(null)}>Vazgeç</button></>
                                : <button type="button" className="admin-btn" onClick={() => setEdit({ id: e.id, text: e.text })}>Düzenle</button>}
                            <button type="button" className="admin-icon-btn" onClick={() => patch(e, { pinned: !e.pinned })} aria-label={e.pinned ? 'Sabitlemeyi kaldır' : 'En üste sabitle'} title={e.pinned ? 'Sabitlemeyi kaldır' : 'En üste sabitle'}>{e.pinned ? <PinOff size={15} /> : <Pin size={15} />}</button>
                            <button type="button" className="admin-icon-btn danger" onClick={() => remove(e)} aria-label="Sil"><Trash2 size={15} /></button>
                        </div>
                    </li>
                ))}
            </ol>
        </>
    );
}
