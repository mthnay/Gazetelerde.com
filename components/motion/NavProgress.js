"use client";
import { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

// Site içi bir bağlantıya tıklanınca üstte akan çizgi; yeni sayfa gelince tamamlanır
function Bar() {
    const pathname = usePathname();
    const search = useSearchParams();
    const [state, setState] = useState('idle'); // idle | loading | done
    const timer = useRef(null);

    useEffect(() => {
        const onClick = (e) => {
            if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
            const a = e.target.closest?.('a[href]');
            if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
            const url = new URL(a.href, location.href);
            if (url.origin !== location.origin) return;
            if (url.pathname === location.pathname && url.search === location.search) return; // aynı sayfa / çapa
            setState('loading');
        };
        document.addEventListener('click', onClick, true);
        return () => document.removeEventListener('click', onClick, true);
    }, []);

    useEffect(() => {
        // Adres değişti: çizgiyi tamamla
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setState((s) => (s === 'loading' ? 'done' : s));
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setState('idle'), 600);
        return () => clearTimeout(timer.current);
    }, [pathname, search]);

    return <div className={`nav-progress ${state === 'loading' ? 'is-loading' : state === 'done' ? 'is-done' : ''}`} aria-hidden="true" />;
}

export default function NavProgress() {
    return <Suspense fallback={null}><Bar /></Suspense>;
}
