import { NextResponse } from 'next/server';
import { getCurrentUser, isStaff } from '@/lib/auth';
import { parseFeed } from '@/lib/feeds';

// Tek seferlik akış önizleme (İçerik Çek → "Tek seferlik")
export async function POST(request) {
    if (!isStaff(await getCurrentUser())) {
        return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 401 });
    }
    try {
        const { url } = await request.json().catch(() => ({}));
        if (!url) return NextResponse.json({ error: 'URL gerekli' }, { status: 400 });
        const items = await parseFeed(url);
        return NextResponse.json({ success: true, items: items.slice(0, 25).map((i) => ({ ...i, pubDate: i.publishedAt })) });
    } catch (error) {
        const bad = /izin verilmiyor|Geçersiz URL|Yalnızca http/.test(error.message);
        return NextResponse.json({ error: 'Akış okunamadı: ' + error.message, success: false }, { status: bad ? 400 : 500 });
    }
}
