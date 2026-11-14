import { NextResponse } from 'next/server';
import { activeAds, PLACEMENTS } from '@/lib/ads';
import { prisma } from '@/lib/db';
import { rateLimit, clientIp } from '@/lib/api';

// Yerleşimin reklamları (önbelleklenebilir; kişiye özel değil)
export async function GET(request) {
    const place = new URL(request.url).searchParams.get('yer');
    if (!PLACEMENTS[place]) return NextResponse.json({ ads: [] });
    const ads = await activeAds(place);
    return NextResponse.json({ ads }, { headers: { 'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=300' } });
}

// Gösterim sayacı: { id }
export async function POST(request) {
    let id = 0;
    try { id = Number(JSON.parse(await request.text()).id) || 0; } catch { /* boş */ }
    if (id && rateLimit(`adv:${clientIp(request)}:${id}`, 1, 30 * 60 * 1000)) {
        await prisma.adSlot.updateMany({ where: { id }, data: { views: { increment: 1 } } });
    }
    return new Response(null, { status: 204 });
}
