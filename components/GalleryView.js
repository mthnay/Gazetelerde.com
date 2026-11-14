"use client";
import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react';
import SmartImage from '@/components/SmartImage';

/**
 * Foto galeri: kaydırma (dokunmatik), ok tuşları, küçük resimler, tam ekran.
 * Her fotoğrafın adresi #f-3 gibi paylaşılabilir.
 */
export default function GalleryView({ items, title }) {
    const [i, setI] = useState(0);
    const [full, setFull] = useState(false);
    const touch = useRef(null);
    const thumbs = useRef(null);
    const n = items.length;

    const go = useCallback((k) => {
        const next = (k + n) % n;
        setI(next);
        history.replaceState(null, '', `#f-${next + 1}`);
    }, [n]);

    useEffect(() => {
        const m = location.hash.match(/^#f-(\d+)$/);
        // eslint-disable-next-line react-hooks/set-state-in-effect -- adres çubuğundaki fotoğraf numarası yalnızca istemcide okunur
        if (m) setI(Math.min(n - 1, Math.max(0, Number(m[1]) - 1)));
    }, [n]);

    useEffect(() => {
        const onKey = (e) => {
            if (e.target.closest?.('input, textarea')) return;
            if (e.key === 'ArrowRight') go(i + 1);
            else if (e.key === 'ArrowLeft') go(i - 1);
            else if (e.key === 'Escape') setFull(false);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [i, go]);

    useEffect(() => {
        thumbs.current?.children[i]?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    }, [i]);

    useEffect(() => {
        document.body.style.overflow = full ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [full]);

    const cur = items[i];
    return (
        <section className={`gallery ${full ? 'is-full' : ''}`} aria-roledescription="galeri" aria-label={`${title} — ${n} fotoğraf`}>
            <div className="gallery-stage"
                onTouchStart={(e) => { touch.current = e.touches[0].clientX; }}
                onTouchEnd={(e) => { const dx = e.changedTouches[0].clientX - (touch.current ?? 0); if (Math.abs(dx) > 40) go(i + (dx < 0 ? 1 : -1)); }}>
                {/* Geçerli fotoğraf + komşuları (arka planda yüklenir; geçişte siyah ekran olmaz) */}
                {[i - 1, i, i + 1].filter((k) => k >= 0 && k < n).map((k) => (
                    <div className={`gallery-img ${k === i ? 'is-current' : ''}`} key={`${items[k].src}-${k}`} aria-hidden={k !== i}>
                        <SmartImage src={items[k].src} alt={k === i ? (items[k].caption || `${title} — fotoğraf ${k + 1}`) : ''} sizes={full ? '100vw' : '(max-width: 1180px) 100vw, 1120px'} priority={k === 0} />
                    </div>
                ))}
                <button type="button" className="gallery-nav prev" onClick={() => go(i - 1)} aria-label="Önceki fotoğraf"><ChevronLeft size={26} /></button>
                <button type="button" className="gallery-nav next" onClick={() => go(i + 1)} aria-label="Sonraki fotoğraf"><ChevronRight size={26} /></button>
                <button type="button" className="gallery-full" onClick={() => setFull(!full)} aria-label={full ? 'Tam ekrandan çık' : 'Tam ekran'}>{full ? <X size={18} /> : <Maximize2 size={18} />}</button>
                <span className="gallery-count" aria-live="polite">{i + 1} / {n}</span>
            </div>
            <div className="gallery-caption">
                {cur.caption && <p>{cur.caption}</p>}
                {cur.credit && <span className="image-credit" style={{ textAlign: 'left' }}>Fotoğraf: {cur.credit}</span>}
            </div>
            <div className="gallery-thumbs" ref={thumbs} role="tablist" aria-label="Fotoğraflar">
                {items.map((g, k) => (
                    <button key={g.src + k} type="button" role="tab" aria-selected={k === i} aria-label={`Fotoğraf ${k + 1}`} className={k === i ? 'is-on' : ''} onClick={() => go(k)}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={g.src.startsWith('/media/') ? `${g.src}?w=200` : g.src} alt="" loading="lazy" />
                    </button>
                ))}
            </div>
        </section>
    );
}
