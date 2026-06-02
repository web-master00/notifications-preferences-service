import { Channel, NotificationType } from "../../domain/enums";
import { DefaultPreference } from "../../domain/entities/preference";
import { DefaultPreferenceRepository } from "../../domain/repositories";
import { PrismaDb } from "../prisma/prisma";
import {
  fromPrismaChannel,
  fromPrismaNotificationType,
  toPrismaChannel,
  toPrismaNotificationType,
} from "../prisma/mappers";

export class PrismaDefaultPreferenceRepository
  implements DefaultPreferenceRepository
{
  constructor(private readonly prisma: PrismaDb) {}

  async findAll(): Promise<DefaultPreference[]> {
    const rows = await this.prisma.defaultPreference.findMany();
    return rows.map((row) => ({
      notificationType: fromPrismaNotificationType(row.notificationType),
      channel: fromPrismaChannel(row.channel),
      enabled: row.enabled,
    }));
  }

  async findOne(
    notificationType: NotificationType,
    channel: Channel,
  ): Promise<DefaultPreference | null> {
    const row = await this.prisma.defaultPreference.findUnique({
      where: {
        notificationType_channel: {
          notificationType: toPrismaNotificationType(notificationType),
          channel: toPrismaChannel(channel),
        },
      },
    });
    if (!row) return null;
    return {
      notificationType: fromPrismaNotificationType(row.notificationType),
      channel: fromPrismaChannel(row.channel),
      enabled: row.enabled,
    };
  }
}
