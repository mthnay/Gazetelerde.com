import { prisma } from '@/lib/db';
import { ok, fail, readJson } from '@/lib/api';
import { requireStaff } from '@/lib/adminApi';
import { canPublish } from '@/lib/permissions';
import { pushEnabled } from '@/lib/push';

// Elle bildirim: bir haber seçilir ya da başlık/metin/adres yazılır. Kuyruğa alınır, en geç 1 dk içinde gider.
export async function POST(request) {
    const { user, error } = await requireStaff(canPublish);
    if (error) return error;
    if (!pushEnabled()) return fail('Bildirimler yapılandırılmadı (VAPID anahtarları eksik).', 503);
    const b = (await readJson(request)) || {};
    let { title = '', body = '', url = '/' } = b;
    let articleId = null;
    if (b.articleId) {
        const a = await prisma.article.findFirst({ where: { id: Number(b.articleId), status: 'PUBLISHED' }, select: { id: true, slug: true, title: true, summary: true } });
        if (!a) return fail('Yayında böyle bir haber yok.');
        title = title || a.title; body = body || a.summary; url = `/haber/${a.slug}`;
        if (await prisma.pushMessage.findUnique({ where: { articleId: a.id } })) return fail('Bu haber için zaten bildirim gönderildi.', 409);
        articleId = a.id;
    }
    title = String(title).trim().slice(0, 120); body = String(body).trim().slice(0, 180); url = String(url).trim();
    if (title.length < 5) return fail('Başlık en az 5 karakter olmalı.');
    if (!url.startsWith('/') || url.startsWith('//')) return fail('Adres site içinden olmalı (ör. /haber/...).');
    // Aynı dakika içinde art arda yanlışlıkla gönderimi engelle
    const recent = await prisma.pushMessage.findFirst({ where: { title, createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) } } });
    if (recent) return fail('Aynı başlıklı bildirim son 10 dakikada gönderildi.', 409);
    await prisma.pushMessage.create({ data: { title, body, url, articleId, createdById: user.id } });
    const subs = await prisma.pushSubscription.count();
    return ok({ message: `Bildirim kuyruğa alındı; ${subs} aboneye bir dakika içinde gidecek.` });
}
