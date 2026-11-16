-- 20261120090000_otomatik_akis canlıya ilk hâliyle uygulandı; sonradan eklenen alanlar burada.
-- IF NOT EXISTS: göçün değiştirilmiş hâliyle kurulmuş veritabanlarında da sorunsuz çalışsın.

-- Kaynak ayarları
ALTER TABLE "FeedSource" ADD COLUMN IF NOT EXISTS "note" TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS "keepDays" INTEGER NOT NULL DEFAULT 7;
ALTER TABLE "FeedSource" DROP COLUMN IF EXISTS "preset";

-- Yeni eklenen kaynaklar varsayılan olarak otomatik yayına ayarlı (var olanlar korunur)
ALTER TABLE "FeedSource" ALTER COLUMN "mode" SET DEFAULT 'PUBLISH',
ALTER COLUMN "breaking" SET DEFAULT true;

-- Gelen öğe: yeniden deneme ve kaynakta değişiklik takibi
ALTER TABLE "FeedItem" ADD COLUMN IF NOT EXISTS "attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "sourceHash" TEXT,
ADD COLUMN IF NOT EXISTS "syncedHash" TEXT,
ADD COLUMN IF NOT EXISTS "checkedAt" TIMESTAMPTZ(3),
ADD COLUMN IF NOT EXISTS "updatedFromSource" INTEGER NOT NULL DEFAULT 0;

-- Hazır kaynaklar (kapalı); panelden açılır, düzenlenir ya da silinir
INSERT INTO "FeedSource" ("name", "url", "kind", "linkPattern", "sport", "note", "active", "mode", "breaking", "keepDays") VALUES
  ('TVF Haberler', 'https://tvf.org.tr/icerikler/haberler', 'HTML', '/icerik/', 'voleybol', 'Türkiye Voleybol Federasyonu: ligler, milli takımlar, duyurular.', false, 'PUBLISH', true, 7),
  ('FIVB', 'https://www.fivb.com/feed/', 'RSS', '', 'voleybol', 'Uluslararası Voleybol Federasyonu (İngilizce; yapay zekâ Türkçeleştirir).', false, 'PUBLISH', true, 7),
  ('Voleybol Plus', 'https://www.voleybolplus.com/feed', 'RSS', '', 'voleybol', 'Türk voleybolu haber sitesi.', false, 'PUBLISH', true, 7),
  ('AA Spor', 'https://www.aa.com.tr/tr/rss/default?cat=spor', 'RSS', '', 'spor', 'Anadolu Ajansı spor haberleri.', false, 'PUBLISH', true, 7),
  ('TRT Haber Spor', 'https://www.trthaber.com/spor_articles.rss', 'RSS', '', 'spor', 'TRT Haber spor bölümü.', false, 'PUBLISH', true, 7)
ON CONFLICT ("url") DO NOTHING;
