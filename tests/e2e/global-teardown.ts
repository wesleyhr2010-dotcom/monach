import { getPrisma } from "./helpers/db";

/**
 * Playwright Global Teardown
 * Sweeps any leftover test data by prefix as a safety net.
 */
export default async function globalTeardown() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.warn("[E2E Teardown] DATABASE_URL not set — skipping cleanup");
    return;
  }

  const prisma = await getPrisma();

  try {
    // Delete any records created by E2E tests (identified by email/name prefix)
    const testPrefix = "e2e-";

    // Find and delete test resellers by email pattern
    const testResellers = await prisma.reseller.findMany({
      where: { email: { startsWith: testPrefix } },
      select: { id: true },
    });

    for (const r of testResellers) {
      await prisma.reseller.delete({ where: { id: r.id } }).catch(() => {
        // Ignore errors — may have cascade deletes
      });
    }

    // Find and delete test products by SKU pattern
    const testProducts = await prisma.product.findMany({
      where: { sku: { startsWith: testPrefix.toUpperCase() } },
      select: { id: true },
    });

    for (const p of testProducts) {
      await prisma.product.delete({ where: { id: p.id } }).catch(() => {
        // Ignore errors
      });
    }

    console.log(`[E2E Teardown] Cleaned up ${testResellers.length} leftover test resellers and ${testProducts.length} leftover test products.`);
  } catch (err) {
    console.warn("[E2E Teardown] Cleanup error (non-critical):", err);
  } finally {
    await prisma.$disconnect();
  }
}
