import { test, expect } from "./fixtures/scenarios";
import { loginAsReseller, logout } from "./helpers/auth";

test.describe("Login", () => {
  test("login com credenciais válidas redireciona para /app", async ({ page, seededReseller }) => {
    await loginAsReseller(page, seededReseller.reseller.email, seededReseller.password);
    await expect(page).toHaveURL("/app");
    // Assert greeting or dashboard content is visible
    await expect(page.locator("text=Análisis")).toBeVisible();
  });

  test("login com senha errada exibe erro", async ({ page, seededReseller }) => {
    await page.goto("/app/login");
    await page.fill('input[id="email"]', seededReseller.reseller.email);
    await page.fill('input[id="password"]', "senha-errada-123");
    await page.click('button[type="submit"]');

    // Should stay on login page
    await expect(page).toHaveURL("/app/login");
    // Error message should appear
    await expect(page.locator("text=E-mail ou senha incorretos.")).toBeVisible();
  });

  test("logout redireciona para login", async ({ page, seededReseller }) => {
    await loginAsReseller(page, seededReseller.reseller.email, seededReseller.password);
    await logout(page);
    await expect(page).toHaveURL("/app/login");
  });
});
