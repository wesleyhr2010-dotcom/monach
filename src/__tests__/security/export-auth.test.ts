import { describe, it, expect, vi, beforeEach } from "vitest";
import { BusinessError } from "@/lib/action-utils";

// Mock requireAuth ANTES de importar os handlers
vi.mock("@/lib/user", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/user")>();
  return { ...mod, requireAuth: vi.fn() };
});

// Mock prisma para evitar conexão real ao banco
vi.mock("@/lib/prisma", () => ({
  prisma: {
    product: { findMany: vi.fn().mockResolvedValue([]) },
    reseller: { findMany: vi.fn().mockResolvedValue([]) },
    maleta: { findMany: vi.fn().mockResolvedValue([]) },
    analyticsAcesso: { findMany: vi.fn().mockResolvedValue([]) },
  },
}));

import { requireAuth } from "@/lib/user";
import { GET as exportGET } from "@/app/api/export/route";
import { GET as exportPdfGET } from "@/app/api/export/pdf/route";
import type { NextRequest } from "next/server";

const mockedRequireAuth = vi.mocked(requireAuth);

// Helper para criar NextRequest mock
function makeRequest(url: string): NextRequest {
  const req = new Request(url) as unknown as NextRequest;
  // Next.js route handlers expect nextUrl to be present
  const urlObj = new URL(url);
  (req as any).nextUrl = urlObj;
  return req;
}

describe("SEC-01 — Autenticação em rotas de export", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/export", () => {
    it("retorna 401 sem sessão (requireAuth lança)", async () => {
      mockedRequireAuth.mockRejectedValue(
        new BusinessError("Sesión no válida. Inicia sesión nuevamente.")
      );
      const req = makeRequest("http://localhost/api/export?type=produtos&format=csv");
      const res = await exportGET(req);
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe("No autorizado");
    });

    it("retorna 401 sem sessão para type=revendedoras (PII)", async () => {
      mockedRequireAuth.mockRejectedValue(
        new BusinessError("Sesión no válida. Inicia sesión nuevamente.")
      );
      const req = makeRequest("http://localhost/api/export?type=revendedoras&format=xlsx");
      const res = await exportGET(req);
      expect(res.status).toBe(401);
    });

    it("continua execução quando ADMIN autenticado", async () => {
      mockedRequireAuth.mockResolvedValue({
        id: "u1",
        email: "admin@monarca.com",
        profileId: "p1",
        name: "Admin",
        role: "ADMIN",
        isActive: true,
        colaboradoraId: null,
        rawUser: { id: "u1" },
      } as Awaited<ReturnType<typeof requireAuth>>);

      // type=produtos retorna 404 (sem dados no mock) — mas não 401
      const req = makeRequest("http://localhost/api/export?type=produtos&format=csv");
      const res = await exportGET(req);
      expect(res.status).not.toBe(401);
    });
  });

  describe("GET /api/export/pdf", () => {
    it("retorna 401 sem sessão (requireAuth lança)", async () => {
      mockedRequireAuth.mockRejectedValue(
        new BusinessError("Sesión no válida. Inicia sesión nuevamente.")
      );
      const req = makeRequest("http://localhost/api/export/pdf?type=resumo");
      const res = await exportPdfGET(req);
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe("No autorizado");
    });

    it("retorna 401 sem sessão para type=revendedoras (PII em PDF)", async () => {
      mockedRequireAuth.mockRejectedValue(
        new BusinessError("Sesión no válida. Inicia sesión nuevamente.")
      );
      const req = makeRequest("http://localhost/api/export/pdf?type=revendedoras");
      const res = await exportPdfGET(req);
      expect(res.status).toBe(401);
    });
  });
});
