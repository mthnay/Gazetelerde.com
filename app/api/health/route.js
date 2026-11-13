import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Sağlık kontrolü: yük dengeleyici / uptime servisleri / Docker HEALTHCHECK için.
// 200 = uygulama ve veritabanı çalışıyor, 503 = veritabanına ulaşılamıyor.
export async function GET() {
    const started = Date.now();
    try {
        await prisma.$queryRaw`SELECT 1`;
        return Response.json({ status: 'ok', db: 'ok', latencyMs: Date.now() - started }, { headers: { 'Cache-Control': 'no-store' } });
    } catch (e) {
        console.error('[health] veritabanı hatası', e?.message);
        return Response.json({ status: 'error', db: 'unreachable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
    }
}
