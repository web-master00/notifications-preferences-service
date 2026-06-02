import { PrismaClient } from "@prisma/client";
import { buildAppGraph } from "./app-graph";
import { prisma as defaultPrisma } from "./infrastructure/prisma/prisma";
import { PrismaDefaultPreferenceRepository } from "./infrastructure/repositories/default-preference.repository";
import { PrismaUserPreferenceRepository } from "./infrastructure/repositories/user-preference.repository";
import { PrismaQuietHoursRepository } from "./infrastructure/repositories/quiet-hours.repository";
import { PrismaGlobalPolicyRepository } from "./infrastructure/repositories/global-policy.repository";
import { PrismaUnitOfWork } from "./infrastructure/unit-of-work/prisma.unit-of-work";
import { createRouter } from "./api/routes/router";
import { logger as defaultLogger, Logger } from "./infrastructure/logger";

export interface Container {
  prisma: PrismaClient;
  logger: Logger;
  router: ReturnType<typeof createRouter>;
}

export function buildContainer(
  prismaOverride?: PrismaClient,
  loggerOverride?: Logger,
): Container {
  const prisma = prismaOverride ?? defaultPrisma;
  const logger = loggerOverride ?? defaultLogger;

  const repos = {
    defaults: new PrismaDefaultPreferenceRepository(prisma),
    userPrefs: new PrismaUserPreferenceRepository(prisma),
    quietHours: new PrismaQuietHoursRepository(prisma),
    globalPolicies: new PrismaGlobalPolicyRepository(prisma),
  };
  const uow = new PrismaUnitOfWork(prisma);

  const graph = buildAppGraph(repos, uow, logger);

  const router = createRouter({
    preferences: graph.preferencesController,
    evaluate: graph.evaluateController,
    logger,
    prisma,
  });

  return { prisma, logger, router };
}
