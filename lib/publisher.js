// Otomatik yayın: dış kaynaktan (RSS/HTML akışı ya da POST /api/ingest/articles) gelen haberi
// siteye ekler. Kategoriyi bulur, isteğe göre yapay zekâyla özgünleştirir, yayımlar ya da onaya düşürür.
import 'server-only';
import { prisma } from '@/lib/db';
import { slugify } from '@/lib/slug';
import { toArticleHtml, sanitizeArticleHtml } from '@/lib/html';
import { syncArticleTags } from '@/lib/tags';
import { queueArticlePush } from '@/lib/push';
import { categorySlugsForText, isVolleyball, looksBreaking } from '@/lib/classify';

const esc = (x) => String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const STATUS = { DRAFT: 'DRAFT', REVIEW: 'REVIEW', PUBLISH: 'PUBLISHED', PUBLISHED: 'PUBLISHED' };
export const AUTO_AUTHOR = process.env.AUTO_AUTHOR_NAME || 'Gazetelerde Spor';

// Slug listesinden var olan ilk kategori; hiçbiri yoksa ilk kategori
export async function resolveCategory(slugs) {
    const found = await prisma.category.findMany({ where: { slug: { in: slugs } }, select: { id: true, slug: true } });
    return slugs.map((x) => found.find((c) => c.slug === x)).find(Boolean)
        || prisma.category.findFirst({ orderBy: { sortOrder: 'asc' }, select: { id: true, slug: true } });
}

async function freeSlug(title, suffix) {
    const base = slugify(title).slice(0, 90) || `haber-${suffix}`;
    for (const s of [base, `${base}-${suffix}`, `${base}-${Date.now().toString(36)}`]) {
        if (!(await prisma.article.findUnique({ where: { slug: s }, select: { id: true } }))) return s;
    }
    return `${base}-${Math.random().toString(36).slice(2, 8)}`;
}

async function afterPublish(articleId, push = true) {
    try {
        const { revalidateArticle } = await import('@/lib/revalidate');
        await revalidateArticle(articleId);
    } catch { /* zamanlayıcıdan çağrıldığında istek bağlamı yok; sayfalar en geç 60 sn'de yenilenir */ }
    if (push) await queueArticlePush(articleId).catch(() => null);
}

async function notifyEditors(article) {
    const editors = await prisma.user.findMany({ where: { role: { in: ['EDITOR', 'ADMIN'] } }, select: { id: true } });
    if (!editors.length) return;
    await prisma.userNotification.createMany({
        data: editors.map((e) => ({ userId: e.id, type: 'onay', text: `Akıştan gelen haber onay bekliyor: “${article.title.slice(0, 70)}”`, url: `/admin/haberler/${article.id}` })),
    });
}

/**
 * Haberi oluşturur ya da (externalId aynıysa) günceller.
 * input: { title, summary, content (HTML ya da düz metin) | paragraphs[], image, imageCredit,
 *          category (slug), sport, fallbackCategory, breaking, status ('DRAFT'|'REVIEW'|'PUBLISH'),
 *          sourceName, sourceUrl, externalId, tags[], publishedAt, reviewNote, push (false = bildirim gönderme) }
 */
export async function upsertExternalArticle(input) {
    const title = String(input.title || '').trim().slice(0, 200);
    if (title.length < 5) throw new Error('Başlık çok kısa.');
    const summary = String(input.summary || '').trim().slice(0, 500);
    const content = Array.isArray(input.paragraphs)
        ? input.paragraphs.map((p) => `<p>${esc(String(p).trim())}</p>`).join('')
        : toArticleHtml(input.content || '');
    const text = `${title} ${summary} ${content.replace(/<[^>]+>/g, ' ').slice(0, 3000)}`;

    const slugs = input.category ? [String(input.category)] : [];
    slugs.push(...categorySlugsForText(text, { sport: input.sport || (isVolleyball(text) ? 'voleybol' : 'spor'), fallback: input.fallbackCategory || null }));
    const category = await resolveCategory([...new Set(slugs)]);
    if (!category) throw new Error('Sitede hiç kategori yok.');

    const status = STATUS[String(input.status || 'REVIEW').toUpperCase()] || 'REVIEW';
    const breaking = Boolean(input.breaking ?? looksBreaking(`${title} ${summary}`));
    const published = input.publishedAt ? new Date(input.publishedAt) : null;
    const publishedAt = status === 'PUBLISHED'
        ? (published && !Number.isNaN(published.getTime()) && published < new Date() ? published : new Date())
        : null;
    const sourceLine = input.sourceUrl
        ? `<p><em>Kaynak: <a href="${esc(input.sourceUrl)}" rel="nofollow noopener" target="_blank">${esc(input.sourceName || new URL(input.sourceUrl).hostname)}</a></em></p>`
        : '';
    const data = {
        title, summary: summary || title,
        content: sanitizeArticleHtml((content || `<p>${esc(summary || title)}</p>`) + sourceLine),
        image: input.image ? String(input.image).slice(0, 1000) : null,
        imageCredit: input.imageCredit ? String(input.imageCredit).slice(0, 200) : (input.image && input.sourceName ? input.sourceName : null),
        status, breaking, categoryId: category.id,
        authorName: AUTO_AUTHOR,
        sourceUrl: input.sourceUrl ? String(input.sourceUrl).slice(0, 1000) : null,
        sourceName: input.sourceName ? String(input.sourceName).slice(0, 120) : null,
        reviewNote: input.reviewNote || (status === 'PUBLISHED' ? null : 'Otomatik akıştan geldi. Bilgileri kaynakla karşılaştırıp yayımlayın.'),
    };

    const externalId = input.externalId ? String(input.externalId).slice(0, 300) : null;
    const existing = externalId ? await prisma.article.findUnique({ where: { externalId }, select: { id: true, status: true } }) : null;
    let article;
    if (existing) {
        // Elle yayımlanmış/arşivlenmiş haberin durumuna dokunma; yalnızca içeriği tazele
        const keep = ['PUBLISHED', 'ARCHIVED'].includes(existing.status);
        article = await prisma.article.update({
            where: { id: existing.id },
            data: { ...data, status: keep ? existing.status : status, ...(keep ? {} : { publishedAt }) },
            select: { id: true, slug: true, title: true, status: true },
        });
    } else {
        article = await prisma.article.create({
            data: { ...data, publishedAt, externalId, slug: await freeSlug(title, externalId ? slugify(externalId).slice(-8) : Date.now().toString(36)) },
            select: { id: true, slug: true, title: true, status: true },
        });
        await prisma.articleRevision.create({ data: { kind: 'SAVE', articleId: article.id, title: data.title, summary: data.summary, content: data.content, image: data.image } });
        if (article.status === 'REVIEW') await notifyEditors(article);
    }
    const tags = Array.isArray(input.tags) ? input.tags : [];
    if (isVolleyball(text) && !tags.some((t) => /^voleybol$/i.test(t))) tags.unshift('Voleybol');
    if (tags.length) await syncArticleTags(article.id, tags.slice(0, 10));
    if (article.status === 'PUBLISHED') await afterPublish(article.id, input.push !== false);
    return { ...article, created: !existing, category: category.slug };
}
