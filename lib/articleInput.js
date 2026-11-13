import 'server-only';
import { prisma } from '@/lib/db';
import { slugify } from '@/lib/slug';
import { canPublish } from '@/lib/permissions';

const STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];

// Formdan gelen veriyi doğrular; { data } ya da { error } döner
export async function parseArticleInput(body, user, existing = null) {
    const title = String(body?.title || '').trim();
    const summary = String(body?.summary || '').trim();
    const content = String(body?.content || '').replace(/\r\n/g, '\n').trim();
    const image = String(body?.image || '').trim();
    const categorySlug = String(body?.category || '');
    let status = STATUSES.includes(body?.status) ? body.status : 'DRAFT';

    if (title.length < 5 || title.length > 200) return { error: 'Başlık 5-200 karakter olmalı.' };
    if (summary.length < 10 || summary.length > 500) return { error: 'Özet 10-500 karakter olmalı.' };
    if (content.length < 20) return { error: 'Haber metni çok kısa.' };
    if (image && !/^https?:\/\/\S+$/i.test(image)) return { error: 'Görsel adresi http(s) ile başlamalı.' };

    const category = await prisma.category.findUnique({ where: { slug: categorySlug } });
    if (!category) return { error: 'Geçerli bir kategori seçin.' };

    // Yazarlar yayınlayamaz: yayın isteği taslak olarak kaydedilir
    if (!canPublish(user) && status !== 'DRAFT') status = 'DRAFT';

    let publishedAt = existing?.publishedAt ?? null;
    if (body?.publishedAt) {
        const d = new Date(body.publishedAt);
        if (Number.isNaN(d.getTime())) return { error: 'Yayın tarihi geçersiz.' };
        publishedAt = d;
    }
    if (status === 'PUBLISHED' && !publishedAt) publishedAt = new Date();

    const data = {
        title, summary, content,
        image: image || null,
        status,
        publishedAt,
        featured: canPublish(user) ? !!body?.featured : (existing?.featured ?? false),
        breaking: canPublish(user) ? !!body?.breaking : (existing?.breaking ?? false),
        categoryId: category.id,
        authorName: String(body?.authorName || '').trim().slice(0, 80) || null,
    };
    return { data };
}

// Başlıktan benzersiz slug üret (gerekirse -2, -3 ... ekler)
export async function uniqueSlug(title, ignoreId = null) {
    const base = slugify(title) || 'haber';
    let slug = base;
    for (let i = 2; ; i++) {
        const hit = await prisma.article.findUnique({ where: { slug }, select: { id: true } });
        if (!hit || hit.id === ignoreId) return slug;
        slug = `${base}-${i}`;
    }
}
