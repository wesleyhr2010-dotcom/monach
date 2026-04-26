-- =============================================================================
-- SQL de Teste Rápido v2 — Força criação de maletas de teste
-- =============================================================================
-- Use este script se o anterior não criou maletas (conflito de UNIQUE ou
-- todas as revendedoras já terem maletas ativas).
--
-- Este script:
--   1. Cria maletas de teste diretamente (sem ON CONFLICT)
--   2. Usa a primeira revendedora disponível com auth_user_id
--   3. Se necessário, atualiza maletas existentes para simular os cenários
-- =============================================================================

-- ------------------------------------------------------------------------------
-- 1. IDENTIFICAR REVENDEDORA DE TESTE
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  v_reseller_id UUID;
  v_maleta_d1_id UUID;
  v_maleta_atrasada_id UUID;
BEGIN
  -- Pegar a primeira revendedora com auth_user_id
  SELECT id INTO v_reseller_id 
  FROM resellers 
  WHERE auth_user_id IS NOT NULL 
  LIMIT 1;

  IF v_reseller_id IS NULL THEN
    RAISE EXCEPTION 'Nenhuma revendedora com auth_user_id encontrada. Crie uma revendedora primeiro.';
  END IF;

  RAISE NOTICE 'Usando revendedora: %', v_reseller_id;

  -- ------------------------------------------------------------------------------
  -- 2. CRIAR MALETA D-1 (prazo para amanhã)
  -- ------------------------------------------------------------------------------
  INSERT INTO maletas (reseller_id, status, data_envio, data_limite)
  VALUES (
    v_reseller_id,
    'ativa',
    NOW() - INTERVAL '1 day',
    NOW() + INTERVAL '1 day'
  )
  RETURNING id INTO v_maleta_d1_id;

  RAISE NOTICE 'Maleta D-1 criada: %', v_maleta_d1_id;

  -- ------------------------------------------------------------------------------
  -- 3. CRIAR MALETA ATRASADA (já vencida)
  -- ------------------------------------------------------------------------------
  INSERT INTO maletas (reseller_id, status, data_envio, data_limite)
  VALUES (
    v_reseller_id,
    'ativa',
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '1 day'
  )
  RETURNING id INTO v_maleta_atrasada_id;

  RAISE NOTICE 'Maleta atrasada criada: %', v_maleta_atrasada_id;

END $$;

-- ------------------------------------------------------------------------------
-- 4. VERIFICAR DADOS CRIADOS
-- ------------------------------------------------------------------------------
SELECT 'Maletas ativas com prazo < 2 dias' AS check_item, COUNT(*) AS count 
FROM maletas 
WHERE status = 'ativa' AND data_limite < NOW() + INTERVAL '2 days';

SELECT 'Maletas ativas já vencidas' AS check_item, COUNT(*) AS count 
FROM maletas 
WHERE status = 'ativa' AND data_limite < NOW();

SELECT 'Eventos analytics de ontem' AS check_item, COUNT(*) AS count 
FROM analytics_acessos 
WHERE data_acesso >= (NOW() AT TIME ZONE 'America/Asuncion')::date - INTERVAL '1 day' 
  AND is_bot = false;

-- ------------------------------------------------------------------------------
-- 5. LIMPAR NOTIFICAÇÕES DE TESTE ANTERIORES (para permitir reexecução)
-- ------------------------------------------------------------------------------
-- DELETE FROM notificacoes 
-- WHERE tipo IN ('prazo_proximo', 'prazo_proximo_d1', 'maleta_atrasada') 
--   AND created_at > NOW() - INTERVAL '1 hour';
