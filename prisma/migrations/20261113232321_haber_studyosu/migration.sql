-- AlterTable
ALTER TABLE "Article" ADD COLUMN     "layout" JSONB;

-- CreateTable
CREATE TABLE "ArticleTemplate" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "content" TEXT NOT NULL,
    "layout" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,

    CONSTRAINT "ArticleTemplate_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ArticleTemplate" ADD CONSTRAINT "ArticleTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
