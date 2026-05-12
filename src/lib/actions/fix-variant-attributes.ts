"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/user";

export async function fixVariantAttributes() {
  await requireAuth(["ADMIN"]);

  // 1. Verificar quantos registros serão afetados
  const countBefore = await prisma.productVariant.count({
    where: {
      attribute_name: "Padrão",
      attribute_value: "Único",
    },
  });

  if (countBefore === 0) {
    return {
      success: true,
      message: "Nenhum registro com 'Padrão/Único' encontrado. Nada para corrigir.",
      updated: 0,
    };
  }

  // 2. Atualizar os registros
  const result = await prisma.productVariant.updateMany({
    where: {
      attribute_name: "Padrão",
      attribute_value: "Único",
    },
    data: {
      attribute_name: "Tipo",
    },
  });

  // 3. Registrar a migration no Prisma
  try {
    await prisma.$executeRawUnsafe(`
      INSERT INTO _prisma_migrations (
        id, checksum, finished_at, migration_name, logs,
        rolled_back_at, started_at, applied_steps_count
      )
      SELECT
        gen_random_uuid(),
        '',
        now(),
        '20260512000000_fix_variant_padrao_to_tipo',
        '',
        null,
        now(),
        1
      WHERE NOT EXISTS (
        SELECT 1 FROM _prisma_migrations
        WHERE migration_name = '20260512000000_fix_variant_padrao_to_tipo'
      );
    `);
  } catch (err) {
    console.warn("[fixVariantAttributes] Migration already registered or error:", err);
  }

  // 4. Verificar se ficou tudo correto
  const countAfter = await prisma.productVariant.count({
    where: {
      attribute_name: "Padrão",
      attribute_value: "Único",
    },
  });

  return {
    success: true,
    message: `Corrigido: ${result.count} variantes de 'Padrão' para 'Tipo'`,
    updated: result.count,
    remainingPadrao: countAfter,
  };
}
