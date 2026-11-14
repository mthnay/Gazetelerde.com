import { prisma } from '@/lib/db';
import { ok, fail, readJson } from '@/lib/api';
import { requireStaff, idParam } from '@/lib/adminApi';
import { canEditArticle } from '@/lib/permissions';
import { revalidateArticle } from '@/lib/revalidate';
import { LIVE_KINDS, toEntry } from '@/lib/live';
import { pushEnabled } from '@/lib/push';

async function load(params, user) {
    const id = await idParam(params);
    const a = id && (await prisma.article.findUnique({ where: { id } }));
    if (!a) return { error: fail('Haber bulunamadı.', 404) };
    if (!canEditArticle(user, a) && !['EDITOR', 'ADMIN'].includes(user.role)) return { error: fail('Bu haberde yetkiniz yok.', 403) };
    return { a };
}

const clean = (b) => {
    const text = String(b.text || '').replace(/\r\n/g, '\n').trim().slice(0, 2000);
    const image = /^(\/media\/[a-z0-9]+|https:\/\/\S+)$/i.test(String(b.image || '')) ? String(b.image) : null;
    return { text, image, kind: LIVE_KINDS[b.kind] ? b.kind : 'normal' };
};

// Yeni giriş: { text, kind, image?, notify? } ; canlı aç/kapat: { live: true|false }
export async function POST(request, { params }) {
    const { user, error } = await requireStaff();
    if (error) return error;
    const { a, error: e2 } = await load(params, user);
    if (e2) return e2;
    const b = (await readJson(request)) || {};

    if (b.live !== undefined) {
        await prisma.article.update({ where: { id: a.id }, data: { live: !!b.live, liveEndedAt: b.live ? null : new Date() } });
        await revalidateArticle(a.id);
        return ok();
    }
    const data = clean(b);
    if (data.text.length < 2) return fail('Metin boş olamaz.');
    const e = await prisma.liveEntry.create({ data: { ...data, articleId: a.id, authorId: user.id } });
    // İsteğe bağlı: önemli gelişmeyi bildirim olarak gönder (yayındaki haberler için)
    if (b.notify && pushEnabled() && a.status === 'PUBLISHED') {
        await prisma.pushMessage.create({
            data: { title: `${data.kind === 'son' ? 'Son durum' : 'Canlı'}: ${a.title}`.slice(0, 120), body: data.text.slice(0, 180), url: `/haber/${a.slug}`, createdById: user.id },
        });
    }
    await revalidateArticle(a.id); // ilk boyamayı da güncel tutar; anlık güncellemeyi istemci yoklaması yapar
    return ok({ entry: toEntry(e) }, 201);
}

// Düzenle / sabitle: { entryId, text?, kind?, pinned? }
export async function PATCH(request, { params }) {
    const { user, error } = await requireStaff();
    if (error) return error;
    const { a, error: e2 } = await load(params, user);
    if (e2) return e2;
    const b = (await readJson(request)) || {};
    const data = {};
    if (b.text !== undefined) { const c = clean(b); if (c.text.length < 2) return fail('Metin boş olamaz.'); data.text = c.text; }
    if (b.kind !== undefined) data.kind = LIVE_KINDS[b.kind] ? b.kind : 'normal';
    if (b.pinned !== undefined) {
        data.pinned = !!b.pinned;
        if (data.pinned) await prisma.liveEntry.updateMany({ where: { articleId: a.id, pinned: true }, data: { pinned: false } }); // tek sabit giriş
    }
    const r = await prisma.liveEntry.updateMany({ where: { id: Number(b.entryId) || 0, articleId: a.id }, data });
    if (!r.count) return fail('Giriş bulunamadı.', 404);
    await revalidateArticle(a.id);
    return ok();
}

export async function DELETE(request, { params }) {
    const { user, error } = await requireStaff();
    if (error) return error;
    const { a, error: e2 } = await load(params, user);
    if (e2) return e2;
    const entryId = Number(new URL(request.url).searchParams.get('entry')) || 0;
    await prisma.liveEntry.deleteMany({ where: { id: entryId, articleId: a.id } });
    await revalidateArticle(a.id);
    return ok();
}
