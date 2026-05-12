"use server";

import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { EstoqueMovimentoTipo } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";

export interface ParsedRow {
  sku: string;
  nome: string;
  saldo: number;
  precio: number | null;
}

export interface MatchedProduct {
  sku: string;
  nome: string;
  saldo: number;
  precio: number | null;
  variantId: string;
  currentStock: number;
  currentPrice: number | null;
  newStock?: number;
  newPrice?: number | null;
  willCreateVariant?: boolean;
}

export interface RejectedProduct {
  sku: string;
  nome: string;
  reason: string;
}

export interface SyncPreview {
  matched: MatchedProduct[];
  rejected: RejectedProduct[];
}

export interface SyncResult {
  updated: number;
  rejected: RejectedProduct[];
  movements: number;
}

/**
 * Extrai o SKU da coluna "Artículo" no formato "SKU - NOME DO PRODUTO"
 * Ex: "338 - COLLAR PUNTO DE LUZ" → { sku: "338", nome: "COLLAR PUNTO DE LUZ" }
 */
function parseArticulo(articulo: string | number): { sku: string; nome: string } {
  const str = String(articulo).trim();
  const parts = str.split(" - ");
  if (parts.length >= 2) {
    return { sku: parts[0].trim(), nome: parts.slice(1).join(" - ").trim() };
  }
  // Se não tem " - ", usa o valor inteiro como SKU
  return { sku: str, nome: str };
}

/**
 * Lê o arquivo XLS/XLSX e retorna as linhas parseadas
 * Suporta tanto .xls (binário antigo) quanto .xlsx
 */
export async function parseSpreadsheet(file: File): Promise<ParsedRow[]> {
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  const workbook = XLSX.read(uint8Array, {
    type: "array",
    cellDates: true,
  });

  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);

  return rows
    .filter((row) => row["Artículo"] != null && row["Artículo"] !== "")
    .map((row) => {
      const { sku, nome } = parseArticulo(row["Artículo"] as string | number);
      const saldo = typeof row["Saldo"] === "number" ? row["Saldo"] : parseInt(String(row["Saldo"]), 10) || 0;
      const precio = row["Precio"] != null ? parseFloat(String(row["Precio"])) || null : null;
      return { sku, nome, saldo, precio };
    });
}

/**
 * Preview da sincronização — não modifica o banco
 */
export async function previewSync(
  fileData: { name: string; data: string },
  options: { updateStock: boolean; updatePrice: boolean }
): Promise<SyncPreview> {
  const buffer = Buffer.from(fileData.data, "base64");
  const uint8 = new Uint8Array(buffer);
  const file = new File([uint8], fileData.name);
  const parsed = await parseSpreadsheet(file);

  const skus = parsed.map((r) => r.sku);

  const products = await prisma.product.findMany({
    where: { sku: { in: skus } },
    include: { variants: true },
  });

  const variantsBySku = await prisma.productVariant.findMany({
    where: { sku: { in: skus } },
  });
  const variantMap = new Map(variantsBySku.map((v) => [v.sku!, v]));

  const matched: MatchedProduct[] = [];
  const rejected: RejectedProduct[] = [];

  for (const row of parsed) {
    let variant = variantMap.get(row.sku);
    let willCreateVariant = false;

    if (!variant) {
      const product = products.find((p) => p.sku === row.sku);
      if (product) {
        if (product.variants.length > 0) {
          variant = product.variants[0];
        } else {
          willCreateVariant = true;
          variant = {
            id: product.id,
            product_id: product.id,
            attribute_name: "Padrão",
            attribute_value: "Único",
            price: product.price,
            sku: product.sku,
            in_stock: true,
            stock_quantity: 0,
            image_url: "",
            ativo: true,
            created_at: new Date(),
          } as unknown as typeof variantsBySku[0];
        }
      }
    }

    if (!variant) {
      rejected.push({
        sku: row.sku,
        nome: row.nome,
        reason: "SKU não encontrado no banco de dados",
      });
      continue;
    }

    const match: MatchedProduct = {
      sku: row.sku,
      nome: row.nome,
      saldo: row.saldo,
      precio: row.precio,
      variantId: variant.id,
      currentStock: variant.stock_quantity,
      currentPrice: variant.price ? parseFloat(variant.price.toString()) : null,
      willCreateVariant,
    };

    if (options.updateStock) {
      match.newStock = row.saldo;
    }
    if (options.updatePrice && row.precio !== null) {
      match.newPrice = row.precio;
    }

    matched.push(match);
  }

  return { matched, rejected };
}

/**
 * Executa a sincronização — atualiza ProductVariant e cria EstoqueMovimento
 * Produtos simples sem variação recebem uma variação padrão automaticamente
 */
export async function executeSync(
  fileData: { name: string; data: string },
  options: { updateStock: boolean; updatePrice: boolean }
): Promise<SyncResult> {
  const buffer = Buffer.from(fileData.data, "base64");
  const uint8 = new Uint8Array(buffer);
  const file = new File([uint8], fileData.name);
  const parsed = await parseSpreadsheet(file);

  const rejected: RejectedProduct[] = [];
  let updatedCount = 0;
  let movementsCount = 0;

  const skus = parsed.map((r) => r.sku);

  // === FASE 1: Buscar produtos e criar variações pendentes ===
  const products = await prisma.product.findMany({
    where: { sku: { in: skus } },
    include: { variants: true },
  });

  // Criar variações padrão para produtos simples (sem variação)
  const productsNeedingVariant = products.filter((p) => p.variants.length === 0);
  for (const product of productsNeedingVariant) {
    await prisma.productVariant.create({
      data: {
        product_id: product.id,
        attribute_name: "Padrão",
        attribute_value: "Único",
        sku: product.sku,
        price: product.price,
        stock_quantity: 0,
        in_stock: true,
        image_url: "",
        ativo: true,
      },
    });
  }

  // === FASE 2: Buscar TODAS as variações (incluindo as recém-criadas) ===
  const allVariants = await prisma.productVariant.findMany({
    where: {
      OR: [
        { sku: { in: skus } },
        { product: { sku: { in: skus } } },
      ],
    },
  });

  // Indexar por SKU (prioriza ProductVariant.sku, depois Product.sku)
  const variantBySku = new Map<string, typeof allVariants[0]>();
  for (const v of allVariants) {
    if (v.sku && !variantBySku.has(v.sku)) {
      variantBySku.set(v.sku, v);
    }
  }
  // Também indexar por Product.sku para variantes sem sku próprio
  for (const v of allVariants) {
    const product = products.find((p) => p.id === v.product_id);
    if (product && !variantBySku.has(product.sku)) {
      variantBySku.set(product.sku, v);
    }
  }

  // === FASE 3: Preparar updates ===
  const updates: {
    variantId: string;
    sku: string;
    nome: string;
    oldStock: number;
    newStock?: number;
    oldPrice: number | null;
    newPrice?: number | null;
  }[] = [];

  for (const row of parsed) {
    const variant = variantBySku.get(row.sku);

    if (!variant) {
      rejected.push({
        sku: row.sku,
        nome: row.nome,
        reason: "SKU não encontrado no banco de dados",
      });
      continue;
    }

    updates.push({
      variantId: variant.id,
      sku: row.sku,
      nome: row.nome,
      oldStock: variant.stock_quantity,
      newStock: options.updateStock ? row.saldo : undefined,
      oldPrice: variant.price ? parseFloat(variant.price.toString()) : null,
      newPrice: options.updatePrice && row.precio !== null ? row.precio : undefined,
    });
  }

  // === FASE 4: Executar updates em transação com timeout aumentado ===
  if (updates.length > 0) {
    await prisma.$transaction(
      async (tx) => {
        for (const update of updates) {
          const updateData: Record<string, unknown> = {};
          if (update.newStock !== undefined) {
            updateData.stock_quantity = update.newStock;
          }
          if (update.newPrice !== undefined) {
            updateData.price = update.newPrice;
          }

          await tx.productVariant.update({
            where: { id: update.variantId },
            data: updateData,
          });

          // Registrar movimentação de estoque
          if (update.newStock !== undefined) {
            await tx.estoqueMovimento.create({
              data: {
                product_variant_id: update.variantId,
                quantidade: update.newStock - update.oldStock,
                tipo: EstoqueMovimentoTipo.ajuste_manual,
                motivo: "Sincronização de Estoque via Planilha do CRM",
              },
            });
            movementsCount++;
          }

          updatedCount++;
        }
      },
      {
        maxWait: 10000,
        timeout: 20000,
      }
    );
  }

  // Revalidar páginas
  revalidatePath("/admin/produtos");
  revalidatePath("/admin/estoque");

  return { updated: updatedCount, rejected, movements: movementsCount };
}
