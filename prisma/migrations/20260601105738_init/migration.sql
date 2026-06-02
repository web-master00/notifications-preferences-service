-- CreateEnum
CREATE TYPE "Channel" AS ENUM ('EMAIL', 'SMS', 'PUSH');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('TRANSACTIONAL_EMAIL', 'MARKETING_EMAIL', 'MARKETING_SMS', 'MARKETING_PUSH');

-- CreateEnum
CREATE TYPE "Region" AS ENUM ('EU', 'US', 'APAC');

-- CreateTable
CREATE TABLE "DefaultPreference" (
    "id" SERIAL NOT NULL,
    "notificationType" "NotificationType" NOT NULL,
    "channel" "Channel" NOT NULL,
    "enabled" BOOLEAN NOT NULL,

    CONSTRAINT "DefaultPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "notificationType" "NotificationType" NOT NULL,
    "channel" "Channel" NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuietHours" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuietHours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GlobalPolicy" (
    "id" TEXT NOT NULL,
    "region" "Region" NOT NULL,
    "notificationType" "NotificationType" NOT NULL,
    "channel" "Channel" NOT NULL,
    "enabled" BOOLEAN NOT NULL,

    CONSTRAINT "GlobalPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DefaultPreference_notificationType_channel_key" ON "DefaultPreference"("notificationType", "channel");

-- CreateIndex
CREATE INDEX "UserPreference_userId_idx" ON "UserPreference"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPreference_userId_notificationType_channel_key" ON "UserPreference"("userId", "notificationType", "channel");

-- CreateIndex
CREATE UNIQUE INDEX "QuietHours_userId_key" ON "QuietHours"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GlobalPolicy_region_notificationType_channel_key" ON "GlobalPolicy"("region", "notificationType", "channel");
