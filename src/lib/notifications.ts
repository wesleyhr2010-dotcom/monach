import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { sendPushNotification } from "@/lib/onesignal-server";
import { sanitizeForLog } from "@/lib/errors/sanitize-log";
import DOMPurify from "isomorphic-dompurify";

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

/**
 * Substitui placeholders `{chave}` em um template por valores do contexto.
 * Suporta notação de ponto para objetos aninhados: `{maleta.id}`.
 * Se whitelist for fornecida, apenas chaves na whitelist são substituídas.
 * Chaves não encontradas no contexto permanecem como estão.
 */
export function substituirVariaveis(
  template: string,
  contexto: Record<string, unknown>,
  whitelist?: string[]
): string {
  return template.replace(/\{([^}]+)\}/g, (match, key) => {
    if (whitelist && !whitelist.includes(key)) {
      return match;
    }

    const parts = key.split(".");
    let value: unknown = contexto;

    for (const part of parts) {
      if (value && typeof value === "object" && part in value) {
        value = (value as Record<string, unknown>)[part];
      } else {
        return match;
      }
    }

    return value !== undefined && value !== null ? String(value) : match;
  });
}

/**
 * Whitelist de variáveis permitidas por tipo de notificação.
 * Hardcoded em código-fonte — não configurável em runtime.
 */
export const VARIAVEIS_POR_TIPO: Record<string, string[]> = {
  prazo_proximo: ["maleta_id", "dias_restantes", "nome_revendedora"],
  maleta_atrasada: ["maleta_id", "nome_revendedora"],
  pontos_ganhos: ["pontos", "motivo", "nome_revendedora"],
  acerto_confirmado: ["maleta_id", "valor_comissao", "nome_revendedora"],
  devolucao_recebida: ["maleta_id", "nome_revendedora"],
  nova_maleta: ["maleta_id", "nome_revendedora"],
  brinde_entregue: ["nome_regalo", "nome_revendedora"],
};

/**
 * Mapeia os valores de `tipo` armazenados no banco para as chaves de
 * `VARIAVEIS_POR_TIPO`.  Alguns templates no BD usam sufixos (ex. d3/d1)
 * que compartilham a mesma whitelist.
 */
export function mapTipoParaWhitelist(tipoDb: string): string | null {
  if (tipoDb.startsWith("prazo_proximo")) return "prazo_proximo";
  if (tipoDb === "maleta_atrasada") return "maleta_atrasada";
  if (tipoDb === "maleta_devolvida_admin") return "devolucao_recebida";
  if (tipoDb === "nova_maleta_revendedora") return "nova_maleta";
  if (tipoDb === "brinde_disponivel") return "brinde_entregue";
  if (tipoDb === "pontos_concedidos") return "pontos_ganhos";
  return null;
}

/**
 * Sanitiza HTML de template, permitindo apenas tags de formatação básicas.
 * Remove scripts, handlers de evento e atributos perigosos.
 */
export function sanitizeTemplateVars(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ["b", "i", "strong", "em", "br", "p", "a"],
    ALLOWED_ATTR: ["href"],
  });
}

/**
 * Converte HTML em texto plano para notificações push (OneSignal).
 * Substitui <br> e <p> por \n, remove tags restantes, decodifica entidades HTML.
 */
export function htmlToPlainText(html: string): string {
  let text = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p>/gi, "\n\n")
    .replace(/<p\s*\/?>/gi, "")
    .replace(/<\/p>/gi, "\n");

  // Remove todas as tags HTML restantes
  text = text.replace(/<[^>]+>/g, "");

  // Decodifica entidades HTML comuns
  const entities: Record<string, string> = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
    "&nbsp;": " ",
  };

  for (const [entity, char] of Object.entries(entities)) {
    text = text.split(entity).join(char);
  }

  // Normaliza espaços em branco
  return text.replace(/\n{3,}/g, "\n\n").trim();
}
