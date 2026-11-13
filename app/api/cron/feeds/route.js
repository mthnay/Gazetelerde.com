import { timingSafeEqual } from 'node:crypto';
import { pollAll } from '@/lib/feeds';

export const dynamic = 'force-dynamic';

// Dış zamanlayıcı (cron) için: GET /api/cron/feeds  Başlık: Authorization: Bearer <CRON_SECRET>
// Uygulama içi zamanlayıcı (instrumentation.js) zaten çalışıyor; bu uç isteğe bağlı yedektir.
export async function GET(request) {
    const secret = process.env.CRON_SECRET || '';
    const got = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
    const okKey = secret.length >= 16 && got.length === secret.length && timingSafeEqual(Buffer.from(got), Buffer.from(secret));
    if (!okKey) return Response.json({ success: false }, { status: 401 });
    return Response.json({ success: true, results: await pollAll() });
}
