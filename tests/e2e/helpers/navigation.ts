import type { Page } from "@playwright/test";

export async function navigateToMaleta(page: Page) {
  await page.goto("/app/maleta");
  await page.waitForLoadState("networkidle");
}

export async function navigateToHome(page: Page) {
  await page.goto("/app");
  await page.waitForLoadState("networkidle");
}

export async function waitForAppReady(page: Page) {
  // Wait for main content — AppHeader renders the reseller name
  await page.waitForSelector("text=Análisis", { timeout: 10000 });
}
