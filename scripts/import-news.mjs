// İçerik içe aktarma: content/*.json dosyasındaki haberleri veritabanına yükler (slug'a göre günceller/ekler).
//   DATABASE_URL=... node scripts/import-news.mjs content/spor-2026-11-14.json
import { readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { slugify } from '../lib/slug.js';

const file = process.argv[2];
if (!file) { console.error('Kullanım: node scripts/import-news.mjs <dosya.json>'); process.exit(1); }

const prisma = new PrismaClient();
const data = JSON.parse(readFileSync(file, 'utf8'));
const img = (id) => (id ? (id.startsWith('http') ? id : `https://images.unsplash.com/${id}?q=80&w=1600&auto=format&fit=crop`) : null);

try {
    const category = await prisma.category.findUnique({ where: { slug: data.category } });
    if (!category) throw new Error(`Kategori yok: ${data.category}`);
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' }, orderBy: { createdAt: 'asc' } });
    const now = Date.now();
    let n = 0;
    for (const a of data.articles) {
        const publishedAt = new Date(a.publishedAt);
        if (publishedAt.getTime() > now) console.warn(`Uyarı: "${a.title}" ileri tarihli, o saate kadar görünmeyecek.`);
        const row = {
            title: a.title,
            summary: a.summary,
            content: a.content.join('\n\n'),
            image: img(a.image),
            status: 'PUBLISHED',
            featured: !!a.featured,
            breaking: !!a.breaking,
            publishedAt,
            categoryId: category.id,
            authorId: admin?.id ?? null,
            authorName: a.authorName || data.authorName || null,
        };
        const slug = slugify(a.title);
        await prisma.article.upsert({ where: { slug }, update: row, create: { ...row, slug } });
        n++;
    }
    console.log(`${n} haber yüklendi (${data.category}).`);
} finally {
    await prisma.$disconnect();
}
