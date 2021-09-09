import { PrismaClient } from '@prisma/client';

let prisma;

export function client(): PrismaClient {
  if (prisma) return prisma;

  // Always log errors
  prisma = new PrismaClient({
    log: ['error'],
  });

  return prisma;
}
