import { test, expect } from "./fixtures/scenarios";
import { loginAsReseller } from "./helpers/auth";
import { navigateToMaleta } from "./helpers/navigation";

test.describe("Venda", () => {
  test("registrar venda incrementa quantidade vendida", async ({ page, seededReseller }) => {
    await loginAsReseller(page, seededReseller.reseller.email, seededReseller.password);
    await navigateToMaleta(page);

    // Click on the active maleta
    await page.locator("text=Activa").first().click();
    await expect(page).toHaveURL(/\/app\/maleta\/.+/);

    // Click "Registrar Venta"
    await page.locator("text=Registrar Venta").click();
    await expect(page).toHaveURL(/\/app\/maleta\/.+\/registrar-venta/);

    // Fill client name
    await page.fill('input[placeholder="Ej: Maria Pérez"]', "Cliente Teste E2E");

    // Fill client phone
    await page.fill('input[placeholder="+595 991 123456"]', "+595981111111");

    // Select first available item
    const firstItem = page.locator("button").filter({ hasText: /Produto E2E/ }).first();
    await firstItem.click();

    // Submit sale
    await page.locator("text=Confirmar Venta").click();

    // Should redirect back to maleta detail
    await expect(page).toHaveURL(/\/app\/maleta\/.+/);
  });

  test("venda sem selecionar item mostra erro", async ({ page, seededReseller }) => {
    await loginAsReseller(page, seededReseller.reseller.email, seededReseller.password);
    await navigateToMaleta(page);

    await page.locator("text=Activa").first().click();
    await page.locator("text=Registrar Venta").click();
    await expect(page).toHaveURL(/\/app\/maleta\/.+\/registrar-venta/);

    // Fill client name but don't select item
    await page.fill('input[placeholder="Ej: Maria Pérez"]', "Cliente Teste E2E");
    await page.fill('input[placeholder="+595 991 123456"]', "+595981111111");

    // Try to submit — button should be disabled
    const submitButton = page.locator("text=Confirmar Venta");
    await expect(submitButton).toBeDisabled();
  });

  test("venda sem nombre de cliente mostra erro", async ({ page, seededReseller }) => {
    await loginAsReseller(page, seededReseller.reseller.email, seededReseller.password);
    await navigateToMaleta(page);

    await page.locator("text=Activa").first().click();
    await page.locator("text=Registrar Venta").click();

    // Select item but leave client name empty
    const firstItem = page.locator("button").filter({ hasText: /Produto E2E/ }).first();
    await firstItem.click();

    // Submit button should be disabled because name is empty
    const submitButton = page.locator("text=Confirmar Venta");
    await expect(submitButton).toBeDisabled();
  });
});
