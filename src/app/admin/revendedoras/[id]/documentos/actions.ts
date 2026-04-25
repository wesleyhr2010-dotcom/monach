"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/user";
import { assertIsInGroup } from "@/lib/auth/assert-in-group";
import { notificarRevendedora } from "@/lib/notifications";
import { z } from "zod";

export interface DocumentoRevendedora {
  id: string;
  tipo: string;
  url: string;
  status: string;
  observacao: string;
  created_at: string;
  updated_at: string;
}

export async function getDocumentosRevendedora(
  resellerId: string
): Promise<DocumentoRevendedora[]> {
  const user = await requireAuth(["ADMIN", "COLABORADORA"]);
  if (user.role === "COLABORADORA") {
    await assertIsInGroup(resellerId, user.profileId!);
  }

  const docs = await prisma.resellerDocumento.findMany({
    where: { reseller_id: resellerId },
    orderBy: { created_at: "desc" },
  });

  return docs.map((d) => ({
    id: d.id,
    tipo: d.tipo,
    url: d.url,
    status: d.status,
    observacao: d.observacao,
    created_at: d.created_at.toISOString(),
    updated_at: d.updated_at.toISOString(),
  }));
}

const aprovarSchema = z.object({
  documentoId: z.string().uuid(),
});

export async function aprovarDocumento(documentoId: string) {
  const user = await requireAuth(["ADMIN", "COLABORADORA"]);

  const parsed = aprovarSchema.safeParse({ documentoId });
  if (!parsed.success) {
    return { success: false, error: "ID de documento inválido." };
  }

  const doc = await prisma.resellerDocumento.findUnique({
    where: { id: documentoId },
    include: { reseller: true },
  });

  if (!doc) {
    return { success: false, error: "Documento no encontrado." };
  }

  if (user.role === "COLABORADORA") {
    await assertIsInGroup(doc.reseller_id, user.profileId!);
  }

  await prisma.resellerDocumento.update({
    where: { id: documentoId },
    data: { status: "aprovado", observacao: "" },
  });

  await notificarRevendedora({
    reseller_id: doc.reseller_id,
    tipo: "documento_aprovado",
    titulo: "Documento aprobado",
    mensagem: "¡Tu documento fue aprobado! Tu cadastro está completo.",
    auth_user_id: doc.reseller.auth_user_id,
  });

  return { success: true };
}

const rejeitarSchema = z.object({
  documentoId: z.string().uuid(),
  observacao: z.string().min(1, "La observación es obligatoria al rechazar."),
});

export async function rejeitarDocumento(documentoId: string, observacao: string) {
  const user = await requireAuth(["ADMIN", "COLABORADORA"]);

  const parsed = rejeitarSchema.safeParse({ documentoId, observacao });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Datos inválidos." };
  }

  const doc = await prisma.resellerDocumento.findUnique({
    where: { id: documentoId },
    include: { reseller: true },
  });

  if (!doc) {
    return { success: false, error: "Documento no encontrado." };
  }

  if (user.role === "COLABORADORA") {
    await assertIsInGroup(doc.reseller_id, user.profileId!);
  }

  await prisma.resellerDocumento.update({
    where: { id: documentoId },
    data: { status: "rejeitado", observacao: observacao.trim() },
  });

  await notificarRevendedora({
    reseller_id: doc.reseller_id,
    tipo: "documento_reprovado",
    titulo: "Documento rechazado",
    mensagem: `Tu documento fue rechazado: ${observacao.trim()}. Por favor, envíalo nuevamente.`,
    auth_user_id: doc.reseller.auth_user_id,
  });

  return { success: true };
}
