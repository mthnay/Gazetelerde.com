"use client";
import { useEffect, useRef } from 'react';

// Haber metninde ne kadar ilerlendiğini gösteren üst çubuk (state yok, doğrudan stil: akıcı)
export default function ReadingProgress({ target = '#haber-metni' }) {
    const ref = useRef(null);
    useEffect(() => {
        const el = document.querySelector(target);
        if (!el) return;
        let raf = 0;
        const update = () => {
            const r = el.getBoundingClientRect();
            const total = r.height - window.innerHeight * 0.6;
            const p = Math.min(1, Math.max(0, (window.innerHeight * 0.3 - r.top) / Math.max(1, total)));
            ref.current?.style.setProperty('--p', p.toFixed(4));
        };
        const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(update); };
        update();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); cancelAnimationFrame(raf); };
    }, [target]);
    return <div ref={ref} className="read-progress" aria-hidden="true" />;
}
