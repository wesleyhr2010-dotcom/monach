import { PrismaClient } from "@prisma/client";

/**
 * Prisma client for E2E tests.
 * Uses a fresh instance pointing to the test database.
 * Does NOT use the cached/extended prisma from src/lib/prisma.ts
 * to avoid triggering encryption extensions or middleware.
 */
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});
