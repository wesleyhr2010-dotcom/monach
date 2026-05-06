import type { PrismaClient as PrismaClientType } from "@/generated/prisma/client";

/**
 * Prisma client for E2E tests.
 * Uses a fresh instance pointing to the test database.
 * Does NOT use the cached/extended prisma from src/lib/prisma.ts
 * to avoid triggering encryption extensions or middleware.
 *
 * NOTE: Dynamic import is used to avoid ESM/CJS module conflicts
 * when Playwright transpiles test files.
 */
export async function getPrisma() {
  const { PrismaClient } = await import("@/generated/prisma/client");
  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  }) as PrismaClientType;
}
