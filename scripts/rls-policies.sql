-- ============================================
-- NEXT-MONARCA — Row-Level Security (RLS) Policies
-- Fonte de verdade: docs/sistema/SPEC_SECURITY_RBAC.md
-- ============================================
-- Este script deve ser executado no Supabase SQL Editor.
-- service_role bypassa RLS automaticamente (não precisa de policy).
-- ============================================

-- --------------------------------------------
-- 1. RESSELLERS (perfis de usuários)
-- --------------------------------------------
ALTER TABLE resellers ENABLE ROW LEVEL SECURITY;

-- Anon/public pode ler revendedoras ativas (para vitrina pública)
CREATE POLICY IF NOT EXISTS "resellers_public_read_active"
ON resellers FOR SELECT TO anon
USING (is_active = true);

-- Authenticated pode ler seu próprio perfil
CREATE POLICY IF NOT EXISTS "resellers_auth_read_own"
ON resellers FOR SELECT TO authenticated
USING (auth_user_id = auth.uid());

-- Colaboradora pode ler suas revendedoras (manager_id) e si mesma
CREATE POLICY IF NOT EXISTS "resellers_colaboradora_read_group"
ON resellers FOR SELECT TO authenticated
USING (
    auth_user_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM resellers r2
        WHERE r2.auth_user_id = auth.uid()
        AND r2.role = 'COLABORADORA'
        AND resellers.colaboradora_id = r2.id
    )
);

-- --------------------------------------------
-- 2. MALETAS (consignações)
-- --------------------------------------------
ALTER TABLE maletas ENABLE ROW LEVEL SECURITY;

-- Authenticated pode ler suas próprias maletas (via reseller)
CREATE POLICY IF NOT EXISTS "maletas_auth_read_own"
ON maletas FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM resellers r
        WHERE r.id = maletas.reseller_id
        AND r.auth_user_id = auth.uid()
    )
);

-- --------------------------------------------
-- 3. MALETA_ITENS
-- --------------------------------------------
ALTER TABLE maleta_itens ENABLE ROW LEVEL SECURITY;

-- Authenticated pode ler itens das suas maletas
CREATE POLICY IF NOT EXISTS "maleta_itens_auth_read_own"
ON maleta_itens FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM maletas m
        JOIN resellers r ON r.id = m.reseller_id
        WHERE m.id = maleta_itens.maleta_id
        AND r.auth_user_id = auth.uid()
    )
);

-- --------------------------------------------
-- 4. VENDAS_MALETA
-- --------------------------------------------
ALTER TABLE vendas_maleta ENABLE ROW LEVEL SECURITY;

-- Authenticated pode ler suas próprias vendas
CREATE POLICY IF NOT EXISTS "vendas_maleta_auth_read_own"
ON vendas_maleta FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM resellers r
        WHERE r.id = vendas_maleta.reseller_id
        AND r.auth_user_id = auth.uid()
    )
);

-- --------------------------------------------
-- 5. PONTOS_EXTRATO
-- --------------------------------------------
ALTER TABLE pontos_extrato ENABLE ROW LEVEL SECURITY;

-- Authenticated pode ler seus próprios pontos
CREATE POLICY IF NOT EXISTS "pontos_extrato_auth_read_own"
ON pontos_extrato FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM resellers r
        WHERE r.id = pontos_extrato.reseller_id
        AND r.auth_user_id = auth.uid()
    )
);

-- --------------------------------------------
-- 6. RESELLER_DOCUMENTOS
-- --------------------------------------------
ALTER TABLE reseller_documentos ENABLE ROW LEVEL SECURITY;

-- Authenticated pode ler seus próprios documentos
CREATE POLICY IF NOT EXISTS "reseller_documentos_auth_read_own"
ON reseller_documentos FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM resellers r
        WHERE r.id = reseller_documentos.reseller_id
        AND r.auth_user_id = auth.uid()
    )
);

-- --------------------------------------------
-- 7. DADOS_BANCARIOS
-- --------------------------------------------
ALTER TABLE datos_bancarios ENABLE ROW LEVEL SECURITY;

-- Authenticated pode ler seus próprios dados bancários
CREATE POLICY IF NOT EXISTS "datos_bancarios_auth_read_own"
ON datos_bancarios FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM resellers r
        WHERE r.id = datos_bancarios.reseller_id
        AND r.auth_user_id = auth.uid()
    )
);

-- --------------------------------------------
-- 8. NOTIFICACAO_PREFERENCIAS
-- --------------------------------------------
ALTER TABLE notificacao_preferencias ENABLE ROW LEVEL SECURITY;

-- Authenticated pode ler/gerenciar suas próprias preferências
CREATE POLICY IF NOT EXISTS "notif_pref_auth_own"
ON notificacao_preferencias FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM resellers r
        WHERE r.id = notificacao_preferencias.reseller_id
        AND r.auth_user_id = auth.uid()
    )
);

-- --------------------------------------------
-- 9. SOLICITACOES_BRINDE
-- --------------------------------------------
ALTER TABLE solicitacoes_brinde ENABLE ROW LEVEL SECURITY;

-- Authenticated pode ler suas próprias solicitações
CREATE POLICY IF NOT EXISTS "solicitacoes_brinde_auth_read_own"
ON solicitacoes_brinde FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM resellers r
        WHERE r.id = solicitacoes_brinde.reseller_id
        AND r.auth_user_id = auth.uid()
    )
);

-- --------------------------------------------
-- 10. RESGATES (legado)
-- --------------------------------------------
ALTER TABLE resgates ENABLE ROW LEVEL SECURITY;

-- Authenticated pode ler seus próprios resgates
CREATE POLICY IF NOT EXISTS "resgates_auth_read_own"
ON resgates FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM resellers r
        WHERE r.id = resgates.reseller_id
        AND r.auth_user_id = auth.uid()
    )
);

-- --------------------------------------------
-- 11. ANALYTICS_ACESSOS
-- --------------------------------------------
ALTER TABLE analytics_acessos ENABLE ROW LEVEL SECURITY;

-- Anon pode inserir (tracking público)
CREATE POLICY IF NOT EXISTS "analytics_acessos_anon_insert"
ON analytics_acessos FOR INSERT TO anon
WITH CHECK (true);

-- Authenticated pode ler seus próprios acessos
CREATE POLICY IF NOT EXISTS "analytics_acessos_auth_read_own"
ON analytics_acessos FOR SELECT TO authenticated
USING (
    reseller_id IS NOT NULL
    AND EXISTS (
        SELECT 1 FROM resellers r
        WHERE r.id = analytics_acessos.reseller_id
        AND r.auth_user_id = auth.uid()
    )
);

-- --------------------------------------------
-- 12. ANALYTICS_DIARIO
-- --------------------------------------------
ALTER TABLE analytics_diario ENABLE ROW LEVEL SECURITY;

-- Authenticated pode ler seus próprios analytics diários
CREATE POLICY IF NOT EXISTS "analytics_diario_auth_read_own"
ON analytics_diario FOR SELECT TO authenticated
USING (
    reseller_id IS NOT NULL
    AND EXISTS (
        SELECT 1 FROM resellers r
        WHERE r.id = analytics_diario.reseller_id
        AND r.auth_user_id = auth.uid()
    )
);

-- --------------------------------------------
-- 13. REVENDEDORA_LEADS
-- --------------------------------------------
ALTER TABLE revendedora_leads ENABLE ROW LEVEL SECURITY;

-- Anon pode inserir (formulário público)
CREATE POLICY IF NOT EXISTS "leads_anon_insert"
ON revendedora_leads FOR INSERT TO anon
WITH CHECK (true);

-- --------------------------------------------
-- 14. GAMIFICACAO_REGRAS (público de leitura)
-- --------------------------------------------
ALTER TABLE gamificacao_regras ENABLE ROW LEVEL SECURITY;

-- Authenticated pode ler regras ativas
CREATE POLICY IF NOT EXISTS "gamificacao_regras_auth_read"
ON gamificacao_regras FOR SELECT TO authenticated
USING (ativo = true);

-- --------------------------------------------
-- 15. NIVEL_REGRAS (público de leitura)
-- --------------------------------------------
ALTER TABLE nivel_regras ENABLE ROW LEVEL SECURITY;

-- Authenticated pode ler níveis ativos
CREATE POLICY IF NOT EXISTS "nivel_regras_auth_read"
ON nivel_regras FOR SELECT TO authenticated
USING (ativo = true);

-- --------------------------------------------
-- 16. COMMISSION_TIERS (público de leitura)
-- --------------------------------------------
ALTER TABLE commission_tiers ENABLE ROW LEVEL SECURITY;

-- Authenticated pode ler tiers ativos
CREATE POLICY IF NOT EXISTS "commission_tiers_auth_read"
ON commission_tiers FOR SELECT TO authenticated
USING (ativo = true);

-- --------------------------------------------
-- 17. BRINDES (público de leitura)
-- --------------------------------------------
ALTER TABLE brindes ENABLE ROW LEVEL SECURITY;

-- Authenticated pode ler brindes ativos
CREATE POLICY IF NOT EXISTS "brindes_auth_read"
ON brindes FOR SELECT TO authenticated
USING (ativo = true);

-- --------------------------------------------
-- 18. CONTRATOS (público de leitura)
-- --------------------------------------------
ALTER TABLE contratos ENABLE ROW LEVEL SECURITY;

-- Authenticated pode ler contratos ativos
CREATE POLICY IF NOT EXISTS "contratos_auth_read"
ON contratos FOR SELECT TO authenticated
USING (ativo = true);

-- --------------------------------------------
-- 19. CATEGORIES (público de leitura)
-- --------------------------------------------
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Todos podem ler categorias
CREATE POLICY IF NOT EXISTS "categories_public_read"
ON categories FOR SELECT TO authenticated
USING (true);

CREATE POLICY IF NOT EXISTS "categories_anon_read"
ON categories FOR SELECT TO anon
USING (true);

-- --------------------------------------------
-- 20. PRODUCTS (público de leitura)
-- --------------------------------------------
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Todos podem ler produtos ativos
CREATE POLICY IF NOT EXISTS "products_public_read"
ON products FOR SELECT TO authenticated
USING (ativo = true);

CREATE POLICY IF NOT EXISTS "products_anon_read"
ON products FOR SELECT TO anon
USING (ativo = true);

-- --------------------------------------------
-- 21. PRODUCT_VARIANTS (público de leitura)
-- --------------------------------------------
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- Todos podem ler variantes ativas
CREATE POLICY IF NOT EXISTS "product_variants_public_read"
ON product_variants FOR SELECT TO authenticated
USING (ativo = true);

CREATE POLICY IF NOT EXISTS "product_variants_anon_read"
ON product_variants FOR SELECT TO anon
USING (ativo = true);

-- --------------------------------------------
-- 22. RESELLER_PRODUCTS (público de leitura)
-- --------------------------------------------
ALTER TABLE reseller_products ENABLE ROW LEVEL SECURITY;

-- Todos podem ler
CREATE POLICY IF NOT EXISTS "reseller_products_public_read"
ON reseller_products FOR SELECT
USING (true);

-- --------------------------------------------
-- 23. ESTOQUE_MOVIMENTOS
-- --------------------------------------------
ALTER TABLE estoque_movimentos ENABLE ROW LEVEL SECURITY;

-- Apenas service_role escreve; não exponha diretamente ao anon
CREATE POLICY IF NOT EXISTS "estoque_movimentos_service_only"
ON estoque_movimentos FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- NOTAS DE IMPLEMENTAÇÃO
-- ============================================
-- 1. Todas as mutations (INSERT/UPDATE/DELETE) devem ser feitas via
--    Server Actions usando SUPABASE_SERVICE_ROLE_KEY, que bypassa RLS.
-- 2. O frontend/browser usa anon_key, que é protegido por estas policies.
-- 3. Se precisar permitir INSERT de leads/analytics pelo anon, as policies
--    acima já cobrem.
-- 4. Após rodar este script, valide no Supabase Studio (Table Editor > Policies).
