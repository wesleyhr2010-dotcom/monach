import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { sendPushNotification } from "@/lib/onesignal-server";
import { sanitizeForLog } from "@/lib/errors/sanitize-log";

// Re-exportar utilitários compartilhados (safe para client components)
export {
  substituirVariaveis,
  VARIAVEIS_POR_TIPO,
  mapTipoParaWhitelist,
  htmlToPlainText,
} from "./notifications-shared";

export type {
  TipoNotificacao,
  DadosNotificacao,
  CriarNotificacaoInput,
} from "./notifications-shared";

/**
 * Cria um registro de notificação no banco (histórico persistente).
 * Independente de push — sempre persiste.
 */
export async function criarNotificacao(input: import("./notifications-shared").CriarNotificacaoInput) {
  try {
    const notif = await prisma.notificacao.create({
      data: {
        reseller_id: input.reseller_id,
        tipo: input.tipo,
        titulo: input.titulo,
        mensagem: input.mensagem,
        dados: (input.dados ?? {}) as Prisma.InputJsonValue,
      },
    });
    return notif;
  } catch (err) {
    console.error(
      "[criarNotificacao] Erro ao persistir notificação:",
      err instanceof Error ? err.message : err,
      sanitizeForLog({ reseller_id: input.reseller_id, tipo: input.tipo })
    );
    // Best-effort: não falha o fluxo principal se o log de notificação falhar
    return null;
  }
}

/**
 * Verifica preferência de push do revendedor para um tipo específico.
 * Se não houver preferência cadastrada, usa defaults da SPEC:
 * - pontos_ganhos: false (default OFF)
 * - demais: true (default ON)
 */
export async function podeEnviarPush(
  resellerId: string,
  tipo: import("./notifications-shared").TipoNotificacao
): Promise<boolean> {
  try {
    const prefs = await prisma.notificacaoPreferencia.findUnique({
      where: { reseller_id: resellerId },
    });

    if (!prefs) {
      return tipo !== "pontos_ganhos";
    }

    switch (tipo) {
      case "nova_maleta":
        return prefs.nova_maleta;
      case "prazo_proximo":
        return prefs.prazo_proximo;
      case "maleta_atrasada":
        return prefs.maleta_atrasada;
      case "acerto_confirmado":
        return prefs.acerto_confirmado;
      case "brinde_entregue":
        return prefs.brinde_entregue;
      case "pontos_ganhos":
        return prefs.pontos_ganhos;
      default:
        return true;
    }
  } catch (err) {
    console.error(
      "[podeEnviarPush] Erro ao verificar preferência:",
      err instanceof Error ? err.message : err
    );
    return false;
  }
}

/**
 * Envia push notification se o revendedor tiver a preferência ativa.
 */
export async function enviarPushSePermitido(
  resellerAuthUserId: string | null | undefined,
  resellerId: string,
  tipo: import("./notifications-shared").TipoNotificacao,
  titulo: string,
  mensagem: string
) {
  if (!resellerAuthUserId) return;

  const permitido = await podeEnviarPush(resellerId, tipo);
  if (!permitido) {
    console.log(`[enviarPushSePermitido] Push bloqueado por preferência: ${tipo}`);
    return;
  }

  try {
    await sendPushNotification([resellerAuthUserId], titulo, mensagem);
  } catch (err) {
    console.error(
      "[enviarPushSePermitido] Erro ao enviar push:",
      err instanceof Error ? err.message : err
    );
  }
}

/**
 * Busca template ativo no banco e substitui variáveis.
 * Retorna null se template inativo/ausente.
 */
export async function buscarTemplateAtivo(
  tipo: string
): Promise<{ titulo: string; mensagem: string } | null> {
  try {
    const template = await prisma.notificacaoTemplate.findFirst({
      where: { tipo, ativo: true },
      select: { titulo_es: true, body_es: true },
    });

    if (!template) return null;

    return {
      titulo: template.titulo_es,
      mensagem: template.body_es,
    };
  } catch (err) {
    console.error("[buscarTemplateAtivo] Erro:", err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * Combinação completa: persiste notificação + envia push condicional.
 * Retorna a notificação criada (ou null em caso de erro no banco).
 */
export async function notificarRevendedora(
  input: import("./notifications-shared").CriarNotificacaoInput & {
    auth_user_id?: string | null;
  }
) {
  const notif = await criarNotificacao(input);

  if (input.auth_user_id) {
    await enviarPushSePermitido(
      input.auth_user_id,
      input.reseller_id,
      input.tipo,
      input.titulo,
      input.mensagem
    );
  }

  return notif;
}

/**
 * Envia notificação usando template do banco com substituição de variáveis.
 * Se template inativo/ausente, usa fallback (não envia nada).
 * Falhas na notificação não quebram o fluxo principal.
 */
export async function notificarComTemplate(params: {
  reseller_id: string;
  auth_user_id?: string | null;
  tipo: import("./notifications-shared").TipoNotificacao;
  variaveis: Record<string, unknown>;
  fallbackTitulo: string;
  fallbackMensagem: string;
  dados?: import("./notifications-shared").DadosNotificacao;
}) {
  try {
    const template = await buscarTemplateAtivo(params.tipo);

    if (!template) {
      // Template inativo/ausente: não enviar (fallback removido por design)
      return null;
    }

    const whitelist = (await import("./notifications-shared")).VARIAVEIS_POR_TIPO[params.tipo];
    const titulo = (await import("./notifications-shared")).substituirVariaveis(
      template.titulo,
      params.variaveis,
      whitelist
    );
    const mensagem = (await import("./notifications-shared")).substituirVariaveis(
      template.mensagem,
      params.variaveis,
      whitelist
    );

    return notificarRevendedora({
      reseller_id: params.reseller_id,
      tipo: params.tipo,
      titulo,
      mensagem,
      dados: params.dados,
      auth_user_id: params.auth_user_id,
    });
  } catch (err) {
    console.error("[notificarComTemplate] Erro:", err instanceof Error ? err.message : err);
    return null;
  }
}
