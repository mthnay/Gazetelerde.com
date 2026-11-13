"use client";
// Haber stüdyosunun özel blokları (Tiptap düğümleri).
// Ürettikleri HTML lib/html.js'teki izin listesiyle birebir uyumludur; sitede aynı sınıflarla biçimlenir.
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';

export const FIGURE_ALIGNS = ['center', 'wide', 'full', 'left', 'right'];
export const CALLOUT_TONES = ['info', 'highlight', 'warning'];

/* ------------------------------------------------------------------ Görsel (altyazılı) */
export const Figure = Node.create({
    name: 'figure',
    group: 'block',
    content: 'inline*', // altyazı
    draggable: true,
    isolating: true,
    addAttributes() {
        return {
            src: { default: null },
            alt: { default: '' },
            align: { default: 'center' },
        };
    },
    parseHTML() {
        return [
            {
                tag: 'figure',
                contentElement: (el) => el.querySelector('figcaption') || document.createElement('figcaption'),
                getAttrs: (el) => {
                    if (el.classList.contains('gallery-item')) return false;
                    const img = el.querySelector('img');
                    if (!img) return false;
                    const align = el.getAttribute('data-align');
                    return { src: img.getAttribute('src'), alt: img.getAttribute('alt') || '', align: FIGURE_ALIGNS.includes(align) ? align : 'center' };
                },
            },
            // Eski içerikteki yalın görseller de görsel bloğuna dönüşür
            { tag: 'img[src]', getAttrs: (el) => ({ src: el.getAttribute('src'), alt: el.getAttribute('alt') || '' }) },
        ];
    },
    renderHTML({ node }) {
        return ['figure', { 'data-align': node.attrs.align }, ['img', { src: node.attrs.src, alt: node.attrs.alt }], ['figcaption', 0]];
    },
    addCommands() {
        return {
            setFigure: (attrs) => ({ commands }) => commands.insertContent({ type: this.name, attrs }),
        };
    },
});

/* ------------------------------------------------------------------ Galeri */
export const GalleryImage = Node.create({
    name: 'galleryImage',
    atom: true,
    selectable: true,
    addAttributes() { return { src: { default: null }, alt: { default: '' } }; },
    parseHTML() {
        return [{ tag: 'figure.gallery-item', priority: 60, getAttrs: (el) => { const i = el.querySelector('img'); return i ? { src: i.getAttribute('src'), alt: i.getAttribute('alt') || '' } : false; } }];
    },
    renderHTML({ node }) { return ['figure', { class: 'gallery-item' }, ['img', { src: node.attrs.src, alt: node.attrs.alt }]]; },
});

export const Gallery = Node.create({
    name: 'gallery',
    group: 'block',
    content: 'galleryImage+',
    draggable: true,
    addAttributes() {
        return { cols: { default: 3, parseHTML: (el) => (el.classList.contains('gallery-2') ? 2 : 3) } };
    },
    parseHTML() { return [{ tag: 'div.gallery', priority: 60 }]; },
    renderHTML({ node }) { return ['div', { class: `gallery gallery-${node.attrs.cols === 2 ? 2 : 3}` }, 0]; },
    addCommands() {
        return {
            setGallery: (images, cols = 3) => ({ commands }) => commands.insertContent({
                type: this.name, attrs: { cols },
                content: images.map((i) => ({ type: 'galleryImage', attrs: { src: i.src, alt: i.alt || '' } })),
            }),
        };
    },
});

/* ------------------------------------------------------------------ Sütunlar */
export const Column = Node.create({
    name: 'column',
    content: 'block+',
    isolating: true,
    parseHTML() { return [{ tag: 'div.col', priority: 60 }]; },
    renderHTML() { return ['div', { class: 'col' }, 0]; },
});

export const Columns = Node.create({
    name: 'columns',
    group: 'block',
    content: 'column{2,3}',
    draggable: true,
    isolating: true,
    parseHTML() { return [{ tag: 'div.cols', priority: 60 }]; },
    renderHTML({ node }) { return ['div', { class: `cols cols-${node.childCount === 3 ? 3 : 2}` }, 0]; },
    addCommands() {
        return {
            setColumns: (n = 2) => ({ commands }) => commands.insertContent({
                type: this.name,
                content: Array.from({ length: n }, () => ({ type: 'column', content: [{ type: 'paragraph' }] })),
            }),
        };
    },
});

/* ------------------------------------------------------------------ Bilgi kutusu */
export const Callout = Node.create({
    name: 'callout',
    group: 'block',
    content: 'block+',
    draggable: true,
    defining: true,
    addAttributes() {
        return { tone: { default: 'info', parseHTML: (el) => (CALLOUT_TONES.includes(el.getAttribute('data-tone')) ? el.getAttribute('data-tone') : 'info') } };
    },
    parseHTML() { return [{ tag: 'aside.callout', priority: 60 }]; },
    renderHTML({ node }) { return ['aside', { class: 'callout', 'data-tone': node.attrs.tone }, 0]; },
    addCommands() {
        return {
            setCallout: (tone = 'info', text = '') => ({ commands }) => commands.insertContent({
                type: this.name, attrs: { tone },
                content: [{ type: 'paragraph', content: text ? [{ type: 'text', text }] : [] }],
            }),
        };
    },
});

/* ------------------------------------------------------------------ Maç skoru */
const SCORE_ATTRS = ['meta', 'home', 'away', 'homeScore', 'awayScore', 'sets'];
const dataName = (k) => `data-${k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`;

function ScoreView({ node, updateAttributes, selected }) {
    const a = node.attrs;
    const field = (k, props = {}) => (
        <input value={a[k] || ''} onChange={(e) => updateAttributes({ [k]: e.target.value.slice(0, 120) })} {...props} />
    );
    return (
        <NodeViewWrapper className={`score score-edit ${selected ? 'is-selected' : ''}`} data-drag-handle="">
            <div className="score-meta">{field('meta', { placeholder: 'Lig · hafta · salon', 'aria-label': 'Maç bilgisi' })}</div>
            <div className="score-row">
                <span className="score-team">{field('home', { placeholder: 'Ev sahibi', 'aria-label': 'Ev sahibi takım' })}</span>
                <span className="score-num">
                    {field('homeScore', { placeholder: '0', 'aria-label': 'Ev sahibi skoru', inputMode: 'numeric', size: 2 })}
                    <span aria-hidden="true">–</span>
                    {field('awayScore', { placeholder: '0', 'aria-label': 'Konuk skoru', inputMode: 'numeric', size: 2 })}
                </span>
                <span className="score-team">{field('away', { placeholder: 'Konuk', 'aria-label': 'Konuk takım' })}</span>
            </div>
            <div className="score-sets">{field('sets', { placeholder: 'Set skorları: 25-20, 17-25, 25-17, 25-18', 'aria-label': 'Set skorları' })}</div>
        </NodeViewWrapper>
    );
}

export const ScoreBox = Node.create({
    name: 'scoreBox',
    group: 'block',
    atom: true,
    draggable: true,
    selectable: true,
    addAttributes() {
        return Object.fromEntries(SCORE_ATTRS.map((k) => [k, { default: '', parseHTML: (el) => el.getAttribute(dataName(k)) || '' }]));
    },
    parseHTML() { return [{ tag: 'div.score', priority: 60 }]; },
    renderHTML({ node }) {
        const a = node.attrs;
        const data = Object.fromEntries(SCORE_ATTRS.map((k) => [dataName(k), a[k] || '']));
        return ['div', mergeAttributes({ class: 'score' }, data),
            ['div', { class: 'score-meta' }, a.meta || ''],
            ['div', { class: 'score-row' },
                ['span', { class: 'score-team' }, a.home || ''],
                ['span', { class: 'score-num' }, `${a.homeScore || 0} – ${a.awayScore || 0}`],
                ['span', { class: 'score-team' }, a.away || '']],
            ['div', { class: 'score-sets' }, a.sets || ''],
        ];
    },
    addNodeView() { return ReactNodeViewRenderer(ScoreView); },
    addCommands() {
        return { setScoreBox: (attrs = {}) => ({ commands }) => commands.insertContent({ type: this.name, attrs }) };
    },
});

/* ------------------------------------------------------------------ Blok taşıma yardımcıları */
// İmlecin bulunduğu en üst düzey bloğun başlangıç konumu
export function topBlockPos(state) {
    const { $from } = state.selection;
    if (state.selection.node && $from.depth === 0) return $from.pos;
    return $from.depth >= 1 ? $from.before(1) : null;
}

export function moveBlock(editor, dir) {
    const { state, view } = editor;
    const pos = topBlockPos(state);
    if (pos == null) return false;
    const $pos = state.doc.resolve(pos);
    const index = $pos.index(0);
    const node = state.doc.child(index);
    const target = index + dir;
    if (target < 0 || target >= state.doc.childCount) return false;
    const other = state.doc.child(target);
    const tr = state.tr;
    if (dir < 0) {
        const otherPos = pos - other.nodeSize;
        tr.delete(pos, pos + node.nodeSize).insert(otherPos, node);
        tr.setSelection(state.selection.constructor.near(tr.doc.resolve(otherPos + 1)));
    } else {
        tr.delete(pos, pos + node.nodeSize);
        const insertAt = pos + other.nodeSize;
        tr.insert(insertAt, node);
        tr.setSelection(state.selection.constructor.near(tr.doc.resolve(insertAt + 1)));
    }
    view.dispatch(tr.scrollIntoView());
    view.focus();
    return true;
}

export function duplicateBlock(editor) {
    const { state, view } = editor;
    const pos = topBlockPos(state);
    if (pos == null) return false;
    const node = state.doc.nodeAt(pos);
    view.dispatch(state.tr.insert(pos + node.nodeSize, node.copy(node.content)).scrollIntoView());
    return true;
}

export function deleteBlock(editor) {
    const { state, view } = editor;
    const pos = topBlockPos(state);
    if (pos == null) return false;
    const node = state.doc.nodeAt(pos);
    view.dispatch(state.tr.delete(pos, pos + node.nodeSize));
    view.focus();
    return true;
}
