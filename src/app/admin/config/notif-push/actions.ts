"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/user";
import { Prisma } from "@/generated/prisma/client";
import type { NotificacaoTemplate, NotificacaoLog } from "@/generated/prisma/client";

// ============================================
// Default templates (seed-on-read)
// ============================================

const DEFAULT_TEMPLATES: Array<Pick<NotificacaoTemplate, "tipo" | "titulo_es" | "body_es">> = [
  {
    tipo: "prazo_proximo_d3",
    titulo_es: "⚠️ Aviso de Vencimiento",
    body_es: "Tu consignación #{maleta_id} vence en {dias_restantes} días. ¡No olvides devolver a tiempo!",
  },
  {
    tipo: "prazo_proximo_d1",
    titulo_es: "‼️ ¡Tu consignación vence mañana!",
    body_es: "Tu consignación #{maleta_id} vence mañana. ¡Devuelve lo que no vendiste!",
  },
  {
    tipo: "maleta_atrasada",
    titulo_es: "🔴 Consignación atrasada",
    body_es: "Tu consignación #{maleta_id} está atrasada. Contacta a tu consultora lo antes posible.",
  },
  {
    tipo: "maleta_devolvida_admin",
    titulo_es: "📦 Nueva devolución recibida",
    body_es: "{nome_revendedora} devolvió la maleta #{maleta_id}. ¡Programa la conferencia!",
  },
  {
    tipo: "nova_maleta_revendedora",
    titulo_es: "🎁 Nueva consignación lista",
    body_es: "Tu nueva consignación #{maleta_id} está lista. ¡Revisa los artículos y empieza a vender!",
  },
  {
    tipo: "brinde_disponivel",
    titulo_es: "🎁 ¡Tu canje fue aprobado!",
    body_es: "¡Felicitaciones! Tu canje de premio fue aprobado. Coordina la entrega con tu consultora.",
  },
  {
    tipo: "pontos_concedidos",
    titulo_es: "⭐ ¡Ganaste puntos!",
    body_es: "¡Ganaste {pontos} puntos! Sigue así para subir de nivel y acceder a más beneficios.",
  },
];

async function seedTemplatesIfEmpty(): Promise<void> {
  if (!("notificacaoTemplate" in prisma)) {
    console.error("[seedTemplatesIfEmpty] prisma.notificacaoTemplate is undefined — schema may not be generated yet");
    return;
  }
  const count = await prisma.notificacaoTemplate.count();
  if (count === 0) {
    await prisma.notificacaoTemplate.createMany({
      data: DEFAULT_TEMPLATES,
      skipDuplicates: true,
    });
  }
}

// ============================================
// Templates
// ============================================

export async function getNotificacaoTemplates(): Promise<NotificacaoTemplate[]> {
  await requireAuth(["ADMIN"]);
  if (!("notificacaoTemplate" in prisma)) {
    console.error("[getNotificacaoTemplates] prisma.notificacaoTemplate is undefined");
    return [];
  }
  await seedTemplatesIfEmpty();
  return prisma.notificacaoTemplate.findMany({
    orderBy: { tipo: "asc" },
  });
}

export async function updateNotificacaoTemplate(
  id: string,
  data: { titulo_es: string; body_es: string; ativo: boolean }
): Promise<NotificacaoTemplate> {
  await requireAuth(["ADMIN"]);
  if (!("notificacaoTemplate" in prisma)) {
    throw new Error("BUSINESS: Sistema de plantillas de notificación no disponible.");
  }
  return prisma.notificacaoTemplate.update({
    where: { id },
    data: {
      titulo_es: data.titulo_es,
      body_es: data.body_es,
      ativo: data.ativo,
    },
  });
}

export async function toggleNotificacaoTemplate(id: string, ativo: boolean): Promise<NotificacaoTemplate> {
  await requireAuth(["ADMIN"]);
  if (!("notificacaoTemplate" in prisma)) {
    throw new Error("BUSINESS: Sistema de plantillas de notificación no disponible.");
  }
  return prisma.notificacaoTemplate.update({
    where: { id },
    data: { ativo },
  });
}

// ============================================
// Teste de push
// ============================================

export async function enviarPushTeste(): Promise<{ success: boolean; message: string }> {
  const user = await requireAuth(["ADMIN"]);

  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
  const restKey = process.env.ONESIGNAL_REST_API_KEY;

  if (!appId || !restKey) {
    return { success: false, message: "OneSignal no está configurado. Verifica las variables de entorno." };
  }

  try {
    const res = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        Authorization: `Basic ${restKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        app_id: appId,
        include_aliases: { external_id: [user.id] },
        target_channel: "push",
        headings: { es: "✅ Notificación de prueba" },
        contents: { es: "¡Las notificaciones push están funcionando correctamente en Monarca!" },
        data: { tipo: "teste" },
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, message: `Error OneSignal: ${err.errors?.[0] || res.statusText}` };
    }

    const data = await res.json();

    // Registrar no log (skip se model ainda não disponível no client)
    if ("notificacaoLog" in prisma) {
      await prisma.notificacaoLog.create({
        data: {
          tipo: "teste",
          reseller_ids: [user.profileId ?? user.id],
          total_enviado: 1,
          onesignal_id: data.id,
          payload: {
            app_id: appId,
            target: user.id,
            headings: "✅ Notificación de prueba",
          } as Prisma.InputJsonValue,
        },
      });
    } else {
      console.error("[enviarPushTeste] prisma.notificacaoLog is undefined — skipping log entry");
    }

    return { success: true, message: "Notificación de prueba enviada correctamente." };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    return { success: false, message: msg };
  }
}

// ============================================
// Logs
// ============================================

export interface NotificacaoLogItem {
  id: string;
  tipo: string;
  total_enviado: number;
  total_falha: number;
  created_at: Date;
}

export async function getNotificacaoLogs(
  tipo?: string,
  limit = 50
): Promise<NotificacaoLogItem[]> {
  await requireAuth(["ADMIN"]);
  if (!("notificacaoLog" in prisma)) {
    console.error("[getNotificacaoLogs] prisma.notificacaoLog is undefined");
    return [];
  }
  return prisma.notificacaoLog.findMany({
    where: tipo ? { tipo } : undefined,
    orderBy: { created_at: "desc" },
    take: limit,
    select: {
      id: true,
      tipo: true,
      total_enviado: true,
      total_falha: true,
      created_at: true,
    },
  });
}
