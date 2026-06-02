import {
  Channel as PrismaChannel,
  NotificationType as PrismaNotificationType,
  Region as PrismaRegion,
} from "@prisma/client";
import { Channel, NotificationType, Region } from "../../domain/enums";

const NOTIFICATION_TYPE_TO_PRISMA: Record<NotificationType, PrismaNotificationType> = {
  transactional_email: PrismaNotificationType.TRANSACTIONAL_EMAIL,
  marketing_email: PrismaNotificationType.MARKETING_EMAIL,
  marketing_sms: PrismaNotificationType.MARKETING_SMS,
  marketing_push: PrismaNotificationType.MARKETING_PUSH,
};

const NOTIFICATION_TYPE_FROM_PRISMA: Record<PrismaNotificationType, NotificationType> = {
  TRANSACTIONAL_EMAIL: "transactional_email",
  MARKETING_EMAIL: "marketing_email",
  MARKETING_SMS: "marketing_sms",
  MARKETING_PUSH: "marketing_push",
};

const CHANNEL_TO_PRISMA: Record<Channel, PrismaChannel> = {
  email: PrismaChannel.EMAIL,
  sms: PrismaChannel.SMS,
  push: PrismaChannel.PUSH,
};

const CHANNEL_FROM_PRISMA: Record<PrismaChannel, Channel> = {
  EMAIL: "email",
  SMS: "sms",
  PUSH: "push",
};

const REGION_TO_PRISMA: Record<Region, PrismaRegion> = {
  EU: PrismaRegion.EU,
  US: PrismaRegion.US,
  APAC: PrismaRegion.APAC,
};

const REGION_FROM_PRISMA: Record<PrismaRegion, Region> = {
  EU: "EU",
  US: "US",
  APAC: "APAC",
};

export const toPrismaNotificationType = (t: NotificationType): PrismaNotificationType =>
  NOTIFICATION_TYPE_TO_PRISMA[t];

export const fromPrismaNotificationType = (t: PrismaNotificationType): NotificationType =>
  NOTIFICATION_TYPE_FROM_PRISMA[t];

export const toPrismaChannel = (c: Channel): PrismaChannel => CHANNEL_TO_PRISMA[c];
export const fromPrismaChannel = (c: PrismaChannel): Channel => CHANNEL_FROM_PRISMA[c];

export const toPrismaRegion = (r: Region): PrismaRegion => REGION_TO_PRISMA[r];
export const fromPrismaRegion = (r: PrismaRegion): Region => REGION_FROM_PRISMA[r];
