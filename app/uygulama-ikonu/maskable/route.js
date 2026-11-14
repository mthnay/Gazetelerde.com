import { ImageResponse } from 'next/og';

// Android "maskable" simge: harf güvenli alanın (%80) içinde kalır, kenarlar tam dolu
export function GET() {
    return new ImageResponse(
        (<div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ffc21a', color: '#16130f', fontSize: 260, fontWeight: 900 }}>G</div>),
        { width: 512, height: 512, headers: { 'Cache-Control': 'public, max-age=604800' } },
    );
}
