import "dotenv/config";
import {
  PrismaClient,
  NotificationType,
  Channel,
  Region,
} from "@prisma/client";

const prisma = new PrismaClient();

type DefaultRow = {
  notificationType: NotificationType;
  channel: Channel;
  enabled: boolean;
};

const DEFAULTS: DefaultRow[] = [
  {
    notificationType: NotificationType.TRANSACTIONAL_EMAIL,
    channel: Channel.EMAIL,
    enabled: true,
  },
  {
    notificationType: NotificationType.MARKETING_EMAIL,
    channel: Channel.EMAIL,
    enabled: false,
  },
  {
    notificationType: NotificationType.MARKETING_SMS,
    channel: Channel.SMS,
    enabled: false,
  },
  {
    notificationType: NotificationType.MARKETING_PUSH,
    channel: Channel.PUSH,
    enabled: false,
  },
];

type PolicyRow = {
  region: Region;
  notificationType: NotificationType;
  channel: Channel;
  enabled: boolean;
};

const GLOBAL_POLICIES: PolicyRow[] = [
  {
    region: Region.EU,
    notificationType: NotificationType.MARKETING_SMS,
    channel: Channel.SMS,
    enabled: false,
  },
];

async function main() {
  console.log("Seeding default preferences...");
  for (const row of DEFAULTS) {
    await prisma.defaultPreference.upsert({
      where: {
        notificationType_channel: {
          notificationType: row.notificationType,
          channel: row.channel,
        },
      },
      update: { enabled: row.enabled },
      create: row,
    });
  }

  console.log("Seeding global policies...");
  for (const row of GLOBAL_POLICIES) {
    await prisma.globalPolicy.upsert({
      where: {
        region_notificationType_channel: {
          region: row.region,
          notificationType: row.notificationType,
          channel: row.channel,
        },
      },
      update: { enabled: row.enabled },
      create: row,
    });
  }

  console.log("Seed completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
