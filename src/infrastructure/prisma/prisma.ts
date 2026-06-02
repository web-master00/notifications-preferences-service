import { Prisma, PrismaClient } from "@prisma/client";

export type PrismaDb = PrismaClient | Prisma.TransactionClient;

export const prisma = new PrismaClient();
