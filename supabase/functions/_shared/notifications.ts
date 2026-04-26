// Helpers compartilhados entre Edge Functions de cron jobs
// Deno runtime — usar apenas APIs do navegador/Deno

import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

export interface NotificacaoTemplate {
  id: string;
  tipo: string;
  titulo_es: string;
  body_es: string;
  ativo: boolean;
}

/**
 * Substitui variáveis no formato {chave} por valores do contexto.
 */
export function substituirVariaveis(
  template: string,
  ctx: Record<string, string | number | undefined>
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const val = ctx[key];
    return val !== undefined && val !== null ? String(val) : `{${key}}`;
  });
}

/**
 * Busca template ativo do banco pelo tipo.
 */
export async function buscarTemplate(
  supabase: SupabaseClient,
  tipo: string
): Promise<NotificacaoTemplate | null> {
  const { data, error } = await supabase
    .from("notificacao_templates")
    .select("id, tipo, titulo_es, body_es, ativo")
    .eq("tipo", tipo)
    .eq("ativo", true)
    .single();

  if (error || !data) {
    console.warn(`[buscarTemplate] Template não encontrado ou inativo: ${tipo}`, error?.message);
    return null;
  }
  return data as NotificacaoTemplate;
}

/**
 * Verifica se a revendedora permite push para um tipo específico.
 * Defaults: tudo true exceto pontos_ganhos (false).
 */
export async function podeEnviarPush(
  supabase: SupabaseClient,
  resellerId: string,
  tipo: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("notificacao_preferencias")
    .select(tipo)
    .eq("reseller_id", resellerId)
    .single();

  if (error || !data) {
    // Sem preferência cadastrada: default false apenas para pontos_ganhos
    return tipo !== "pontos_ganhos";
  }

  // data pode ter a chave do tipo como boolean ou null
  const val = data[tipo];
  if (val === false) return false;
  if (val === true) return true;
  return tipo !== "pontos_ganhos";
}

/**
 * Cria registro de notificação no histórico (notificacoes).
 */
export async function criarNotificacao(
  supabase: SupabaseClient,
  input: {
    reseller_id: string;
    tipo: string;
    titulo: string;
    mensagem: string;
    dados?: Record<string, unknown>;
  }
) {
  const { error } = await supabase.from("notificacoes").insert({
    reseller_id: input.reseller_id,
    tipo: input.tipo,
    titulo: input.titulo,
    mensagem: input.mensagem,
    dados: input.dados ?? {},
    lida: false,
  });

  if (error) {
    console.error("[criarNotificacao] Erro ao persistir:", error.message);
  }
}

/**
 * Envia push via OneSignal REST API.
 */
export async function enviarPushOneSignal(
  onesignalAppId: string,
  onesignalKey: string,
  resellerAuthUserId: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
) {
  const resp = await fetch("https://onesignal.com/api/v1/notifications", {
    method: "POST",
    headers: {
      Authorization: `Basic ${onesignalKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      app_id: onesignalAppId,
      include_aliases: { external_id: [resellerAuthUserId] },
      target_channel: "push",
      headings: { es: title },
      contents: { es: body },
      data: data ?? {},
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`OneSignal ${resp.status}: ${text}`);
  }
}

/**
 * Combinação: busca template → substitui variáveis → persiste → push condicional.
 * Fallback para textos default se template inativo/ausente.
 */
export async function notificarRevendedora(
  supabase: SupabaseClient,
  onesignalAppId: string,
  onesignalKey: string,
  input: {
    reseller_id: string;
    auth_user_id?: string | null;
    tipo: string;
    tituloDefault: string;
    mensagemDefault: string;
    dados?: Record<string, unknown>;
    variaveis?: Record<string, string | number | undefined>;
  }
) {
  const template = await buscarTemplate(supabase, input.tipo);

  const titulo = template
    ? substituirVariaveis(template.titulo_es, input.variaveis ?? {})
    : input.tituloDefault;
  const mensagem = template
    ? substituirVariaveis(template.body_es, input.variaveis ?? {})
    : input.mensagemDefault;

  // Persistir no banco
  await criarNotificacao(supabase, {
    reseller_id: input.reseller_id,
    tipo: input.tipo,
    titulo,
    mensagem,
    dados: input.dados,
  });

  // Push condicional
  if (input.auth_user_id) {
    const permitido = await podeEnviarPush(supabase, input.reseller_id, input.tipo);
    if (!permitido) {
      console.log(`[notificarRevendedora] Push bloqueado por preferência: ${input.tipo}`);
      return;
    }
    try {
      await enviarPushOneSignal(
        onesignalAppId,
        onesignalKey,
        input.auth_user_id,
        titulo,
        mensagem,
        input.dados
      );
    } catch (err) {
      console.error("[notificarRevendedora] Erro push:", err instanceof Error ? err.message : err);
    }
  }
}
