-- Migration: Adiciona campo pontos_por_guarani em GamificacaoRegra
-- Permite configurar pontos proporcionais ao valor da venda em Guaranis
-- (ex: 0.001 = 1 ponto a cada 1.000 Gs)
-- NULL = continua usando pontos fixos (retrocompatível)

ALTER TABLE "gamificacao_regras"
  ADD COLUMN IF NOT EXISTS "pontos_por_guarani" DECIMAL(10, 6);
