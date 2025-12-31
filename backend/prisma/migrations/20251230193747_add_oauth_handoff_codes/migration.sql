-- CreateTable
CREATE TABLE "OAuthHandoffCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "returnPath" TEXT NOT NULL DEFAULT '/',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OAuthHandoffCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OAuthHandoffCode_code_key" ON "OAuthHandoffCode"("code");

-- CreateIndex
CREATE INDEX "OAuthHandoffCode_code_idx" ON "OAuthHandoffCode"("code");

-- CreateIndex
CREATE INDEX "OAuthHandoffCode_expiresAt_idx" ON "OAuthHandoffCode"("expiresAt");
