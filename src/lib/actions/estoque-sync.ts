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
  fileData: { name: string; data: string }, // base64 encoded file
  options: { updateStock: boolean; updatePrice: boolean }
): Promise<SyncPreview> {
  // Decode base64 to Uint8Array (server-side)
  const buffer = Buffer.from(fileData.data, "base64");
  const uint8 = new Uint8Array(buffer);
  const file = new File([uint8], fileData.name);
  const parsed = await parseSpreadsheet(file);

  const matched: MatchedProduct[] = [];
  const rejected: RejectedProduct[] = [];

  for (const row of parsed) {
    const variant = await prisma.productVariant.findFirst({
      where: { sku: row.sku },
    });

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
 */
export async function executeSync(
  fileData: { name: string; data: string },
  options: { updateStock: boolean; updatePrice: boolean }
): Promise<SyncResult> {
  // Decode base64 to Uint8Array (server-side)
  const buffer = Buffer.from(fileData.data, "base64");
  const uint8 = new Uint8Array(buffer);
  const file = new File([uint8], fileData.name);
  const parsed = await parseSpreadsheet(file);

  const rejected: RejectedProduct[] = [];
  let updatedCount = 0;
  let movementsCount = 0;

  // Buscar todos os SKUs de uma vez para eficiência
  const skus = parsed.map((r) => r.sku);
  const variants = await prisma.productVariant.findMany({
    where: { sku: { in: skus } },
  });
  const variantMap = new Map(variants.map((v) => [v.sku!, v]));

  // Preparar as atualizações
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
    const variant = variantMap.get(row.sku);
    if (!variant) {
      rejected.push({
        sku: row.sku,
        nome: row.nome,
        reason: "SKU não encontrado no banco de dados",
      });
      continue;
    }

    const update: typeof updates[number] = {
      variantId: variant.id,
      sku: row.sku,
      nome: row.nome,
      oldStock: variant.stock_quantity,
      oldPrice: variant.price ? parseFloat(variant.price.toString()) : null,
    };

    if (options.updateStock) {
      update.newStock = row.saldo;
    }
    if (options.updatePrice && row.precio !== null) {
      update.newPrice = row.precio;
    }

    updates.push(update);
  }

  // Executar em transação
  if (updates.length > 0) {
    await prisma.$transaction(async (tx) => {
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
    });
  }

  // Revalidar páginas de produtos e estoque
  revalidatePath("/admin/produtos");
  revalidatePath("/admin/estoque");

  return { updated: updatedCount, rejected, movements: movementsCount };
}
