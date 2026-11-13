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
