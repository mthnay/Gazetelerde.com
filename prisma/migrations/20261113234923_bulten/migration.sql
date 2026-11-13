-- CreateEnum
CREATE TYPE "NewsletterStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- AlterTable
ALTER TABLE "Subscriber" ADD COLUMN     "confirmSentAt" TIMESTAMPTZ(3),
ADD COLUMN     "confirmedAt" TIMESTAMPTZ(3),
ADD COLUMN     "unsubscribedAt" TIMESTAMPTZ(3);

-- CreateTable
CREATE TABLE "NewsletterIssue" (
    "id" SERIAL NOT NULL,
    "subject" TEXT NOT NULL,
    "preheader" TEXT NOT NULL DEFAULT '',
    "intro" TEXT NOT NULL DEFAULT '',
    "articleIds" INTEGER[],
    "status" "NewsletterStatus" NOT NULL DEFAULT 'DRAFT',
    "auto" BOOLEAN NOT NULL DEFAULT false,
    "scheduledAt" TIMESTAMPTZ(3),
    "startedAt" TIMESTAMPTZ(3),
    "sentAt" TIMESTAMPTZ(3),
    "recipients" INTEGER NOT NULL DEFAULT 0,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "NewsletterIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsletterDelivery" (
    "issueId" INTEGER NOT NULL,
    "subscriberId" INTEGER NOT NULL,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "sentAt" TIMESTAMPTZ(3),

    CONSTRAINT "NewsletterDelivery_pkey" PRIMARY KEY ("issueId","subscriberId")
);

-- CreateIndex
CREATE INDEX "NewsletterIssue_status_scheduledAt_idx" ON "NewsletterIssue"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "NewsletterDelivery_issueId_status_idx" ON "NewsletterDelivery"("issueId", "status");

-- CreateIndex
CREATE INDEX "Subscriber_active_confirmedAt_idx" ON "Subscriber"("active", "confirmedAt");

-- AddForeignKey
ALTER TABLE "NewsletterIssue" ADD CONSTRAINT "NewsletterIssue_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsletterDelivery" ADD CONSTRAINT "NewsletterDelivery_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "NewsletterIssue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsletterDelivery" ADD CONSTRAINT "NewsletterDelivery_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "Subscriber"("id") ON DELETE CASCADE ON UPDATE CASCADE;
