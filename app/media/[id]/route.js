import sharp from 'sharp';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

// Yüklenen görseli sunar. İçerik değişmediği için tarayıcı ve CDN bir yıl önbellekte tutabilir.
export async function GET(request, { params }) {
    const { id } = await params;
    // E-postalar için: ?w=600&f=jpg -> küçültülmüş JPEG (Outlook WebP göstermez)
    const q = new URL(request.url).searchParams;
    const w = Math.min(1600, Math.max(80, Number(q.get('w')) || 0));
    const asJpg = q.get('f') === 'jpg';
    if (!/^[a-z0-9]{20,40}$/.test(id)) return new Response('Bulunamadı', { status: 404 });
    const m = await prisma.media.findUnique({ where: { id }, select: { bytes: true, mime: true } });
    if (!m) return new Response('Bulunamadı', { status: 404 });
    if (asJpg || q.get('w')) {
        let img = sharp(Buffer.from(m.bytes));
        if (q.get('w')) img = img.resize({ width: w, withoutEnlargement: true });
        const out = asJpg ? await img.jpeg({ quality: 80, mozjpeg: true }).toBuffer() : await img.webp({ quality: 80 }).toBuffer();
        return new Response(out, {
            headers: { 'Content-Type': asJpg ? 'image/jpeg' : 'image/webp', 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff' },
        });
    }
    return new Response(m.bytes, {
        headers: {
            'Content-Type': m.mime,
            'Cache-Control': 'public, max-age=31536000, immutable',
            'X-Content-Type-Options': 'nosniff',
        },
    });
}
