import { timingSafeEqual } from 'node:crypto';
import { upsertExternalArticle } from '@/lib/publisher';
import { validatePublicUrl } from '@/lib/safeFetch';

export const dynamic = 'force-dynamic';

// Otomatik yayın akışı girişi (n8n, kendi botunuz vb. buraya bağlanır).
//   POST /api/ingest/articles   Başlık: Authorization: Bearer <INGEST_SECRET>
//   Gövde: tek haber nesnesi ya da { articles: [...] } (en fazla 50)
//   Alanlar: externalId (zorunlu, aynı kimlik tekrar gelirse haber güncellenir), title, summary,
//            content (HTML/düz metin) ya da paragraphs[], image, imageCredit, category (slug, boşsa metinden bulunur),
//            breaking, status ('DRAFT' | 'REVIEW' | 'PUBLISH'; varsayılan INGEST_DEFAULT_STATUS ya da REVIEW),
//            sourceName, sourceUrl, publishedAt, tags[]
function authorized(request) {
    const secret = process.env.INGEST_SECRET || '';
    const got = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
    return secret.length >= 16 && got.length === secret.length && timingSafeEqual(Buffer.from(got), Buffer.from(secret));
}

export async function POST(request) {
    if (!authorized(request)) return Response.json({ success: false, error: 'Yetkisiz' }, { status: 401 });
    const body = await request.json().catch(() => null);
    const list = Array.isArray(body?.articles) ? body.articles : body ? [body] : [];
    if (!list.length || list.length > 50) return Response.json({ success: false, error: '1-50 haber gönderin.' }, { status: 400 });
    const results = [];
    for (const a of list) {
        try {
            if (!a?.externalId) throw new Error('externalId zorunlu.');
            const sourceUrl = a.sourceUrl ? validatePublicUrl(a.sourceUrl).href : null;
            const image = a.image ? validatePublicUrl(a.image).href : null;
            const r = await upsertExternalArticle({ ...a, sourceUrl, image, status: a.status || process.env.INGEST_DEFAULT_STATUS || 'REVIEW' });
            results.push({ externalId: a.externalId, ok: true, id: r.id, slug: r.slug, status: r.status, category: r.category, created: r.created });
        } catch (e) {
            results.push({ externalId: a?.externalId ?? null, ok: false, error: String(e?.message || e).slice(0, 200) });
        }
    }
    const failed = results.filter((r) => !r.ok).length;
    return Response.json({ success: failed === 0, results }, { status: failed === results.length ? 400 : 200 });
}
