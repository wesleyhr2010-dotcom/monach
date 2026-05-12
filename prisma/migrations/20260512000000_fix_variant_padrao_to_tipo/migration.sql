-- Migration: Corrige attribute_name de 'Padrão' para 'Tipo' em produtos simples
-- Causado por inconsistência entre criação via admin ('Tipo/Único') e sync ('Padrão/Único')
-- Após essa migration, todos os produtos simples usarão 'Tipo/Único'

-- 1. Atualiza os registros
UPDATE product_variants
SET attribute_name = 'Tipo'
WHERE attribute_name = 'Padrão'
  AND attribute_value = 'Único';

-- 2. Registra a migration no Prisma (para não rodar de novo no migrate deploy)
INSERT INTO _prisma_migrations (
    id,
    checksum,
    finished_at,
    migration_name,
    logs,
    rolled_back_at,
    started_at,
    applied_steps_count
)
SELECT
    gen_random_uuid(),
    '',
    now(),
    '20260512000000_fix_variant_padrao_to_tipo',
    '',
    null,
    now(),
    1
WHERE NOT EXISTS (
    SELECT 1 FROM _prisma_migrations
    WHERE migration_name = '20260512000000_fix_variant_padrao_to_tipo'
);
