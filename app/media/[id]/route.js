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
    // Google yapılandırılmış veri için kırpılmış oranlar: ?ar=16x9 | 4x3 | 1x1
    const AR = { '16x9': 16 / 9, '4x3': 4 / 3, '1x1': 1 };
    const ar = AR[q.get('ar')];
    if (!/^[a-z0-9]{20,40}$/.test(id)) return new Response('Bulunamadı', { status: 404 });
    const m = await prisma.media.findUnique({ where: { id }, select: { bytes: true, mime: true, width: true } });
    if (!m) return new Response('Bulunamadı', { status: 404 });
    if (asJpg || q.get('w') || ar) {
        let img = sharp(Buffer.from(m.bytes));
        if (ar) {
            const width = Math.min(Math.max(80, Number(q.get('w')) || 1200), m.width || 1200);
            img = img.resize({ width, height: Math.round(width / ar), fit: 'cover', position: 'attention' });
        } else if (q.get('w')) img = img.resize({ width: w, withoutEnlargement: true });
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
