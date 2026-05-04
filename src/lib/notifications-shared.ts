/**
 * Funções e constantes compartilhadas de notificação.
 * Safe para importação em client components — não depende de Prisma ou pg.
 */

export type TipoNotificacao =
  | "nova_maleta"
  | "prazo_proximo"
  | "maleta_atrasada"
  | "acerto_confirmado"
  | "brinde_entregue"
  | "pontos_ganhos"
  | "devolucao_recebida"
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
 * Substitui placeholders `{chave}` em um template por valores do contexto.
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

export const VARIAVEIS_POR_TIPO: Record<string, string[]> = {
  prazo_proximo: ["maleta_id", "dias_restantes", "nome_revendedora"],
  maleta_atrasada: ["maleta_id", "nome_revendedora"],
  pontos_ganhos: ["pontos", "motivo", "nome_revendedora"],
  acerto_confirmado: ["maleta_id", "valor_comissao", "nome_revendedora"],
  devolucao_recebida: ["maleta_id", "nome_revendedora"],
  nova_maleta: ["maleta_id", "nome_revendedora"],
  brinde_entregue: ["nome_regalo", "nome_revendedora"],
};

export function mapTipoParaWhitelist(tipoDb: string): string | null {
  if (tipoDb.startsWith("prazo_proximo")) return "prazo_proximo";
  if (tipoDb === "maleta_atrasada") return "maleta_atrasada";
  if (tipoDb === "maleta_devolvida_admin") return "devolucao_recebida";
  if (tipoDb === "nova_maleta_revendedora") return "nova_maleta";
  if (tipoDb === "brinde_disponivel") return "brinde_entregue";
  if (tipoDb === "pontos_concedidos") return "pontos_ganhos";
  return null;
}

export function htmlToPlainText(html: string): string {
  let text = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p>/gi, "\n\n")
    .replace(/<p\s*\/?>/gi, "")
    .replace(/<\/p>/gi, "\n");

  text = text.replace(/<[^>]+>/g, "");

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

  return text.replace(/\n{3,}/g, "\n\n").trim();
}
