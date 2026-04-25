"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/user";
import { getResellerScope } from "@/lib/auth/get-reseller-scope";
import { Prisma } from "@/generated/prisma/client";
import type { NotificacaoTemplate } from "@/generated/prisma/client";

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

function formatOneSignalErrors(errors: unknown): string {
  if (!errors) return "respuesta sin detalles";
  if (Array.isArray(errors)) return errors.join("; ");
  if (typeof errors === "string") return errors;
  if (typeof errors === "object") {
    const e = errors as Record<string, unknown>;
    if (Array.isArray(e.invalid_external_user_ids)) {
      return `external_id sin suscripción: ${(e.invalid_external_user_ids as string[]).length} ID(s). La revendedora aún no instaló/abrió la PWA.`;
    }
    if (e.invalid_aliases) {
      const aliases = e.invalid_aliases as Record<string, unknown>;
      const ids = Array.isArray(aliases.external_id) ? aliases.external_id as string[] : [];
      return `aliases sin suscripción: ${ids.length} ID(s). La revendedora aún no instaló/abrió la PWA.`;
    }
    return JSON.stringify(errors);
  }
  return String(errors);
}

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
        headings: { en: "✅ Test notification", es: "✅ Notificación de prueba" },
        contents: {
          en: "Push notifications are working correctly in Monarca!",
          es: "¡Las notificaciones push están funcionando correctamente en Monarca!",
        },
        data: { tipo: "teste" },
      }),
    });

    const data = await res.json().catch(() => ({} as Record<string, unknown>));

    if (!res.ok) {
      console.error("[enviarPushTeste] OneSignal !ok:", res.status, data);
      return { success: false, message: `Error OneSignal (${res.status}): ${formatOneSignalErrors((data as { errors?: unknown }).errors) || res.statusText}` };
    }

    const recipients = typeof (data as { recipients?: number }).recipients === "number" ? (data as { recipients: number }).recipients : null;
    if (recipients === 0) {
      return {
        success: false,
        message: `OneSignal aceptó la solicitud pero no encontró ningún dispositivo vinculado a tu usuario. Instala la PWA en tu teléfono e inicia sesión antes de probar.`,
      };
    }

    const onesignalId = (data as { id?: string }).id ?? null;

    // Registrar no log (skip se model ainda não disponível no client)
    if ("notificacaoLog" in prisma) {
      await prisma.notificacaoLog.create({
        data: {
          tipo: "teste",
          reseller_ids: [user.profileId ?? user.id],
          total_enviado: 1,
          onesignal_id: onesignalId,
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

    return {
      success: true,
      message: recipients !== null
        ? `Notificación de prueba enviada a ${recipients} dispositivo(s).`
        : "Notificación de prueba enviada correctamente.",
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    return { success: false, message: msg };
  }
}

// ============================================
// Campanhas Push em Massa
// ============================================

export type FiltroCampanha = "todas" | "com_maleta_ativa" | "sem_maleta" | "onboarding_incompleto";

export interface RevendedoraCampanha {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  auth_user_id: string | null;
  colaboradora_id: string | null;
  hasMaletaAtiva: boolean;
}

export async function getRevendedorasParaCampanha(
  filtro: FiltroCampanha = "todas"
): Promise<RevendedoraCampanha[]> {
  const user = await requireAuth(["ADMIN", "COLABORADORA"]);
  const scope = getResellerScope(user);

  const whereBase: Prisma.ResellerWhereInput = {
    ...scope,
    role: "REVENDEDORA",
    is_active: true,
  };

  let where = whereBase;

  if (filtro === "com_maleta_ativa") {
    where = {
      ...whereBase,
      maletas: { some: { status: "ativa" } },
    };
  } else if (filtro === "sem_maleta") {
    where = {
      ...whereBase,
      maletas: { none: { status: { in: ["ativa", "atrasada"] } } },
    };
  } else if (filtro === "onboarding_incompleto") {
    where = {
      ...whereBase,
      onboarding_completo: false,
    };
  }

  const revendedoras = await prisma.reseller.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      whatsapp: true,
      auth_user_id: true,
      colaboradora_id: true,
      _count: {
        select: {
          maletas: { where: { status: "ativa" } },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return revendedoras.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    whatsapp: r.whatsapp,
    auth_user_id: r.auth_user_id,
    colaboradora_id: r.colaboradora_id,
    hasMaletaAtiva: r._count.maletas > 0,
  }));
}

export interface CampanhaPushResult {
  success: boolean;
  message: string;
  total_enviado: number;
  total_falha: number;
  onesignal_id?: string;
}

export async function enviarCampanhaPush(
  resellerIds: string[],
  titulo: string,
  mensagem: string
): Promise<CampanhaPushResult> {
  const user = await requireAuth(["ADMIN", "COLABORADORA"]);

  if (!resellerIds || resellerIds.length === 0) {
    return { success: false, message: "Selecciona al menos una revendedora.", total_enviado: 0, total_falha: 0 };
  }

  if (!titulo.trim() || !mensagem.trim()) {
    return { success: false, message: "Título y mensaje son obligatorios.", total_enviado: 0, total_falha: 0 };
  }

  // Validação de escopo: COLABORADORA só pode enviar para suas revendedoras
  if (user.role === "COLABORADORA" && user.profileId) {
    const revendedoras = await prisma.reseller.findMany({
      where: {
        id: { in: resellerIds },
        colaboradora_id: user.profileId,
      },
      select: { id: true },
    });
    const validIds = new Set(revendedoras.map((r) => r.id));
    const invalidIds = resellerIds.filter((id) => !validIds.has(id));
    if (invalidIds.length > 0) {
      return {
        success: false,
        message: `No puedes enviar a ${invalidIds.length} revendedora(s) que no están en tu equipo.`,
        total_enviado: 0,
        total_falha: 0,
      };
    }
  }

  // Buscar auth_user_id das revendedoras selecionadas
  const revendedoras = await prisma.reseller.findMany({
    where: { id: { in: resellerIds }, is_active: true },
    select: { id: true, auth_user_id: true },
  });

  const userIds = revendedoras.map((r) => r.auth_user_id).filter(Boolean) as string[];
  const semAuthUserId = revendedoras.filter((r) => !r.auth_user_id).length;

  if (userIds.length === 0) {
    return {
      success: false,
      message: "Ninguna de las revendedoras seleccionadas tiene un dispositivo vinculado para push.",
      total_enviado: 0,
      total_falha: resellerIds.length,
    };
  }

  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
  const restKey = process.env.ONESIGNAL_REST_API_KEY;

  if (!appId || !restKey) {
    return { success: false, message: "OneSignal no está configurado.", total_enviado: 0, total_falha: userIds.length };
  }

  // OneSignal suporta até ~2000 external_ids por request
  const BATCH_SIZE = 2000;
  let totalEnviado = 0;
  let totalFalha = 0;
  let onesignalId: string | undefined;
  let firstError: string | null = null;

  for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
    const batch = userIds.slice(i, i + BATCH_SIZE);
    try {
      const res = await fetch("https://onesignal.com/api/v1/notifications", {
        method: "POST",
        headers: {
          Authorization: `Basic ${restKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          app_id: appId,
          include_aliases: { external_id: batch },
          target_channel: "push",
          headings: { en: titulo.trim(), es: titulo.trim() },
          contents: { en: mensagem.trim(), es: mensagem.trim() },
          data: { tipo: "campanha_manual" },
        }),
      });

      const data = await res.json().catch(() => ({} as Record<string, unknown>));

      if (!res.ok) {
        console.error("[enviarCampanhaPush] OneSignal !ok:", res.status, data);
        totalFalha += batch.length;
        if (!firstError) {
          firstError = `OneSignal ${res.status}: ${formatOneSignalErrors((data as { errors?: unknown }).errors) || res.statusText}`;
        }
        continue;
      }

      const recipients = typeof (data as { recipients?: number }).recipients === "number"
        ? (data as { recipients: number }).recipients
        : batch.length;
      const enviadosNoBatch = Math.min(recipients, batch.length);
      const falhasNoBatch = batch.length - enviadosNoBatch;
      totalEnviado += enviadosNoBatch;
      totalFalha += falhasNoBatch;
      if (falhasNoBatch > 0 && !firstError) {
        const errs = (data as { errors?: unknown }).errors;
        firstError = errs ? formatOneSignalErrors(errs) : "algunos external_id sin suscripción";
      }
      if (!onesignalId) onesignalId = (data as { id?: string }).id;
    } catch (error) {
      console.error("[enviarCampanhaPush] Exceção:", error instanceof Error ? error.message : error);
      totalFalha += batch.length;
      if (!firstError) firstError = error instanceof Error ? error.message : "fallo de red";
    }
  }

  // Registrar no log
  if ("notificacaoLog" in prisma) {
    await prisma.notificacaoLog.create({
      data: {
        tipo: "campanha_manual",
        reseller_ids: resellerIds,
        total_enviado: totalEnviado,
        total_falha: totalFalha + semAuthUserId,
        onesignal_id: onesignalId || null,
        payload: {
          titulo: titulo.trim(),
          mensagem: mensagem.trim(),
          enviado_por: user.id,
          enviado_por_role: user.role,
          filtro_manual: true,
        } as Prisma.InputJsonValue,
      },
    });
  }

  const partes: string[] = [`Enviado a ${totalEnviado} dispositivo(s).`];
  if (totalFalha > 0) {
    partes.push(`${totalFalha} sin suscripción activa en OneSignal.`);
  }
  if (semAuthUserId > 0) {
    partes.push(`${semAuthUserId} sin dispositivo vinculado.`);
  }
  if (totalEnviado === 0 && firstError) {
    partes.push(`Detalle: ${firstError}`);
  }

  return {
    success: totalEnviado > 0,
    message: totalFalha === 0 && semAuthUserId === 0
      ? `Campanha enviada correctamente a ${totalEnviado} revendedora(s).`
      : partes.join(" "),
    total_enviado: totalEnviado,
    total_falha: totalFalha + semAuthUserId,
    onesignal_id: onesignalId,
  };
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
