import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

/**
 * Prisma client for E2E tests.
 * Uses a fresh instance pointing to the test database.
 * Does NOT use the cached/extended prisma from src/lib/prisma.ts
 * to avoid triggering encryption extensions or middleware.
 *
 * NOTE: PrismaClient is loaded via dynamic import to avoid ESM/CJS
 * module conflicts when Playwright transpiles test files.
 */
export async function getPrisma() {
  const { PrismaClient } = await import("@/generated/prisma/client");

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: ["error"],
  });
}
