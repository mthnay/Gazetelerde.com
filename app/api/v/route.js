import { prisma } from '@/lib/db';
import { rateLimit, clientIp } from '@/lib/api';
import { isBot, deviceOf, kindOf, istanbulDay } from '@/lib/analytics';
import { THRESHOLDS, BUCKETS, rate, bucketOf } from '@/lib/vitals';

// Gerçek kullanıcı hız ölçümleri (web-vitals). Çerez ve kimlik yok; günlük histogram olarak toplanır.
// Gövde: { p: "/haber/..", m: [{ n: "LCP", v: 1234.5 }, ...] }
export async function POST(request) {
    const ua = request.headers.get('user-agent') || '';
    if (isBot(ua) || !rateLimit(`vit:${clientIp(request)}`, 60, 10 * 60 * 1000)) return new Response(null, { status: 204 });
    let b = {};
    try { b = JSON.parse((await request.text()).slice(0, 4000)); } catch { return new Response(null, { status: 204 }); }
    const path = String(b.p || '');
    if (!path.startsWith('/') || path.startsWith('/admin')) return new Response(null, { status: 204 });
    const day = istanbulDay(), kind = kindOf(path), device = deviceOf(ua);
    for (const { n, v } of (Array.isArray(b.m) ? b.m : []).slice(0, 6)) {
        const value = Number(v);
        if (!THRESHOLDS[n] || !Number.isFinite(value) || value < 0 || value > 120000) continue;
        const r = rate(n, value);
        const idx = bucketOf(n, value) + 1; // Postgres dizileri 1'den başlar
        const init = Array.from({ length: BUCKETS }, (_, i) => (i === idx - 1 ? 1 : 0));
        await prisma.$executeRaw`
            INSERT INTO "VitalDaily" (day, metric, kind, device, good, ni, poor, buckets)
            VALUES (${day}, ${n}, ${kind}, ${device}, ${r === 'good' ? 1 : 0}, ${r === 'ni' ? 1 : 0}, ${r === 'poor' ? 1 : 0}, ${init})
            ON CONFLICT (day, metric, kind, device) DO UPDATE SET
                good = "VitalDaily".good + EXCLUDED.good, ni = "VitalDaily".ni + EXCLUDED.ni, poor = "VitalDaily".poor + EXCLUDED.poor,
                buckets[${idx}] = coalesce("VitalDaily".buckets[${idx}], 0) + 1`;
    }
    return new Response(null, { status: 204 });
}
