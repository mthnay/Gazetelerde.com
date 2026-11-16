import { SITE_NAME, SITE_DESCRIPTION } from '@/lib/site';

// Uygulama bildirimi: "Ana ekrana ekle" ile Gazetelerde tam ekran bir uygulama gibi açılır.
// iPhone'da bildirimler yalnızca ana ekrana eklenmiş sitede çalışır.
export default function manifest() {
    return {
        name: `${SITE_NAME} — Voleybol haberleri`,
        short_name: SITE_NAME,
        description: SITE_DESCRIPTION,
        lang: 'tr',
        dir: 'ltr',
        start_url: '/?utm_source=uygulama',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait-primary',
        background_color: '#f4efe6',
        theme_color: '#16130f',
        categories: ['news', 'sports'],
        icons: [
            { src: '/icon', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: '/uygulama-ikonu/maskable', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
            { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
        ],
        shortcuts: [
            { name: 'Son dakika', url: '/?utm_source=uygulama-kisayol', description: 'En yeni voleybol ve spor haberleri' },
            { name: 'Maç Merkezi', url: '/mac-merkezi?utm_source=uygulama-kisayol', description: 'Canlı skorlar ve puan durumu' },
            { name: 'Kaydettiklerim', url: '/profile?sekme=bookmarks', description: 'Sonra okumak için kaydettiğiniz haberler' },
        ],
    };
}
