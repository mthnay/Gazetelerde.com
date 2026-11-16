-- CreateEnum
CREATE TYPE "FeedKind" AS ENUM ('RSS', 'HTML');

-- CreateEnum
CREATE TYPE "FeedMode" AS ENUM ('INBOX', 'DRAFT', 'REVIEW', 'PUBLISH');

-- AlterTable
ALTER TABLE "FeedSource" ADD COLUMN     "kind" "FeedKind" NOT NULL DEFAULT 'RSS',
ADD COLUMN     "mode" "FeedMode" NOT NULL DEFAULT 'INBOX',
ADD COLUMN     "linkPattern" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "include" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "exclude" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "breaking" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "rewrite" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "sport" TEXT NOT NULL DEFAULT 'voleybol',
ADD COLUMN     "preset" TEXT,
ADD COLUMN     "keepDays" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "FeedSource_preset_key" ON "FeedSource"("preset");

-- AlterTable
ALTER TABLE "FeedItem" ADD COLUMN     "error" TEXT;

-- AlterTable
ALTER TABLE "Article" ADD COLUMN     "sourceName" TEXT,
ADD COLUMN     "externalId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Article_externalId_key" ON "Article"("externalId");
