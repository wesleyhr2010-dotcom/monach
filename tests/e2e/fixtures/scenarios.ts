import { test as base, expect } from "@playwright/test";
import { seedScenario, cleanupScenario } from "../helpers/seed";
import type { Reseller, Maleta, Product } from "@/generated/prisma/client";

interface SeededFixtures {
  seededReseller: {
    reseller: Reseller;
    authUserId: string;
    maleta: Maleta;
    products: Product[];
    password: string;
  };
}

export const test = base.extend<SeededFixtures>({
  seededReseller: async ({}, use) => {
    const scenario = await seedScenario();
    await use({
      reseller: scenario.reseller,
      authUserId: scenario.resellerAuthId,
      maleta: scenario.maleta,
      products: scenario.products,
      password: "ResellerPass123!",
    });
    await cleanupScenario();
  },
});

export { expect };
