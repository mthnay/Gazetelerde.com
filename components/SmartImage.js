import Image from 'next/image';

const HOSTS = (process.env.NEXT_PUBLIC_IMAGE_HOSTS || 'images.unsplash.com').split(',').map((h) => h.trim());

function isOptimizable(src) {
    try {
        const u = new URL(src);
        return u.protocol === 'https:' && HOSTS.includes(u.hostname);
    } catch {
        return false;
    }
}

// İzinli alan adlarındaki görselleri next/image ile (boyutlandırma + AVIF/WebP) sunar,
// diğerlerini lazy-load'lu düz <img> olarak gösterir. Kapsayıcı position:relative olmalı.
export default function SmartImage({ src, alt, sizes, priority = false, className, style }) {
    if (!src) return null;
    const common = { className, style: { objectFit: 'cover', ...style } };
    if (isOptimizable(src)) {
        return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} {...common} />;
    }
    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={src} alt={alt} loading={priority ? 'eager' : 'lazy'} decoding="async"
            {...common} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', ...common.style }}
        />
    );
}
