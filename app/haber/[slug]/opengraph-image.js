import { ImageResponse } from 'next/og';
import { getArticleBySlug } from '@/lib/news';
import { ogFonts, coverDataUrl, titleSize, SERIF, SANS } from '@/lib/ogImage';

// Her haber için markalı paylaşım kartı: kapak görseli + koyu degrade + kategori + başlık + logo.
// X, WhatsApp, Facebook, LinkedIn ve Telegram önizlemelerinde kullanılır.
export const runtime = 'nodejs';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Gazetelerde haber kartı';
export const revalidate = 3600;

export default async function OgImage({ params }) {
    const { slug } = await params;
    const item = await getArticleBySlug(slug);
    const [fonts, cover] = await Promise.all([ogFonts(), coverDataUrl(item?.img)]);
    const title = item?.title || 'Gazetelerde';
    const live = item?.live;

    return new ImageResponse(
        (
            <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', background: '#16130f', fontFamily: SANS }}>
                {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
                {cover && <img src={cover} width={1200} height={630} style={{ position: 'absolute', inset: 0, objectFit: 'cover' }} />}
                <div style={{ position: 'absolute', inset: 0, display: 'flex', background: cover ? 'linear-gradient(180deg, rgba(22,19,15,0.15) 0%, rgba(22,19,15,0.55) 45%, rgba(22,19,15,0.96) 100%)' : 'linear-gradient(135deg, #16130f 0%, #2a241d 100%)' }} />
                <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', width: '100%', padding: '56px 64px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
                        {live && <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#dc2a1d', color: '#fff', fontSize: 24, fontWeight: 700, padding: '6px 16px', borderRadius: 8, letterSpacing: 2 }}><div style={{ width: 12, height: 12, borderRadius: 6, background: '#fff' }} />CANLI</div>}
                        <div style={{ display: 'flex', background: '#ffc21a', color: '#16130f', fontSize: 24, fontWeight: 700, padding: '6px 16px', borderRadius: 8, letterSpacing: 2, textTransform: 'uppercase' }}>
                            {item?.categoryLabel || 'Haber'}
                        </div>
                    </div>
                    <div style={{ display: 'flex', fontFamily: SERIF, fontWeight: 800, fontSize: titleSize(title), lineHeight: 1.08, color: '#fffcf6', letterSpacing: -1.5, maxWidth: 1072 }}>
                        {title.length > 140 ? `${title.slice(0, 137)}…` : title}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 30, paddingTop: 22, borderTop: '2px solid rgba(255,252,246,0.25)' }}>
                        <div style={{ display: 'flex', fontFamily: SERIF, fontWeight: 800, fontSize: 38, color: '#fffcf6' }}>
                            Gazetelerde<span style={{ color: '#ffc21a' }}>.</span>
                        </div>
                        <div style={{ display: 'flex', fontSize: 24, fontWeight: 500, color: 'rgba(255,252,246,0.75)' }}>{item?.author || ''}</div>
                    </div>
                </div>
            </div>
        ),
        { ...size, fonts },
    );
}
