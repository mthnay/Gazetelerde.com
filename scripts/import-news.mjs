// İçerik içe aktarma: content/*.json dosyasındaki haberleri veritabanına yükler (slug'a göre günceller/ekler).
//   DATABASE_URL=... node scripts/import-news.mjs content/dosya.json
//   DATABASE_URL=... node scripts/import-news.mjs --localize-images     (mevcut haberlerin dış görsellerini siteye taşır)
//
// Görseller indirilip WebP'ye çevrilir ve sitenin kendi görsel deposuna (Media tablosu, /media/<id>) kaydedilir.
// Böylece sayfalar açılırken dış görsel sunucularına bağımlılık ve oradan kaynaklı gecikme olmaz.
import { readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import sharp from 'sharp';
import { slugify } from '../lib/slug.js';

const prisma = new PrismaClient();
const unsplash = (id) => `https://images.unsplash.com/${id}?q=85&w=2000&auto=format&fit=crop`;
const cache = new Map();

// Dış görseli indirip Media'ya kaydeder; aynı adres bir kez işlenir
async function localize(src, alt, uploadedById) {
    if (!src || src.startsWith('/media/')) return src || null;
    const url = src.startsWith('http') ? src : unsplash(src);
    if (cache.has(url)) return cache.get(url);
    const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
    if (!res.ok) throw new Error(`Görsel indirilemedi (${res.status}): ${url}`);
    const out = await sharp(Buffer.from(await res.arrayBuffer()))
        .rotate().resize({ width: 2000, withoutEnlargement: true }).webp({ quality: 82 })
        .toBuffer({ resolveWithObject: true });
    const m = await prisma.media.create({
        data: { mime: 'image/webp', width: out.info.width, height: out.info.height, size: out.info.size, bytes: out.data, alt: String(alt || '').slice(0, 200), uploadedById },
        select: { id: true },
    });
    const local = `/media/${m.id}`;
    cache.set(url, local);
    return local;
}

async function importFile(file, admin) {
    const data = JSON.parse(readFileSync(file, 'utf8'));
    const categories = Object.fromEntries((await prisma.category.findMany()).map((c) => [c.slug, c.id]));
    const now = Date.now();
    let n = 0;
    for (const a of data.articles) {
        const catSlug = a.category || data.category;
        if (!categories[catSlug]) throw new Error(`Kategori yok: ${catSlug} (${a.title})`);
        const publishedAt = new Date(a.publishedAt);
        if (publishedAt.getTime() > now) console.warn(`Uyarı: "${a.title}" ileri tarihli, o saate kadar görünmeyecek.`);
        const content = Array.isArray(a.content) ? a.content.map((p) => `<p>${p.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`).join('') : a.content;
        const row = {
            title: a.title,
            summary: a.summary,
            content,
            image: await localize(a.image, a.title, admin?.id ?? null),
            imageCredit: a.imageCredit || (a.image && !String(a.image).startsWith('/media/') && (!String(a.image).startsWith('http') || String(a.image).includes('unsplash.com')) ? 'Unsplash' : null),
            status: 'PUBLISHED',
            featured: !!a.featured,
            breaking: !!a.breaking,
            publishedAt,
            categoryId: categories[catSlug],
            authorId: admin?.id ?? null,
            authorName: a.authorName || data.authorName || null,
        };
        const slug = slugify(a.title);
        await prisma.article.upsert({ where: { slug }, update: row, create: { ...row, slug } });
        n++;
        process.stdout.write('.');
    }
    console.log(`\n${n} haber yüklendi (${file}).`);
}

async function localizeExisting(admin) {
    const rows = await prisma.article.findMany({ where: { image: { startsWith: 'http' } }, select: { id: true, title: true, image: true } });
    for (const r of rows) {
        const local = await localize(r.image, r.title, admin?.id ?? null);
        await prisma.article.update({ where: { id: r.id }, data: { image: local } });
        process.stdout.write('.');
    }
    console.log(`\n${rows.length} haberin görseli siteye taşındı.`);
}

try {
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' }, orderBy: { createdAt: 'asc' } });
    const args = process.argv.slice(2);
    if (!args.length) throw new Error('Kullanım: node scripts/import-news.mjs <dosya.json> | --localize-images');
    for (const arg of args) {
        if (arg === '--localize-images') await localizeExisting(admin);
        else await importFile(arg, admin);
    }
} finally {
    await prisma.$disconnect();
}
