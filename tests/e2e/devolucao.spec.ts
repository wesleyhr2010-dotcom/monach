import { test, expect } from "./fixtures/scenarios";
import { loginAsReseller } from "./helpers/auth";
import { navigateToMaleta } from "./helpers/navigation";

test.describe("Devolucao", () => {
  test("iniciar devolucao e acessar passos", async ({ page, seededReseller }) => {
    await loginAsReseller(page, seededReseller.reseller.email, seededReseller.password);
    await navigateToMaleta(page);

    // Click on active maleta
    await page.locator("text=Activa").first().click();
    await expect(page).toHaveURL(/\/app\/maleta\/.+/);

    // Click "Devolver Consignación"
    await page.locator("text=Devolver Consignación").click();
    await expect(page).toHaveURL(/\/app\/maleta\/.+\/devolver/);

    // Step 1: Resumen should show summary
    await expect(page.locator("text=Resumen")).toBeVisible();
    await expect(page.locator("text=Enviados")).toBeVisible();
    await expect(page.locator("text=Vendidos")).toBeVisible();
    await expect(page.locator("text=A devolver")).toBeVisible();
  });

  test("devolucao com upload de comprovante", async ({ page, seededReseller }) => {
    await loginAsReseller(page, seededReseller.reseller.email, seededReseller.password);
    await navigateToMaleta(page);

    await page.locator("text=Activa").first().click();
    await page.locator("text=Devolver Consignación").click();
    await expect(page).toHaveURL(/\/app\/maleta\/.+\/devolver/);

    // Step 1: Click Continue
    await page.locator("text=Continuar").click();

    // Step 2: Foto — use file upload instead of camera
    await expect(page.locator("text=Foto del Comprobante")).toBeVisible();

    // Upload a test image via the hidden file input
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "comprovante-test.jpg",
      mimeType: "image/jpeg",
      buffer: Buffer.from(
        // Minimal valid JPEG (1x1 pixel)
        "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAAA//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8Af//Z",
        "base64"
      ),
    });

    // Wait for preview to appear
    await expect(page.locator("text=Tomar Otra Foto")).toBeVisible();

    // Click Next to go to Step 3
    await page.locator("text=Siguiente: Revisar").click();

    // Step 3: Revisión Final
    await expect(page.locator("text=Revisión Final")).toBeVisible();
    await expect(page.locator("text=Comisión estimada")).toBeVisible();

    // Step 4: Submit devolucion
    await page.locator("text=Enviar Devolución").click();

    // Should reach success state
    await expect(page.locator("text=¡Devolución Enviada!")).toBeVisible();
  });
});
