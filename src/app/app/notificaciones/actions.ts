"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/user";

export type NotificacaoGrupo = {
  hoy: NotificacaoItem[];
  ayer: NotificacaoItem[];
  anteriores: NotificacaoItem[];
};

export type NotificacaoItem = {
  id: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  dados: Record<string, unknown>;
  lida: boolean;
  created_at: Date;
};

function stripTime(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function diffEmDias(a: Date, b: Date) {
  const ms = stripTime(a).getTime() - stripTime(b).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

export async function getNotificacoes(): Promise<NotificacaoGrupo> {
  const user = await requireAuth(["REVENDEDORA"]);
  const resellerId = user.profileId!;

  const rows = await prisma.notificacao.findMany({
    where: { reseller_id: resellerId },
    orderBy: { created_at: "desc" },
    take: 100,
  });

  const hoy: NotificacaoItem[] = [];
  const ayer: NotificacaoItem[] = [];
  const anteriores: NotificacaoItem[] = [];

  const agora = new Date();

  for (const row of rows) {
    const item: NotificacaoItem = {
      id: row.id,
      tipo: row.tipo,
      titulo: row.titulo,
      mensagem: row.mensagem,
      dados: (row.dados as Record<string, unknown>) ?? {},
      lida: row.lida,
      created_at: row.created_at,
    };

    const diff = diffEmDias(agora, row.created_at);
    if (diff === 0) {
      hoy.push(item);
    } else if (diff === 1) {
      ayer.push(item);
    } else {
      anteriores.push(item);
    }
  }

  return { hoy, ayer, anteriores };
}

export async function marcarComoLida(notificacaoId: string) {
  const user = await requireAuth(["REVENDEDORA"]);
  const resellerId = user.profileId!;

  // Ownership check: só marca como lida se pertencer ao usuário
  const notif = await prisma.notificacao.findFirst({
    where: { id: notificacaoId, reseller_id: resellerId },
    select: { id: true },
  });

  if (!notif) {
    throw new Error("BUSINESS: Notificación no encontrada.");
  }

  await prisma.notificacao.update({
    where: { id: notificacaoId },
    data: { lida: true },
  });

  return { success: true };
}

export async function getContagemNaoLidas(): Promise<number> {
  const user = await requireAuth(["REVENDEDORA"]);
  const resellerId = user.profileId!;

  const count = await prisma.notificacao.count({
    where: { reseller_id: resellerId, lida: false },
  });

  return count;
}
