"use client";
import { useEffect, useState } from 'react';
import { Sparkles, Check, Wand2, SpellCheck, Tags, Type, FileText } from 'lucide-react';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const ACTIONS = [
    ['basliklar', Type, 'Başlık önerileri', 'Beş başlık, SEO başlığı ve meta açıklama'],
    ['ozet', FileText, 'Özet (spot) yaz', 'Haberin girişine 1-2 cümle'],
    ['etiket', Tags, 'Kategori ve etiket öner', 'Mevcut etiketlerle uyumlu'],
    ['yazim', SpellCheck, 'Yazım denetimi', 'TDK kurallarına göre hatalar'],
    ['taslak', Wand2, 'Özgün taslağa dönüştür', 'Kaynak metni kendi cümlelerimizle yeniden yazar'],
];

/**
 * Stüdyo > Yapay zekâ sekmesi. Öneriler hiçbir zaman kendiliğinden uygulanmaz; editör “Uygula” ile seçer.
 * Yapay zekâ yalnızca haberdeki bilgileri kullanır, yine de yayından önce mutlaka kontrol edin.
 */
export default function AiPanel({ form, update, replaceContent }) {
    const [enabled, setEnabled] = useState(null);
    const [busy, setBusy] = useState(null);
    const [res, setRes] = useState({});
    const [err, setErr] = useState('');

    useEffect(() => {
        fetch('/api/admin/ai').then((r) => r.json()).then((d) => setEnabled(Boolean(d.enabled))).catch(() => setEnabled(false));
    }, []);

    const run = async (task) => {
        setBusy(task); setErr('');
        const d = await fetch('/api/admin/ai', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ task, title: form.title, summary: form.summary, content: form.content, sourceUrl: form.sourceUrl }),
        }).then((r) => r.json()).catch(() => null);
        setBusy(null);
        if (!d?.success) return setErr(d?.message || 'Yanıt alınamadı.');
        setRes((r) => ({ ...r, [task]: d.result }));
    };

    const applyFix = (issue, k) => {
        if (!form.content.includes(issue.original)) return setErr(`“${issue.original}” metinde birebir bulunamadı; elle düzeltin.`);
        replaceContent({ content: form.content.replace(issue.original, issue.suggestion) });
        setRes((r) => ({ ...r, yazim: { issues: r.yazim.issues.filter((_, i) => i !== k) } }));
    };

    if (enabled === null) return <p className="st-hint">Yükleniyor…</p>;
    if (!enabled) return <p className="st-hint">Yapay zekâ yardımcısı kapalı. Açmak için sunucuya <code>ANTHROPIC_API_KEY</code> eklenmesi gerekiyor.</p>;

    const r = res;
    return (
        <div className="ai-panel">
            <p className="st-hint" style={{ marginTop: 0 }}><Sparkles size={13} style={{ verticalAlign: -2 }} /> Öneriler yalnızca bu haberdeki bilgilere dayanır, ama yayından önce mutlaka kontrol edin. Hiçbir öneri siz onaylamadan uygulanmaz.</p>
            <div className="ai-actions">
                {ACTIONS.map(([k, Icon, label, hint]) => (
                    <button key={k} type="button" className="ai-action" onClick={() => run(k)} disabled={!!busy}>
                        <Icon size={16} aria-hidden="true" />
                        <span><strong>{label}</strong><small>{hint}</small></span>
                        {busy === k && <span className="spinner" style={{ width: 14, height: 14 }} />}
                    </button>
                ))}
            </div>
            {err && <div className="admin-msg error" role="alert">{err}</div>}

            {r.basliklar && (
                <div className="ai-result">
                    <strong>Başlık önerileri</strong>
                    {r.basliklar.titles.map((t) => (
                        <div key={t} className="ai-row"><span>{t}</span><button type="button" className="admin-btn" onClick={() => update({ title: t })}><Check size={13} /> Uygula</button></div>
                    ))}
                    <p className="st-hint">SEO başlığı: {r.basliklar.seoTitle}<br />Meta açıklama: {r.basliklar.metaDescription}</p>
                </div>
            )}
            {r.ozet && (
                <div className="ai-result">
                    <strong>Özet</strong>
                    <div className="ai-row"><span>{r.ozet.summary}</span><button type="button" className="admin-btn" onClick={() => update({ summary: r.ozet.summary })}><Check size={13} /> Uygula</button></div>
                </div>
            )}
            {r.etiket && (
                <div className="ai-result">
                    <strong>Kategori ve etiketler</strong>
                    <div className="ai-row"><span>Kategori: {r.etiket.category}</span>{r.etiket.categorySlug && <button type="button" className="admin-btn" onClick={() => update({ category: r.etiket.categorySlug })}><Check size={13} /> Uygula</button>}</div>
                    <div className="ai-row"><span>{r.etiket.tags.map((t) => `#${t}`).join(' ')}</span>
                        <button type="button" className="admin-btn" onClick={() => update({ tags: [...new Set([...(form.tags || []), ...r.etiket.tags])].slice(0, 10) })}><Check size={13} /> Ekle</button></div>
                </div>
            )}
            {r.yazim && (
                <div className="ai-result">
                    <strong>Yazım denetimi</strong>
                    {!r.yazim.issues.length ? <p className="st-hint">Hata bulunmadı. ✓</p> : r.yazim.issues.map((x, k) => (
                        <div key={x.original + k} className="ai-row">
                            <span><del>{x.original}</del> → <ins>{x.suggestion}</ins><small style={{ display: 'block' }}>{x.reason}</small></span>
                            <button type="button" className="admin-btn" onClick={() => applyFix(x, k)}><Check size={13} /> Düzelt</button>
                        </div>
                    ))}
                </div>
            )}
            {r.taslak && (
                <div className="ai-result">
                    <strong>Özgün taslak</strong>
                    <p style={{ margin: '4px 0' }}><b>{r.taslak.title}</b></p>
                    <p className="st-hint" style={{ margin: 0 }}>{r.taslak.summary}</p>
                    <p className="st-hint">{r.taslak.paragraphs.length} paragraf</p>
                    <button type="button" className="admin-btn primary" onClick={() => {
                        if (!confirm('Başlık, özet ve metin bu taslakla değiştirilsin mi? (Geçmiş sekmesinden geri alabilirsiniz.)')) return;
                        replaceContent({ title: r.taslak.title, summary: r.taslak.summary, content: r.taslak.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('') });
                    }}><Check size={13} /> Taslağı uygula</button>
                </div>
            )}
        </div>
    );
}
