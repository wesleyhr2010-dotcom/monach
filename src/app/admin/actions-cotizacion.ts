"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/user";
import { safeAction, BusinessError, type ActionResult } from "@/lib/action-utils";
import { invalidateCache } from "@/lib/cache/invalidate";

export type CotizacionAtual = {
  id: string;
  brlToPyg: number;
  usdToPyg: number;
  createdAt: string;
};

export type CotizacionHistorialItem = {
  id: string;
  brlToPyg: number;
  usdToPyg: number;
  createdAt: string;
};

/**
 * Salva uma nova cotização (insert-por-update — D-17-01).
 * Cada save cria um registro novo; o histórico nunca é sobrescrito.
 */
export async function salvarCotizacion(
  brlToPyg: number,
  usdToPyg: number
): Promise<ActionResult<{ id: string }>> {
  return safeAction(
    async () => {
      await requireAuth(["ADMIN"]);

      if (!Number.isFinite(brlToPyg) || brlToPyg <= 0) {
        throw new BusinessError("La tasa BRL → Gs. debe ser mayor a cero.");
      }
      if (!Number.isFinite(usdToPyg) || usdToPyg <= 0) {
        throw new BusinessError("La tasa USD → Gs. debe ser mayor a cero.");
      }

      const cotizacion = await prisma.cotizacionDia.create({
        data: {
          brl_to_py: brlToPyg,
          usd_to_py: usdToPyg,
        },
      });

      invalidateCache.path.admin("/config/cotizacion");
      invalidateCache.path.admin("/pdv");

      return { id: cotizacion.id };
    },
    { actionName: "salvarCotizacion" }
  );
}

/**
 * Lê a cotização mais recente (D-17-01).
 * Retorna null se nenhuma cotização foi configurada ainda.
 */
export async function getCotizacionAtual(): Promise<ActionResult<CotizacionAtual | null>> {
  return safeAction(
    async () => {
      await requireAuth(["ADMIN"]);

      const cotizacion = await prisma.cotizacionDia.findFirst({
        orderBy: { created_at: "desc" },
      });

      if (!cotizacion) return null;

      return {
        id: cotizacion.id,
        brlToPyg: Number(cotizacion.brl_to_py),
        usdToPyg: Number(cotizacion.usd_to_py),
        createdAt: cotizacion.created_at.toISOString(),
      };
    },
    { actionName: "getCotizacionAtual" }
  );
}

/**
 * Histórico de cotizações (mais recentes primeiro). Default: 20 registros.
 */
export async function getHistorialCotizaciones(
  limit = 20
): Promise<ActionResult<CotizacionHistorialItem[]>> {
  return safeAction(
    async () => {
      await requireAuth(["ADMIN"]);

      const safeLimit = Math.min(Math.max(1, Math.floor(limit)), 100);

      const registros = await prisma.cotizacionDia.findMany({
        orderBy: { created_at: "desc" },
        take: safeLimit,
      });

      return registros.map((r) => ({
        id: r.id,
        brlToPyg: Number(r.brl_to_py),
        usdToPyg: Number(r.usd_to_py),
        createdAt: r.created_at.toISOString(),
      }));
    },
    { actionName: "getHistorialCotizaciones" }
  );
}
