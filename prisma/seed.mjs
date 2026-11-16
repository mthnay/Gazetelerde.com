// Örnek kategori/haber verisini ve admin kullanıcısını yükler.
// Çalıştırma: npm run db:seed   (tekrar çalıştırmak güvenlidir)
import { readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { slugify } from '../lib/slug.js';
import { hashPassword } from '../lib/password.js';

const prisma = new PrismaClient();
const data = JSON.parse(readFileSync(new URL('./seed-data.json', import.meta.url), 'utf8'));

async function main() {
    for (const c of data.categories) {
        await prisma.category.upsert({ where: { slug: c.slug }, update: c, create: c });
    }
    const cats = Object.fromEntries((await prisma.category.findMany()).map((c) => [c.slug, c.id]));

    // Hazır haber kaynakları kapalı (active: false) eklenir; yönetim panelinden açılır.
    // Var olan kaynağa dokunulmaz (panelde yapılan ayarlar korunur).
    for (const { category, ...f } of data.feedSources || []) {
        await prisma.feedSource.upsert({ where: { url: f.url }, update: {}, create: { ...f, active: false, categoryId: category ? cats[category] ?? null : null } });
    }

    // Gerçek sitede örnek (uydurma) haberler yüklenmesin: SEED_DEMO_ARTICLES=0
    const demo = process.env.SEED_DEMO_ARTICLES !== '0';
    if (!demo) data.articles = [];

    // Örnek tarihleri, en yeni haber 10 dk önce yayınlanmış olacak şekilde bugüne kaydır
    const newest = data.articles.length ? Math.max(...data.articles.map((x) => new Date(x.publishedAt).getTime())) : Date.now();
    const shift = Date.now() - 10 * 60 * 1000 - newest;

    for (const a of data.articles) {
        const { category, ...rest } = a;
        const row = {
            ...rest,
            slug: slugify(a.title),
            status: 'PUBLISHED',
            publishedAt: new Date(new Date(a.publishedAt).getTime() + shift),
            categoryId: cats[category],
        };
        await prisma.article.upsert({ where: { slug: row.slug }, update: row, create: row });
    }

    const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;
    if (email && password) {
        await prisma.user.upsert({
            where: { email },
            update: { role: 'ADMIN' },
            create: { email, name: 'Yönetici', role: 'ADMIN', passwordHash: await hashPassword(password) },
        });
        console.log(`Admin kullanıcısı hazır: ${email}`);
    } else {
        console.log('ADMIN_EMAIL / ADMIN_PASSWORD tanımlı değil, admin oluşturulmadı.');
    }
    console.log(`${data.categories.length} kategori, ${data.articles.length} haber yüklendi.`);
}

main().finally(() => prisma.$disconnect());
