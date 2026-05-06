import type { Page } from "@playwright/test";

/**
 * Authentication helpers for E2E tests.
 * All helpers fill the actual login forms and submit them.
 */

export async function loginAsReseller(
  page: Page,
  email: string,
  password: string
) {
  await page.goto("/app/login");
  await page.waitForSelector('input[id="email"]');
  await page.fill('input[id="email"]', email);
  await page.fill('input[id="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL("/app", { timeout: 10000 });
  // Ensure the page is fully loaded
  await page.waitForLoadState("networkidle");
}

export async function loginAsAdmin(
  page: Page,
  email: string,
  password: string
) {
  await page.goto("/admin/login");
  await page.waitForSelector('input[id="email"]');
  await page.fill('input[id="email"]', email);
  await page.fill('input[id="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL("/admin", { timeout: 10000 });
  await page.waitForLoadState("networkidle");
}

export async function loginAsColaboradora(
  page: Page,
  email: string,
  password: string
) {
  // Colaboradoras use the same login route as admins
  await loginAsAdmin(page, email, password);
}

export async function logout(page: Page) {
  // Navigate to logout endpoint or click logout button
  // The app uses a Server Action for logout; we navigate to the login page
  // which will clear the session if middleware handles it, or we just clear cookies
  await page.goto("/app/login");
  await page.context().clearCookies();
}
