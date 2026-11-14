-- AlterTable
ALTER TABLE "Article" ADD COLUMN     "format" TEXT NOT NULL DEFAULT 'standart',
ADD COLUMN     "gallery" JSONB,
ADD COLUMN     "sponsored" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "videoUrl" TEXT;

-- AlterTable
ALTER TABLE "PushMessage" ADD COLUMN     "teamIds" INTEGER[];

-- AlterTable
ALTER TABLE "PushSubscription" ADD COLUMN     "userId" TEXT;

-- CreateTable
CREATE TABLE "AdSlot" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "placement" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'gorsel',
    "image" TEXT,
    "link" TEXT,
    "alt" TEXT NOT NULL DEFAULT '',
    "code" TEXT NOT NULL DEFAULT '',
    "label" TEXT NOT NULL DEFAULT 'Reklam',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMPTZ(3),
    "endsAt" TIMESTAMPTZ(3),
    "weight" INTEGER NOT NULL DEFAULT 1,
    "views" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTier" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "amount" INTEGER NOT NULL,
    "period" TEXT NOT NULL DEFAULT 'aylik',
    "paymentUrl" TEXT NOT NULL,
    "adFree" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "SupportTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supporter" (
    "id" SERIAL NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "tier" TEXT NOT NULL DEFAULT '',
    "amount" INTEGER NOT NULL DEFAULT 0,
    "until" TIMESTAMPTZ(3),
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Supporter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VitalDaily" (
    "day" DATE NOT NULL,
    "metric" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "device" TEXT NOT NULL,
    "good" INTEGER NOT NULL DEFAULT 0,
    "ni" INTEGER NOT NULL DEFAULT 0,
    "poor" INTEGER NOT NULL DEFAULT 0,
    "buckets" INTEGER[],

    CONSTRAINT "VitalDaily_pkey" PRIMARY KEY ("day","metric","kind","device")
);

-- CreateTable
CREATE TABLE "Poll" (
    "id" SERIAL NOT NULL,
    "question" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'anket',
    "articleId" INTEGER,
    "matchId" INTEGER,
    "closesAt" TIMESTAMPTZ(3),
    "correctId" INTEGER,
    "showResults" TEXT NOT NULL DEFAULT 'oy-sonrasi',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Poll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PollOption" (
    "id" SERIAL NOT NULL,
    "pollId" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "votes" INTEGER NOT NULL DEFAULT 0,
    "sort" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PollOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PollVote" (
    "pollId" INTEGER NOT NULL,
    "voterHash" TEXT NOT NULL,
    "optionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PollVote_pkey" PRIMARY KEY ("pollId","voterHash")
);

-- CreateTable
CREATE TABLE "TeamFollow" (
    "userId" TEXT NOT NULL,
    "teamId" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamFollow_pkey" PRIMARY KEY ("userId","teamId")
);

-- CreateTable
CREATE TABLE "AiUsage" (
    "id" SERIAL NOT NULL,
    "userId" TEXT,
    "task" TEXT NOT NULL,
    "inputTok" INTEGER NOT NULL DEFAULT 0,
    "outputTok" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdSlot_placement_active_idx" ON "AdSlot"("placement", "active");

-- CreateIndex
CREATE INDEX "Supporter_userId_idx" ON "Supporter"("userId");

-- CreateIndex
CREATE INDEX "Supporter_email_idx" ON "Supporter"("email");

-- CreateIndex
CREATE INDEX "Poll_articleId_idx" ON "Poll"("articleId");

-- CreateIndex
CREATE INDEX "TeamFollow_teamId_idx" ON "TeamFollow"("teamId");

-- CreateIndex
CREATE INDEX "AiUsage_createdAt_idx" ON "AiUsage"("createdAt");

-- AddForeignKey
ALTER TABLE "Supporter" ADD CONSTRAINT "Supporter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Poll" ADD CONSTRAINT "Poll_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PollOption" ADD CONSTRAINT "PollOption_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "Poll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PollVote" ADD CONSTRAINT "PollVote_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "Poll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamFollow" ADD CONSTRAINT "TeamFollow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamFollow" ADD CONSTRAINT "TeamFollow_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

