import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/**
 * Retorna o início e fim do dia anterior no timezone America/Asuncion (UTC-4/UTC-3).
 * Simplificação: Paraguay é UTC-4 no verão e UTC-3 no inverno.
 * Para evitar complexidade de DST, usamos o offset atual do ambiente.
 * Como Edge Functions rodam em UTC, aplicamos o offset manualmente.
 */
function getYesterdayRangePy(): { start: string; end: string; dateKey: string } {
  // Offset de Paraguay: verificar se estamos em DST (outubro-março = UTC-3, resto UTC-4)
  const now = new Date();
  const month = now.getUTCMonth(); // 0-11
  const isDST = month >= 9 || month <= 2; // outubro (9) a março (2) — aproximado
  const offsetHours = isDST ? 3 : 4;

  // Agora em PY
  const nowPy = new Date(now.getTime() - offsetHours * 60 * 60 * 1000);

  // Ontem em PY
  const yesterdayPy = new Date(nowPy);
  yesterdayPy.setDate(yesterdayPy.getDate() - 1);

  const y = yesterdayPy.getUTCFullYear();
  const m = String(yesterdayPy.getUTCMonth() + 1).padStart(2, "0");
  const d = String(yesterdayPy.getUTCDate()).padStart(2, "0");
  const dateKey = `${y}-${m}-${d}`;

  // start = ontem 00:00 PY → UTC
  const startPy = new Date(Date.UTC(y, yesterdayPy.getUTCMonth(), d, 0, 0, 0));
  const start = new Date(startPy.getTime() + offsetHours * 60 * 60 * 1000);

  // end = ontem 23:59:59.999 PY → UTC
  const endPy = new Date(Date.UTC(y, yesterdayPy.getUTCMonth(), d, 23, 59, 59, 999));
  const end = new Date(endPy.getTime() + offsetHours * 60 * 60 * 1000);

  return { start: start.toISOString(), end: end.toISOString(), dateKey };
}

Deno.serve(async () => {
  try {
    const { start, end, dateKey } = getYesterdayRangePy();

    // ── 1. Buscar eventos do dia anterior (não bot) ──
    const { data: events, error: errEvents } = await supabase
      .from("analytics_acessos")
      .select("reseller_id, tipo_evento, visitor_id")
      .gte("data_acesso", start)
      .lte("data_acesso", end)
      .eq("is_bot", false);

    if (errEvents) throw errEvents;
    if (!events || events.length === 0) {
      return new Response(
        JSON.stringify({ success: true, date: dateKey, events_processed: 0 }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // ── 2. Agrupar por (reseller_id, tipo_evento) ──
    const groups = new Map<
      string,
      { total: number; visitors: Set<string> }
    >();

    for (const evt of events) {
      const key = `${evt.reseller_id ?? "NULL"}|${evt.tipo_evento}`;
      if (!groups.has(key)) {
        groups.set(key, { total: 0, visitors: new Set() });
      }
      const g = groups.get(key)!;
      g.total++;
      if (evt.visitor_id) g.visitors.add(evt.visitor_id);
    }

    // ── 3. Upsert em analytics_diario ──
    let upserted = 0;
    const rows = [];
    for (const [key, data] of groups) {
      const [resellerId, tipo] = key.split("|");
      const rId = resellerId === "NULL" ? null : resellerId;

      rows.push({
        data: dateKey,
        reseller_id: rId,
        tipo,
        total_visitas: data.total,
        visitantes_unicos: data.visitors.size,
        cliques_whatsapp: tipo === "clique_whatsapp" ? data.total : 0,
      });
    }

    const { error: errUpsert } = await supabase
      .from("analytics_diario")
      .upsert(rows, { onConflict: "data,reseller_id,tipo" });

    if (errUpsert) throw errUpsert;
    upserted = rows.length;

    return new Response(
      JSON.stringify({
        success: true,
        date: dateKey,
        events_processed: events.length,
        groups_upserted: upserted,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[agrega-analytics-diario] Error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
