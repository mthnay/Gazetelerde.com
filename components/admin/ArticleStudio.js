"use client";
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, Save, Send, ExternalLink, Trash2, History, RotateCcw, Link2, Monitor, Tablet, Smartphone, PanelLeft,
    Type, Heading2, Quote, List, Image as ImageIcon, Images, Youtube, Columns2, Columns3, Minus, Info, Star, AlertTriangle,
    Trophy, ArrowUp, ArrowDown, Copy, LayoutTemplate, Plus, X, AlignCenter, Maximize2, StretchHorizontal, PanelLeftClose, PanelRightClose,
} from 'lucide-react';
import { STATUS_LABELS } from '@/lib/permissions';
import { HERO_OPTIONS, WIDTH_OPTIONS, DEFAULT_LAYOUT, normalizeLayout } from '@/lib/layout';
import StudioEditor from './editor/StudioEditor';
import TagInput from './TagInput';
import CoverImage from './CoverImage';
import { BUILTIN_TEMPLATES } from './editor/templates';
import { moveBlock, duplicateBlock, deleteBlock } from './editor/blocks';
import { uploadImage } from './uploadImage';

const AUTOSAVE_MS = 15000;
const NEW_DRAFT_KEY = 'admin:yeni-haber-taslak';
const KIND = { SAVE: 'Kaydedildi', AUTOSAVE: 'Otomatik', RESTORE: 'Geri yüklendi' };
const BLOCK_NAMES = {
    paragraph: 'Paragraf', heading: 'Başlık', blockquote: 'Alıntı', bulletList: 'Madde listesi', orderedList: 'Numaralı liste',
    figure: 'Görsel', gallery: 'Galeri', galleryImage: 'Galeri görseli', columns: 'Sütunlar', column: 'Sütun', callout: 'Kutu',
    scoreBox: 'Maç skoru', youtube: 'Video', horizontalRule: 'Ayraç',
};
const ALIGNS = [
    { id: 'left', label: 'Sola', icon: PanelLeftClose },
    { id: 'center', label: 'Ortada', icon: AlignCenter },
    { id: 'right', label: 'Sağa', icon: PanelRightClose },
    { id: 'wide', label: 'Geniş', icon: StretchHorizontal },
    { id: 'full', label: 'Tam ekran', icon: Maximize2 },
];
const TONES = [{ id: 'info', label: 'Bilgi' }, { id: 'highlight', label: 'Öne çıkan' }, { id: 'warning', label: 'Uyarı' }];
const DEVICES = [{ id: 'desktop', label: 'Masaüstü', icon: Monitor }, { id: 'tablet', label: 'Tablet', icon: Tablet }, { id: 'mobile', label: 'Mobil', icon: Smartphone }];

const toLocalInput = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};
const time = (d) => new Date(d).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const textToHtml = (t) => String(t || '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean).map((p) => `<p>${esc(p)}</p>`).join('');
const asHtml = (c) => (/<\/?(p|h2|h3|ul|ol|blockquote|figure|div|aside)[\s>]/i.test(c || '') ? c : textToHtml(c));
const isEmptyDoc = (html) => !html || /^(<p><\/p>|\s)*$/.test(html);

function pickFiles(multiple) {
    return new Promise((resolve) => {
        const i = document.createElement('input');
        i.type = 'file'; i.accept = 'image/*'; i.multiple = multiple;
        i.onchange = () => resolve([...(i.files || [])]);
        i.click();
    });
}

function Section({ title, children, right }) {
    return (
        <section className="st-section">
            <div className="st-section-head"><h3>{title}</h3>{right}</div>
            {children}
        </section>
    );
}

export default function ArticleStudio({ article = null, categories, canPublish, initial = {} }) {
    const router = useRouter();
    const isNew = !article;
    const [form, setForm] = useState({
        title: article?.title ?? initial.title ?? '',
        summary: article?.summary ?? initial.summary ?? '',
        content: asHtml(article?.content ?? initial.content ?? ''),
        image: article?.image ?? initial.image ?? '',
        category: article?.category ?? initial.category ?? categories[0]?.slug ?? '',
        status: article?.status ?? 'DRAFT',
        featured: article?.featured ?? false,
        breaking: article?.breaking ?? false,
        authorName: article?.authorName ?? '',
        sourceUrl: article?.sourceUrl ?? initial.sourceUrl ?? '',
        tags: article?.tags ?? initial.tags ?? [],
        publishedAt: toLocalInput(article?.publishedAt),
        layout: normalizeLayout(article?.layout ?? initial.layout ?? DEFAULT_LAYOUT),
    });
    const [editorKey, setEditorKey] = useState(0);
    const [editor, setEditor] = useState(null);
    const [sel, setSel] = useState([]);
    const [leftTab, setLeftTab] = useState('bloklar');
    const [rightTab, setRightTab] = useState('haber');
    const [device, setDevice] = useState('desktop');
    const [panels, setPanels] = useState(true);
    const [fetchUrl, setFetchUrl] = useState(initial.sourceUrl ?? '');
    const [msg, setMsg] = useState(null);
    const [busy, setBusy] = useState(false);
    const [dirty, setDirty] = useState(false);
    const [autoAt, setAutoAt] = useState(null);
    const [restore, setRestore] = useState(null);
    const [revs, setRevs] = useState(null);
    const [saved, setSaved] = useState(null); // kayıtlı şablonlar
    const lastSent = useRef('');
    const saveRef = useRef(null);

    const flash = (type, text) => { setMsg({ type, text }); if (type === 'success') setTimeout(() => setMsg((m) => (m?.text === text ? null : m)), 4000); };
    const update = (patch) => { setForm((f) => ({ ...f, ...patch })); setDirty(true); };
    const set = (k) => (e) => update({ [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
    const setLayout = (patch) => update({ layout: { ...form.layout, ...patch } });
    const snapshot = (f) => JSON.stringify({ t: f.title, s: f.summary, c: f.content, i: f.image });
    const onReady = useCallback((ed) => setEditor(ed), []);

    // Tam ekranda sayfanın kendisi kaymasın
    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = prev; };
    }, []);

    // --- Açılışta kaydedilmemiş taslak var mı?
    useEffect(() => {
        if (isNew) {
            try {
                const d = JSON.parse(localStorage.getItem(NEW_DRAFT_KEY) || 'null');
                // eslint-disable-next-line react-hooks/set-state-in-effect
                if (d && (d.title || !isEmptyDoc(d.content)) && !initial.title) setRestore({ source: 'local', at: d.at, data: d });
            } catch { /* yoksay */ }
            return;
        }
        fetch(`/api/admin/articles/${article.id}/revisions`).then((r) => r.json()).then(async (d) => {
            const latest = d.revisions?.[0];
            if (latest?.kind === 'AUTOSAVE' && new Date(latest.createdAt) > new Date(article.updatedAt)) {
                const full = await fetch(`/api/admin/articles/${article.id}/revisions?rev=${latest.id}`).then((r) => r.json());
                if (full.revision && (full.revision.content !== article.content || full.revision.title !== article.title)) {
                    setRestore({ source: 'server', at: latest.createdAt, data: full.revision });
                }
            }
        }).catch(() => { });
        // yalnızca açılışta
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // --- Otomatik kayıt
    const autosave = useCallback(async () => {
        const snap = snapshot(form);
        if (snap === lastSent.current || (!form.title && isEmptyDoc(form.content))) return;
        lastSent.current = snap;
        if (isNew) {
            try { localStorage.setItem(NEW_DRAFT_KEY, JSON.stringify({ ...form, at: new Date().toISOString() })); setAutoAt(new Date()); } catch { /* yoksay */ }
            return;
        }
        const res = await fetch(`/api/admin/articles/${article.id}/autosave`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: form.title, summary: form.summary, content: form.content, image: form.image }),
        }).catch(() => null);
        const data = await res?.json().catch(() => null);
        if (data?.success) setAutoAt(new Date(data.savedAt));
        else lastSent.current = '';
    }, [form, isNew, article?.id]);

    useEffect(() => {
        if (!dirty) return;
        const t = setTimeout(autosave, isNew ? 4000 : AUTOSAVE_MS);
        return () => clearTimeout(t);
    }, [form, dirty, autosave, isNew]);

    useEffect(() => {
        if (!dirty) return;
        const h = (e) => { e.preventDefault(); e.returnValue = ''; };
        window.addEventListener('beforeunload', h);
        return () => window.removeEventListener('beforeunload', h);
    }, [dirty]);

    // Ctrl/⌘+S ile kaydet
    useEffect(() => {
        const h = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') { e.preventDefault(); saveRef.current?.(); }
        };
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, []);

    const replaceContent = (data) => {
        setForm((f) => ({
            ...f,
            title: data.title ?? f.title,
            summary: data.summary ?? f.summary,
            content: asHtml(data.content ?? f.content),
            image: data.image ?? f.image,
            layout: data.layout ? normalizeLayout(data.layout) : f.layout,
        }));
        setEditorKey((k) => k + 1);
        setDirty(true);
    };

    // --- Kaydet / yayınla
    const save = async (overrideStatus) => {
        setBusy(true); setMsg(null);
        const payload = {
            ...form,
            status: overrideStatus || form.status,
            publishedAt: form.publishedAt ? new Date(form.publishedAt).toISOString() : null,
            feedItemId: initial.feedItemId,
        };
        const res = await fetch(isNew ? '/api/admin/articles' : `/api/admin/articles/${article.id}`, {
            method: isNew ? 'POST' : 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
        }).catch(() => null);
        const data = await res?.json().catch(() => null);
        setBusy(false);
        if (!data?.success) return flash('error', data?.message || 'Kaydedilemedi.');
        if (overrideStatus) setForm((f) => ({ ...f, status: data.article.status }));
        setDirty(false);
        lastSent.current = snapshot(form);
        setRevs(null);
        flash('success', !canPublish && payload.status !== 'DRAFT'
            ? 'Taslak olarak kaydedildi; yayınlanması için editör onayı gerekiyor.'
            : data.article.status === 'PUBLISHED' ? 'Yayında.' : 'Kaydedildi.');
        if (isNew) {
            try { localStorage.removeItem(NEW_DRAFT_KEY); } catch { /* yoksay */ }
            router.replace(`/admin/haberler/${data.article.id}`);
        } else router.refresh();
    };
    useEffect(() => { saveRef.current = () => save(); });

    const remove = async () => {
        if (!confirm('Bu haber kalıcı olarak silinsin mi? Bu işlem geri alınamaz.')) return;
        const res = await fetch(`/api/admin/articles/${article.id}`, { method: 'DELETE' }).catch(() => null);
        const data = await res?.json().catch(() => null);
        if (!data?.success) return flash('error', data?.message || 'Silinemedi.');
        setDirty(false);
        router.push('/admin/haberler');
        router.refresh();
    };

    // --- Linkten doldur
    const fetchFromUrl = async () => {
        if (!fetchUrl.trim()) return;
        setBusy(true); setMsg(null);
        const res = await fetch('/api/scrape', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: fetchUrl.trim() }) }).catch(() => null);
        const data = await res?.json().catch(() => null);
        setBusy(false);
        if (!data?.success) return flash('error', data?.error || 'İçerik çekilemedi.');
        const d = data.data;
        setForm((f) => ({
            ...f,
            title: f.title || d.title,
            summary: f.summary || d.description,
            content: isEmptyDoc(f.content) ? textToHtml(d.content) : f.content,
            image: f.image || d.image,
            sourceUrl: fetchUrl.trim(),
        }));
        setEditorKey((k) => k + 1);
        setDirty(true);
        flash('success', 'İçerik dolduruldu. Yayınlamadan önce metni kendi cümlelerinizle yeniden yazın.');
    };

    // --- Blok ekleme
    const run = (fn) => { if (editor) fn(editor.chain().focus()).run(); };
    const addFigure = async () => {
        const [file] = await pickFiles(false);
        if (!file) return;
        try { const m = await uploadImage(file, ''); run((c) => c.setFigure({ src: m.url, alt: '', align: 'center' })); setRightTab('blok'); }
        catch (e) { flash('error', e.message); }
    };
    const addGallery = async () => {
        const files = await pickFiles(true);
        if (!files.length) return;
        setBusy(true);
        try {
            const imgs = [];
            for (const f of files.slice(0, 24)) imgs.push({ src: (await uploadImage(f, '')).url });
            run((c) => c.setGallery(imgs, imgs.length === 2 || imgs.length === 4 ? 2 : 3));
        } catch (e) { flash('error', e.message); }
        setBusy(false);
    };
    const addVideo = () => {
        const url = window.prompt('YouTube video bağlantısı:');
        if (!url || !editor) return;
        if (!editor.chain().focus().setYoutubeVideo({ src: url.trim() }).run()) flash('error', 'Geçerli bir YouTube bağlantısı girin.');
    };

    const BLOCKS = [
        { group: 'Metin', items: [
            { label: 'Paragraf', icon: Type, on: () => run((c) => c.setParagraph()) },
            { label: 'Ara başlık', icon: Heading2, on: () => run((c) => c.toggleHeading({ level: 2 })) },
            { label: 'Alıntı', icon: Quote, on: () => run((c) => c.toggleBlockquote()) },
            { label: 'Liste', icon: List, on: () => run((c) => c.toggleBulletList()) },
        ] },
        { group: 'Medya', items: [
            { label: 'Görsel', icon: ImageIcon, on: addFigure },
            { label: 'Galeri', icon: Images, on: addGallery },
            { label: 'Video', icon: Youtube, on: addVideo },
        ] },
        { group: 'Düzen', items: [
            { label: '2 sütun', icon: Columns2, on: () => run((c) => c.setColumns(2)) },
            { label: '3 sütun', icon: Columns3, on: () => run((c) => c.setColumns(3)) },
            { label: 'Ayraç', icon: Minus, on: () => run((c) => c.setHorizontalRule()) },
        ] },
        { group: 'Kutular', items: [
            { label: 'Bilgi kutusu', icon: Info, on: () => run((c) => c.setCallout('info')) },
            { label: 'Öne çıkan', icon: Star, on: () => run((c) => c.setCallout('highlight')) },
            { label: 'Uyarı', icon: AlertTriangle, on: () => run((c) => c.setCallout('warning')) },
            { label: 'Maç skoru', icon: Trophy, on: () => run((c) => c.setScoreBox({})) },
        ] },
    ];

    // --- Şablonlar
    const loadSaved = useCallback(async () => {
        const d = await fetch('/api/admin/templates').then((r) => r.json()).catch(() => null);
        setSaved(d?.templates || []);
    }, []);
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (leftTab === 'sablonlar' && saved === null) loadSaved();
    }, [leftTab, saved, loadSaved]);

    const applyTemplate = (t, mode) => {
        if (mode === 'insert') {
            run((c) => c.insertContent(t.html ?? t.content));
            return flash('success', `"${t.name}" imlecin olduğu yere eklendi.`);
        }
        if (!isEmptyDoc(form.content) && !confirm(`"${t.name}" şablonu mevcut metnin yerine geçecek. Devam edilsin mi? (Gerekirse sürüm geçmişinden geri alabilirsiniz.)`)) return;
        replaceContent({ content: t.html ?? t.content, layout: t.layout });
        flash('success', `"${t.name}" şablonu uygulandı; sayfa düzeni de şablona göre ayarlandı.`);
    };

    const saveAsTemplate = async () => {
        const name = window.prompt('Şablon adı:', form.title ? `${form.title.slice(0, 40)} düzeni` : '');
        if (!name) return;
        const description = window.prompt('Kısa açıklama (isteğe bağlı):', '') ?? '';
        const res = await fetch('/api/admin/templates', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, description, content: form.content, layout: form.layout }),
        }).catch(() => null);
        const data = await res?.json().catch(() => null);
        if (!data?.success) return flash('error', data?.message || 'Şablon kaydedilemedi.');
        flash('success', `"${name}" şablonu kaydedildi; tüm ekip kullanabilir.`);
        setLeftTab('sablonlar');
        loadSaved();
    };

    const deleteTemplate = async (t) => {
        if (!confirm(`"${t.name}" şablonu silinsin mi?`)) return;
        const d = await fetch(`/api/admin/templates/${t.id}`, { method: 'DELETE' }).then((r) => r.json()).catch(() => null);
        if (!d?.success) return flash('error', d?.message || 'Silinemedi.');
        loadSaved();
    };

    // --- Sürüm geçmişi
    const loadRevisions = async () => {
        const d = await fetch(`/api/admin/articles/${article.id}/revisions`).then((r) => r.json()).catch(() => null);
        setRevs(d?.revisions || []);
    };
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (rightTab === 'gecmis' && !isNew && revs === null) loadRevisions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rightTab]);
    const restoreRevision = async (id) => {
        const d = await fetch(`/api/admin/articles/${article.id}/revisions?rev=${id}`).then((r) => r.json()).catch(() => null);
        if (!d?.revision) return;
        replaceContent(d.revision);
        flash('success', `${time(d.revision.createdAt)} sürümü yüklendi. Kalıcı olması için kaydedin.`);
    };

    // --- Seçili blok
    const has = (name) => sel.find((s) => s.name === name);
    const figure = has('figure');
    const gallery = has('gallery');
    const callout = has('callout');
    const topName = sel.length ? sel[sel.length - 1].name : null; // en dıştaki blok
    const innerName = sel.length ? sel[0].name : null;
    const addToGallery = async () => {
        const files = await pickFiles(true);
        if (!files.length || !editor) return;
        setBusy(true);
        try {
            const { state, view } = editor;
            const $from = state.selection.$from;
            let depth = $from.depth;
            while (depth > 0 && $from.node(depth).type.name !== 'gallery') depth--;
            if (depth === 0) throw new Error('Önce galerideki bir görseli seçin.');
            let end = $from.end(depth);
            for (const f of files) {
                const m = await uploadImage(f, '');
                const node = view.state.schema.nodes.galleryImage.create({ src: m.url, alt: '' });
                view.dispatch(view.state.tr.insert(end, node));
                end += node.nodeSize;
            }
        } catch (e) { flash('error', e.message); }
        setBusy(false);
    };

    const hero = form.layout.hero;
    const coverVisible = hero !== 'minimal' && form.image;

    return (
        <div className={`studio ${panels ? '' : 'studio--focus'}`}>
            {/* ÜST ÇUBUK */}
            <header className="st-top">
                <div className="st-top-left">
                    <Link href="/admin/haberler" className="admin-icon-btn" title="Haberlere dön" aria-label="Haberlere dön"><ArrowLeft size={16} /></Link>
                    <button type="button" className={`admin-icon-btn ${panels ? '' : 'is-on'}`} onClick={() => setPanels(!panels)} title={panels ? 'Odak modu (panelleri gizle)' : 'Panelleri göster'} aria-label="Panelleri aç/kapat"><PanelLeft size={16} /></button>
                    <span className={`badge ${form.status}`}>{STATUS_LABELS[form.status]}</span>
                    <span className={`save-state ${dirty ? 'dirty' : ''}`}>{dirty ? 'Kaydedilmemiş değişiklik' : 'Kaydedildi'}{autoAt && ` · otomatik ${time(autoAt)}`}</span>
                </div>
                <div className="st-devices" role="group" aria-label="Önizleme boyutu">
                    {DEVICES.map(({ id, label, icon: I }) => (
                        <button key={id} type="button" className={device === id ? 'is-on' : ''} onClick={() => setDevice(id)} title={label} aria-label={label} aria-pressed={device === id}><I size={16} /></button>
                    ))}
                </div>
                <div className="st-top-right">
                    {!isNew && article.status === 'PUBLISHED' && (
                        <Link href={`/haber/${article.slug}`} target="_blank" className="admin-btn"><ExternalLink size={15} /> Sitede gör</Link>
                    )}
                    <button type="button" className="admin-btn" onClick={() => save()} disabled={busy} title="Ctrl/⌘ + S"><Save size={15} /> {busy ? 'Kaydediliyor…' : 'Kaydet'}</button>
                    {canPublish && form.status !== 'PUBLISHED' && (
                        <button type="button" className="admin-btn primary" onClick={() => save('PUBLISHED')} disabled={busy}><Send size={15} /> Yayınla</button>
                    )}
                </div>
            </header>

            {(msg || restore) && (
                <div className="st-messages">
                    {restore && (
                        <div className="admin-msg restore-banner" role="status">
                            <span><strong>Kaydedilmemiş bir taslak bulundu</strong> ({time(restore.at)}).</span>
                            <span style={{ display: 'flex', gap: 8 }}>
                                <button type="button" className="admin-btn primary" onClick={() => { replaceContent(restore.data); setRestore(null); }}><RotateCcw size={14} /> Geri yükle</button>
                                <button type="button" className="admin-btn" onClick={() => { setRestore(null); if (restore.source === 'local') try { localStorage.removeItem(NEW_DRAFT_KEY); } catch { /* yoksay */ } }}>Yok say</button>
                            </span>
                        </div>
                    )}
                    {msg && <div className={`admin-msg ${msg.type}`} role="status">{msg.text}<button type="button" className="st-msg-x" onClick={() => setMsg(null)} aria-label="Kapat"><X size={14} /></button></div>}
                </div>
            )}

            <div className="st-body">
                {/* SOL PANEL: bloklar ve şablonlar */}
                <aside className="st-left" aria-label="Bloklar ve şablonlar">
                    <div className="st-tabs">
                        <button type="button" className={leftTab === 'bloklar' ? 'is-on' : ''} onClick={() => setLeftTab('bloklar')}><Plus size={14} /> Bloklar</button>
                        <button type="button" className={leftTab === 'sablonlar' ? 'is-on' : ''} onClick={() => setLeftTab('sablonlar')}><LayoutTemplate size={14} /> Şablonlar</button>
                    </div>
                    {leftTab === 'bloklar' ? (
                        <div className="st-scroll">
                            <p className="st-hint">Blok imlecin olduğu yere eklenir. Eklenen bloğu solundaki <strong>⠿</strong> tutamağından sürükleyerek istediğiniz yere taşıyabilirsiniz. Görselleri bilgisayarınızdan doğrudan sayfaya da sürükleyebilirsiniz.</p>
                            {BLOCKS.map((g) => (
                                <Section key={g.group} title={g.group}>
                                    <div className="st-blocks">
                                        {g.items.map(({ label, icon: I, on }) => (
                                            <button key={label} type="button" className="st-block" onMouseDown={(e) => e.preventDefault()} onClick={on} disabled={busy || !editor}>
                                                <I size={18} /><span>{label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </Section>
                            ))}
                            {isNew && (
                                <Section title="Linkten doldur">
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <input className="admin-input" type="url" placeholder="https://..." value={fetchUrl} onChange={(e) => setFetchUrl(e.target.value)} aria-label="Kaynak bağlantısı" />
                                        <button type="button" className="admin-icon-btn" onClick={fetchFromUrl} disabled={busy} title="Çek" aria-label="Linkten doldur"><Link2 size={15} /></button>
                                    </div>
                                </Section>
                            )}
                        </div>
                    ) : (
                        <div className="st-scroll">
                            <button type="button" className="admin-btn primary" style={{ width: '100%', justifyContent: 'center', marginBottom: 14 }} onClick={saveAsTemplate} disabled={isEmptyDoc(form.content)}>
                                <Save size={15} /> Bu tasarımı şablon olarak kaydet
                            </button>
                            <Section title="Kaydedilen şablonlar">
                                {saved === null ? <p className="st-hint">Yükleniyor…</p> : saved.length === 0 ? (
                                    <p className="st-hint">Henüz kayıtlı şablon yok. Bir haberi istediğiniz gibi tasarlayıp yukarıdaki düğmeyle şablon yapabilirsiniz.</p>
                                ) : saved.map((t) => (
                                    <div key={t.id} className="st-template">
                                        <strong>{t.name}</strong>
                                        {t.description && <span>{t.description}</span>}
                                        <span className="st-template-by">{t.createdBy}</span>
                                        <div className="st-template-actions">
                                            <button type="button" className="admin-btn primary" onClick={() => applyTemplate(t, 'replace')}>Uygula</button>
                                            <button type="button" className="admin-btn" onMouseDown={(e) => e.preventDefault()} onClick={() => applyTemplate(t, 'insert')}>Ekle</button>
                                            <button type="button" className="admin-icon-btn danger" onClick={() => deleteTemplate(t)} aria-label="Şablonu sil" title="Sil"><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                ))}
                            </Section>
                            <Section title="Hazır şablonlar">
                                {BUILTIN_TEMPLATES.map((t) => (
                                    <div key={t.id} className="st-template">
                                        <strong>{t.name}</strong>
                                        <span>{t.description}</span>
                                        <div className="st-template-actions">
                                            <button type="button" className="admin-btn primary" onClick={() => applyTemplate(t, 'replace')}>Uygula</button>
                                            <button type="button" className="admin-btn" onMouseDown={(e) => e.preventDefault()} onClick={() => applyTemplate(t, 'insert')}>Ekle</button>
                                        </div>
                                    </div>
                                ))}
                            </Section>
                        </div>
                    )}
                </aside>

                {/* ORTA: sayfa, sitede göründüğü gibi */}
                <main className="st-canvas-wrap">
                    <div className={`st-canvas st-canvas--${device} article--${form.layout.width === 'wide' ? 'wide' : 'normal'} ${form.layout.dropcap ? '' : 'article--no-dropcap'}`}>
                        <div className={`st-hero st-hero--${hero} ${coverVisible ? 'has-cover' : ''}`}>
                            {coverVisible && (hero === 'immersive' || hero === 'split') && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img className="st-hero-img" src={form.image} alt="" />
                            )}
                            <div className="st-hero-text">
                                <span className="kicker">{categories.find((c) => c.slug === form.category)?.label || 'Kategori'}</span>
                                <textarea className="st-title" rows={1} value={form.title} onChange={set('title')} placeholder="Başlık" maxLength={200} aria-label="Başlık"
                                    onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = `${e.target.scrollHeight}px`; }} />
                                <textarea className="st-summary" rows={2} value={form.summary} onChange={set('summary')} placeholder="Özet — haberin girişinde ve kartlarda görünür" maxLength={500} aria-label="Özet"
                                    onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = `${e.target.scrollHeight}px`; }} />
                            </div>
                            {coverVisible && hero === 'classic' && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img className="st-hero-img" src={form.image} alt="" />
                            )}
                            {!form.image && hero !== 'minimal' && (
                                <button type="button" className="st-cover-empty" onClick={() => { setRightTab('haber'); setPanels(true); }}>
                                    <ImageIcon size={18} /> Kapak görseli ekleyin (sağ panel)
                                </button>
                            )}
                        </div>
                        <StudioEditor
                            key={editorKey}
                            content={form.content}
                            onChange={(html) => update({ content: html })}
                            onReady={onReady}
                            onSelectionChange={setSel}
                            onError={(m) => flash('error', m)}
                        />
                    </div>
                </main>

                {/* SAĞ PANEL: haber, blok ve geçmiş */}
                <aside className="st-right" aria-label="Ayarlar">
                    <div className="st-tabs">
                        <button type="button" className={rightTab === 'haber' ? 'is-on' : ''} onClick={() => setRightTab('haber')}>Haber</button>
                        <button type="button" className={rightTab === 'blok' ? 'is-on' : ''} onClick={() => setRightTab('blok')}>Blok</button>
                        {!isNew && <button type="button" className={rightTab === 'gecmis' ? 'is-on' : ''} onClick={() => setRightTab('gecmis')}><History size={13} /> Geçmiş</button>}
                    </div>
                    <div className="st-scroll">
                        {rightTab === 'haber' && (
                            <>
                                <Section title="Yayın">
                                    <label className="admin-field"><span>Durum</span>
                                        <select className="admin-select" value={form.status} onChange={set('status')}>
                                            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k} disabled={!canPublish && k !== 'DRAFT'}>{v}</option>)}
                                        </select>
                                    </label>
                                    <label className="admin-field"><span>Yayın tarihi</span>
                                        <input className="admin-input" type="datetime-local" value={form.publishedAt} onChange={set('publishedAt')} />
                                        <span className="hint">Boşsa yayınlandığı an. İleri tarih seçilirse o saatte görünür.</span>
                                    </label>
                                    {canPublish && (
                                        <>
                                            <label className="admin-check"><input type="checkbox" checked={form.featured} onChange={set('featured')} /> Manşette göster</label>
                                            <label className="admin-check" style={{ marginTop: 8 }}><input type="checkbox" checked={form.breaking} onChange={set('breaking')} /> Son dakika şeridi (24 saat)</label>
                                        </>
                                    )}
                                </Section>
                                <Section title="Sayfa düzeni">
                                    <div className="st-choices">
                                        {HERO_OPTIONS.map((o) => (
                                            <button key={o.id} type="button" className={`st-choice ${hero === o.id ? 'is-on' : ''}`} onClick={() => setLayout({ hero: o.id })} title={o.hint}>
                                                <span className={`st-thumb st-thumb--${o.id}`} aria-hidden="true"><i /><b /><b /></span>
                                                {o.label}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="st-seg" role="group" aria-label="Metin genişliği">
                                        {WIDTH_OPTIONS.map((o) => (
                                            <button key={o.id} type="button" className={form.layout.width === o.id ? 'is-on' : ''} onClick={() => setLayout({ width: o.id })}>{o.label} metin</button>
                                        ))}
                                    </div>
                                    <label className="admin-check" style={{ marginTop: 10 }}><input type="checkbox" checked={form.layout.aside} onChange={(e) => setLayout({ aside: e.target.checked })} /> Yanda &quot;Çok okunanlar&quot;</label>
                                    <label className="admin-check" style={{ marginTop: 8 }}><input type="checkbox" checked={form.layout.dropcap} onChange={(e) => setLayout({ dropcap: e.target.checked })} /> Büyük ilk harf</label>
                                </Section>
                                <Section title="Kapak görseli">
                                    <CoverImage value={form.image || ''} onChange={(v) => update({ image: v })} />
                                </Section>
                                <Section title="Bilgiler">
                                    <label className="admin-field"><span>Kategori</span>
                                        <select className="admin-select" value={form.category} onChange={set('category')}>
                                            {categories.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}
                                        </select>
                                    </label>
                                    <label className="admin-field"><span>Görünen yazar adı</span>
                                        <input className="admin-input" value={form.authorName} onChange={set('authorName')} placeholder="Boşsa hesabınızdaki ad" maxLength={80} />
                                    </label>
                                    <div className="admin-field"><span>Etiketler</span>
                                        <TagInput value={form.tags} onChange={(tags) => update({ tags })} />
                                    </div>
                                    <label className="admin-field"><span>Kaynak bağlantısı</span>
                                        <input className="admin-input" type="url" value={form.sourceUrl} onChange={set('sourceUrl')} placeholder="https://" />
                                    </label>
                                </Section>
                                {!isNew && <button type="button" onClick={remove} className="admin-btn danger" style={{ width: '100%', justifyContent: 'center' }}><Trash2 size={15} /> Haberi sil</button>}
                            </>
                        )}

                        {rightTab === 'blok' && (
                            !editor || !sel.length ? <p className="st-hint">Ayarlarını görmek için sayfada bir bloğa tıklayın.</p> : (
                                <>
                                    <Section title={`Seçili: ${BLOCK_NAMES[innerName] || innerName}${topName !== innerName ? ` · ${BLOCK_NAMES[topName] || topName} içinde` : ''}`}>
                                        <div className="st-actions">
                                            <button type="button" className="admin-btn" onClick={() => moveBlock(editor, -1)} title="Yukarı taşı"><ArrowUp size={14} /> Yukarı</button>
                                            <button type="button" className="admin-btn" onClick={() => moveBlock(editor, 1)} title="Aşağı taşı"><ArrowDown size={14} /> Aşağı</button>
                                            <button type="button" className="admin-btn" onClick={() => duplicateBlock(editor)} title="Çoğalt"><Copy size={14} /> Çoğalt</button>
                                            <button type="button" className="admin-btn danger" onClick={() => deleteBlock(editor)} title="Sil"><Trash2 size={14} /> Sil</button>
                                        </div>
                                        {topName !== innerName && <p className="st-hint" style={{ marginTop: 8 }}>Taşıma ve silme, en dıştaki <strong>{BLOCK_NAMES[topName] || topName}</strong> bloğuna uygulanır.</p>}
                                    </Section>

                                    {figure && (
                                        <Section title="Görsel yerleşimi">
                                            <div className="st-aligns">
                                                {ALIGNS.map(({ id, label, icon: I }) => (
                                                    <button key={id} type="button" className={figure.attrs.align === id ? 'is-on' : ''} onClick={() => editor.chain().focus().updateAttributes('figure', { align: id }).run()} title={label}>
                                                        <I size={16} /><span>{label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                            <label className="admin-field" style={{ marginTop: 12 }}><span>Görsel açıklaması (alt metin)</span>
                                                <input className="admin-input" value={figure.attrs.alt || ''} onChange={(e) => editor.commands.updateAttributes('figure', { alt: e.target.value.slice(0, 200) })} placeholder="Görme engelli okurlar ve arama motorları için" />
                                            </label>
                                            <button type="button" className="admin-btn" onClick={async () => {
                                                const [file] = await pickFiles(false);
                                                if (!file) return;
                                                try { const m = await uploadImage(file, ''); editor.chain().focus().updateAttributes('figure', { src: m.url }).run(); } catch (e) { flash('error', e.message); }
                                            }}><ImageIcon size={14} /> Görseli değiştir</button>
                                            <p className="st-hint" style={{ marginTop: 8 }}>Altyazıyı doğrudan görselin altına yazabilirsiniz.</p>
                                        </Section>
                                    )}

                                    {gallery && (
                                        <Section title="Galeri">
                                            <div className="st-seg">
                                                {[2, 3].map((n) => <button key={n} type="button" className={gallery.attrs.cols === n ? 'is-on' : ''} onClick={() => editor.chain().focus().updateAttributes('gallery', { cols: n }).run()}>{n} sütun</button>)}
                                            </div>
                                            <button type="button" className="admin-btn" style={{ marginTop: 10 }} onClick={addToGallery} disabled={busy}><Plus size={14} /> Görsel ekle</button>
                                            <p className="st-hint" style={{ marginTop: 8 }}>Bir görseli kaldırmak için tıklayıp Delete tuşuna basın.</p>
                                        </Section>
                                    )}

                                    {callout && (
                                        <Section title="Kutu tonu">
                                            <div className="st-seg">
                                                {TONES.map((t) => <button key={t.id} type="button" className={callout.attrs.tone === t.id ? 'is-on' : ''} onClick={() => editor.chain().focus().updateAttributes('callout', { tone: t.id }).run()}>{t.label}</button>)}
                                            </div>
                                        </Section>
                                    )}

                                    {has('scoreBox') && <Section title="Maç skoru"><p className="st-hint">Takım adlarını, skoru ve setleri doğrudan kutunun içine yazın.</p></Section>}
                                    {has('youtube') && <Section title="Video"><p className="st-hint">Videoyu değiştirmek için silip yeniden ekleyin. Video tam genişlikte gösterilir; yan yana yerleşim için sütun bloğu kullanın.</p></Section>}
                                    {has('columns') && <Section title="Sütunlar"><p className="st-hint">Her sütuna metin, görsel ya da video ekleyebilirsiniz. Mobilde sütunlar alt alta dizilir.</p></Section>}
                                </>
                            )
                        )}

                        {rightTab === 'gecmis' && !isNew && (
                            revs === null ? <p className="st-hint">Yükleniyor…</p> : revs.length === 0 ? <p className="st-hint">Henüz kayıtlı sürüm yok.</p> : (
                                <div className="rev-list" style={{ maxHeight: 'none' }}>
                                    {revs.map((r) => (
                                        <div key={r.id} className="rev-item">
                                            <span><span className="rev-kind">{KIND[r.kind]}</span><br />{time(r.createdAt)} · {r.user}</span>
                                            <button type="button" className="admin-btn" style={{ padding: '6px 10px' }} onClick={() => restoreRevision(r.id)}>Yükle</button>
                                        </div>
                                    ))}
                                </div>
                            )
                        )}
                    </div>
                </aside>
            </div>
        </div>
    );
}
