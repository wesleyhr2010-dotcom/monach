-- =============================================================================
-- SQL de Teste Rápido — Cron Jobs (Edge Functions)
-- =============================================================================
-- Rode este script no SQL Editor do Supabase Dashboard para preparar dados
-- de teste, depois invoque as Edge Functions via curl ou Dashboard.
--
-- Atenção: use apenas em ambiente de desenvolvimento/preview.
-- =============================================================================

-- ------------------------------------------------------------------------------
-- 1. PREPARAR DADOS DE TESTE — Maleta com prazo próximo (D-1)
-- ------------------------------------------------------------------------------
-- Escolha uma revendedora existente para o teste:
-- SELECT id, name, auth_user_id FROM resellers LIMIT 5;

-- Criar uma maleta de teste com data_limite = amanhã (simula D-1):
INSERT INTO maletas (reseller_id, status, data_envio, data_limite)
SELECT 
  id AS reseller_id,
  'ativa' AS status,
  NOW() - INTERVAL '1 day' AS data_envio,
  NOW() + INTERVAL '1 day' AS data_limite
FROM resellers
WHERE auth_user_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 1
ON CONFLICT DO NOTHING;

-- Verificar a maleta criada:
-- SELECT id, reseller_id, status, data_limite FROM maletas WHERE status = 'ativa' AND data_limite < NOW() + INTERVAL '2 days';

-- ------------------------------------------------------------------------------
-- 2. PREPARAR DADOS DE TESTE — Maleta atrasada
-- ------------------------------------------------------------------------------
-- Criar uma maleta de teste com data_limite = ontem (simula atrasada):
INSERT INTO maletas (reseller_id, status, data_envio, data_limite)
SELECT 
  id AS reseller_id,
  'ativa' AS status,
  NOW() - INTERVAL '10 days' AS data_envio,
  NOW() - INTERVAL '1 day' AS data_limite
FROM resellers
WHERE auth_user_id IS NOT NULL
  AND id NOT IN (SELECT reseller_id FROM maletas WHERE status = 'ativa')
ORDER BY created_at DESC
LIMIT 1
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------------------------
-- 3. PREPARAR DADOS DE TESTE — Eventos de analytics (ontem)
-- ------------------------------------------------------------------------------
-- Inserir eventos fake de ontem para testar agregação:
INSERT INTO analytics_acessos (reseller_id, visitor_id, tipo_evento, data_acesso, is_bot)
SELECT 
  id AS reseller_id,
  gen_random_uuid()::text AS visitor_id,
  'catalogo_revendedora' AS tipo_evento,
  (NOW() AT TIME ZONE 'America/Asuncion')::date - INTERVAL '1 day' + (random() * INTERVAL '23 hours') AS data_acesso,
  false AS is_bot
FROM resellers
WHERE auth_user_id IS NOT NULL
LIMIT 10;

-- Inserir alguns cliques no WhatsApp:
INSERT INTO analytics_acessos (reseller_id, visitor_id, tipo_evento, data_acesso, is_bot)
SELECT 
  id AS reseller_id,
  gen_random_uuid()::text AS visitor_id,
  'clique_whatsapp' AS tipo_evento,
  (NOW() AT TIME ZONE 'America/Asuncion')::date - INTERVAL '1 day' + (random() * INTERVAL '23 hours') AS data_acesso,
  false AS is_bot
FROM resellers
WHERE auth_user_id IS NOT NULL
LIMIT 5;

-- ------------------------------------------------------------------------------
-- 4. VERIFICAR ESTADO ANTES DO TESTE
-- ------------------------------------------------------------------------------
SELECT 'Maletas ativas com prazo < 2 dias' AS check_item, COUNT(*) AS count FROM maletas WHERE status = 'ativa' AND data_limite < NOW() + INTERVAL '2 days';
SELECT 'Maletas ativas já vencidas' AS check_item, COUNT(*) AS count FROM maletas WHERE status = 'ativa' AND data_limite < NOW();
SELECT 'Eventos analytics de ontem' AS check_item, COUNT(*) AS count FROM analytics_acessos WHERE data_acesso >= (NOW() AT TIME ZONE 'America/Asuncion')::date - INTERVAL '1 day' AND is_bot = false;

-- ------------------------------------------------------------------------------
-- 5. LIMPAR NOTIFICAÇÕES DE TESTE ANTERIORES (opcional)
-- ------------------------------------------------------------------------------
-- Se quiser reexecutar o teste de D-1/D-3, limpe as notificações recentes:
-- DELETE FROM notificacoes WHERE tipo IN ('prazo_proximo', 'prazo_proximo_d1', 'maleta_atrasada') AND created_at > NOW() - INTERVAL '1 hour';

-- =============================================================================
-- INSTRUÇÕES DE INVOCAÇÃO MANUAL
-- =============================================================================
-- Após rodar este SQL, invoque as Edge Functions via Dashboard ou curl:
--
-- Dashboard:
--   1. Acesse: https://supabase.com/dashboard/project/YOUR_REF/functions
--   2. Clique em "check-maleta-prazo" → "Invoke"
--   3. Clique em "marcar-maletas-atrasadas" → "Invoke"
--   4. Clique em "agrega-analytics-diario" → "Invoke"
--
-- Curl (substitua YOUR_SERVICE_ROLE_KEY):
--   curl -X POST https://YOUR_REF.supabase.co/functions/v1/check-maleta-prazo \
--     -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
--
--   curl -X POST https://YOUR_REF.supabase.co/functions/v1/marcar-maletas-atrasadas \
--     -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
--
--   curl -X POST https://YOUR_REF.supabase.co/functions/v1/agrega-analytics-diario \
--     -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
--
-- VERIFICAÇÃO:
--   - Notificações: SELECT * FROM notificacoes ORDER BY created_at DESC LIMIT 10;
--   - Analytics: SELECT * FROM analytics_diario ORDER BY data DESC LIMIT 10;
--   - Maletas: SELECT id, status, data_limite FROM maletas WHERE status = 'atrasada' ORDER BY updated_at DESC LIMIT 5;
-- =============================================================================
