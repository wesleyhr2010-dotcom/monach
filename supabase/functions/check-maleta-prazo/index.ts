import { createClient } from "npm:@supabase/supabase-js@2";
import { notificarRevendedora } from "../_shared/notifications.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ONESIGNAL_APP_ID = Deno.env.get("ONESIGNAL_APP_ID")!;
const ONESIGNAL_REST_API_KEY = Deno.env.get("ONESIGNAL_REST_API_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

Deno.serve(async () => {
  try {
    const now = new Date();
    const resultados = { d3: 0, d1: 0 };

    // ── Maletas ativas com prazo entre agora e 49h (cobre D-3 e D-1) ──
    const limiteSuperior = new Date(now.getTime() + 49 * 60 * 60 * 1000);

    const { data: maletas, error: errMaletas } = await supabase
      .from("maletas")
      .select("id, numero, reseller_id, data_limite, resellers(name, auth_user_id)")
      .eq("status", "ativa")
      .gte("data_limite", now.toISOString())
      .lt("data_limite", limiteSuperior.toISOString());

    if (errMaletas) throw errMaletas;
    if (!maletas || maletas.length === 0) {
      return new Response("Sin maletas próximas a vencer", { status: 200 });
    }

    for (const maleta of maletas) {
      const reseller = maleta.resellers as {
        name: string;
        auth_user_id: string | null;
      } | null;

      const diasRestantes = Math.ceil(
        (new Date(maleta.data_limite).getTime() - now.getTime()) /
          (1000 * 60 * 60 * 24)
      );

      // Determina tipo: D-1 (≤1 dia) ou D-3 (2 dias)
      const tipo = diasRestantes <= 1 ? "prazo_proximo_d1" : "prazo_proximo";

      // ── Deduplicação: evitar notificar 2x em 24h para a mesma maleta/tipo ──
      const vinteQuatroHorasAtras = new Date(
        now.getTime() - 24 * 60 * 60 * 1000
      ).toISOString();

      const { count: jaNotificou, error: errCount } = await supabase
        .from("notificacoes")
        .select("*", { count: "exact", head: true })
        .eq("reseller_id", maleta.reseller_id)
        .eq("tipo", tipo)
        .gte("created_at", vinteQuatroHorasAtras)
        .filter("dados->>maleta_id", "eq", String(maleta.id));

      if (errCount) {
        console.error("[check-maleta-prazo] Erro deduplicação:", errCount.message);
      }
      if ((jaNotificou ?? 0) > 0) continue;

      // ── Notificar ──
      await notificarRevendedora(supabase, ONESIGNAL_APP_ID, ONESIGNAL_REST_API_KEY, {
        reseller_id: maleta.reseller_id,
        auth_user_id: reseller?.auth_user_id,
        tipo,
        tituloDefault: "¡Plazo próximo!",
        mensagemDefault:
          diasRestantes <= 1
            ? "Tu consignación vence mañana. ¡No olvides devolver!"
            : `Tu consignación vence en ${diasRestantes} día(s). ¡No olvides devolver!`,
        dados: {
          cta_url: `/app/maleta/${maleta.id}/devolver`,
          maleta_id: maleta.id,
        },
        variaveis: {
          maleta_id: maleta.numero ?? maleta.id,
          dias_restantes: diasRestantes,
          nome_revendedora: reseller?.name ?? "",
        },
      });

      if (diasRestantes <= 1) resultados.d1++;
      else resultados.d3++;
    }

    return new Response(
      JSON.stringify({
        success: true,
        d3Notified: resultados.d3,
        d1Notified: resultados.d1,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[check-maleta-prazo] Error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
