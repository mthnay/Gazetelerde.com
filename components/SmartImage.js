'use client';
import Image from 'next/image';
import { useCallback, useState } from 'react';

const HOSTS = (process.env.NEXT_PUBLIC_IMAGE_HOSTS || 'images.unsplash.com').split(',').map((h) => h.trim());

function isOptimizable(src) {
    if (/^\/media\/[a-z0-9]+$/.test(src)) return true; // kendi yüklediğimiz görseller
    try {
        const u = new URL(src);
        return u.protocol === 'https:' && HOSTS.includes(u.hostname);
    } catch {
        return false;
    }
}

// İzinli alan adlarındaki görselleri next/image ile (boyutlandırma + AVIF/WebP) sunar,
// diğerlerini lazy-load'lu düz <img> olarak gösterir. Kapsayıcı position:relative olmalı.
export default function SmartImage(props) {
    return <ImageWithRetry key={props.src || ''} {...props} />;
}

function ImageWithRetry({ src, alt, sizes, priority = false, className, style, cover = false }) {
    const [stage, setStage] = useState('initial');
    // İlk HTML'deki görsel, React hata dinleyicisini bağlamadan önce de 404 alabilir.
    const checkLoadedImage = useCallback((img) => {
        if (cover && img?.complete && img.naturalWidth === 0) setStage('unavailable');
    }, [cover]);
    if (!src || stage === 'unavailable') {
        return cover ? <span className="cover-placeholder" aria-hidden="true">G<span>•</span></span> : null;
    }
    const common = { className, style: { objectFit: 'cover', ...style } };
    if (stage === 'initial' && isOptimizable(src)) {
        return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} {...common} onError={() => setStage('original')} />;
    }
    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            ref={checkLoadedImage} src={src} alt={alt} loading={priority ? 'eager' : 'lazy'} decoding="async"
            referrerPolicy="no-referrer" onError={cover ? () => setStage('unavailable') : undefined}
            {...common} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', ...common.style }}
        />
    );
}
