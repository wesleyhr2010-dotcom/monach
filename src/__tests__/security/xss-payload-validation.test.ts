import { describe, it, expect, vi, beforeEach } from "vitest";
import { htmlToPlainText, substituirVariaveis } from "@/lib/notifications-shared";
import { sanitizeTemplateVars } from "@/lib/notifications-server";

// Mock do sendPushNotification para testar enviarPushSePermitido sem chamar API externa
vi.mock("@/lib/onesignal-server", () => ({
  sendPushNotification: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    notificacaoPreferencia: {
      findUnique: vi.fn(),
    },
  },
}));

import { sendPushNotification } from "@/lib/onesignal-server";
import { prisma } from "@/lib/prisma";
import { enviarPushSePermitido } from "@/lib/notifications";

const mockedPrisma = prisma as unknown as {
  notificacaoPreferencia: { findUnique: ReturnType<typeof vi.fn> };
};

describe("XSS Payload Validation — Notification Paths", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("htmlToPlainText", () => {
    it("remove script tags completamente", () => {
      const input = "<script>alert('xss')</script>Hello";
      // htmlToPlainText strip tags mas preserva o texto interno
      expect(htmlToPlainText(input)).toBe("alert('xss')Hello");
    });

    it("converte <b>bold</b> para plain text", () => {
      expect(htmlToPlainText("<b>bold</b>")).toBe("bold");
    });

    it("converte <br> para nova linha", () => {
      expect(htmlToPlainText("Line1<br>Line2")).toBe("Line1\nLine2");
    });

    it("converte parágrafos para dupla nova linha", () => {
      expect(htmlToPlainText("<p>Para 1</p><p>Para 2</p>")).toBe("Para 1\n\nPara 2");
    });

    it("remove atributos perigosos", () => {
      const input = '<div onclick="alert(1)">text</div>';
      expect(htmlToPlainText(input)).toBe("text");
    });
  });

  describe("sanitizeTemplateVars", () => {
    it("remove scripts de template com variáveis", () => {
      const input = "<script>alert('xss')</script>";
      expect(sanitizeTemplateVars(input)).not.toContain("<script>");
    });

    it("permite tags de formatação básica", () => {
      const input = "<b>bold</b> <i>italic</i> <a href='https://example.com'>link</a>";
      const sanitized = sanitizeTemplateVars(input);
      expect(sanitized).toContain("<b>bold</b>");
      expect(sanitized).toContain("<i>italic</i>");
      expect(sanitized).toContain("<a href=\"https://example.com\">link</a>");
    });

    it("remove event handlers de tags permitidas", () => {
      const input = '<b onclick="alert(1)">bold</b>';
      expect(sanitizeTemplateVars(input)).toBe("<b>bold</b>");
    });
  });

  describe("substituirVariaveis", () => {
    it("não executa código quando variável contém HTML", () => {
      const template = "Olá {nome}";
      const result = substituirVariaveis(template, { nome: "<script>alert('xss')</script>" });
      expect(result).toContain("<script>");
      // A função não sanitiza — sanitização é responsabilidade do caller (DOMPurify)
      expect(result).toBe("Olá <script>alert('xss')</script>");
    });

    it("whitelist protege contra injection de chaves não esperadas", () => {
      const template = "{maleta_id} {dias_restantes} {script}";
      const result = substituirVariaveis(
        template,
        { maleta_id: "123", dias_restantes: "5", script: "evil" },
        ["maleta_id", "dias_restantes"]
      );
      expect(result).toBe("123 5 {script}");
    });
  });

  describe("enviarPushSePermitido — plain-text enforcement", () => {
    it("envia push com HTML strip aplicado", async () => {
      mockedPrisma.notificacaoPreferencia.findUnique.mockResolvedValue({
        nova_maleta: true,
        prazo_proximo: true,
        maleta_atrasada: true,
        acerto_confirmado: true,
        brinde_entregue: true,
        pontos_ganhos: true,
      });

      await enviarPushSePermitido("user-123", "reseller-1", "nova_maleta", "<b>Título</b>", "<p>Mensagem</p>");

      expect(sendPushNotification).toHaveBeenCalledWith(
        ["user-123"],
        "Título",
        "Mensagem"
      );
    });

    it("não envia push se auth_user_id for nulo", async () => {
      await enviarPushSePermitido(null, "reseller-1", "nova_maleta", "Título", "Mensagem");
      expect(sendPushNotification).not.toHaveBeenCalled();
    });
  });
});
