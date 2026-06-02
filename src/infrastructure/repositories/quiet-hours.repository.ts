import { QuietHours } from "../../domain/entities/preference";
import { QuietHoursRepository } from "../../domain/repositories";
import { PrismaDb } from "../prisma/prisma";

export class PrismaQuietHoursRepository implements QuietHoursRepository {
  constructor(private readonly prisma: PrismaDb) {}

  async findOne(userId: string): Promise<QuietHours | null> {
    const row = await this.prisma.quietHours.findUnique({ where: { userId } });
    if (!row) return null;
    return {
      userId: row.userId,
      timezone: row.timezone,
      startTime: row.startTime,
      endTime: row.endTime,
    };
  }

  async upsert(quiet: QuietHours): Promise<QuietHours> {
    const row = await this.prisma.quietHours.upsert({
      where: { userId: quiet.userId },
      update: {
        timezone: quiet.timezone,
        startTime: quiet.startTime,
        endTime: quiet.endTime,
      },
      create: {
        userId: quiet.userId,
        timezone: quiet.timezone,
        startTime: quiet.startTime,
        endTime: quiet.endTime,
      },
    });
    return {
      userId: row.userId,
      timezone: row.timezone,
      startTime: row.startTime,
      endTime: row.endTime,
    };
  }

  async delete(userId: string): Promise<void> {
    await this.prisma.quietHours.deleteMany({ where: { userId } });
  }
}
