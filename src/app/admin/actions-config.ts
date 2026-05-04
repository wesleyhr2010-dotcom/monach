"use server";

import { prisma } from "@/lib/prisma";
import { safeAction, type ActionResult } from "@/lib/action-utils";
import { requireAuth } from "@/lib/user";
import { z } from "zod";

// ============================================
// Commission Tiers
// ============================================

export async function getCommissionTiers(): Promise<
  ActionResult<
    Array<{
      id: string;
      min_sales_value: number;
      pct: number;
      ativo: boolean;
    }>
  >
> {
  return safeAction(async () => {
    await requireAuth(["ADMIN"]);
    const tiers = await prisma.commissionTier.findMany({
      orderBy: { min_sales_value: "asc" },
    });
    return tiers.map((t) => ({
      id: t.id,
      min_sales_value: Number(t.min_sales_value),
      pct: Number(t.pct),
      ativo: t.ativo,
    }));
  });
}

const upsertCommissionTierSchema = z.object({
  id: z.string().uuid().optional(),
  min_sales_value: z.number().int().min(0, "El valor mínimo debe ser ≥ 0"),
  pct: z.number().min(1, "La comisión debe ser ≥ 1%").max(100, "La comisión debe ser ≤ 100%"),
  ativo: z.boolean().default(true),
});

export async function upsertCommissionTier(
  rawData: unknown
): Promise<ActionResult<{ id: string }>> {
  return safeAction(async () => {
    await requireAuth(["ADMIN"]);
    const data = upsertCommissionTierSchema.parse(rawData);

    // Verificar duplicado de min_sales_value
    const existing = await prisma.commissionTier.findFirst({
      where: {
        min_sales_value: data.min_sales_value,
        NOT: data.id ? { id: data.id } : undefined,
      },
    });
    if (existing) {
      throw new Error("Ya existe una faixa con ese valor mínimo de ventas.");
    }

    if (data.id) {
      const updated = await prisma.commissionTier.update({
        where: { id: data.id },
        data: {
          min_sales_value: data.min_sales_value,
          pct: data.pct,
          ativo: data.ativo,
        },
      });
      return { id: updated.id };
    } else {
      const created = await prisma.commissionTier.create({
        data: {
          min_sales_value: data.min_sales_value,
          pct: data.pct,
          ativo: data.ativo,
        },
      });
      return { id: created.id };
    }
  });
}

export async function deleteCommissionTier(
  id: string
): Promise<ActionResult<void>> {
  return safeAction(async () => {
    await requireAuth(["ADMIN"]);

    const tier = await prisma.commissionTier.findUnique({ where: { id } });
    if (!tier) {
      throw new Error("Faixa no encontrada.");
    }

    if (Number(tier.min_sales_value) === 0) {
      throw new Error("Não é possível deletar a faixa base.");
    }

    await prisma.commissionTier.delete({ where: { id } });
  });
}

// ============================================
// Nivel Regras (Gamification)
// ============================================

export async function getNivelRegras(): Promise<
  ActionResult<
    Array<{
      id: string;
      nome: string;
      pontos_minimos: number;
      cor: string;
      ordem: number;
      ativo: boolean;
    }>
  >
> {
  return safeAction(async () => {
    await requireAuth(["ADMIN"]);
    const niveis = await prisma.nivelRegra.findMany({
      orderBy: { pontos_minimos: "asc" },
    });
    return niveis.map((n) => ({
      id: n.id,
      nome: n.nome,
      pontos_minimos: n.pontos_minimos,
      cor: n.cor,
      ordem: n.ordem,
      ativo: n.ativo,
    }));
  });
}

const upsertNivelRegraSchema = z.object({
  id: z.string().uuid().optional(),
  nome: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(30, "Máximo 30 caracteres"),
  pontos_minimos: z.number().int().min(0, "Los puntos mínimos deben ser ≥ 0"),
  cor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "El color debe ser un hex válido (ej: #FF0000)"),
  ordem: z.number().int().min(0, "El orden debe ser ≥ 0"),
  ativo: z.boolean().default(true),
});

export async function upsertNivelRegra(
  rawData: unknown
): Promise<ActionResult<{ id: string }>> {
  return safeAction(async () => {
    await requireAuth(["ADMIN"]);
    const data = upsertNivelRegraSchema.parse(rawData);

    // Verificar duplicado de pontos_minimos
    const existing = await prisma.nivelRegra.findFirst({
      where: {
        pontos_minimos: data.pontos_minimos,
        NOT: data.id ? { id: data.id } : undefined,
      },
    });
    if (existing) {
      throw new Error("Ya existe un nivel con esa cantidad de puntos mínimos.");
    }

    if (data.id) {
      const updated = await prisma.nivelRegra.update({
        where: { id: data.id },
        data: {
          nome: data.nome,
          pontos_minimos: data.pontos_minimos,
          cor: data.cor,
          ordem: data.ordem,
          ativo: data.ativo,
        },
      });
      return { id: updated.id };
    } else {
      const created = await prisma.nivelRegra.create({
        data: {
          nome: data.nome,
          pontos_minimos: data.pontos_minimos,
          cor: data.cor,
          ordem: data.ordem,
          ativo: data.ativo,
        },
      });
      return { id: created.id };
    }
  });
}

export async function deleteNivelRegra(
  id: string
): Promise<ActionResult<void>> {
  return safeAction(async () => {
    await requireAuth(["ADMIN"]);

    const nivel = await prisma.nivelRegra.findUnique({ where: { id } });
    if (!nivel) {
      throw new Error("Nivel no encontrado.");
    }

    await prisma.nivelRegra.delete({ where: { id } });
  });
}
