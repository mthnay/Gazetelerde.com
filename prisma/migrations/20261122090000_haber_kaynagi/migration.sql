-- Haber ↔ kaynak bağlantısı: her otomatik haber hangi kaynaktan geldiğini doğrudan bilir
ALTER TABLE "Article" ADD COLUMN IF NOT EXISTS "feedSourceId" INTEGER;

CREATE INDEX IF NOT EXISTS "Article_feedSourceId_status_idx" ON "Article"("feedSourceId", "status");

ALTER TABLE "Article" ADD CONSTRAINT "Article_feedSourceId_fkey" FOREIGN KEY ("feedSourceId") REFERENCES "FeedSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Var olan akış haberlerini kaynağına bağla
UPDATE "Article" a SET "feedSourceId" = fi."sourceId"
FROM "FeedItem" fi WHERE fi."articleId" = a."id" AND a."feedSourceId" IS NULL;

-- Kaynak sitenin simgesi (ilk taramada sitenin ana sayfasından okunur)
ALTER TABLE "FeedSource" ADD COLUMN IF NOT EXISTS "iconUrl" TEXT;
