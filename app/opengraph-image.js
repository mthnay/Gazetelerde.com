import { ImageResponse } from 'next/og';

// Görseli olmayan sayfalar paylaşıldığında kullanılan varsayılan kart (1200x630)
export const alt = 'Gazetelerde — Geleceğin Haberciliği';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
    return new ImageResponse(
        (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 80, background: 'linear-gradient(135deg, #09090b 0%, #1c1917 100%)', color: '#fff' }}>
                <div style={{ display: 'flex', background: '#fbbf24', color: '#000', fontSize: 64, fontWeight: 900, padding: '8px 28px', borderRadius: 12, alignSelf: 'flex-start' }}>GAZETELERDE</div>
                <div style={{ fontSize: 72, fontWeight: 800, marginTop: 48, lineHeight: 1.1 }}>Geleceğin Haberciliği</div>
                <div style={{ fontSize: 34, color: '#a1a1aa', marginTop: 24 }}>Doğru, tarafsız ve anlık haber akışı</div>
            </div>
        ),
        size,
    );
}
