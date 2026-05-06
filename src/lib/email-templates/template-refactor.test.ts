import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  emailConviteUsuario,
  emailCandidaturaAprovada,
  emailCandidaturaRechazada,
  emailAcertoConfirmado,
  emailDocumentoAprovado,
  emailDocumentoPendente,
  emailDocumentoRejeitado,
} from "./index";
import * as emailsModule from "../emails";

// Mock sendEmail para evitar envios reais durante os testes
vi.mock("../emails", () => ({
  sendEmail: vi.fn(),
}));

const sendEmailMock = vi.mocked(emailsModule.sendEmail);

function getLastCall() {
  return sendEmailMock.mock.calls[0][0] as {
    htmlContent: string;
    textContent: string;
    subject: string;
  };
}

describe("email-templates regression", () => {
  beforeEach(() => {
    sendEmailMock.mockClear();
  });

  describe("emailConviteUsuario", () => {
    it("retorna EmailContent com html e text não vazios", async () => {
      const result = await emailConviteUsuario({
        email: "test@example.com",
        nome: "María",
        linkDefinirSenha: "https://example.com/reset",
        senhaTemporaria: "Temp1234",
        tipo: "revendedora",
      });

      expect(result).toHaveProperty("html");
      expect(result).toHaveProperty("text");
      expect(typeof result.html).toBe("string");
      expect(typeof result.text).toBe("string");
      expect(result.html.length).toBeGreaterThan(0);
      expect(result.text.length).toBeGreaterThan(0);
    });

    it("chama sendEmail com htmlContent e textContent", async () => {
      await emailConviteUsuario({
        email: "test@example.com",
        nome: "María",
        linkDefinirSenha: null,
        senhaTemporaria: "Temp1234",
        tipo: "consultora",
      });

      expect(sendEmailMock).toHaveBeenCalledOnce();
      const call = getLastCall();
      expect(call).toHaveProperty("htmlContent");
      expect(call).toHaveProperty("textContent");
      expect(typeof call.htmlContent).toBe("string");
      expect(typeof call.textContent).toBe("string");
      expect(call.htmlContent).not.toBe("");
      expect(call.textContent).not.toBe("");
    });

    it("textContent contém 'Contraseña temporal:'", async () => {
      const result = await emailConviteUsuario({
        email: "test@example.com",
        nome: "María",
        linkDefinirSenha: null,
        senhaTemporaria: "Temp1234",
        tipo: "revendedora",
      });

      expect(result.text).toContain("Contraseña temporal:");
    });

    it("htmlContent contém DOCTYPE e logo Monarca", async () => {
      const result = await emailConviteUsuario({
        email: "test@example.com",
        nome: "María",
        linkDefinirSenha: null,
        senhaTemporaria: "Temp1234",
        tipo: "revendedora",
      });

      expect(result.html).toContain("<!DOCTYPE html>");
      expect(result.html).toContain("Monarca Semijoyas");
      expect(result.html).toContain('alt="Monarca Semijoyas"');
    });

    it("textContent não contém tags HTML (<)", async () => {
      const result = await emailConviteUsuario({
        email: "test@example.com",
        nome: "María",
        linkDefinirSenha: null,
        senhaTemporaria: "Temp1234",
        tipo: "revendedora",
      });

      expect(result.text).not.toMatch(/</);
    });
  });

  describe("emailCandidaturaAprovada", () => {
    it("retorna EmailContent com html e text", async () => {
      const result = await emailCandidaturaAprovada({
        email: "test@example.com",
        nome: "Ana",
        senhaTemp: "Pass1234",
      });

      expect(result.html.length).toBeGreaterThan(0);
      expect(result.text.length).toBeGreaterThan(0);
    });

    it("chama sendEmail com htmlContent e textContent", async () => {
      await emailCandidaturaAprovada({
        email: "test@example.com",
        nome: "Ana",
        senhaTemp: "Pass1234",
      });

      expect(sendEmailMock).toHaveBeenCalledOnce();
      const call = getLastCall();
      expect(call.htmlContent).not.toBe("");
      expect(call.textContent).not.toBe("");
    });
  });

  describe("emailCandidaturaRechazada", () => {
    it("retorna EmailContent sem emojis", async () => {
      const result = await emailCandidaturaRechazada({
        email: "test@example.com",
        nome: "Lucía",
      });

      const emojiRegex = /[\u{1F300}-\u{1F9FF}]/u;
      expect(result.html).not.toMatch(emojiRegex);
      expect(result.text).not.toMatch(emojiRegex);
    });

    it("chama sendEmail com htmlContent e textContent", async () => {
      await emailCandidaturaRechazada({
        email: "test@example.com",
        nome: "Lucía",
      });

      expect(sendEmailMock).toHaveBeenCalledOnce();
      const call = getLastCall();
      expect(call.htmlContent).not.toBe("");
      expect(call.textContent).not.toBe("");
    });

    it("não contém exclamação na saudação", async () => {
      const result = await emailCandidaturaRechazada({
        email: "test@example.com",
        nome: "Lucía",
      });

      expect(result.html).toContain("Hola Lucía,");
      expect(result.html).not.toContain("¡Hola");
    });
  });

  describe("emailAcertoConfirmado", () => {
    it("retorna EmailContent com tabela visual", async () => {
      const result = await emailAcertoConfirmado(
        "test@example.com",
        "Carla",
        42,
        "Gs. 1.500.000",
        "Gs. 300.000",
        20
      );

      expect(result.html).toContain("<table");
      expect(result.html).toContain("Total vendido");
      expect(result.html).toContain("Tu comisión");
    });

    it("highlightRow aplica background na linha de comissão", async () => {
      const result = await emailAcertoConfirmado(
        "test@example.com",
        "Carla",
        42,
        "Gs. 1.500.000",
        "Gs. 300.000",
        20
      );

      expect(result.html).toContain("background:#fff8e7");
    });

    it("textContent contém 'Total vendido:' e 'Tu comisión:'", async () => {
      const result = await emailAcertoConfirmado(
        "test@example.com",
        "Carla",
        42,
        "Gs. 1.500.000",
        "Gs. 300.000",
        20
      );

      expect(result.text).toContain("Total vendido:");
      expect(result.text).toContain("Tu comisión (20%):");
    });

    it("chama sendEmail com htmlContent e textContent", async () => {
      await emailAcertoConfirmado(
        "test@example.com",
        "Carla",
        42,
        "Gs. 1.500.000",
        "Gs. 300.000",
        20
      );

      expect(sendEmailMock).toHaveBeenCalledOnce();
      const call = getLastCall();
      expect(call.htmlContent).not.toBe("");
      expect(call.textContent).not.toBe("");
    });
  });

  describe("emailDocumentoAprovado", () => {
    it("retorna EmailContent com html e text", async () => {
      const result = await emailDocumentoAprovado(
        "test@example.com",
        "Sofía",
        "Cédula de identidad"
      );

      expect(result.html.length).toBeGreaterThan(0);
      expect(result.text.length).toBeGreaterThan(0);
    });

    it("chama sendEmail com htmlContent e textContent", async () => {
      await emailDocumentoAprovado(
        "test@example.com",
        "Sofía",
        "Cédula de identidad"
      );

      expect(sendEmailMock).toHaveBeenCalledOnce();
      const call = getLastCall();
      expect(call.htmlContent).not.toBe("");
      expect(call.textContent).not.toBe("");
    });
  });

  describe("emailDocumentoPendente", () => {
    it("retorna EmailContent com subject contendo 📄", async () => {
      await emailDocumentoPendente(
        "Julieta",
        "uuid-123",
        "Comprobante de domicilio",
        [{ email: "admin@example.com", name: "Admin" }]
      );

      expect(sendEmailMock).toHaveBeenCalledOnce();
      const call = sendEmailMock.mock.calls[0][0];
      expect(call.subject).toContain("📄");
    });

    it("chama sendEmail com htmlContent e textContent", async () => {
      await emailDocumentoPendente(
        "Julieta",
        "uuid-123",
        "Comprobante de domicilio",
        [{ email: "admin@example.com", name: "Admin" }]
      );

      expect(sendEmailMock).toHaveBeenCalledOnce();
      const call = getLastCall();
      expect(call.htmlContent).not.toBe("");
      expect(call.textContent).not.toBe("");
    });
  });

  describe("emailDocumentoRejeitado", () => {
    it("retorna EmailContent com alerta de warning", async () => {
      const result = await emailDocumentoRejeitado(
        "test@example.com",
        "Martina",
        "Cédula de identidad",
        "La imagen no es legible."
      );

      expect(result.html).toContain("border-left:4px solid #C9A84C");
    });

    it("chama sendEmail com htmlContent e textContent", async () => {
      await emailDocumentoRejeitado(
        "test@example.com",
        "Martina",
        "Cédula de identidad",
        "La imagen no es legible."
      );

      expect(sendEmailMock).toHaveBeenCalledOnce();
      const call = getLastCall();
      expect(call.htmlContent).not.toBe("");
      expect(call.textContent).not.toBe("");
    });
  });
});
