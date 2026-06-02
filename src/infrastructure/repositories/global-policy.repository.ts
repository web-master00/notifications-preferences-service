import { Channel, NotificationType, Region } from "../../domain/enums";
import { GlobalPolicy } from "../../domain/entities/preference";
import { GlobalPolicyRepository } from "../../domain/repositories";
import { PrismaDb } from "../prisma/prisma";
import {
  fromPrismaChannel,
  fromPrismaNotificationType,
  fromPrismaRegion,
  toPrismaChannel,
  toPrismaNotificationType,
  toPrismaRegion,
} from "../prisma/mappers";

export class PrismaGlobalPolicyRepository implements GlobalPolicyRepository {
  constructor(private readonly prisma: PrismaDb) {}

  async findOne(
    region: Region,
    notificationType: NotificationType,
    channel: Channel,
  ): Promise<GlobalPolicy | null> {
    const row = await this.prisma.globalPolicy.findUnique({
      where: {
        region_notificationType_channel: {
          region: toPrismaRegion(region),
          notificationType: toPrismaNotificationType(notificationType),
          channel: toPrismaChannel(channel),
        },
      },
    });
    if (!row) return null;
    return {
      region: fromPrismaRegion(row.region),
      notificationType: fromPrismaNotificationType(row.notificationType),
      channel: fromPrismaChannel(row.channel),
      enabled: row.enabled,
    };
  }
}
