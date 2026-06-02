import { PrismaClient } from "@prisma/client";
import {
  TransactionalRepositories,
  UnitOfWork,
} from "../../domain/unit-of-work";
import { PrismaUserPreferenceRepository } from "../repositories/user-preference.repository";
import { PrismaQuietHoursRepository } from "../repositories/quiet-hours.repository";

export class PrismaUnitOfWork implements UnitOfWork {
  constructor(private readonly prisma: PrismaClient) {}

  run<T>(fn: (repos: TransactionalRepositories) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      const repos: TransactionalRepositories = {
        userPrefs: new PrismaUserPreferenceRepository(tx),
        quietHours: new PrismaQuietHoursRepository(tx),
      };
      return fn(repos);
    });
  }
}
