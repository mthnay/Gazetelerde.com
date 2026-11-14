import 'server-only';
import { prisma } from '@/lib/db';
import { slugify } from '@/lib/slug';
import { canPublish } from '@/lib/permissions';
import { sanitizeArticleHtml, plainText } from '@/lib/html';
import { normalizeLayout } from '@/lib/layout';

const STATUSES = ['DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED'];

// Formdan gelen veriyi doğrular; { data } ya da { error } döner
export async function parseArticleInput(body, user, existing = null) {
    const title = String(body?.title || '').trim();
    const summary = String(body?.summary || '').trim();
    // Zengin metin: sunucuda temizlenir; düz metin gelirse paragraflara çevrilir
    const raw = String(body?.content || '').replace(/\r\n/g, '\n').trim();
    const content = /<\/?[a-z][^>]*>/i.test(raw) ? sanitizeArticleHtml(raw) : raw;
    const image = String(body?.image || '').trim();
    const categorySlug = String(body?.category || '');
    let status = STATUSES.includes(body?.status) ? body.status : 'DRAFT';

    if (title.length < 5 || title.length > 200) return { error: 'Başlık 5-200 karakter olmalı.' };
    if (summary.length < 10 || summary.length > 500) return { error: 'Özet 10-500 karakter olmalı.' };
    if (plainText(content).length < 20) return { error: 'Haber metni çok kısa.' };
    if (image && !/^(https?:\/\/\S+|\/media\/[a-z0-9]+)$/i.test(image)) return { error: 'Görsel adresi http(s) ile başlamalı ya da yüklenmiş bir görsel olmalı.' };

    const category = await prisma.category.findUnique({ where: { slug: categorySlug } });
    if (!category) return { error: 'Geçerli bir kategori seçin.' };

    // Yazarlar yayınlayamaz: yayın isteği taslak olarak kaydedilir
    // Yazarlar yayınlayamaz: yayın isteği onaya gönderilir
    if (!canPublish(user) && status !== 'DRAFT') status = 'REVIEW';

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
        imageCredit: String(body?.imageCredit ?? existing?.imageCredit ?? '').trim().slice(0, 120) || null,
        status,
        publishedAt,
        featured: canPublish(user) ? !!body?.featured : (existing?.featured ?? false),
        breaking: canPublish(user) ? !!body?.breaking : (existing?.breaking ?? false),
        categoryId: category.id,
        authorName: String(body?.authorName || '').trim().slice(0, 80) || null,
        layout: body?.layout ? normalizeLayout(body.layout) : (existing?.layout ?? undefined),
        // Editörün yazara notu (onaydan geri gönderirken); yalnızca editör yazar
        reviewNote: canPublish(user) && body?.reviewNote !== undefined ? (String(body.reviewNote).trim().slice(0, 1000) || null) : (existing?.reviewNote ?? null),
        sourceUrl: /^https?:\/\/\S+$/.test(String(body?.sourceUrl || '')) ? String(body.sourceUrl).slice(0, 500) : (existing?.sourceUrl ?? null),
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
