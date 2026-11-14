"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Lock, ExternalLink } from 'lucide-react';

async function api(url, method, body) {
    const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined }).catch(() => null);
    return (await r?.json().catch(() => null)) || { success: false, message: 'Sunucuya ulaşılamadı.' };
}

export default function PollAdmin({ polls, matches }) {
    const router = useRouter();
    const [f, setF] = useState({ question: '', kind: 'anket', options: '', matchId: '', articleSlug: '', closesAt: '', showResults: 'oy-sonrasi' });
    const [msg, setMsg] = useState(null);
    const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

    const create = async (e) => {
        e.preventDefault();
        const d = await api('/api/admin/polls', 'POST', { ...f, closesAt: f.closesAt ? new Date(f.closesAt).toISOString() : '' });
        if (!d.success) return setMsg({ type: 'error', text: d.message });
        setF({ ...f, question: '', options: '', matchId: '' }); setMsg({ type: 'success', text: 'Oluşturuldu.' }); router.refresh();
    };
    const patch = async (p, body) => { const d = await api(`/api/admin/polls/${p.id}`, 'PATCH', body); if (d.success) router.refresh(); else setMsg({ type: 'error', text: d.message }); };

    return (
        <>
            {msg && <div className={`admin-msg ${msg.type}`} role="status">{msg.text}</div>}
            <button type="button" className="admin-btn" style={{ marginBottom: 16 }} onClick={async () => {
                const d = await api('/api/admin/polls/bulk', 'POST', {});
                setMsg(d.success ? { type: 'success', text: `${d.total} yaklaşan maçtan ${d.created} tanesi için tahmin oluşturuldu (tahmin ligi).` } : { type: 'error', text: d.message });
                router.refresh();
            }}>Önümüzdeki 7 günün maçları için tahmin oluştur</button>
            <div className="admin-grid-2">
                <section style={{ display: 'grid', gap: 12, alignContent: 'start' }}>
                    {!polls.length && <div className="admin-panel"><p className="admin-empty">Henüz anket yok.</p></div>}
                    {polls.map((p) => {
                        const total = p.options.reduce((n, o) => n + o.votes, 0);
                        const closed = (p.closesAt && new Date(p.closesAt) <= new Date()) || p.correctId != null;
                        return (
                            <article key={p.id} className="admin-panel">
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                                    <div>
                                        <span className="badge" style={{ marginRight: 6 }}>{p.kind === 'tahmin' ? 'Tahmin' : 'Anket'}</span>
                                        {closed ? <span className="badge">Kapandı</span> : <span className="badge ok">Açık</span>}
                                        <h3 style={{ margin: '8px 0 4px' }}>{p.question}</h3>
                                        <p className="hint" style={{ margin: 0 }}>{total} oy{p.article && <> · <a href={`/haber/${p.article.slug}`} target="_blank" rel="noreferrer">{p.article.title}</a></>}</p>
                                    </div>
                                    <div className="admin-actions">
                                        <a className="admin-icon-btn" href={`/anket/${p.id}`} target="_blank" rel="noreferrer" aria-label="Anket sayfası"><ExternalLink size={14} /></a>
                                        {!closed && <button type="button" className="admin-icon-btn" onClick={() => patch(p, { close: true })} aria-label="Oylamayı kapat" title="Oylamayı kapat"><Lock size={14} /></button>}
                                        <button type="button" className="admin-icon-btn danger" onClick={async () => { if (confirm('Anket ve oyları silinsin mi?')) { await api(`/api/admin/polls/${p.id}`, 'DELETE'); router.refresh(); } }} aria-label="Sil"><Trash2 size={14} /></button>
                                    </div>
                                </div>
                                <ul className="admin-list" style={{ marginTop: 8 }}>
                                    {p.options.map((o) => (
                                        <li key={o.id} className="admin-list-row">
                                            <span style={{ flex: 1 }}>{o.text}{p.correctId === o.id && <b style={{ color: 'var(--a-ok)' }}> ✓ doğru</b>}</span>
                                            <strong>{total ? Math.round((o.votes / total) * 100) : 0}%</strong>
                                            {p.kind === 'tahmin' && p.correctId !== o.id && <button type="button" className="admin-btn" onClick={() => patch(p, { correctId: o.id })}>Doğru</button>}
                                        </li>
                                    ))}
                                </ul>
                            </article>
                        );
                    })}
                </section>

                <form className="admin-panel" onSubmit={create}>
                    <h2 style={{ marginTop: 0 }}>Yeni anket</h2>
                    <div className="admin-tabs" role="radiogroup" aria-label="Tür" style={{ marginBottom: 12 }}>
                        {[['anket', 'Anket'], ['tahmin', 'Maç tahmini']].map(([k, v]) => <button key={k} type="button" role="radio" aria-checked={f.kind === k} className={`admin-tab ${f.kind === k ? 'active' : ''}`} onClick={() => setF({ ...f, kind: k })}>{v}</button>)}
                    </div>
                    <label className="admin-field"><span>Soru</span><input className="admin-input" required value={f.question} onChange={set('question')} placeholder={f.kind === 'tahmin' ? 'Derbiyi kim kazanır?' : 'Sizce …?'} /></label>
                    {f.kind === 'tahmin' ? (
                        <label className="admin-field"><span>Maç (seçenekler maçtan oluşur, maç bitince sonuçlanır)</span>
                            <select className="admin-select" value={f.matchId} onChange={set('matchId')}>
                                <option value="">— Maç seçin ya da seçenekleri elle yazın —</option>
                                {matches.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
                            </select></label>
                    ) : null}
                    {!(f.kind === 'tahmin' && f.matchId) && (
                        <label className="admin-field"><span>Seçenekler (her satıra bir tane, 2-8)</span><textarea className="admin-textarea" rows={4} value={f.options} onChange={set('options')} /></label>
                    )}
                    <label className="admin-field"><span>Bağlı haber adresi (isteğe bağlı, haberin altında görünür)</span><input className="admin-input" value={f.articleSlug} onChange={set('articleSlug')} placeholder="https://…/haber/…" /></label>
                    <label className="admin-field"><span>Kapanış (isteğe bağlı)</span><input className="admin-input" type="datetime-local" value={f.closesAt} onChange={set('closesAt')} /></label>
                    <label className="admin-field"><span>Sonuçlar</span>
                        <select className="admin-select" value={f.showResults} onChange={set('showResults')}>
                            <option value="oy-sonrasi">Oy verince görünsün</option><option value="kapaninca">Anket kapanınca görünsün</option>
                        </select></label>
                    <button className="admin-btn primary"><Plus size={15} /> Oluştur</button>
                </form>
            </div>
        </>
    );
}
