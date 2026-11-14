import { prisma } from '@/lib/db';
import { rateLimit, clientIp } from '@/lib/api';
import { isBot, deviceOf, kindOf, sourceOf, istanbulDay } from '@/lib/analytics';

// Sayfa görüntüleme sayacı (navigator.sendBeacon). Çerez yok, IP saklanmaz: yalnızca gün/tür/kaynak/cihaz toplamları.
export async function POST(request) {
    const ua = request.headers.get('user-agent') || '';
    if (isBot(ua)) return new Response(null, { status: 204 });
    let b = {};
    try { b = JSON.parse(await request.text()); } catch { /* boş */ }
    const path = String(b.p || '').slice(0, 300);
    if (!path.startsWith('/') || path.startsWith('/admin') || path.startsWith('/api')) return new Response(null, { status: 204 });
    // Aynı IP'den aynı sayfa 30 dakikada bir kez sayılır (IP yalnızca bellekte, kısa süreli)
    if (!rateLimit(`pv:${clientIp(request)}:${path}`, 1, 30 * 60 * 1000)) return new Response(null, { status: 204 });

    const key = {
        day: istanbulDay(), kind: kindOf(path), device: deviceOf(ua),
        source: sourceOf({ referrer: String(b.r || ''), utm: String(b.u || ''), host: new URL(request.url).hostname }),
    };
    await prisma.$executeRaw`
        INSERT INTO "PageDailyStat" (day, kind, source, device, views) VALUES (${key.day}, ${key.kind}, ${key.source}, ${key.device}, 1)
        ON CONFLICT (day, kind, source, device) DO UPDATE SET views = "PageDailyStat".views + 1`;
    return new Response(null, { status: 204 });
}
