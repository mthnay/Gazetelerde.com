"use client";
import { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { NodeSelection } from '@tiptap/pm/state';
import StarterKit from '@tiptap/starter-kit';
import Youtube from '@tiptap/extension-youtube';
import Placeholder from '@tiptap/extension-placeholder';
import {
    Bold, Italic, Strikethrough, Heading2, Heading3, Pilcrow, List, ListOrdered, Quote,
    Link2, Link2Off, Undo2, Redo2, GripVertical,
} from 'lucide-react';
import { Figure, Gallery, GalleryImage, Columns, Column, Callout, ScoreBox } from './blocks';
import { uploadImage } from '../uploadImage';

function Btn({ on, active, disabled, label, children }) {
    return (
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={on} disabled={disabled}
            className={`re-btn ${active ? 'is-active' : ''}`} title={label} aria-label={label} aria-pressed={active}>
            {children}
        </button>
    );
}

// Seçimin içinde bulunduğu blokları üstten alta: [{ name, attrs }]
function describeSelection(editor) {
    const { selection } = editor.state;
    const chain = [];
    if (selection instanceof NodeSelection) chain.push({ name: selection.node.type.name, attrs: selection.node.attrs });
    const $from = selection.$from;
    for (let d = $from.depth; d > 0; d--) {
        const n = $from.node(d);
        chain.push({ name: n.type.name, attrs: n.attrs });
    }
    return chain;
}

/**
 * Stüdyonun düzenleme alanı. Editör örneğini `onReady` ile üst bileşene verir;
 * blok ekleme / taşıma / ayar panelleri bu örnek üzerinden çalışır.
 */
export default function StudioEditor({ content, onChange, onReady, onSelectionChange, onError }) {
    const wrapRef = useRef(null);
    const [handle, setHandle] = useState(null); // { top, pos }

    const insertFiles = async (view, files, pos) => {
        const images = [...files].filter((f) => f.type.startsWith('image/'));
        for (const file of images) {
            try {
                const m = await uploadImage(file, '');
                const node = view.state.schema.nodes.figure.create({ src: m.url, alt: '', align: 'center' });
                const at = pos ?? view.state.selection.to;
                view.dispatch(view.state.tr.insert(Math.min(at, view.state.doc.content.size), node));
            } catch (e) {
                onError?.(e.message);
            }
        }
        return images.length > 0;
    };

    const editor = useEditor({
        immediatelyRender: false,
        shouldRerenderOnTransaction: true,
        extensions: [
            StarterKit.configure({
                heading: { levels: [2, 3] },
                code: false,
                codeBlock: false,
                link: { openOnClick: false, autolink: true, defaultProtocol: 'https' },
                dropcursor: { color: '#ffc21a', width: 3 },
            }),
            Figure, Gallery, GalleryImage, Columns, Column, Callout, ScoreBox,
            Youtube.configure({ nocookie: true, controls: true, width: 640, height: 360 }),
            Placeholder.configure({
                placeholder: ({ node }) => (node.type.name === 'figure' ? 'Görsel altyazısı (isteğe bağlı)' : 'Yazmaya başlayın ya da soldan bir blok ekleyin…'),
                includeChildren: true,
            }),
        ],
        content,
        editorProps: {
            attributes: { class: 'article-body studio-content', 'aria-label': 'Haber metni', spellcheck: 'true', lang: 'tr' },
            // Bilgisayardan sürüklenen görseller bırakıldığı yere yüklenir
            handleDrop: (view, event, _slice, moved) => {
                if (moved || !event.dataTransfer?.files?.length) return false;
                const coords = view.posAtCoords({ left: event.clientX, top: event.clientY });
                const $p = coords ? view.state.doc.resolve(coords.pos) : null;
                const at = $p ? ($p.depth > 0 ? $p.after(1) : coords.pos) : undefined;
                if (![...event.dataTransfer.files].some((f) => f.type.startsWith('image/'))) return false;
                event.preventDefault();
                insertFiles(view, event.dataTransfer.files, at);
                return true;
            },
            // Panodan yapıştırılan görseller de yüklenir
            handlePaste: (view, event) => {
                const files = event.clipboardData?.files;
                if (!files?.length || ![...files].some((f) => f.type.startsWith('image/'))) return false;
                event.preventDefault();
                insertFiles(view, files);
                return true;
            },
        },
        onUpdate: ({ editor: ed }) => onChange?.(ed.getHTML()),
        onSelectionUpdate: ({ editor: ed }) => onSelectionChange?.(describeSelection(ed)),
        onCreate: ({ editor: ed }) => { onReady?.(ed); onSelectionChange?.(describeSelection(ed)); },
    });

    useEffect(() => () => onReady?.(null), [onReady]);

    // --- Sürükleme tutamağı: imlecin üzerindeki en üst düzey bloğun solunda belirir
    const onMouseMove = (e) => {
        if (!editor) return;
        const root = editor.view.dom;
        let el = e.target;
        while (el && el.parentElement !== root) {
            if (el === root || !el.parentElement) { el = null; break; }
            el = el.parentElement;
        }
        if (!el || el.nodeType !== 1) return;
        let pos;
        try { pos = editor.view.posAtDOM(el, 0); } catch { return; }
        const $p = editor.state.doc.resolve(pos);
        const blockPos = $p.depth > 0 ? $p.before(1) : pos;
        const wrapRect = wrapRef.current.getBoundingClientRect();
        const r = el.getBoundingClientRect();
        setHandle({ top: r.top - wrapRect.top + Math.min(8, r.height / 2 - 12), pos: blockPos, el });
    };

    const selectBlock = () => {
        if (!handle) return;
        const node = editor.state.doc.nodeAt(handle.pos);
        if (!node) return;
        editor.view.dispatch(editor.state.tr.setSelection(NodeSelection.create(editor.state.doc, handle.pos)));
        editor.view.focus();
    };

    const onDragStart = (e) => {
        if (!handle) return;
        const { view } = editor;
        const node = view.state.doc.nodeAt(handle.pos);
        if (!node) return;
        const sel = NodeSelection.create(view.state.doc, handle.pos);
        view.dispatch(view.state.tr.setSelection(sel));
        // ProseMirror'ın kendi taşıma mekanizması: bırakınca blok yerinden alınıp yeni yere konur.
        // view bir React durumu değil, ProseMirror nesnesidir; bu atama onun belgelenmiş sürükleme arayüzüdür.
        // eslint-disable-next-line react-hooks/immutability
        view.dragging = { slice: sel.content(), move: true };
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', node.textContent.slice(0, 100));
        if (handle.el) e.dataTransfer.setDragImage(handle.el, 0, 0);
    };

    if (!editor) return <div className="studio-content skeleton" style={{ minHeight: 420 }} />;

    const setLink = () => {
        const prev = editor.getAttributes('link').href || '';
        const url = window.prompt('Bağlantı adresi (boş bırakırsanız kaldırılır):', prev);
        if (url === null) return;
        if (!url.trim()) return editor.chain().focus().extendMarkRange('link').unsetLink().run();
        const href = /^(https?:|mailto:)/i.test(url.trim()) ? url.trim() : `https://${url.trim()}`;
        editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
    };
    const is = (n, a) => editor.isActive(n, a);
    const words = editor.getText().split(/\s+/).filter(Boolean).length;

    return (
        <div className="studio-editor">
            <div className="studio-format re-toolbar" role="toolbar" aria-label="Biçimlendirme">
                <Btn label="Paragraf" on={() => editor.chain().focus().setParagraph().run()} active={is('paragraph') && !is('heading')}><Pilcrow size={16} /></Btn>
                <Btn label="Ara başlık" on={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={is('heading', { level: 2 })}><Heading2 size={16} /></Btn>
                <Btn label="Küçük başlık" on={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={is('heading', { level: 3 })}><Heading3 size={16} /></Btn>
                <span className="re-sep" />
                <Btn label="Kalın (Ctrl+B)" on={() => editor.chain().focus().toggleBold().run()} active={is('bold')}><Bold size={16} /></Btn>
                <Btn label="İtalik (Ctrl+I)" on={() => editor.chain().focus().toggleItalic().run()} active={is('italic')}><Italic size={16} /></Btn>
                <Btn label="Üstü çizili" on={() => editor.chain().focus().toggleStrike().run()} active={is('strike')}><Strikethrough size={16} /></Btn>
                <Btn label="Bağlantı" on={setLink} active={is('link')}><Link2 size={16} /></Btn>
                {is('link') && <Btn label="Bağlantıyı kaldır" on={() => editor.chain().focus().unsetLink().run()}><Link2Off size={16} /></Btn>}
                <span className="re-sep" />
                <Btn label="Madde listesi" on={() => editor.chain().focus().toggleBulletList().run()} active={is('bulletList')}><List size={16} /></Btn>
                <Btn label="Numaralı liste" on={() => editor.chain().focus().toggleOrderedList().run()} active={is('orderedList')}><ListOrdered size={16} /></Btn>
                <Btn label="Alıntı" on={() => editor.chain().focus().toggleBlockquote().run()} active={is('blockquote')}><Quote size={16} /></Btn>
                <span className="re-sep" />
                <Btn label="Geri al (Ctrl+Z)" on={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}><Undo2 size={16} /></Btn>
                <Btn label="İleri al (Ctrl+Shift+Z)" on={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}><Redo2 size={16} /></Btn>
                <span className="re-count">{words} kelime · ~{Math.max(1, Math.round(words / 200))} dk</span>
            </div>

            <div ref={wrapRef} className="studio-blocks" onMouseMove={onMouseMove} onMouseLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setHandle(null); }}>
                {handle && (
                    <button
                        type="button"
                        className="drag-handle"
                        style={{ top: handle.top }}
                        draggable
                        onDragStart={onDragStart}
                        onDragEnd={() => setHandle(null)}
                        onClick={selectBlock}
                        title="Sürükleyerek taşı · tıklayarak seç"
                        aria-label="Bloğu taşı ya da seç"
                    >
                        <GripVertical size={16} />
                    </button>
                )}
                <EditorContent editor={editor} />
            </div>
        </div>
    );
}
