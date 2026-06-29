import { PrismaClient } from '@prisma/client';

// A single PrismaClient instance reused across hot-reloads (dev) and warm
// serverless invocations. Instantiating a new client per request exhausts the
// database connection pool ("too many connections").
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
