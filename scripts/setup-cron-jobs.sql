-- =============================================================================
-- Setup de Cron Jobs no Supabase (pg_cron + pg_net)
-- =============================================================================
-- Este script configura os jobs agendados que chamam as Edge Functions.
-- Pré-requisitos:
--   1. Extensões pg_cron e pg_net habilitadas no projeto Supabase.
--   2. Edge Functions deployadas em supabase/functions/.
--   3. Variáveis de ambiente das Edge Functions configuradas no Dashboard.
--
-- Como executar: Supabase Dashboard → SQL Editor → New query → Run
-- =============================================================================

-- ------------------------------------------------------------------------------
-- 0. Garantir extensões (idempotente)
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ------------------------------------------------------------------------------
-- 1. Stored procedure: agregação de analytics (opcional — Edge Function também
--    faz em JS, mas a procedure é mais performática para grandes volumes)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION aggregate_yesterday_analytics()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_start timestamptz;
  v_end   timestamptz;
  v_date  date;
  offset_hours int := CASE
    WHEN extract(month from now() AT TIME ZONE 'America/Asuncion') BETWEEN 10 AND 3 THEN 3
    ELSE 4
  END;
BEGIN
  -- Ontem em PY
  v_date  := (now() AT TIME ZONE 'America/Asuncion')::date - 1;
  v_start := (v_date::timestamptz AT TIME ZONE 'America/Asuncion') - make_interval(hours => offset_hours);
  v_end   := ((v_date + 1)::timestamptz AT TIME ZONE 'America/Asuncion') - make_interval(hours => offset_hours) - interval '1 millisecond';

  INSERT INTO analytics_diario (data, reseller_id, tipo, total_visitas, visitantes_unicos, cliques_whatsapp)
  SELECT
    v_date AS data,
    reseller_id,
    tipo_evento AS tipo,
    COUNT(*) AS total_visitas,
    COUNT(DISTINCT visitor_id) AS visitantes_unicos,
    COUNT(*) FILTER (WHERE tipo_evento = 'clique_whatsapp') AS cliques_whatsapp
  FROM analytics_acessos
  WHERE data_acesso >= v_start
    AND data_acesso <= v_end
    AND is_bot = false
  GROUP BY reseller_id, tipo_evento
  ON CONFLICT (data, reseller_id, tipo)
  DO UPDATE SET
    total_visitas     = EXCLUDED.total_visitas,
    visitantes_unicos = EXCLUDED.visitantes_unicos,
    cliques_whatsapp  = EXCLUDED.cliques_whatsapp;
END;
$$;

-- ------------------------------------------------------------------------------
-- 2. Remover jobs antigos se existirem (evita duplicados)
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  PERFORM cron.unschedule('check-maleta-prazo');
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Job check-maleta-prazo não existia (OK)';
END $$;

DO $$
BEGIN
  PERFORM cron.unschedule('marcar-maletas-atrasadas');
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Job marcar-maletas-atrasadas não existia (OK)';
END $$;

DO $$
BEGIN
  PERFORM cron.unschedule('agrega-analytics-diario');
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Job agrega-analytics-diario não existia (OK)';
END $$;

-- ------------------------------------------------------------------------------
-- 3. Criar novos jobs
-- ------------------------------------------------------------------------------
-- Horários em UTC (Paraguay = UTC-4 no inverno, UTC-3 no verão)
-- Ajustar manualmente se o horário de verão mudar.

-- Job 1: Notificar maletas próximas a vencer (D-3 / D-1)
-- Roda todos os dias às 12:00 UTC = 08:00 PY (inverno)
SELECT cron.schedule(
  'check-maleta-prazo',
  '0 12 * * *',
  $$
    SELECT net.http_post(
      url := 'https://amlwwakxpungeqpiyxwr.supabase.co/functions/v1/check-maleta-prazo',
      headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY_JWT_HERE"}'::jsonb
    )
  $$
);

-- Job 2: Marcar maletas atrasadas
-- Roda todos os dias às 05:00 UTC = 01:00 PY (inverno)
SELECT cron.schedule(
  'marcar-maletas-atrasadas',
  '0 5 * * *',
  $$
    SELECT net.http_post(
      url := 'https://amlwwakxpungeqpiyxwr.supabase.co/functions/v1/marcar-maletas-atrasadas',
      headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY_JWT_HERE"}'::jsonb
    )
  $$
);

-- Job 3: Agregar analytics diário
-- Roda todos os dias às 07:00 UTC = 03:00 PY (inverno)
SELECT cron.schedule(
  'agrega-analytics-diario',
  '0 7 * * *',
  $$
    SELECT net.http_post(
      url := 'https://amlwwakxpungeqpiyxwr.supabase.co/functions/v1/agrega-analytics-diario',
      headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY_JWT_HERE"}'::jsonb
    )
  $$
);

-- =============================================================================
-- Notas de deploy
-- =============================================================================
-- 1. As Edge Functions devem ser deployadas com:
--      npx supabase functions deploy
--    ou via Supabase CLI.
-- 2. As variáveis de ambiente das Edge Functions devem ser configuradas no
--    Supabase Dashboard → Project Settings → Edge Functions → Environment variables:
--      SUPABASE_URL=https://amlwwakxpungeqpiyxwr.supabase.co
--      SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
--      ONESIGNAL_APP_ID=400a793c-dd76-4433-b07c-dc32745d0741
--      ONESIGNAL_REST_API_KEY=<rest_api_key>
-- 3. Os jobs pg_cron agora estão ativos e rodarão automaticamente.
-- 4. Para ver os jobs ativos: SELECT * FROM cron.job;
-- 5. Para ver os logs de execução: SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;
-- =============================================================================
