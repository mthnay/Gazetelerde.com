import sharp from 'sharp';
import { prisma } from '@/lib/db';
import { ok, fail, rateLimit } from '@/lib/api';
import { requireStaff } from '@/lib/adminApi';
import { mediaUsage } from '@/lib/mediaUsage';

export const runtime = 'nodejs';

const MAX_BYTES = 12 * 1024 * 1024;
const MAX_WIDTH = 2000;

// Görsel yükleme: WebP'ye çevrilir, döndürme düzeltilir, EXIF (konum vb.) silinir, en fazla 2000 px
export async function POST(request) {
    const { user, error } = await requireStaff();
    if (error) return error;
    if (!rateLimit(`media:${user.id}`, 60, 60 * 60 * 1000)) return fail('Çok fazla yükleme yaptınız, biraz bekleyin.', 429);

    let form;
    try { form = await request.formData(); } catch { return fail('Geçersiz yükleme.'); }
    const file = form.get('file');
    const alt = String(form.get('alt') || '').trim().slice(0, 200);
    if (!file || typeof file === 'string') return fail('Dosya seçilmedi.');
    if (!/^image\/(jpeg|png|webp|gif|avif)$/.test(file.type)) return fail('Yalnızca JPG, PNG, WebP, GIF veya AVIF yüklenebilir.');
    if (file.size > MAX_BYTES) return fail('Görsel en fazla 12 MB olabilir.');

    let out;
    try {
        const input = Buffer.from(await file.arrayBuffer());
        out = await sharp(input, { limitInputPixels: 50_000_000 })
            .rotate()
            .resize({ width: MAX_WIDTH, withoutEnlargement: true })
            .webp({ quality: 82 })
            .toBuffer({ resolveWithObject: true });
    } catch {
        return fail('Görsel işlenemedi; dosya bozuk olabilir.');
    }

    const media = await prisma.media.create({
        data: { mime: 'image/webp', width: out.info.width, height: out.info.height, size: out.info.size, bytes: out.data, alt, uploadedById: user.id },
        select: { id: true, width: true, height: true, size: true, alt: true },
    });
    return ok({ media: { ...media, url: `/media/${media.id}` } }, 201);
}

// Görsel kitaplığı: ?q=alt metinde arama, ?filtre=altsiz|kullanilmayan, ?sayfa=N (48'er)
export async function GET(request) {
    const { error } = await requireStaff();
    if (error) return error;
    const sp = new URL(request.url).searchParams;
    const q = String(sp.get('q') || '').trim().slice(0, 100);
    const filter = sp.get('filtre');
    const page = Math.max(1, Number(sp.get('sayfa')) || 1);
    const where = {
        ...(q ? { alt: { contains: q, mode: 'insensitive' } } : {}),
        ...(filter === 'altsiz' ? { alt: '' } : {}),
    };
    const select = { id: true, width: true, height: true, size: true, alt: true, createdAt: true, uploadedBy: { select: { name: true } } };
    let rows, total;
    if (filter === 'kullanilmayan') {
        // Kullanılmayanlar: veritabanında hesaplanır (en fazla son 500 görsel içinde)
        const recent = await prisma.media.findMany({ where, orderBy: { createdAt: 'desc' }, take: 500, select: { id: true } });
        const usage = await mediaUsage(recent.map((r) => r.id));
        const unused = recent.filter((r) => !usage.get(r.id)).map((r) => r.id);
        total = unused.length;
        rows = await prisma.media.findMany({ where: { id: { in: unused.slice((page - 1) * 48, page * 48) } }, orderBy: { createdAt: 'desc' }, select });
    } else {
        [rows, total] = await Promise.all([
            prisma.media.findMany({ where, orderBy: { createdAt: 'desc' }, take: 48, skip: (page - 1) * 48, select }),
            prisma.media.count({ where }),
        ]);
    }
    const usage = await mediaUsage(rows.map((r) => r.id));
    return ok({
        total, page,
        media: rows.map((m) => ({ ...m, uploadedBy: m.uploadedBy?.name ?? null, uses: usage.get(m.id) ?? 0, url: `/media/${m.id}` })),
    });
}
