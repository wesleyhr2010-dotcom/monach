import { test as base, expect } from "@playwright/test";
import { seedScenario, cleanupScenario } from "../helpers/seed";

interface SeededFixtures {
  seededReseller: {
    reseller: { id: string; email: string; name: string; slug: string };
    authUserId: string;
    maleta: { id: string; numero: number; status: string };
    products: { id: string; name: string; sku: string }[];
    password: string;
  };
}

export const test = base.extend<SeededFixtures>({
  /* eslint-disable react-hooks/rules-of-hooks */
  seededReseller: async ({}, useFixture) => {
    const scenario = await seedScenario();
    await useFixture({
      reseller: scenario.reseller,
      authUserId: scenario.resellerAuthId,
      maleta: scenario.maleta,
      products: scenario.products,
      password: "ResellerPass123!",
    });
    await cleanupScenario();
  },
  /* eslint-enable react-hooks/rules-of-hooks */
});

export { expect };
