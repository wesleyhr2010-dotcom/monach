-- ============================================
-- Monarca Semijoias — PRD Migration
-- Execute no Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. Extensão: product_variants (novos campos)
-- ============================================
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS stock_quantity INT DEFAULT 0;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS cost_price NUMERIC(12, 2);

-- ============================================
-- 2. Enum de roles
-- ============================================
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('ADMIN', 'COLABORADORA', 'REVENDEDORA');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- 3. Extensão: resellers (novos campos PRD)
-- ============================================
ALTER TABLE resellers ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'REVENDEDORA';
ALTER TABLE resellers ADD COLUMN IF NOT EXISTS colaboradora_id UUID REFERENCES resellers(id);
ALTER TABLE resellers ADD COLUMN IF NOT EXISTS taxa_comissao NUMERIC(5, 2) DEFAULT 0;
ALTER TABLE resellers ADD COLUMN IF NOT EXISTS documentos_url JSONB DEFAULT '[]';
ALTER TABLE resellers ADD COLUMN IF NOT EXISTS perfil_completo BOOLEAN DEFAULT FALSE;
ALTER TABLE resellers ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_resellers_auth_user ON resellers (auth_user_id);

-- ============================================
-- 4. Enum de status de maleta
-- ============================================
DO $$ BEGIN
    CREATE TYPE maleta_status AS ENUM ('ativa', 'atrasada', 'aguardando_revisao', 'concluida');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- 5. Tabela: maletas
-- ============================================
CREATE TABLE IF NOT EXISTS maletas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reseller_id UUID NOT NULL REFERENCES resellers(id) ON DELETE CASCADE,
    status maleta_status DEFAULT 'ativa',
    data_envio TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    data_limite TIMESTAMPTZ NOT NULL,
    comprovante_devolucao_url TEXT,

    -- Valores congelados no fecho
    valor_total_vendido NUMERIC(12, 2),
    valor_custo_total NUMERIC(12, 2),
    valor_comissao_revendedora NUMERIC(12, 2),
    valor_comissao_colaboradora NUMERIC(12, 2),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_maletas_reseller ON maletas (reseller_id);
CREATE INDEX IF NOT EXISTS idx_maletas_status ON maletas (status);

CREATE TRIGGER trigger_maletas_updated_at
    BEFORE UPDATE ON maletas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. Tabela: maleta_itens
-- ============================================
CREATE TABLE IF NOT EXISTS maleta_itens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    maleta_id UUID NOT NULL REFERENCES maletas(id) ON DELETE CASCADE,
    product_variant_id UUID NOT NULL REFERENCES product_variants(id),
    quantidade_enviada INT NOT NULL,
    quantidade_vendida INT DEFAULT 0,
    preco_fixado NUMERIC(12, 2),
    custo_fixado NUMERIC(12, 2)
);

CREATE INDEX IF NOT EXISTS idx_maleta_itens_maleta ON maleta_itens (maleta_id);

-- ============================================
-- 7. Tabela: gamificacao_regras
-- ============================================
CREATE TABLE IF NOT EXISTS gamificacao_regras (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    descricao TEXT DEFAULT '',
    acao TEXT NOT NULL,
    pontos INT NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 8. Tabela: pontos_extrato
-- ============================================
CREATE TABLE IF NOT EXISTS pontos_extrato (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reseller_id UUID NOT NULL REFERENCES resellers(id) ON DELETE CASCADE,
    regra_id UUID REFERENCES gamificacao_regras(id),
    pontos INT NOT NULL,
    descricao TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pontos_reseller ON pontos_extrato (reseller_id);

-- ============================================
-- 9. Tabela: resgates
-- ============================================
CREATE TABLE IF NOT EXISTS resgates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reseller_id UUID NOT NULL REFERENCES resellers(id) ON DELETE CASCADE,
    pontos INT NOT NULL,
    premio TEXT NOT NULL,
    status TEXT DEFAULT 'pendente',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resgates_reseller ON resgates (reseller_id);

-- ============================================
-- 10. Tabela: analytics_acessos
-- ============================================
CREATE TABLE IF NOT EXISTS analytics_acessos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reseller_id UUID REFERENCES resellers(id) ON DELETE SET NULL,
    visitor_id TEXT,
    tipo_evento TEXT NOT NULL,
    page_url TEXT NOT NULL,
    data_acesso TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_reseller ON analytics_acessos (reseller_id);
CREATE INDEX IF NOT EXISTS idx_analytics_data ON analytics_acessos (data_acesso);

-- ============================================
-- 11. RLS para novas tabelas
-- ============================================

-- Maletas
ALTER TABLE maletas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on maletas" ON maletas FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can read own maletas" ON maletas FOR SELECT TO authenticated USING (reseller_id IN (SELECT id FROM resellers WHERE auth_user_id = auth.uid()));

-- Maleta Itens
ALTER TABLE maleta_itens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on maleta_itens" ON maleta_itens FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can read own maleta_itens" ON maleta_itens FOR SELECT TO authenticated USING (maleta_id IN (SELECT id FROM maletas WHERE reseller_id IN (SELECT id FROM resellers WHERE auth_user_id = auth.uid())));

-- Gamificação
ALTER TABLE gamificacao_regras ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on gamificacao_regras" ON gamificacao_regras FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can read regras" ON gamificacao_regras FOR SELECT TO authenticated USING (ativo = true);

ALTER TABLE pontos_extrato ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on pontos_extrato" ON pontos_extrato FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can read own pontos" ON pontos_extrato FOR SELECT TO authenticated USING (reseller_id IN (SELECT id FROM resellers WHERE auth_user_id = auth.uid()));

ALTER TABLE resgates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on resgates" ON resgates FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can read own resgates" ON resgates FOR SELECT TO authenticated USING (reseller_id IN (SELECT id FROM resellers WHERE auth_user_id = auth.uid()));

-- Analytics
ALTER TABLE analytics_acessos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on analytics" ON analytics_acessos FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anon can insert analytics" ON analytics_acessos FOR INSERT TO anon WITH CHECK (true);
