// Sosyal paylaşım kartları (1200x630) için ortak yardımcılar. Yalnızca sunucuda (node) çalışır.
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { prisma } from '@/lib/db';

const F = (pkg, file) => path.join(process.cwd(), 'node_modules', '@fontsource', pkg, 'files', file);
let fonts;

// Türkçe karakterler (ğ, ş, ı, İ) latin-ext dosyalarında. Ayrı adlarla yüklenip yazı tipi zincirinde
// yedek olarak verilir (SERIF / SANS); aynı ad kullanılınca satori yanlış dosyaya düşüyor.
export const SERIF = 'Fraunces, FrauncesExt';
export const SANS = 'Inter, InterExt';
export async function ogFonts() {
    fonts ??= Promise.all([
        ['Fraunces', 800, 'fraunces', 'fraunces-latin-800-normal.woff'],
        ['FrauncesExt', 800, 'fraunces', 'fraunces-latin-ext-800-normal.woff'],
        ['Inter', 500, 'inter', 'inter-latin-500-normal.woff'],
        ['InterExt', 500, 'inter', 'inter-latin-ext-500-normal.woff'],
        ['Inter', 700, 'inter', 'inter-latin-700-normal.woff'],
        ['InterExt', 700, 'inter', 'inter-latin-ext-700-normal.woff'],
    ].map(async ([name, weight, pkg, file]) => ({ name, weight, style: 'normal', data: await readFile(F(pkg, file)) })));
    return fonts;
}

// Kapak görselini 1200x630 JPEG veri adresine çevirir (sitenin kendi deposundan; dış istek yok)
export async function coverDataUrl(src) {
    if (!src) return null;
    try {
        let buf;
        if (src.startsWith('/media/')) {
            const m = await prisma.media.findUnique({ where: { id: src.slice(7) }, select: { bytes: true } });
            if (!m) return null;
            buf = Buffer.from(m.bytes);
        } else return null; // dış görseller paylaşım kartına alınmaz (yavaş ve güvenilmez)
        const out = await sharp(buf).resize(1200, 630, { fit: 'cover', position: 'attention' }).jpeg({ quality: 78 }).toBuffer();
        return `data:image/jpeg;base64,${out.toString('base64')}`;
    } catch {
        return null;
    }
}

// Başlık uzunluğuna göre punto
export const titleSize = (t) => (t.length > 110 ? 52 : t.length > 80 ? 60 : t.length > 50 ? 68 : 78);
