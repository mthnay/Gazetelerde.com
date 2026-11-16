import { prisma } from '@/lib/db';
import { ok, fail, readJson } from '@/lib/api';
import { requireStaff } from '@/lib/adminApi';
import { canPublish } from '@/lib/permissions';
import { validatePublicUrl } from '@/lib/safeFetch';
import { pollSource, processNewItems, feedSettings } from '@/lib/feeds';

// Kaynak ekle (editör / yönetici)
export async function POST(request) {
    const { error } = await requireStaff(canPublish);
    if (error) return error;
    const body = await readJson(request);
    const name = String(body?.name || '').trim().slice(0, 80);
    let url;
    try { url = validatePublicUrl(body?.url).href; } catch (e) { return fail(e.message); }
    if (name.length < 2) return fail('Kaynağa bir ad verin.');
    const category = body?.category ? await prisma.category.findUnique({ where: { slug: String(body.category) } }) : null;
    const exists = await prisma.feedSource.findUnique({ where: { url } });
    if (exists) return fail('Bu akış zaten ekli.', 409);
    const source = await prisma.feedSource.create({ data: { ...feedSettings(body), name, url, categoryId: category?.id ?? null } });
    // Eklerken bir kez oku: adres çalışıyor mu hemen görülsün. Otomatik işleme (yapay zekâ) arka planda.
    const first = await pollSource({ ...source, mode: 'INBOX' });
    if (source.mode !== 'INBOX') processNewItems(source).catch((e) => console.error('[kaynak eklendi]', name, e?.message));
    return ok({ source, poll: first }, 201);
}
