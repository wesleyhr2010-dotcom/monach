import { prisma } from "@/lib/prisma";

/**
 * Tipo do cliente Prisma estendido (com middleware de criptografia).
 * Usado em transações para compatibilidade com o client estendido.
 */
type ExtendedPrismaClient = typeof prisma;

/**
 * Concede pontos de gamificação a uma revendedora com base em uma regra configurada no banco.
 * Caso a regra (por `acao`) não exista, a função resolve silenciosamente para evitar quebrar a transação de vendas.
 */
export async function awardPoints(
  resellerId: string,
  acao: string,
  tx?: Omit<
    ExtendedPrismaClient,
    "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
  >
) {
  const db = tx || prisma;

  const regra = await db.gamificacaoRegra.findUnique({
    where: { acao },
  });

  if (!regra || !regra.ativo || regra.pontos <= 0) return;

  await db.pontosExtrato.create({
    data: {
      reseller_id: resellerId,
      regra_id: regra.id,
      pontos: regra.pontos,
      descricao: `Ganhos por ação: ${acao}`,
    },
  });
}
