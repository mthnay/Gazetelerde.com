# Gazetelerde.com

Next.js 16 (App Router) + PostgreSQL (Prisma) ile yazılmış haber sitesi: üyelik, yorum/beğeni/kaydetme,
kategori takibi ve bildirimler, rol bazlı yönetim paneli, RSS'ten içerik çekme, önbellekli (ISR) sayfalar,
sitemap / Google News sitemap / RSS.

## Gereksinimler

- Node.js 20.9+ (22 önerilir)
- PostgreSQL 14+

## Hızlı başlangıç (geliştirme)

```bash
cp .env.example .env.local     # DATABASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD'ü doldurun
npm install                     # Prisma istemcisini de üretir
npm run db:migrate              # tabloları oluşturur
npm run db:seed                 # örnek kategoriler/haberler + ilk yönetici hesabı
npm run dev                     # http://localhost:3000
```

Yönetim paneli: `http://localhost:3000/admin` (seed'deki `ADMIN_EMAIL` / `ADMIN_PASSWORD` ile giriş).

## Komutlar

| Komut | Ne yapar |
|---|---|
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` / `npm start` | Üretim derlemesi / sunucusu |
| `npm run lint` | ESLint |
| `npm test` | Birim testleri (`tests/`, Node'un yerleşik test aracı) |
| `npm run db:migrate` | Şema değişikliğinden yeni migration üretir ve uygular (geliştirme) |
| `npm run db:deploy` | Bekleyen migration'ları uygular (üretim) |
| `npm run db:seed` | Örnek veri + yönetici hesabı (tekrar çalıştırmak güvenli) |
| `npm run db:studio` | Veritabanını tarayıcıda görüntüler |
| `npm run db:cleanup` | Süresi dolmuş oturumları siler (günde bir cron önerilir) |

## Ortam değişkenleri

Tam liste ve açıklamalar: [`.env.example`](.env.example). En önemlileri:

| Değişken | Açıklama |
|---|---|
| `DATABASE_URL` | PostgreSQL bağlantı adresi |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | `db:seed` ile oluşturulan ilk yönetici |
| `NEXT_PUBLIC_SITE_URL` | Sitenin gerçek adresi — sitemap, canonical ve RSS linkleri buradan üretilir. **Build sırasında koda gömülür.** |
| `NEXT_PUBLIC_IMAGE_HOSTS` | Optimize edilecek görsel alan adları (virgülle) |
| `COMPANY_*`, `CONTACT_*`, `KVKK_EMAIL`, `HOSTING_PROVIDER` | Künye / KVKK / İletişim sayfalarındaki kurum bilgileri |

## Otomatik haber akışı

Site yalnızca voleybol ve spor haberi yayımlar. Haberler iki yoldan otomatik gelir:

1. **Kaynak tarama** (`/admin/icerik-cek` → Kaynaklar): RSS/Atom akışları ya da akışı olmayan siteler
   (ör. TVF, tür: *Web sayfası*, bağlantı kalıbı `/icerik/`) `FEED_POLL_MINUTES` dakikada bir taranır.
   Her kaynak için yeni haberlere ne olacağı seçilir: *Gelen kutusu*, *Taslak*, *Onaya gönder* ya da *Otomatik yayımla*.
   Kategori metinden bulunur (Sultanlar / Efeler / Milli / Avrupa / Transfer / Alt ligler / Plaj, voleybol dışı → Spor, `lib/classify.js`).
   Yapay zekâ anahtarı tanımlıysa metin özgün habere dönüştürülür; değilse otomatik yayında yalnızca kısa özet + kaynak bağlantısı yayımlanır.
   Hazır kaynaklar `db:seed` ile **kapalı** eklenir (TVF, FIVB, Voleybol Plus, AA Spor, TRT Haber Spor).
2. **Dış otomasyon** (n8n, kendi botunuz): `POST /api/ingest/articles`, başlık `Authorization: Bearer $INGEST_SECRET`.
   Gövde tek haber ya da `{ "articles": [...] }`; aynı `externalId` tekrar gelirse haber güncellenir.

```bash
curl -X POST https://gazetelerde.com/api/ingest/articles \
  -H "Authorization: Bearer $INGEST_SECRET" -H "Content-Type: application/json" \
  -d '{"externalId":"tvf-123","title":"Filenin Sultanları kampa giriyor","summary":"…","paragraphs":["…"],
       "sourceName":"TVF","sourceUrl":"https://tvf.org.tr/icerik/…","breaking":false,"status":"REVIEW"}'
```

| Değişken | Açıklama |
|---|---|
| `INGEST_SECRET` | Dış akış anahtarı (en az 16 karakter; boşsa uç kapalı) |
| `INGEST_DEFAULT_STATUS` | Gövdede `status` yoksa: `DRAFT`, `REVIEW` (varsayılan) ya da `PUBLISH` |
| `FEED_POLL_MINUTES` | Kaynak tarama sıklığı (varsayılan 30, 0 = kapalı) |
| `FEED_AUTO_PER_RUN` | Bir taramada kaynak başına en fazla kaç haber işlenir (varsayılan 8) |
| `AUTO_AUTHOR_NAME` | Otomatik haberlerde görünen yazar adı (varsayılan "Gazetelerde Spor") |

## Yayına alma

### Docker (önerilen)

```bash
cp .env.example .env.production          # değerleri doldurun
export POSTGRES_PASSWORD=...             # compose'daki veritabanı için
docker compose up -d --build
docker compose exec app node prisma/seed.mjs   # yalnızca ilk kurulumda
```

- Container açılışta bekleyen migration'ları otomatik uygular (`docker-entrypoint.sh`).
- Kendi PostgreSQL sunucunuzu kullanacaksanız `docker-compose.yml`'den `db` servisini silip `DATABASE_URL`'i
  `.env.production`'a yazın.
- Sağlık kontrolü: `GET /api/health` → `200` (uygulama + veritabanı çalışıyor) / `503`.
- Build sırasında veritabanı gerekmez; ulaşılamazsa önbellekli sayfalar boş üretilir ve container açılırken
  veritabanından doldurulur.

### Docker olmadan

```bash
npm ci && npm run db:deploy && npm run build && npm start
```

### Yayından sonra

1. `https://alanadiniz/sitemap.xml` ve `/news-sitemap.xml`'i Google Search Console'a ekleyin.
2. Google News'te görünmek için Google News Publisher Center'a başvurun.
3. Künye, KVKK ve İletişim sayfalarındaki `[ ... ]` alanlarını ortam değişkenleriyle doldurun; KVKK metnini bir hukukçuya kontrol ettirin.
4. `npm run db:cleanup`'ı günlük cron'a ekleyin.

## Mimari notlar

- **Önbellek:** Ana sayfa, haber ve kategori sayfaları önbellekten sunulur (ISR, 60 sn). Haber yayınlanınca /
  düzenlenince / yorum gelince ilgili sayfalar `lib/revalidate.js` ile anında tazelenir. Bu yüzden herkese açık
  sayfalar sunucuda **kullanıcıya özel veri okumaz**; giriş durumu (`/api/me`), beğeni/kayıt durumu
  (`/api/articles/[id]/me`) tarayıcıda yüklenir. Yeni bir herkese açık sayfa yazarken `getCurrentUser()`
  çağırmayın, aksi halde sayfa her istekte yeniden üretilir.
- **Oturum:** Rastgele token httpOnly çerezde, veritabanında yalnızca SHA-256 özeti (`lib/auth.js`).
  Şifreler scrypt ile hash'lenir (`lib/password.js`).
- **Yetkiler:** `lib/permissions.js` — Yazar (kendi taslakları), Editör (yayın + yorum moderasyonu),
  Yönetici (+ kullanıcı/rol yönetimi). Kontroller API'de yapılır; arayüz sadece gizler.
- **Dış istekler:** Scrape/RSS sadece personele açıktır ve iç ağ adresleri engellenir (`lib/safeFetch.js`).
- **Bülten (e-posta):** Abonelik çift onaylıdır (`/bulten/onay`); onaylamayan adrese bülten gitmez. Sayılar
  `/admin/bulten`'de hazırlanır, gönderim kuyruğu `instrumentation.js` içinden dakikada bir çalışır
  (`lib/newsletter/service.js`, `MAIL_RATE_PER_MINUTE` kadar e-posta/dk, hata alanlar 3 kez denenir). Her e-postada
  tek tıkla çıkış başlıkları (`List-Unsubscribe`) vardır. SMTP: `SMTP_URL` + `MAIL_FROM`; geliştirmede
  e-postalar `.mail-outbox/` klasörüne yazılır. `NEWSLETTER_AUTO=draft|send` her sabah gündemden otomatik sayı hazırlar.
- **Etiketler / konu sayfaları:** Haber stüdyosunda eklenir, her etiketin `/etiket/<slug>` sayfası vardır. Öne çıkan
  etiketler ana sayfadaki “Gündemde” şeridinde görünür (`/admin/etiketler`). Mevcut haberleri anahtar kelimeyle
  etiketlemek için: `node scripts/auto-tag.mjs`.
- **İstatistik:** Çerezsiz; IP ya da kimlik saklanmaz. `components/Analytics.js` her sayfa geçişinde `/api/t`'ye
  sayaç gönderir, veriler günlük toplam olarak tutulur (`PageDailyStat`, `ArticleDailyStat`). Panel: `/admin/istatistik`.
- **Web push:** “Son dakika” işaretiyle yayınlanan haber (yayından sonraki 6 saat içinde) otomatik bildirim olur;
  `/admin/bildirim`'den elle de gönderilir. Anahtarlar: `npx web-push generate-vapid-keys`.
- **Hata takibi:** Sunucu (`instrumentation.js` → `onRequestError`), tarayıcı (`components/ErrorReporter.js`) ve
  arka plan işlerinin hataları `ErrorEvent` tablosunda gruplanır; `/admin/sistem` sunucu sağlığını ve işleri gösterir.
- **Güvenlik:** Personel ve okurlar Profil → Hesap ve güvenlik'ten iki adımlı doğrulamayı (TOTP + 10 kurtarma kodu)
  açabilir; anahtarlar `AUTH_SECRET` ile AES-GCM şifreli saklanır. Giriş denemeleri `LoginAttempt` tablosuna yazılır
  (IP tuzlu özet), hesap başına 15 dakikada 8 / IP başına 30 hatalı denemede giriş kilitlenir.
- **Arama:** Postgres tam metin arama (`Article.search`, veritabanında üretilen sütun + GIN indeks). Türkçe kök + kök
  öneki eşleşmesi, tırnak / eksi sözdizimi, `ts_headline` ile vurgulu özet. Not: Prisma bu sütun için yeni
  migration'larda `ALTER COLUMN "search" DROP DEFAULT` satırı üretir; o satırı silin.
- **Yazar sayfaları:** `/yazar/<slug>`; unvan ve biyografi Profil'den düzenlenir. Adresler her deploy'da
  `scripts/backfill-authors.mjs` ile tamamlanır. Görünen yazar adı elle değiştirilen haberler yazar sayfasına bağlanmaz.
- **Deploy kapısı:** `npm run build` öncesinde birim testleri çalışır (`prebuild`); test kırılırsa build ve deploy durur.
  CI ayrıca `scripts/smoke.mjs` ile uçtan uca duman testi yapar (`npm run smoke -- https://site-adresi` canlıda da çalışır).
- **Maç merkezi:** `/mac-merkezi` ve `/mac-merkezi/<lig>`; ligler, takımlar ve maçlar `/admin/mac-merkezi`'den
  girilir. Voleybolda set skorları yazılır, maç skoru ve puan durumu (`lib/standings.js`, 3-0/3-1=3, 3-2=2-1) hesaplanır.
- **Canlı anlatım:** Stüdyodan “Canlı anlatım masası” (`/admin/canli/<id>`). Haber sayfası açıkken 20 sn'de bir
  yeni girişleri çeker (`/api/articles/<id>/live`); şema `LiveBlogPosting`. Bir maç habere bağlanırsa canlı skor kutusu görünür.
- **Paylaşım kartları:** `app/haber/[slug]/opengraph-image.js` kapak + başlıkla 1200x630 kart üretir;
  yazı tipleri `@fontsource` paketlerinden (Türkçe karakterler için latin-ext ayrı adla yedek).
- **Yayın akışı:** Yazar “Onaya gönder” → editörlere bildirim; editör yayınlar ya da notla geri gönderir → yazara
  bildirim. `/admin/takvim` aylık yayın takvimi, `/admin/gorseller` görsel kitaplığı (alt metin, kullanım, temizlik).
- **Erişilebilirlik:** Renk değişkenleri WCAG AA kontrastına göre ayarlı (`--muted`, `--brand-on-ink`, `--live-bg`);
  değiştirirken iki temada da 4.5:1'i koruyun.
- **Reklam ve çerez onayı:** `/admin/reklamlar`. Görsel (birinci taraf) reklamlar çerezsiz; reklam ağı kodları
  (yalnızca yönetici girer) okur çerez bandında izin verirse yüklenir. Bant yalnızca etkin kod reklamı varken çıkar.
  Destekçilere reklam gösterilmez. Sponsorlu haberler etiketlenir ve Google Haberler site haritasına girmez.
- **Destek:** `/destek` sayfası; paketler ödeme sağlayıcısının ödeme bağlantısıyla çalışır (iyzico/Shopier/Papara linki),
  ödeme gelince editör destekçiyi `/admin/destek`'ten ekler → reklamsız okuma. Kart bilgisi sitede işlenmez.
- **Arşiv:** `/arsiv`, `/arsiv/2026/11`, `/arsiv/2026/11/14` + haftanın / ayın en çok okunanları.
- **Gerçek kullanıcı hızı:** `web-vitals` ölçümleri `/api/v`'ye gider, günlük histogram (`VitalDaily`) olarak
  tutulur; `/admin/istatistik`'te p75 değerleri.
- **PWA:** `app/manifest.js`, `public/sw.js` (önce ağ / çevrimdışı önbellek, `/cevrimdisi`), kurulum önerisi
  `components/PwaInstall.js`. Service worker'da önbellek adlarını değiştirmek eski önbellekleri temizler.
- **Video / galeri haberleri:** stüdyoda “Haber türü”. YouTube çerezsiz alan adından ve tıklayınca yüklenir.
- **Anket / tahmin:** `/admin/anketler`; maça bağlı tahminler maç bitince sonuçlanır. Tekrar oy: üye kimliği ya da
  `gz_v` çerezinin tuzlu özeti.
- **Kişisel akış:** takım takibi (puan durumundaki ☆), ana sayfada “Sizin için”; maç başlayınca / bitince yalnızca
  takipçilere bildirim (`PushMessage.teamIds`).
- **Yapay zekâ yardımcısı:** `lib/ai.js`, iki sağlayıcı: Google Gemini (`@google/genai`, `responseJsonSchema` ile
  yapılandırılmış çıktı, `GEMINI_API_KEY`, varsayılan model `gemini-3.8-flash`) ya da Claude Opus 5.5
  (`@anthropic-ai/sdk`, katı şemalı araç, sunucu tarafı reddetme yedeği, `ANTHROPIC_API_KEY`). İkisi de aynı görev
  istemlerini ve şemaları kullanır; sonuç ayrıca şemaya göre denetlenir. Kullanım `/admin/sistem`'de.
- **Voleybol veri merkezi:** `/admin/voleybol` (kulüpler, oyuncular, toplu kadro yapıştırma, transferler).
  Kulüp lig takımlarıyla aynı adla eklenirse maçları otomatik bağlanır. Sayfalar: `/voleybol`, `/oyuncu/<slug>`,
  `/takim/<slug>`, `/oyuncular`, `/transfer`, `/mac/<id>`, `/rehber`. Sezon tarihten hesaplanır (Ağustos'ta yeni sezon), `VOLLEY_SEASON` ile sabitlenebilir.
- **Maç istatistiği:** `/admin/mac/<id>`; elle ya da yapıştırılan tabloyu yapay zekâyla ayrıştırarak. İstatistik
  liderleri lig ve voleybol sayfalarında.
- **Canlı skor:** `/admin/mac/<id>/canli` sayı sayı (A / L / Z kısayolları). Kurallar `lib/volleyScore.js`
  (25 / 5. set 15, 2 fark, 3 set); set ve maç sonu otomatik, maç bitince tahminler sonuçlanır, takipçilere bildirim.
- **Gruplar ve eleme:** maçlara “Grup” ya da “Tur” yazılır; lig sayfası grup tablolarını ve eleme ağacını
  (aynı eşleşmenin maçları seri olarak) gösterir. Lig türü: lig / kupa / avrupa / milli.
- **Tahmin ligi:** `/tahmin-ligi`; doğru tahmin 10 puan, haftalık ve sezonluk sıralama (yalnızca ad + soyad baş harfi).
  Anketler sayfasındaki düğme önümüzdeki 7 günün maçları için tahminleri toplu açar.
- **Deneme sınırları** (`lib/api.js`) bellekte tutulur: tek sunucu için yeterli; birden fazla sunucuda Redis gibi
  ortak bir depoya taşınmalıdır.

## Klasör yapısı

```
app/                 sayfalar ve API route'ları (App Router)
  admin/             yönetim paneli
  api/               JSON API'ler
components/          arayüz bileşenleri (admin/ altında panel bileşenleri)
lib/                 veri erişimi, oturum, yetki, yardımcılar
prisma/              şema, migration'lar, seed
scripts/             bakım betikleri
tests/               birim testleri
```
