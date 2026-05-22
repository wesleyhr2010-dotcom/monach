import { describe, it, expect, vi } from "vitest";
import { getResellerScope } from "@/lib/auth/get-reseller-scope";
import { assertIsInGroup } from "@/lib/auth/assert-in-group";
import type { CurrentUser } from "@/lib/user";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    reseller: {
      findFirst: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";

const mockedPrisma = prisma as unknown as {
  reseller: { findFirst: ReturnType<typeof vi.fn> };
};

const mockUser = (role: CurrentUser["role"], profileId: string | null, colaboradoraId: string | null = null): CurrentUser => ({
  id: "u1",
  email: "test@example.com",
  profileId,
  name: "Test",
  role,
  isActive: true,
  colaboradoraId,
  rawUser: { id: "u1" },
});

describe("RBAC Scope Verification", () => {
  describe("getResellerScope", () => {
    it("ADMIN retorna escopo vazio (acesso total)", () => {
      const scope = getResellerScope(mockUser("ADMIN", "admin-1"));
      expect(scope).toEqual({});
    });

    it("COLABORADORA retorna filtro por colaboradora_id", () => {
      const scope = getResellerScope(mockUser("COLABORADORA", "colab-1"));
      expect(scope).toEqual({ colaboradora_id: "colab-1" });
    });

    it("REVENDEDORA retorna filtro por próprio id", () => {
      const scope = getResellerScope(mockUser("REVENDEDORA", "rev-1"));
      expect(scope).toEqual({ id: "rev-1" });
    });

    it("COLABORADORA sem profileId retorna filtro por id nulo", () => {
      const scope = getResellerScope(mockUser("COLABORADORA", null));
      expect(scope).toEqual({ id: null });
    });
  });

  describe("assertIsInGroup", () => {
    it("retorna success quando revendedora pertence à colaboradora", async () => {
      mockedPrisma.reseller.findFirst.mockResolvedValue({ id: "rev-1", colaboradora_id: "colab-1" });
      const result = await assertIsInGroup("rev-1", "colab-1");
      expect(result.success).toBe(true);
    });

    it("retorna error quando revendedora não pertence à colaboradora", async () => {
      mockedPrisma.reseller.findFirst.mockResolvedValue(null);
      const result = await assertIsInGroup("rev-1", "colab-1");
      expect(result).toMatchObject({ success: false, error: expect.stringContaining("no pertenece a tu equipo") });
    });
  });
});

describe("RLS Policy Drift Check", () => {
  it("scripts/rls-policies.sql contém 10+ CREATE POLICY", () => {
    const fs = require("fs");
    const path = require("path");
    const sqlPath = path.join(process.cwd(), "scripts", "rls-policies.sql");
    const sql = fs.readFileSync(sqlPath, "utf-8");
    const policyCount = (sql.match(/CREATE POLICY/g) || []).length;
    expect(policyCount).toBeGreaterThanOrEqual(10);
  });

  it("scripts/rls-policies.sql contém policies para resellers e maletas", () => {
    const fs = require("fs");
    const path = require("path");
    const sqlPath = path.join(process.cwd(), "scripts", "rls-policies.sql");
    const sql = fs.readFileSync(sqlPath, "utf-8");
    expect(sql).toContain("resellers");
    expect(sql).toContain("maletas");
  });
});
