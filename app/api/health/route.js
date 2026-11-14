import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Sağlık kontrolü: uptime servisleri / Docker HEALTHCHECK / Cockpit için.
// 200 = uygulama ve veritabanı çalışıyor, 503 = veritabanına ulaşılamıyor.
// ?detay=1 arka plan işlerinin durumunu da verir (kişisel/gizli bilgi içermez).
export async function GET(request) {
    const started = Date.now();
    const headers = { 'Cache-Control': 'no-store' };
    try {
        await prisma.$queryRaw`SELECT 1`;
    } catch (e) {
        console.error('[health] veritabanı hatası', e?.message);
        return Response.json({ status: 'error', db: 'unreachable' }, { status: 503, headers });
    }
    const body = { status: 'ok', db: 'ok', latencyMs: Date.now() - started, uptimeSec: Math.round(process.uptime()) };
    if (new URL(request.url).searchParams.get('detay')) {
        const jobs = globalThis.__jobs || {};
        body.memoryMb = Math.round(process.memoryUsage().rss / 1048576);
        body.jobs = Object.fromEntries(Object.entries(jobs).map(([k, j]) => [k, { ok: j.ok, at: j.at }]));
        // Son çalışmasında hata veren bir iş varsa "degraded" (uptime servisi anahtar kelimeyle izleyebilir)
        body.status = Object.values(jobs).some((j) => !j.ok) ? 'degraded' : 'ok';
    }
    return Response.json(body, { headers });
}
