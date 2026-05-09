"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/user";
import { safeAction, BusinessError, type ActionResult } from "@/lib/action-utils";
import { invalidateCache } from "@/lib/cache/invalidate";
import type { Prisma } from "@/generated/prisma/client";

// ============================================
// Types
// ============================================

export type VentaListItem = {
  id: string;
  created_at: Date;
  cliente_nombre: string | null;
  cliente_ruc: string | null;
  cantidad_itens: number;
  total: number;
  total_pyg: number;
  moneda: string;
  cancelled_at: Date | null;
};

export type VentaDetalhe = {
  id: string;
  created_at: Date;
  cliente: { id: string; nombre: string; ruc: string | null } | null;
  moneda: string;
  total: number;
  total_pyg: number;
  cotizacion_snapshot: Record<string, unknown>;
  creador_nombre: string;
  itens: Array<{
    producto_nombre: string;
    variante_valor: string;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
  }>;
  cancelled_at: Date | null;
};

export type VentasKPIs = {
  totalVendidoPyg: number;
  quantidadeVentas: number;
  ticketMedioPyg: number;
  totalItensVendidos: number;
};

export type ListVentasParams = {
  from: Date;
  to: Date;
  search?: string;
  page?: number;
  pageSize?: number;
  sort?: "created_at" | "total" | "cliente";
  dir?: "asc" | "desc";
};

// ============================================
// Helper: build where clause
// ============================================

function buildVentasWhere(params: { from: Date; to: Date; search?: string }): Prisma.VentaLojaWhereInput {
  const where: Prisma.VentaLojaWhereInput = {
    created_at: { gte: params.from, lte: params.to },
  };
  if (params.search && params.search.trim().length > 0) {
    where.cliente = {
      OR: [
        { nombre: { contains: params.search.trim(), mode: "insensitive" } },
        { ruc: { contains: params.search.trim(), mode: "insensitive" } },
      ],
    };
  }
  return where;
}

// ============================================
// 1. listVentas — paginated, filtered, sorted
// ============================================

export async function listVentas(
  params: ListVentasParams
): Promise<ActionResult<{ items: VentaListItem[]; totalCount: number }>> {
  return safeAction(
    async () => {
      await requireAuth(["ADMIN"]);

      const where = buildVentasWhere(params);
      const page = params.page ?? 1;
      const pageSize = params.pageSize ?? 20;
      const sort = params.sort ?? "created_at";
      const dir = params.dir ?? "desc";

      const orderBy: Prisma.VentaLojaOrderByWithRelationInput =
        sort === "cliente"
          ? { cliente: { nombre: dir } }
          : { [sort]: dir };

      const [items, countResult] = await Promise.all([
        prisma.ventaLoja.findMany({
          where,
          include: {
            cliente: { select: { nombre: true, ruc: true } },
            itens: { select: { id: true } },
          },
          orderBy,
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.ventaLoja.count({ where }),
      ]);

      return {
        items: items.map((venta) => ({
          id: venta.id,
          created_at: venta.created_at,
          cliente_nombre: venta.cliente?.nombre ?? null,
          cliente_ruc: venta.cliente?.ruc ?? null,
          cantidad_itens: venta.itens.length,
          total: Number(venta.total),
          total_pyg: Number(venta.total_pyg),
          moneda: venta.moneda,
          cancelled_at: venta.cancelled_at,
        })),
        totalCount: countResult,
      };
    },
    { actionName: "listVentas" }
  );
}

// ============================================
// 2. getVentaById — complete sale details
// ============================================

export async function getVentaById(id: string): Promise<ActionResult<VentaDetalhe>> {
  return safeAction(
    async () => {
      await requireAuth(["ADMIN"]);

      const venta = await prisma.ventaLoja.findUnique({
        where: { id },
        include: {
          cliente: { select: { id: true, nombre: true, ruc: true } },
          itens: {
            include: {
              product_variant: {
                include: {
                  product: { select: { name: true } },
                },
              },
            },
          },
        },
      });

      if (!venta) {
        throw new BusinessError("Venta no encontrada.");
      }

      // Fetch creator name from Reseller
      const reseller = await prisma.reseller.findUnique({
        where: { id: venta.created_by },
        select: { name: true },
      });

      return {
        id: venta.id,
        created_at: venta.created_at,
        cliente: venta.cliente,
        moneda: venta.moneda,
        total: Number(venta.total),
        total_pyg: Number(venta.total_pyg),
        cotizacion_snapshot: venta.cotizacion_snapshot as Record<string, unknown>,
        creador_nombre: reseller?.name ?? "Desconocido",
        itens: venta.itens.map((item) => ({
          producto_nombre: item.product_variant.product.name,
          variante_valor: item.product_variant.attribute_value,
          cantidad: item.cantidad,
          precio_unitario: Number(item.precio_unitario),
          subtotal: Number(item.subtotal),
        })),
        cancelled_at: venta.cancelled_at,
      };
    },
    { actionName: "getVentaById" }
  );
}

// ============================================
// 3. cancelarVenta — cancel sale, restore stock
// ============================================

export async function cancelarVenta(id: string): Promise<ActionResult<void>> {
  return safeAction(
    async () => {
      const user = await requireAuth(["ADMIN"]);

      // Pre-read: find VentaLoja with items
      const venta = await prisma.ventaLoja.findUnique({
        where: { id },
        include: { itens: true },
      });

      if (!venta) {
        throw new BusinessError("Venta no encontrada.");
      }

      if (venta.cancelled_at) {
        throw new BusinessError("La venta ya está cancelada.");
      }

      // Mark as cancelled
      await prisma.ventaLoja.update({
        where: { id },
        data: { cancelled_at: new Date() },
      });

      // Restore stock sequentially (same pattern as actions-pdv.ts compensation)
      for (const item of venta.itens) {
        await prisma.productVariant.update({
          where: { id: item.product_variant_id },
          data: { stock_quantity: { increment: item.cantidad } },
        });
      }

      // Register reverse EstoqueMovimento for each item
      for (const item of venta.itens) {
        await prisma.estoqueMovimento.create({
          data: {
            product_variant_id: item.product_variant_id,
            quantidade: item.cantidad,
            tipo: "ajuste_manual",
            motivo: `Cancelación de venta #${venta.id.slice(0, 8)}`,
            venta_loja_id: venta.id,
          },
        });
      }

      invalidateCache.path.admin("/ventas");

      return undefined;
    },
    { actionName: "cancelarVenta" }
  );
}

// ============================================
// 4. getKPIsVentas — 4 KPIs matching filter
// ============================================

export async function getKPIsVentas(params: {
  from: Date;
  to: Date;
  search?: string;
}): Promise<ActionResult<VentasKPIs>> {
  return safeAction(
    async () => {
      await requireAuth(["ADMIN"]);

      const where = buildVentasWhere(params);

      const [ventaAgg, itemAgg] = await Promise.all([
        prisma.ventaLoja.aggregate({
          where,
          _sum: { total_pyg: true },
          _count: { id: true },
        }),
        prisma.ventaLojaItem.aggregate({
          where: { venta_loja: { is: where } },
          _sum: { cantidad: true },
        }),
      ]);

      const totalVendidoPyg = Number(ventaAgg._sum.total_pyg ?? 0);
      const quantidadeVentas = ventaAgg._count.id;
      const ticketMedioPyg =
        quantidadeVentas > 0 ? Math.round(totalVendidoPyg / quantidadeVentas) : 0;
      const totalItensVendidos = Number(itemAgg._sum.cantidad ?? 0);

      return {
        totalVendidoPyg,
        quantidadeVentas,
        ticketMedioPyg,
        totalItensVendidos,
      };
    },
    { actionName: "getKPIsVentas" }
  );
}

export { getRangeFromParams } from "./actions-analytics";

// ============================================
// 5. exportVentasCSV — CSV string with filtered data
// ============================================

export async function exportVentasCSV(
  params: ListVentasParams
): Promise<ActionResult<string>> {
  return safeAction(
    async () => {
      await requireAuth(["ADMIN"]);

      const where = buildVentasWhere(params);

      const ventas = await prisma.ventaLoja.findMany({
        where,
        include: {
          cliente: { select: { nombre: true, ruc: true } },
          itens: { select: { cantidad: true } },
        },
        orderBy: { created_at: "desc" },
      });

      const header = "Fecha,Cliente,RUC,Moneda,Total Original,Total PYG,Cantidad Items,Estado";

      const rows = ventas.map((venta) => {
        const fecha = venta.created_at.toISOString();
        const cliente = venta.cliente?.nombre ?? "Consumidor Final";
        const ruc = venta.cliente?.ruc ?? "";
        const moneda = venta.moneda;
        const totalOriginal = Number(venta.total).toFixed(2);
        const totalPyg = Number(venta.total_pyg).toString();
        const cantidadItems = venta.itens.reduce((sum, i) => sum + i.cantidad, 0);
        const estado = venta.cancelled_at ? "Cancelada" : "Confirmada";

        // Escape values that may contain commas or quotes
        const escape = (val: string) => {
          if (val.includes(",") || val.includes('"') || val.includes("\n")) {
            return `"${val.replace(/"/g, '""')}"`;
          }
          return val;
        };

        return [
          escape(fecha),
          escape(cliente),
          escape(ruc),
          escape(moneda),
          escape(totalOriginal),
          escape(totalPyg),
          cantidadItems.toString(),
          escape(estado),
        ].join(",");
      });

      return [header, ...rows].join("\n");
    },
    { actionName: "exportVentasCSV" }
  );
}
