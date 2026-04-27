import { describe, it, expect } from "vitest";
import { isModalRoute } from "@/components/app/transitions/useTransitionRouter";

// ============================================================
// Testes unitários — isModalRoute
// Ref: docs/sistema/SPEC_TRANSICOES_TELAS.md §1.3, §3.2
// ============================================================

describe("isModalRoute", () => {
  describe("rotas que são modal sheet", () => {
    it.each([
      "/app/maleta/abc123/registrar-venta",
      "/app/maleta/550e8400-e29b-41d4-a716-446655440000/registrar-venta",
      "/app/maleta/abc/devolver",
      "/app/maleta/abc/devolver/",
      "/app/catalogo/compartir",
    ])("'%s' deve ser modal", (path) => {
      expect(isModalRoute(path)).toBe(true);
    });
  });

  describe("rotas que NÃO são modal sheet", () => {
    it.each([
      "/app",
      "/app/maleta",
      "/app/maleta/abc123",
      "/app/catalogo",
      "/app/mais",
      "/app/perfil",
      "/app/notificaciones",
      "/app/progreso",
      // "registrar-venta" não é modal se não for o segmento final
      "/app/maleta/registrar-venta/outra-rota",
    ])("'%s' não deve ser modal", (path) => {
      expect(isModalRoute(path)).toBe(false);
    });
  });
});
