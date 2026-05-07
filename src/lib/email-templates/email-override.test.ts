import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Prisma - must use vi.hoisted for proper hoisting
const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    emailTemplate: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

// Mock sendEmail to capture calls
vi.mock("@/lib/emails", () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
}));

// Mock React.cache to execute immediately in tests
vi.mock("react", () => ({
  cache: (fn: (...args: unknown[]) => unknown) => fn,
}));

import { getEmailContent } from "@/lib/email-logic";
import { sendEmail } from "@/lib/emails";
import { emailAcertoConfirmado } from "@/lib/email-templates/acerto-confirmado";

describe("Email Override Integration", () => {
  const testTipo = "acerto_confirmado";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("ETML-07: Override System", () => {
    it("should use TypeScript fallback when no DB record exists", async () => {
      mockPrisma.emailTemplate.findUnique.mockResolvedValue(null);

      process.env.USE_EMAIL_DB_OVERRIDE = "true";

      const result = await getEmailContent(testTipo, {
        nome_revendedora: "María",
        maleta_numero: 123,
        valor_vendido: "1.500.000",
        comissao: "150.000",
        pct_comissao: 10,
        portal_url: "https://monarcasemijoyas.com.py/app/maleta",
      });

      // Should return null (no override)
      expect(result).toBeNull();

      process.env.USE_EMAIL_DB_OVERRIDE = "false";
    });

    it("should use DB override when active record exists", async () => {
      mockPrisma.emailTemplate.findUnique.mockResolvedValue({
        id: "test-1",
        tipo: "test_override_active",
        subject: "Asunto personalizado {nome_revendedora}",
        body_html: "<p>Contenido personalizado</p>",
        body_text: "Contenido en texto plano",
        preview: "Preview personalizado",
        greeting: "Hola {nome_revendedora},",
        ativo: true,
      });

      process.env.USE_EMAIL_DB_OVERRIDE = "true";

      const result = await getEmailContent("test_override_active", {
        nome_revendedora: "María",
      });

      expect(result).not.toBeNull();
      expect(result!.subject).toContain("María");
      expect(result!.html).toContain("Contenido personalizado");
      expect(result!.text).toContain("Contenido en texto plano");

      process.env.USE_EMAIL_DB_OVERRIDE = "false";
    });

    it("should fallback when override is inactive (ativo: false)", async () => {
      // findUnique is called with where: { tipo, ativo: true }, so inactive records won't be found
      mockPrisma.emailTemplate.findUnique.mockResolvedValue(null);

      process.env.USE_EMAIL_DB_OVERRIDE = "true";

      const result = await getEmailContent("test_override_inactive", {
        nome_revendedora: "María",
      });

      // Should return null because override is inactive (query includes ativo: true)
      expect(result).toBeNull();

      process.env.USE_EMAIL_DB_OVERRIDE = "false";
    });

    it("should fallback when override is deleted", async () => {
      mockPrisma.emailTemplate.findUnique.mockResolvedValue(null);

      process.env.USE_EMAIL_DB_OVERRIDE = "true";

      const result = await getEmailContent("test_override_deleted", {
        nome_revendedora: "María",
      });

      // Should return null because override was deleted
      expect(result).toBeNull();

      process.env.USE_EMAIL_DB_OVERRIDE = "false";
    });

    it("should correctly interpolate variables from DB override", async () => {
      mockPrisma.emailTemplate.findUnique.mockResolvedValue({
        id: "test-2",
        tipo: "acerto_confirmado", // Use a real tipo that has maleta_numero in whitelist
        subject: "Consignación #{maleta_numero} — {nome_revendedora}",
        body_html: "<p>Vendiste {valor_vendido} y tu comisión es {comissao}</p>",
        body_text: null,
        preview: null,
        greeting: "Hola {nome_revendedora},",
        ativo: true,
      });

      process.env.USE_EMAIL_DB_OVERRIDE = "true";

      const result = await getEmailContent("acerto_confirmado", {
        nome_revendedora: "Ana López",
        maleta_numero: 456,
        valor_vendido: "2.000.000",
        comissao: "200.000",
        pct_comissao: 10,
        portal_url: "https://example.com",
      });

      expect(result).not.toBeNull();
      expect(result!.subject).toContain("456");
      expect(result!.subject).toContain("Ana López");
      expect(result!.html).toContain("2.000.000");
      expect(result!.html).toContain("200.000");

      process.env.USE_EMAIL_DB_OVERRIDE = "false";
    });

    it("should integrate with emailAcertoConfirmado function", async () => {
      mockPrisma.emailTemplate.findUnique.mockResolvedValue({
        id: "test-3",
        tipo: "acerto_confirmado",
        subject: "✅ Tu comisión de {comissao} — Consignación #{maleta_numero}",
        body_html: "<p>Personalizado: {nome_revendedora} vendió {valor_vendido}</p>",
        body_text: null,
        preview: "Consignación confirmada",
        greeting: "Estimada {nome_revendedora},",
        ativo: true,
      });

      process.env.USE_EMAIL_DB_OVERRIDE = "true";

      await emailAcertoConfirmado(
        "test@revendedora.com",
        "María González",
        789,
        "3.000.000",
        "300.000",
        10
      );

      // Verify sendEmail was called with override content
      expect(sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining("300.000"),
          htmlContent: expect.stringContaining("María González"),
          textContent: expect.any(String),
        })
      );

      process.env.USE_EMAIL_DB_OVERRIDE = "false";
    });
  });
});
