import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

// Yüklenen görseli sunar. İçerik değişmediği için tarayıcı ve CDN bir yıl önbellekte tutabilir.
export async function GET(_request, { params }) {
    const { id } = await params;
    if (!/^[a-z0-9]{20,40}$/.test(id)) return new Response('Bulunamadı', { status: 404 });
    const m = await prisma.media.findUnique({ where: { id }, select: { bytes: true, mime: true } });
    if (!m) return new Response('Bulunamadı', { status: 404 });
    return new Response(m.bytes, {
        headers: {
            'Content-Type': m.mime,
            'Cache-Control': 'public, max-age=31536000, immutable',
            'X-Content-Type-Options': 'nosniff',
        },
    });
}
