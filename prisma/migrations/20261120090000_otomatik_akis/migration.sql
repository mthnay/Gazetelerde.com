-- CreateEnum
CREATE TYPE "FeedKind" AS ENUM ('RSS', 'HTML');

-- CreateEnum
CREATE TYPE "FeedMode" AS ENUM ('INBOX', 'DRAFT', 'REVIEW', 'PUBLISH');

-- AlterTable
ALTER TABLE "FeedSource" ADD COLUMN     "kind" "FeedKind" NOT NULL DEFAULT 'RSS',
ADD COLUMN     "mode" "FeedMode" NOT NULL DEFAULT 'PUBLISH',
ADD COLUMN     "linkPattern" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "include" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "exclude" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "breaking" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "rewrite" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "sport" TEXT NOT NULL DEFAULT 'voleybol',
ADD COLUMN     "note" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "keepDays" INTEGER NOT NULL DEFAULT 7;

-- Daha önce elle eklenmiş kaynaklar eskisi gibi gelen kutusuna düşsün
UPDATE "FeedSource" SET "mode" = 'INBOX', "breaking" = false, "keepDays" = 0;

-- Hazır kaynaklar (kapalı); panelden açılır, düzenlenir ya da silinir
INSERT INTO "FeedSource" ("name", "url", "kind", "linkPattern", "sport", "note", "active") VALUES
  ('TVF Haberler', 'https://tvf.org.tr/icerikler/haberler', 'HTML', '/icerik/', 'voleybol', 'Türkiye Voleybol Federasyonu: ligler, milli takımlar, duyurular.', false),
  ('FIVB', 'https://www.fivb.com/feed/', 'RSS', '', 'voleybol', 'Uluslararası Voleybol Federasyonu (İngilizce; yapay zekâ Türkçeleştirir).', false),
  ('Voleybol Plus', 'https://www.voleybolplus.com/feed', 'RSS', '', 'voleybol', 'Türk voleybolu haber sitesi.', false),
  ('AA Spor', 'https://www.aa.com.tr/tr/rss/default?cat=spor', 'RSS', '', 'spor', 'Anadolu Ajansı spor haberleri.', false),
  ('TRT Haber Spor', 'https://www.trthaber.com/spor_articles.rss', 'RSS', '', 'spor', 'TRT Haber spor bölümü.', false)
ON CONFLICT ("url") DO NOTHING;

-- AlterTable
ALTER TABLE "FeedItem" ADD COLUMN     "error" TEXT,
ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sourceHash" TEXT,
ADD COLUMN     "syncedHash" TEXT,
ADD COLUMN     "checkedAt" TIMESTAMPTZ(3),
ADD COLUMN     "updatedFromSource" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Article" ADD COLUMN     "sourceName" TEXT,
ADD COLUMN     "externalId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Article_externalId_key" ON "Article"("externalId");
