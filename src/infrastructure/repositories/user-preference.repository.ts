import { Channel, NotificationType } from "../../domain/enums";
import { UserPreference } from "../../domain/entities/preference";
import { UserPreferenceRepository } from "../../domain/repositories";
import { PrismaDb } from "../prisma/prisma";
import {
  fromPrismaChannel,
  fromPrismaNotificationType,
  toPrismaChannel,
  toPrismaNotificationType,
} from "../prisma/mappers";

export class PrismaUserPreferenceRepository
  implements UserPreferenceRepository
{
  constructor(private readonly prisma: PrismaDb) {}

  async findAllForUser(userId: string): Promise<UserPreference[]> {
    const rows = await this.prisma.userPreference.findMany({
      where: { userId },
    });
    return rows.map((row) => ({
      userId: row.userId,
      notificationType: fromPrismaNotificationType(row.notificationType),
      channel: fromPrismaChannel(row.channel),
      enabled: row.enabled,
    }));
  }

  async findOne(
    userId: string,
    notificationType: NotificationType,
    channel: Channel,
  ): Promise<UserPreference | null> {
    const row = await this.prisma.userPreference.findUnique({
      where: {
        userId_notificationType_channel: {
          userId,
          notificationType: toPrismaNotificationType(notificationType),
          channel: toPrismaChannel(channel),
        },
      },
    });
    if (!row) return null;
    return {
      userId: row.userId,
      notificationType: fromPrismaNotificationType(row.notificationType),
      channel: fromPrismaChannel(row.channel),
      enabled: row.enabled,
    };
  }

  async upsert(pref: UserPreference): Promise<UserPreference> {
    const row = await this.prisma.userPreference.upsert({
      where: {
        userId_notificationType_channel: {
          userId: pref.userId,
          notificationType: toPrismaNotificationType(pref.notificationType),
          channel: toPrismaChannel(pref.channel),
        },
      },
      update: { enabled: pref.enabled },
      create: {
        userId: pref.userId,
        notificationType: toPrismaNotificationType(pref.notificationType),
        channel: toPrismaChannel(pref.channel),
        enabled: pref.enabled,
      },
    });
    return {
      userId: row.userId,
      notificationType: fromPrismaNotificationType(row.notificationType),
      channel: fromPrismaChannel(row.channel),
      enabled: row.enabled,
    };
  }
}
