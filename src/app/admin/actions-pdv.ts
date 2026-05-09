"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/user";
import { safeAction, BusinessError, type ActionResult } from "@/lib/action-utils";
import { invalidateCache } from "@/lib/cache/invalidate";

export type VariantParaPdv = {
  id: string;
  attribute_name: string;
  attribute_value: string;
  price: number | null;
  stock_quantity: number;
  product: {
    id: string;
    name: string;
    images: string[];
  };
};

export type CriarVentaLojaInput = {
  clienteId: string | null;
  moneda: "PYG" | "USD" | "BRL";
  itens: Array<{
    product_variant_id: string;
    cantidad: number;
  }>;
};

/**
 * Lista variantes disponíveis para o PDV.
 * Filtros: stock_quantity > 0, ativo: true, busca por nome de produto, categoria opcional.
 */
export async function getVariantsParaPdv(params?: {
  search?: string;
  categoryId?: string;
}): Promise<ActionResult<VariantParaPdv[]>> {
  return safeAction(
    async () => {
      await requireAuth(["ADMIN"]);

      const productWhere: Record<string, unknown> = { ativo: true };
      if (params?.search && params.search.trim().length > 0) {
        productWhere.name = { contains: params.search.trim(), mode: "insensitive" };
      }
      if (params?.categoryId && params.categoryId !== "all") {
        productWhere.categories = { some: { category_id: params.categoryId } };
      }

      const variants = await prisma.productVariant.findMany({
        where: {
          stock_quantity: { gt: 0 },
          ativo: true,
          product: productWhere,
        },
        include: {
          product: {
            select: { id: true, name: true, images: true, price: true },
          },
        },
        orderBy: { product: { name: "asc" } },
        take: 50,
      });

      return variants.map((v) => ({
        id: v.id,
        attribute_name: v.attribute_name,
        attribute_value: v.attribute_value,
        price: v.price != null ? Number(v.price) : v.product.price != null ? Number(v.product.price) : null,
        stock_quantity: v.stock_quantity,
        product: {
          id: v.product.id,
          name: v.product.name,
          images: (v.product.images as string[]) ?? [],
        },
      }));
    },
    { actionName: "getVariantsParaPdv" }
  );
}

/**
 * Cria VentaLoja (D-17-02 — espelho de criarMaleta).
 * - Cotização SEMPRE relida do DB (D-17-03), nunca aceita do payload do client.
 * - Pré-leitura de stock fora de transação (fail fast).
 * - Cliente opcional (D-17-PDV-01) — clienteId: null = Consumidor Final.
 * - Decremento sequencial com compensação (PrismaPg não suporta interactive transactions).
 * - Math.round() por linha; soma inteiros (D-17-04).
 */
export async function criarVentaLoja(
  input: CriarVentaLojaInput
): Promise<ActionResult<{ id: string }>> {
  return safeAction(
    async () => {
      const user = await requireAuth(["ADMIN"]);
      if (!user.profileId) {
        throw new BusinessError("Tu perfil de usuario no está configurado.");
      }

      // 1) Validação básica do input
      if (!input.itens || input.itens.length === 0) {
        throw new BusinessError("Agregá al menos un producto a la venta.");
      }
      const monedasValidas = ["PYG", "USD", "BRL"] as const;
      if (!monedasValidas.includes(input.moneda)) {
        throw new BusinessError("Moneda inválida.");
      }
      for (const item of input.itens) {
        if (!Number.isInteger(item.cantidad) || item.cantidad < 1) {
          throw new BusinessError("Cantidad inválida en uno de los productos.");
        }
      }

      // 2) Validar clienteId (se passado, deve existir)
      if (input.clienteId) {
        const exists = await prisma.cliente.findUnique({
          where: { id: input.clienteId },
          select: { id: true },
        });
        if (!exists) {
          throw new BusinessError("Cliente no encontrado.");
        }
      }

      // 3) Pré-leitura: cotização do DB (D-17-03 — NUNCA do payload)
      const cotizacion = await prisma.cotizacionDia.findFirst({
        orderBy: { created_at: "desc" },
      });
      if (!cotizacion) {
        throw new BusinessError(
          "No hay cotización registrada. Configurá la cotización antes de registrar ventas."
        );
      }
      const brlToPyg = Number(cotizacion.brl_to_py);
      const usdToPyg = Number(cotizacion.usd_to_py);

      // 4) Pré-leitura: variantes para validação de stock + cálculo de subtotais
      const variantIds = input.itens.map((i) => i.product_variant_id);
      const variants = await prisma.productVariant.findMany({
        where: { id: { in: variantIds } },
        include: { product: { select: { name: true, price: true } } },
      });
      const variantMap = new Map(variants.map((v) => [v.id, v]));

      for (const item of input.itens) {
        const variant = variantMap.get(item.product_variant_id);
        if (!variant) {
          throw new BusinessError("Una de las variantes seleccionadas no existe.");
        }
        if (variant.stock_quantity < item.cantidad) {
          throw new BusinessError(
            `Stock insuficiente para "${variant.product.name} — ${variant.attribute_value}": disponible ${variant.stock_quantity}.`
          );
        }
      }

      // 5) Cálculo de totais (D-17-04 — Math.round por linha, soma inteiros)
      let totalPyg = 0;
      const itensConSubtotal = input.itens.map((item) => {
        const variant = variantMap.get(item.product_variant_id)!;
        const precioUnitPyg =
          variant.price != null
            ? Number(variant.price)
            : variant.product.price != null
              ? Number(variant.product.price)
              : 0;
        const subtotalPyg = Math.round(precioUnitPyg * item.cantidad);
        totalPyg += subtotalPyg;
        return {
          product_variant_id: item.product_variant_id,
          cantidad: item.cantidad,
          precio_unitario: precioUnitPyg,
          subtotal: subtotalPyg,
        };
      });

      // Conversão do total para a moeda de pagamento (preserva PYG como fonte de verdade)
      const total =
        input.moneda === "PYG"
          ? totalPyg
          : input.moneda === "USD"
            ? Math.round((totalPyg / usdToPyg) * 100) / 100
            : Math.round((totalPyg / brlToPyg) * 100) / 100;

      // 6) Criar VentaLoja + itens (cascata via relation)
      const venta = await prisma.ventaLoja.create({
        data: {
          cliente_id: input.clienteId ?? null,
          total,
          moneda: input.moneda,
          total_pyg: totalPyg,
          cotizacion_snapshot: {
            brl_to_py: brlToPyg,
            usd_to_py: usdToPyg,
            cotizacion_id: cotizacion.id,
          },
          created_by: user.profileId,
          itens: {
            create: itensConSubtotal,
          },
        },
      });

      // 7) Decremento sequencial com compensação (padrão criarMaleta — Pitfall 3)
      const stockErrors: { variantId: string; qty: number }[] = [];
      for (const item of input.itens) {
        try {
          await prisma.productVariant.update({
            where: { id: item.product_variant_id },
            data: { stock_quantity: { decrement: item.cantidad } },
          });
        } catch (err) {
          console.error(
            "[criarVentaLoja] Error decrementing stock for variant",
            item.product_variant_id,
            err
          );
          stockErrors.push({ variantId: item.product_variant_id, qty: item.cantidad });
        }
      }
      if (stockErrors.length > 0) {
        // Compensação: deletar VentaLoja (cascade remove os itens)
        await prisma.ventaLoja.delete({ where: { id: venta.id } }).catch(() => {});
        throw new BusinessError(
          "No se pudo actualizar el stock. Intentá de nuevo."
        );
      }

      // 8) Registrar movimentos de estoque (best-effort — não bloqueia a venda)
      for (const item of input.itens) {
        await prisma.estoqueMovimento
          .create({
            data: {
              product_variant_id: item.product_variant_id,
              quantidade: item.cantidad,
              tipo: "venda_loja",
              motivo: `Venta en loja #${venta.id.slice(0, 8)}`,
              venta_loja_id: venta.id,
            },
          })
          .catch((err) =>
            console.error("[criarVentaLoja] Movement log failed:", err)
          );
      }

      invalidateCache.path.admin("/pdv");

      return { id: venta.id };
    },
    { actionName: "criarVentaLoja" }
  );
}
