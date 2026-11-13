import sharp from 'sharp';
import { prisma } from '@/lib/db';
import { ok, fail, rateLimit } from '@/lib/api';
import { requireStaff } from '@/lib/adminApi';

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

// Son yüklenenler (görsel kitaplığı)
export async function GET() {
    const { error } = await requireStaff();
    if (error) return error;
    const rows = await prisma.media.findMany({
        orderBy: { createdAt: 'desc' }, take: 48,
        select: { id: true, width: true, height: true, alt: true, createdAt: true },
    });
    return ok({ media: rows.map((m) => ({ ...m, url: `/media/${m.id}` })) });
}
