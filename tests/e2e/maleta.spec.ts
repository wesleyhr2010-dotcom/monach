import { test, expect } from "./fixtures/scenarios";
import { loginAsReseller } from "./helpers/auth";
import { navigateToMaleta } from "./helpers/navigation";

test.describe("Maleta", () => {
  test("visualizar maleta ativa", async ({ page, seededReseller }) => {
    await loginAsReseller(page, seededReseller.reseller.email, seededReseller.password);
    await navigateToMaleta(page);

    // Assert maleta list page is visible
    await expect(page.locator("text=MIS CONSIGNACIONES")).toBeVisible();
    // Assert at least one maleta card/item is visible (by status text)
    await expect(page.locator("text=Activa")).toBeVisible();
  });

  test("acessar detalhes da maleta", async ({ page, seededReseller }) => {
    await loginAsReseller(page, seededReseller.reseller.email, seededReseller.password);
    await navigateToMaleta(page);

    // Click on the active maleta card
    await page.locator("text=Activa").first().click();

    // Assert URL contains /app/maleta/
    await expect(page).toHaveURL(/\/app\/maleta\/.+/);

    // Assert page shows product items header
    await expect(page.locator("text=Artículos")).toBeVisible();

    // Assert "Registrar Venta" button is visible
    await expect(page.locator("text=Registrar Venta")).toBeVisible();

    // Assert "Devolver" button is visible
    await expect(page.locator("text=Devolver Consignación")).toBeVisible();
  });
});
