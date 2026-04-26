-- =============================================================================
-- SQL de Teste Rápido v3 — Garante maletas de teste (cria ou atualiza)
-- =============================================================================
-- Use este script se as maletas não foram criadas por conflito.
-- Este script pega a PRIMEIRA revendedora com auth_user_id e:
--   - Se não tiver maletas: cria uma D-1 e uma atrasada
--   - Se já tiver maletas: atualiza DUAS delas para simular os cenários
-- =============================================================================

-- ------------------------------------------------------------------------------
-- PASSO 1: Ver qual revendedora vamos usar
-- ------------------------------------------------------------------------------
SELECT 'Revendedora selecionada:' AS info, id, name, auth_user_id 
FROM resellers 
WHERE auth_user_id IS NOT NULL 
LIMIT 1;

-- ------------------------------------------------------------------------------
-- PASSO 2: Criar maletas de teste (se a revendedora não tiver nenhuma)
-- ------------------------------------------------------------------------------
WITH reseller_escolhida AS (
  SELECT id FROM resellers WHERE auth_user_id IS NOT NULL LIMIT 1
)
INSERT INTO maletas (reseller_id, status, data_envio, data_limite)
SELECT 
  r.id,
  'ativa',
  NOW() - INTERVAL '1 day',
  NOW() + INTERVAL '1 day'  -- vence amanhã (D-1)
FROM reseller_escolhida r
WHERE NOT EXISTS (SELECT 1 FROM maletas m WHERE m.reseller_id = r.id);

WITH reseller_escolhida AS (
  SELECT id FROM resellers WHERE auth_user_id IS NOT NULL LIMIT 1
)
INSERT INTO maletas (reseller_id, status, data_envio, data_limite)
SELECT 
  r.id,
  'ativa',
  NOW() - INTERVAL '10 days',
  NOW() - INTERVAL '1 day'  -- já venceu (atrasada)
FROM reseller_escolhida r
WHERE NOT EXISTS (SELECT 1 FROM maletas m WHERE m.reseller_id = r.id);

-- ------------------------------------------------------------------------------
-- PASSO 3: Se já existirem maletas, atualizar DUAS para os cenários de teste
-- ------------------------------------------------------------------------------
-- Atualiza a maleta mais recente para vencer amanhã (D-1)
UPDATE maletas
SET 
  status = 'ativa',
  data_limite = NOW() + INTERVAL '1 day',
  data_envio = NOW() - INTERVAL '1 day',
  updated_at = NOW()
WHERE id = (
  SELECT id FROM maletas 
  WHERE status IN ('ativa', 'concluida', 'aguardando_revisao') 
  ORDER BY created_at DESC 
  LIMIT 1
);

-- Atualiza a segunda maleta mais recente para já estar vencida (atrasada)
UPDATE maletas
SET 
  status = 'ativa',
  data_limite = NOW() - INTERVAL '1 day',
  data_envio = NOW() - INTERVAL '10 days',
  updated_at = NOW()
WHERE id = (
  SELECT id FROM maletas 
  WHERE status IN ('ativa', 'concluida', 'aguardando_revisao') 
    AND id != (SELECT id FROM maletas ORDER BY created_at DESC LIMIT 1)
  ORDER BY created_at DESC 
  LIMIT 1
);

-- ------------------------------------------------------------------------------
-- PASSO 4: Verificar o que foi criado/atualizado
-- ------------------------------------------------------------------------------
SELECT 
  id, 
  reseller_id, 
  status, 
  data_limite,
  CASE 
    WHEN data_limite < NOW() THEN 'ATRASADA'
    WHEN data_limite < NOW() + INTERVAL '2 days' THEN 'D-1 ou D-2'
    ELSE 'Normal'
  END AS situacao
FROM maletas 
WHERE status = 'ativa'
ORDER BY data_limite;

-- ------------------------------------------------------------------------------
-- PASSO 5: Contagens finais
-- ------------------------------------------------------------------------------
SELECT 'Maletas ativas com prazo < 2 dias (D-1)' AS check_item, COUNT(*) AS count 
FROM maletas WHERE status = 'ativa' AND data_limite >= NOW() AND data_limite < NOW() + INTERVAL '2 days';

SELECT 'Maletas ativas já vencidas' AS check_item, COUNT(*) AS count 
FROM maletas WHERE status = 'ativa' AND data_limite < NOW();

-- =============================================================================
-- DEPOIS DE RODAR: execute os curls no terminal para testar as Edge Functions
-- =============================================================================
