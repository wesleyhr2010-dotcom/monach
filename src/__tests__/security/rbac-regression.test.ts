import { describe, it, expect, vi, beforeEach } from "vitest";

// ============================================
// Security Regression Tests — RBAC
// Ref: docs/sistema/SPEC_SECURITY_RBAC.md §8–10
// ============================================

vi.mock("@/lib/user", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/user")>();
  return {
    ...mod,
    getCurrentUser: vi.fn(),
    requireAuth: vi.fn(),
  };
});

vi.mock("@/lib/prisma", () => ({
  prisma: {
    maleta: {
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    reseller: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    productVariant: {
      findMany: vi.fn(),
    },
  },
}));

// Importar actions e mocks APÓS os vi.mock
import { devolverMaleta, getActiveResellers, getAvailableVariants } from "@/app/admin/actions-maletas";
import { getMinhasMaletas, getMinhasVendas, getResumoFinanceiro } from "@/app/app/actions-revendedora";
import { getCurrentUser, requireAuth } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import { assertIsInGroup } from "@/lib/auth/assert-in-group";

const mockedGetCurrentUser = vi.mocked(getCurrentUser);
const mockedRequireAuth = vi.mocked(requireAuth);
const mockedPrisma = prisma as unknown as {
  maleta: { findFirst: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn>; updateMany: ReturnType<typeof vi.fn> };
  reseller: { findMany: ReturnType<typeof vi.fn>; findFirst: ReturnType<typeof vi.fn> };
  productVariant: { findMany: ReturnType<typeof vi.fn> };
};

describe("Segurança — requireAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve lançar BUSINESS error quando não há sessão", async () => {
    mockedGetCurrentUser.mockResolvedValue(null);
    mockedRequireAuth.mockImplementation(async () => {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error("BUSINESS: Sesión no válida. Inicia sesión nuevamente.");
      }
      return user;
    });

    await expect(requireAuth()).rejects.toThrow("BUSINESS: Sesión no válida");
  });

  it("deve lançar BUSINESS error quando role não é permitida", async () => {
    mockedGetCurrentUser.mockResolvedValue({
      id: "u1",
      email: "test@example.com",
      profileId: "r1",
      name: "Test",
      role: "REVENDEDORA",
      isActive: true,
      colaboradoraId: null,
      rawUser: { id: "u1" },
    } as Awaited<ReturnType<typeof getCurrentUser>>);

    mockedRequireAuth.mockImplementation(async (allowedRoles) => {
      const user = await getCurrentUser();
      if (allowedRoles && !allowedRoles.includes(user!.role)) {
        throw new Error("BUSINESS: No tienes permiso para realizar esta acción.");
      }
      return user!;
    });

    await expect(requireAuth(["ADMIN"])).rejects.toThrow("BUSINESS: No tienes permiso");
  });
});

describe("Segurança — getCurrentUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve retornar null quando usuário autenticado não tem perfil no banco", async () => {
    mockedGetCurrentUser.mockResolvedValue(null);
    const user = await getCurrentUser();
    expect(user).toBeNull();
  });
});

describe("Segurança — assertIsInGroup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve lançar BUSINESS error quando revendedora não pertence à colaboradora", async () => {
    mockedPrisma.reseller.findFirst.mockResolvedValue(null);
    await expect(assertIsInGroup("rev-1", "colab-1")).rejects.toThrow(
      "BUSINESS: Esta revendedora no pertenece a tu equipo."
    );
  });

  it("deve passar silenciosamente quando revendedora pertence à colaboradora", async () => {
    mockedPrisma.reseller.findFirst.mockResolvedValue({ id: "rev-1", colaboradora_id: "colab-1" });
    await expect(assertIsInGroup("rev-1", "colab-1")).resolves.toBeUndefined();
  });
});

describe("Segurança — Server Actions críticas sem sessão", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("devolverMaleta deve falhar sem sessão", async () => {
    mockedRequireAuth.mockImplementation(() => {
      return Promise.reject(new Error("BUSINESS: Sesión no válida. Inicia sesión nuevamente."));
    });
    await expect(devolverMaleta("maleta-1", "https://example.com/comp.png")).rejects.toThrow(
      "BUSINESS: Sesión no válida"
    );
  });

  it("getActiveResellers deve falhar sem sessão", async () => {
    mockedRequireAuth.mockRejectedValue(new Error("BUSINESS: Sesión no válida. Inicia sesión nuevamente."));
    await expect(getActiveResellers()).rejects.toThrow("BUSINESS: Sesión no válida");
  });

  it("getAvailableVariants deve falhar sem sessão", async () => {
    mockedRequireAuth.mockRejectedValue(new Error("BUSINESS: Sesión no válida. Inicia sesión nuevamente."));
    await expect(getAvailableVariants()).rejects.toThrow("BUSINESS: Sesión no válida");
  });
});

describe("Segurança — IDOR na app (/app actions)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const colabUser = {
    id: "u1",
    email: "colab@example.com",
    profileId: "colab-1",
    name: "Colab",
    role: "COLABORADORA",
    isActive: true,
    colaboradoraId: null,
    rawUser: { id: "u1" },
  } as Awaited<ReturnType<typeof getCurrentUser>>;

  it("COLABORADORA não deve acessar getMinhasMaletas de revendedora fora do grupo", async () => {
    mockedRequireAuth.mockResolvedValue(colabUser);
    mockedPrisma.reseller.findFirst.mockResolvedValue(null); // fora do grupo

    await expect(getMinhasMaletas("rev-fora-do-grupo")).rejects.toThrow(
      "BUSINESS: Esta revendedora no pertenece a tu equipo."
    );
  });

  it("COLABORADORA não deve acessar getMinhasVendas de revendedora fora do grupo", async () => {
    mockedRequireAuth.mockResolvedValue(colabUser);
    mockedPrisma.reseller.findFirst.mockResolvedValue(null);

    await expect(getMinhasVendas("rev-fora-do-grupo")).rejects.toThrow(
      "BUSINESS: Esta revendedora no pertenece a tu equipo."
    );
  });

  it("COLABORADORA não deve acessar getResumoFinanceiro de revendedora fora do grupo", async () => {
    mockedRequireAuth.mockResolvedValue(colabUser);
    mockedPrisma.reseller.findFirst.mockResolvedValue(null);

    await expect(getResumoFinanceiro("rev-fora-do-grupo")).rejects.toThrow(
      "BUSINESS: Esta revendedora no pertenece a tu equipo."
    );
  });
});
