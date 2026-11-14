// Uçtan uca duman testi: çalışan bir sunucuya karşı kritik sayfaları ve akışları dener.
//   node scripts/smoke.mjs http://localhost:3000
// CI'da build sonrası çalışır; canlı siteye karşı da güvenle çalıştırılabilir (yalnızca okur, hiçbir şey yazmaz).
const BASE = (process.argv[2] || 'http://localhost:3000').replace(/\/$/, '');
let failed = 0;

async function check(name, path, test = (r) => r.status === 200, init) {
    try {
        const res = await fetch(BASE + path, { redirect: 'manual', ...init });
        const body = await res.text();
        const pass = await test({ status: res.status, body, headers: res.headers });
        console.log(`${pass ? '✓' : '✗'} ${name} (${res.status})`);
        if (!pass) failed++;
        return body;
    } catch (e) {
        console.log(`✗ ${name}: ${e.message}`);
        failed++;
        return '';
    }
}

const home = await check('Ana sayfa', '/', (r) => r.status === 200 && r.body.includes('Gazetelerde'));
await check('Sağlık', '/api/health', (r) => r.status === 200 && JSON.parse(r.body).status === 'ok');
await check('Sitemap', '/sitemap.xml', (r) => r.status === 200 && r.body.includes('<urlset'));
await check('Haber sitemap', '/news-sitemap.xml', (r) => r.status === 200);
await check('RSS', '/rss.xml', (r) => r.status === 200 && r.body.includes('<rss'));
await check('robots.txt', '/robots.txt', (r) => r.status === 200 && r.body.includes('Sitemap'));
await check('Arama', '/search?q=haber', (r) => r.status === 200);
await check('Olmayan sayfa 404', '/haber/bu-haber-yok-123456', (r) => r.status === 404);
await check('Service worker', '/sw.js', (r) => r.status === 200 && r.body.includes('push'));
await check('Giriş sayfası', '/login');
await check('Gizlilik', '/gizlilik', (r) => r.status === 200 && r.body.includes('KVKK'));

// Ana sayfadaki ilk haber, kategori ve konu bağlantılarını takip et
const first = (re) => home.match(re)?.[1];
const article = first(/href="(\/haber\/[^"#?]+)"/);
const category = first(/href="(\/category\/[^"#?]+)"/);
if (article) await check(`Haber sayfası ${article}`, article, (r) => r.status === 200 && r.body.includes('application/ld+json'));
if (category) await check(`Kategori ${category}`, category);
const topic = first(/href="(\/etiket\/[^"#?]+)"/);
if (topic) await check(`Konu ${topic}`, topic);
await check('Voleybol merkezi', '/voleybol', (r) => r.status === 200 && r.body.includes('Voleybol'));
await check('Oyuncular', '/oyuncular');
await check('Transfer merkezi', '/transfer');
await check('Tahmin ligi', '/tahmin-ligi');
await check('Voleybol rehberi', '/rehber/voleybol-kurallari', (r) => r.status === 200 && r.body.includes('FAQPage'));
await check('Arşiv', '/arsiv', (r) => r.status === 200 && r.body.includes('Arşiv'));
await check('Video', '/video');
await check('Galeri', '/galeri');
await check('Destek', '/destek');
await check('Uygulama bildirimi', '/manifest.webmanifest', (r) => r.status === 200 && JSON.parse(r.body).display === 'standalone');
await check('Çevrimdışı sayfa', '/cevrimdisi');
await check('Reklam API', '/api/ads?yer=haber-ici', (r) => r.status === 200 && Array.isArray(JSON.parse(r.body).ads));
await check('Yapay zekâ API girişsiz 401', '/api/admin/ai', (r) => r.status === 401);
await check('Maç merkezi', '/mac-merkezi', (r) => r.status === 200 && r.body.includes('Maç Merkezi'));
if (article) await check('Paylaşım kartı', `${article}/opengraph-image`, (r) => r.status === 200 && r.headers.get('content-type') === 'image/png');
if (article) await check('Canlı anlatım API', '/api/articles/1/live', (r) => r.status === 200 || r.status === 404);
await check('Daha fazla yükle API', '/api/articles?skip=0&take=2', (r) => r.status === 200 && JSON.parse(r.body).success);

// Güvenlik: yetkisiz erişimler reddedilmeli
await check('Panel girişsiz yönlendirir', '/admin', (r) => r.status === 307 || r.status === 308);
await check('Yönetim API girişsiz 401', '/api/admin/tags', (r) => r.status === 401);
await check('Hatalı giriş reddedilir', '/api/auth/login', (r) => r.status === 401 || r.status === 429, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'yok@example.test', password: 'yanlis-sifre' }),
});

console.log(failed ? `\n${failed} kontrol başarısız.` : '\nTüm kontroller geçti.');
process.exit(failed ? 1 : 0);
