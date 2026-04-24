import { prisma } from "@/lib/prisma";
import { sendPushNotification } from "@/lib/onesignal-server";
import { sanitizeForLog } from "@/lib/errors/sanitize-log";

export type TipoNotificacao =
  | "nova_maleta"
  | "prazo_proximo"
  | "maleta_atrasada"
  | "acerto_confirmado"
  | "brinde_entregue"
  | "pontos_ganhos"
  | "documento_reprovado"
  | "documento_aprovado";

export interface DadosNotificacao {
  cta_url?: string;
  maleta_id?: string;
  pontos?: number;
  motivo?: string;
  observacao?: string;
  [key: string]: unknown;
}

export interface CriarNotificacaoInput {
  reseller_id: string;
  tipo: TipoNotificacao;
  titulo: string;
  mensagem: string;
  dados?: DadosNotificacao;
}

/**
 * Cria um registro de notificação no banco (histórico persistente).
 * Independente de push — sempre persiste.
 */
export async function criarNotificacao(input: CriarNotificacaoInput) {
  try {
    const notif = await prisma.notificacao.create({
      data: {
        reseller_id: input.reseller_id,
        tipo: input.tipo,
        titulo: input.titulo,
        mensagem: input.mensagem,
        dados: input.dados ?? {},
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
  tipo: TipoNotificacao
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
  tipo: TipoNotificacao,
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
 * Combinação completa: persiste notificação + envia push condicional.
 * Retorna a notificação criada (ou null em caso de erro no banco).
 */
export async function notificarRevendedora(
  input: CriarNotificacaoInput & {
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
