"use client";
import { useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import Placeholder from '@tiptap/extension-placeholder';
import {
    Bold, Italic, Strikethrough, Heading2, Heading3, Pilcrow, List, ListOrdered, Quote, Minus,
    Link2, Link2Off, ImagePlus, Youtube as YoutubeIcon, Undo2, Redo2,
} from 'lucide-react';
import { uploadImage } from './uploadImage';

function Btn({ on, active, disabled, label, children }) {
    return (
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={on} disabled={disabled}
            className={`re-btn ${active ? 'is-active' : ''}`} title={label} aria-label={label} aria-pressed={active}>
            {children}
        </button>
    );
}

/**
 * Zengin metin editörü (Tiptap). Çıktı HTML'dir; sunucuda ayrıca temizlenir.
 * `content` yalnızca ilk açılışta okunur — dışarıdan içerik değiştirmek için bileşene yeni bir `key` verin.
 */
export default function RichEditor({ content, onChange, placeholder = 'Haberi yazmaya başlayın…' }) {
    const fileRef = useRef(null);
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState('');

    const editor = useEditor({
        immediatelyRender: false,
        shouldRerenderOnTransaction: true,
        extensions: [
            StarterKit.configure({
                heading: { levels: [2, 3] },
                code: false,
                codeBlock: false,
                link: { openOnClick: false, autolink: true, defaultProtocol: 'https' },
            }),
            Image.configure({ inline: false }),
            Youtube.configure({ nocookie: true, controls: true, width: 640, height: 360 }),
            Placeholder.configure({ placeholder }),
        ],
        content,
        editorProps: { attributes: { class: 'article-body re-content', 'aria-label': 'Haber metni', spellcheck: 'true', lang: 'tr' } },
        onUpdate: ({ editor: ed }) => onChange?.(ed.getHTML()),
    });

    if (!editor) return <div className="re"><div className="re-content skeleton" style={{ minHeight: 360 }} /></div>;

    const setLink = () => {
        const prev = editor.getAttributes('link').href || '';
        const url = window.prompt('Bağlantı adresi (boş bırakırsanız kaldırılır):', prev);
        if (url === null) return;
        if (!url.trim()) return editor.chain().focus().extendMarkRange('link').unsetLink().run();
        const href = /^(https?:|mailto:)/i.test(url.trim()) ? url.trim() : `https://${url.trim()}`;
        editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
    };

    const addVideo = () => {
        const url = window.prompt('YouTube video bağlantısı:');
        if (!url) return;
        const ok = editor.commands.setYoutubeVideo({ src: url.trim() });
        if (!ok) setErr('Geçerli bir YouTube bağlantısı girin.');
    };

    const onFile = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        const alt = window.prompt('Görsel açıklaması (görme engelli okurlar ve arama motorları için):', '') ?? '';
        setBusy(true); setErr('');
        try {
            const m = await uploadImage(file, alt);
            editor.chain().focus().setImage({ src: m.url, alt }).run();
        } catch (ex) {
            setErr(ex.message);
        } finally {
            setBusy(false);
        }
    };

    const words = editor.getText().split(/\s+/).filter(Boolean).length;
    const is = (n, a) => editor.isActive(n, a);

    return (
        <div className="re">
            <div className="re-toolbar" role="toolbar" aria-label="Biçimlendirme">
                <Btn label="Paragraf" on={() => editor.chain().focus().setParagraph().run()} active={is('paragraph')}><Pilcrow size={16} /></Btn>
                <Btn label="Ara başlık" on={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={is('heading', { level: 2 })}><Heading2 size={16} /></Btn>
                <Btn label="Küçük başlık" on={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={is('heading', { level: 3 })}><Heading3 size={16} /></Btn>
                <span className="re-sep" />
                <Btn label="Kalın (Ctrl+B)" on={() => editor.chain().focus().toggleBold().run()} active={is('bold')}><Bold size={16} /></Btn>
                <Btn label="İtalik (Ctrl+I)" on={() => editor.chain().focus().toggleItalic().run()} active={is('italic')}><Italic size={16} /></Btn>
                <Btn label="Üstü çizili" on={() => editor.chain().focus().toggleStrike().run()} active={is('strike')}><Strikethrough size={16} /></Btn>
                <Btn label="Bağlantı ekle" on={setLink} active={is('link')}><Link2 size={16} /></Btn>
                {is('link') && <Btn label="Bağlantıyı kaldır" on={() => editor.chain().focus().unsetLink().run()}><Link2Off size={16} /></Btn>}
                <span className="re-sep" />
                <Btn label="Madde listesi" on={() => editor.chain().focus().toggleBulletList().run()} active={is('bulletList')}><List size={16} /></Btn>
                <Btn label="Numaralı liste" on={() => editor.chain().focus().toggleOrderedList().run()} active={is('orderedList')}><ListOrdered size={16} /></Btn>
                <Btn label="Alıntı" on={() => editor.chain().focus().toggleBlockquote().run()} active={is('blockquote')}><Quote size={16} /></Btn>
                <Btn label="Ayraç çizgisi" on={() => editor.chain().focus().setHorizontalRule().run()}><Minus size={16} /></Btn>
                <span className="re-sep" />
                <Btn label="Görsel ekle" on={() => fileRef.current?.click()} disabled={busy}>{busy ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <ImagePlus size={16} />}</Btn>
                <Btn label="YouTube videosu ekle" on={addVideo}><YoutubeIcon size={16} /></Btn>
                <span className="re-sep" />
                <Btn label="Geri al (Ctrl+Z)" on={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}><Undo2 size={16} /></Btn>
                <Btn label="İleri al (Ctrl+Shift+Z)" on={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}><Redo2 size={16} /></Btn>
                <span className="re-count">{words} kelime · ~{Math.max(1, Math.round(words / 200))} dk</span>
            </div>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
            {err && <div className="admin-msg error" style={{ margin: 12 }}>{err}</div>}
            <EditorContent editor={editor} />
        </div>
    );
}
