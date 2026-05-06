import { test, expect } from "./fixtures/scenarios";
import { loginAsReseller } from "./helpers/auth";
import { generateRecoveryLink } from "./helpers/email";

test.describe("Recuperar Contraseña", () => {
  test("solicitar recuperación de senha", async ({ page, seededReseller }) => {
    await page.goto("/app/login");

    // Click "Olvidé mi contraseña"
    await page.locator("text=Olvidé mi contraseña").click();
    await expect(page).toHaveURL("/app/login/recuperar-contrasena");

    // Fill email
    await page.fill('input[id="email"]', seededReseller.reseller.email);

    // Submit
    await page.click('button[type="submit"]');

    // Assert success message
    await expect(page.locator("text=¡Correo enviado!")).toBeVisible();
    await expect(page.locator(`text=${seededReseller.reseller.email}`)).toBeVisible();
  });

  test("redefinir senha com token válido", async ({ page, seededReseller }) => {
    // Generate recovery link via admin API
    const recoveryLink = await generateRecoveryLink(seededReseller.reseller.email);

    // Navigate to the recovery link
    await page.goto(recoveryLink);

    // Wait for verification
    await expect(page.locator("text=Crear nueva contraseña")).toBeVisible();

    // Fill new password
    const newPassword = "NovaSenha123!";
    await page.fill('input[id="password"]', newPassword);
    await page.fill('input[id="confirm"]', newPassword);

    // Submit
    await page.click('button[type="submit"]');

    // Assert success
    await expect(page.locator("text=¡Contraseña actualizada!")).toBeVisible();
  });

  test("login com nova senha", async ({ page, seededReseller }) => {
    // First reset the password
    const recoveryLink = await generateRecoveryLink(seededReseller.reseller.email);
    await page.goto(recoveryLink);
    await expect(page.locator("text=Crear nueva contraseña")).toBeVisible();

    const newPassword = "NovaSenha456!";
    await page.fill('input[id="password"]', newPassword);
    await page.fill('input[id="confirm"]', newPassword);
    await page.click('button[type="submit"]');
    await expect(page.locator("text=¡Contraseña actualizada!")).toBeVisible();

    // Now log in with the new password
    await loginAsReseller(page, seededReseller.reseller.email, newPassword);
    await expect(page).toHaveURL("/app");
    await expect(page.locator("text=Análisis")).toBeVisible();
  });

  test("token inválido mostra erro", async ({ page }) => {
    // Navigate to reset page with an invalid token
    await page.goto("/app/nueva-contrasena?code=invalid-token-12345");

    // Should show error state
    await expect(page.locator("text=El enlace puede haber vencido")).toBeVisible();
  });
});
