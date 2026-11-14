-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "draftedAt" TIMESTAMPTZ(3),
ADD COLUMN     "remindedAt" TIMESTAMPTZ(3);

-- CreateTable
CREATE TABLE "PredictionGroup" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PredictionGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PredictionGroupMember" (
    "groupId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PredictionGroupMember_pkey" PRIMARY KEY ("groupId","userId")
);

-- CreateIndex
CREATE UNIQUE INDEX "PredictionGroup_code_key" ON "PredictionGroup"("code");

-- CreateIndex
CREATE INDEX "PredictionGroupMember_userId_idx" ON "PredictionGroupMember"("userId");

-- AddForeignKey
ALTER TABLE "PredictionGroupMember" ADD CONSTRAINT "PredictionGroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "PredictionGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PredictionGroupMember" ADD CONSTRAINT "PredictionGroupMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;


