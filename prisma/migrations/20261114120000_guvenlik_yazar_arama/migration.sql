-- AlterTable
ALTER TABLE "Article" ADD COLUMN     "imageCredit" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatar" TEXT,
ADD COLUMN     "bio" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "lastLoginAt" TIMESTAMPTZ(3),
ADD COLUMN     "recoveryCodes" TEXT[],
ADD COLUMN     "slug" TEXT,
ADD COLUMN     "title" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "totpEnabledAt" TIMESTAMPTZ(3),
ADD COLUMN     "totpSecret" TEXT;

-- CreateTable
CREATE TABLE "LoginAttempt" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "ipHash" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "reason" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserNotification" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "readAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LoginAttempt_email_createdAt_idx" ON "LoginAttempt"("email", "createdAt");

-- CreateIndex
CREATE INDEX "LoginAttempt_ipHash_createdAt_idx" ON "LoginAttempt"("ipHash", "createdAt");

-- CreateIndex
CREATE INDEX "UserNotification_userId_readAt_createdAt_idx" ON "UserNotification"("userId", "readAt", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "User_slug_key" ON "User"("slug");

-- AddForeignKey
ALTER TABLE "UserNotification" ADD CONSTRAINT "UserNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Tam metin arama: başlık (A), özet (B) ve metin (C) ağırlıklı.
-- Hem Türkçe kökler ('turkish') hem de olduğu gibi kelimeler ('simple') indekslenir; Türkçe kök bulucu bazı
-- kelimelerde tutarsız olduğu için (takım -> tak, takımları -> takım) sorgu kökleri ayrıca önek olarak da aranır.
-- Veritabanı kendisi üretir; uygulama bu sütuna yazmaz.
ALTER TABLE "Article" ADD COLUMN "search" tsvector GENERATED ALWAYS AS (
  setweight(to_tsvector('turkish', coalesce("title", '')), 'A') ||
  setweight(to_tsvector('simple', coalesce("title", '')), 'A') ||
  setweight(to_tsvector('turkish', coalesce("summary", '')), 'B') ||
  setweight(to_tsvector('simple', coalesce("summary", '')), 'B') ||
  setweight(to_tsvector('turkish', regexp_replace(coalesce("content", ''), '<[^>]+>', ' ', 'g')), 'C') ||
  setweight(to_tsvector('simple', regexp_replace(coalesce("content", ''), '<[^>]+>', ' ', 'g')), 'C')
) STORED;
CREATE INDEX "Article_search_idx" ON "Article" USING GIN ("search");
