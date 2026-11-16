import { ImageResponse } from 'next/og';
import { ogFonts, SERIF, SANS } from '@/lib/ogImage';

export const runtime = 'nodejs';

// Görseli olmayan sayfalar paylaşıldığında kullanılan varsayılan kart (1200x630)
export const alt = 'Gazetelerde — Voleybol Haberleri ve Canlı Skor';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OgImage() {
    const fonts = await ogFonts();
    return new ImageResponse(
        (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 80, background: 'linear-gradient(135deg, #16130f 0%, #2a241d 100%)', color: '#fffcf6', fontFamily: SANS }}>
                <div style={{ display: 'flex', fontFamily: SERIF, fontWeight: 800, fontSize: 96, letterSpacing: -2 }}>Gazetelerde<span style={{ color: '#ffc21a' }}>.</span></div>
                <div style={{ fontFamily: SERIF, fontSize: 64, fontWeight: 800, marginTop: 40, lineHeight: 1.1 }}>Voleybolun Nabzı</div>
                <div style={{ fontSize: 34, fontWeight: 500, color: 'rgba(255,252,246,0.7)', marginTop: 24 }}>Doğru, tarafsız ve anlık haber akışı</div>
            </div>
        ),
        { ...size, fonts },
    );
}
