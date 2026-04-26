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
    const nowIso = new Date().toISOString();

    // ── 1. Marcar maletas atrasadas ──
    const { data: maletas, error: errUpdate } = await supabase
      .from("maletas")
      .update({ status: "atrasada", updated_at: nowIso })
      .eq("status", "ativa")
      .lt("data_limite", nowIso)
      .select("id, numero, reseller_id, resellers(name, auth_user_id)");

    if (errUpdate) throw errUpdate;
    if (!maletas || maletas.length === 0) {
      return new Response("Sin maletas para marcar", { status: 200 });
    }

    // ── 2. Notificar revendedoras afetadas ──
    for (const maleta of maletas) {
      const reseller = maleta.resellers as {
        name: string;
        auth_user_id: string | null;
      } | null;

      await notificarRevendedora(supabase, ONESIGNAL_APP_ID, ONESIGNAL_REST_API_KEY, {
        reseller_id: maleta.reseller_id,
        auth_user_id: reseller?.auth_user_id,
        tipo: "maleta_atrasada",
        tituloDefault: "Consignación atrasada",
        mensagemDefault:
          "Tu consignación está atrasada. Comunícate con tu consultora.",
        dados: {
          cta_url: `/app/maleta/${maleta.id}`,
          maleta_id: maleta.id,
        },
        variaveis: {
          maleta_id: maleta.numero ?? maleta.id,
          nome_revendedora: reseller?.name ?? "",
        },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        atrasadasMarcadas: maletas.length,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[marcar-maletas-atrasadas] Error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
