/*
  Warnings:

  - A unique constraint covering the columns `[tenantId,slug]` on the table `RepairBrand` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantId,slug]` on the table `RepairDevice` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantId,slug]` on the table `RepairServiceType` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "CloudflareDomainStatus" AS ENUM ('PENDING', 'ACTIVE', 'DNS_CONFIGURED', 'ERROR');

-- CreateEnum
CREATE TYPE "TenantVertical" AS ENUM ('REPAIR_SHOP', 'BARBER', 'CAR_WASH', 'BIKE_REPAIR', 'GENERAL_SERVICE');

-- CreateEnum
CREATE TYPE "CmsStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- AlterEnum
ALTER TYPE "TenantStatus" ADD VALUE 'SEEDING';

-- DropForeignKey
ALTER TABLE "OwnerAuditLog" DROP CONSTRAINT "OwnerAuditLog_ownerId_fkey";

-- DropIndex
DROP INDEX "RepairBrand_slug_idx";

-- DropIndex
DROP INDEX "RepairBrand_slug_key";

-- DropIndex
DROP INDEX "RepairDevice_slug_idx";

-- DropIndex
DROP INDEX "RepairDevice_slug_key";

-- DropIndex
DROP INDEX "RepairServiceType_name_key";

-- DropIndex
DROP INDEX "RepairServiceType_slug_idx";

-- DropIndex
DROP INDEX "RepairServiceType_slug_key";

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "bookedByEmail" TEXT,
ADD COLUMN     "bookedByName" TEXT;

-- AlterTable
ALTER TABLE "RepairBrand" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "RepairDevice" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "RepairServiceType" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "TenantConfig" ADD COLUMN     "accentColor" TEXT,
ADD COLUMN     "borderRadius" TEXT NOT NULL DEFAULT '0.625rem',
ADD COLUMN     "darkMode" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "website" TEXT;

-- AlterTable
ALTER TABLE "TenantDomain" ADD COLUMN     "cloudflareStatus" "CloudflareDomainStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "cloudflareZoneId" TEXT,
ADD COLUMN     "errorMessage" TEXT,
ADD COLUMN     "lastCheckedAt" TIMESTAMP(3),
ADD COLUMN     "nameservers" TEXT[],
ADD COLUMN     "sslStatus" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "TenantFeature" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "ecommerceEnabled" BOOLEAN NOT NULL DEFAULT true,
    "refurbishedGrading" BOOLEAN NOT NULL DEFAULT true,
    "wishlistEnabled" BOOLEAN NOT NULL DEFAULT true,
    "stockNotifications" BOOLEAN NOT NULL DEFAULT true,
    "couponsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "repairsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "quoteOnRequest" BOOLEAN NOT NULL DEFAULT false,
    "mailInRepairs" BOOLEAN NOT NULL DEFAULT false,
    "walkInQueue" BOOLEAN NOT NULL DEFAULT false,
    "ticketsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "liveChatWidget" BOOLEAN NOT NULL DEFAULT true,
    "invoicingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "vatCalculation" BOOLEAN NOT NULL DEFAULT true,
    "pdfGeneration" BOOLEAN NOT NULL DEFAULT true,
    "inventoryEnabled" BOOLEAN NOT NULL DEFAULT true,
    "advancedInventory" BOOLEAN NOT NULL DEFAULT false,
    "employeeManagement" BOOLEAN NOT NULL DEFAULT false,
    "maxAdminUsers" INTEGER NOT NULL DEFAULT 1,
    "analyticsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantFeature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantUIConfig" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "vertical" "TenantVertical" NOT NULL DEFAULT 'REPAIR_SHOP',
    "marqueeItems" JSONB,
    "footerTagline" TEXT,
    "newsletterTitle" TEXT,
    "newsletterSubtitle" TEXT,
    "googleReviewUrl" TEXT,
    "googleReviewRating" TEXT,
    "dateLocale" TEXT NOT NULL DEFAULT 'nl-BE',
    "dateFormat" TEXT NOT NULL DEFAULT 'dd MMMM yyyy',
    "checkoutLabels" JSONB,
    "bookingLabels" JSONB,
    "reviewLabels" JSONB,
    "navLabels" JSONB,
    "authLabels" JSONB,
    "footerLabels" JSONB,
    "supportFaqItems" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantUIConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantHomepage" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "heroTitle" TEXT NOT NULL DEFAULT 'Problemen met uw toestel?',
    "heroSubtitle" TEXT NOT NULL DEFAULT 'Wij helpen u graag.',
    "heroDescription" TEXT,
    "heroImageUrl" TEXT,
    "heroCta1Text" TEXT NOT NULL DEFAULT 'Bekijk Toestellen',
    "heroCta1Link" TEXT NOT NULL DEFAULT '/phones',
    "heroCta2Text" TEXT DEFAULT 'Maak Afspraak',
    "heroCta2Link" TEXT DEFAULT '/repair/book',
    "trustBadge1" TEXT NOT NULL DEFAULT 'Gratis verzending',
    "trustBadge2" TEXT NOT NULL DEFAULT '1 jaar garantie',
    "trustBadge3" TEXT NOT NULL DEFAULT 'Veilig betalen',
    "conversionTitle" TEXT DEFAULT 'Vandaag kapot. Vandaag opgelost.',
    "conversionFeature1" TEXT DEFAULT 'Binnen 60 minuten klaar',
    "conversionFeature2" TEXT DEFAULT 'Originele onderdelen',
    "conversionFeature3" TEXT DEFAULT 'Lokale service',
    "showConversionStrip" BOOLEAN NOT NULL DEFAULT true,
    "showServices" BOOLEAN NOT NULL DEFAULT true,
    "status" "CmsStatus" NOT NULL DEFAULT 'PUBLISHED',
    "draftContent" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantHomepage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantPage" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "showInNav" BOOLEAN NOT NULL DEFAULT false,
    "navOrder" INTEGER NOT NULL DEFAULT 0,
    "isSystemPage" BOOLEAN NOT NULL DEFAULT false,
    "status" "CmsStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantPage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TenantFeature_tenantId_key" ON "TenantFeature"("tenantId");

-- CreateIndex
CREATE INDEX "TenantFeature_tenantId_idx" ON "TenantFeature"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "TenantUIConfig_tenantId_key" ON "TenantUIConfig"("tenantId");

-- CreateIndex
CREATE INDEX "TenantUIConfig_tenantId_idx" ON "TenantUIConfig"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "TenantHomepage_tenantId_key" ON "TenantHomepage"("tenantId");

-- CreateIndex
CREATE INDEX "TenantPage_tenantId_idx" ON "TenantPage"("tenantId");

-- CreateIndex
CREATE INDEX "TenantPage_tenantId_status_idx" ON "TenantPage"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "TenantPage_tenantId_slug_key" ON "TenantPage"("tenantId", "slug");

-- CreateIndex
CREATE INDEX "Appointment_bookedByEmail_idx" ON "Appointment"("bookedByEmail");

-- CreateIndex
CREATE INDEX "RepairBrand_tenantId_idx" ON "RepairBrand"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "RepairBrand_tenantId_slug_key" ON "RepairBrand"("tenantId", "slug");

-- CreateIndex
CREATE INDEX "RepairDevice_tenantId_idx" ON "RepairDevice"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "RepairDevice_tenantId_slug_key" ON "RepairDevice"("tenantId", "slug");

-- CreateIndex
CREATE INDEX "RepairServiceType_tenantId_idx" ON "RepairServiceType"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "RepairServiceType_tenantId_slug_key" ON "RepairServiceType"("tenantId", "slug");

-- CreateIndex
CREATE INDEX "TenantDomain_cloudflareStatus_idx" ON "TenantDomain"("cloudflareStatus");

-- AddForeignKey
ALTER TABLE "TenantFeature" ADD CONSTRAINT "TenantFeature_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantUIConfig" ADD CONSTRAINT "TenantUIConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantHomepage" ADD CONSTRAINT "TenantHomepage_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantPage" ADD CONSTRAINT "TenantPage_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepairBrand" ADD CONSTRAINT "RepairBrand_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepairDevice" ADD CONSTRAINT "RepairDevice_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepairServiceType" ADD CONSTRAINT "RepairServiceType_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
