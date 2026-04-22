-- Migration: spec_alignment
-- Alinha o schema com SPEC_DATABASE.md
-- Gerado em 2026-04-19

-- ============================================
-- Novo enum
-- ============================================
CREATE TYPE "lead_status" AS ENUM ('pendente', 'aprovado', 'rejeitado');

-- ============================================
-- AlterTable: campos existentes
-- ============================================

ALTER TABLE "analytics_acessos"
  ADD COLUMN "produto_id" UUID,
  ALTER COLUMN "page_url" SET DEFAULT '';

ALTER TABLE "analytics_diario"
  ADD COLUMN "cliques_whatsapp" INTEGER NOT NULL DEFAULT 0,
  ALTER COLUMN "tipo" SET DEFAULT '';

ALTER TABLE "categories"
  ADD COLUMN "ativo" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "gamificacao_regras"
  ADD COLUMN "icone" TEXT NOT NULL DEFAULT 'star',
  ADD COLUMN "limite_diario" INTEGER,
  ADD COLUMN "meta_valor" DECIMAL(12,2),
  ADD COLUMN "ordem" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "tipo" TEXT NOT NULL DEFAULT 'por_evento';

ALTER TABLE "maleta_itens"
  ADD COLUMN "quantidade_recebida" INTEGER;

ALTER TABLE "maletas"
  ADD COLUMN "criada_por" UUID,
  ADD COLUMN "nota_acerto" TEXT,
  ADD COLUMN "numero" SERIAL NOT NULL,
  ADD COLUMN "pct_comissao_aplicado" DECIMAL(5,2),
  ADD COLUMN "valor_total_enviado" DECIMAL(12,2);

ALTER TABLE "product_variants"
  ADD COLUMN "ativo" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "image_url" TEXT NOT NULL DEFAULT '';

ALTER TABLE "products"
  ADD COLUMN "ativo" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "resellers"
  ADD COLUMN "cedula" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "edad" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "empresa" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "endereco_cep" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "endereco_cidade" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "endereco_complemento" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "endereco_estado" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "endereco_logradouro" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "endereco_numero" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "estado_civil" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "hijos" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "informconf" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "instagram" TEXT NOT NULL DEFAULT '';

-- ============================================
-- vendas_maleta: backfill seguro para colunas NOT NULL
-- (adiciona nullable → backfill → constraint)
-- ============================================
ALTER TABLE "vendas_maleta"
  ADD COLUMN "maleta_id" UUID,
  ADD COLUMN "reseller_id" UUID;

-- Backfill: preenche maleta_id e reseller_id a partir do join existente
UPDATE "vendas_maleta" vm
SET
  maleta_id  = mi.maleta_id,
  reseller_id = m.reseller_id
FROM "maleta_itens" mi
JOIN "maletas" m ON m.id = mi.maleta_id
WHERE vm.maleta_item_id = mi.id;

-- Agora aplica NOT NULL (já que todos os registros existentes foram preenchidos)
ALTER TABLE "vendas_maleta"
  ALTER COLUMN "maleta_id" SET NOT NULL,
  ALTER COLUMN "reseller_id" SET NOT NULL;

-- ============================================
-- Novas tabelas
-- ============================================

CREATE TABLE "reseller_documentos" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "reseller_id" UUID NOT NULL,
    "tipo" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "observacao" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "reseller_documentos_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "contratos" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "nome" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "obrigatorio" BOOLEAN NOT NULL DEFAULT false,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "contratos_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "datos_bancarios" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "reseller_id" UUID NOT NULL,
    "tipo" TEXT NOT NULL,
    "alias_tipo" TEXT,
    "alias_valor" TEXT,
    "alias_titular" TEXT,
    "alias_ci_ruc" TEXT,
    "banco" TEXT,
    "agencia" TEXT,
    "cuenta" TEXT,
    "tipo_cuenta" TEXT,
    "titular" TEXT,
    "ci_ruc" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "datos_bancarios_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "nivel_regras" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "nome" TEXT NOT NULL,
    "pontos_minimos" INTEGER NOT NULL,
    "cor" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "nivel_regras_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "commission_tiers" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "min_sales_value" DECIMAL(12,2) NOT NULL,
    "pct" DECIMAL(5,2) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "commission_tiers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "brindes" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "nome" TEXT NOT NULL,
    "descricao" TEXT NOT NULL DEFAULT '',
    "imagem_url" TEXT NOT NULL,
    "custo_pontos" INTEGER NOT NULL,
    "estoque" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "brindes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "solicitacoes_brinde" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "reseller_id" UUID NOT NULL,
    "brinde_id" UUID NOT NULL,
    "pontos_debitados" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "solicitacoes_brinde_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "notificacao_preferencias" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "reseller_id" UUID NOT NULL,
    "nova_maleta" BOOLEAN NOT NULL DEFAULT true,
    "prazo_proximo" BOOLEAN NOT NULL DEFAULT true,
    "maleta_atrasada" BOOLEAN NOT NULL DEFAULT true,
    "acerto_confirmado" BOOLEAN NOT NULL DEFAULT true,
    "brinde_entregue" BOOLEAN NOT NULL DEFAULT true,
    "pontos_ganhos" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notificacao_preferencias_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "revendedora_leads" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "nome" TEXT NOT NULL,
    "cedula" TEXT NOT NULL,
    "edad" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "estado_civil" TEXT NOT NULL DEFAULT '',
    "hijos" TEXT NOT NULL DEFAULT '',
    "instagram" TEXT NOT NULL DEFAULT '',
    "whatsapp" TEXT NOT NULL,
    "empresa" TEXT NOT NULL DEFAULT '',
    "informconf" TEXT NOT NULL DEFAULT '',
    "status" "lead_status" NOT NULL DEFAULT 'pendente',
    "taxa_comissao" DECIMAL(5,2),
    "colaboradora_id" UUID,
    "observacao_admin" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "revendedora_leads_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- Índices novos
-- ============================================

CREATE INDEX "reseller_documentos_reseller_id_idx" ON "reseller_documentos"("reseller_id");
CREATE UNIQUE INDEX "datos_bancarios_reseller_id_key" ON "datos_bancarios"("reseller_id");
CREATE INDEX "solicitacoes_brinde_reseller_id_idx" ON "solicitacoes_brinde"("reseller_id");
CREATE INDEX "solicitacoes_brinde_status_idx" ON "solicitacoes_brinde"("status");
CREATE UNIQUE INDEX "notificacao_preferencias_reseller_id_key" ON "notificacao_preferencias"("reseller_id");
CREATE INDEX "revendedora_leads_status_idx" ON "revendedora_leads"("status");
CREATE INDEX "revendedora_leads_created_at_idx" ON "revendedora_leads"("created_at");
CREATE UNIQUE INDEX "gamificacao_regras_acao_key" ON "gamificacao_regras"("acao");
CREATE INDEX "pontos_extrato_created_at_idx" ON "pontos_extrato"("created_at");
CREATE INDEX "vendas_maleta_maleta_id_idx" ON "vendas_maleta"("maleta_id");
CREATE INDEX "vendas_maleta_reseller_id_idx" ON "vendas_maleta"("reseller_id");

-- ============================================
-- Foreign Keys novas
-- ============================================

ALTER TABLE "reseller_documentos"
  ADD CONSTRAINT "reseller_documentos_reseller_id_fkey"
  FOREIGN KEY ("reseller_id") REFERENCES "resellers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "datos_bancarios"
  ADD CONSTRAINT "datos_bancarios_reseller_id_fkey"
  FOREIGN KEY ("reseller_id") REFERENCES "resellers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "vendas_maleta"
  ADD CONSTRAINT "vendas_maleta_maleta_id_fkey"
  FOREIGN KEY ("maleta_id") REFERENCES "maletas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "vendas_maleta"
  ADD CONSTRAINT "vendas_maleta_reseller_id_fkey"
  FOREIGN KEY ("reseller_id") REFERENCES "resellers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "pontos_extrato"
  ADD CONSTRAINT "pontos_extrato_regra_id_fkey"
  FOREIGN KEY ("regra_id") REFERENCES "gamificacao_regras"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "solicitacoes_brinde"
  ADD CONSTRAINT "solicitacoes_brinde_reseller_id_fkey"
  FOREIGN KEY ("reseller_id") REFERENCES "resellers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "solicitacoes_brinde"
  ADD CONSTRAINT "solicitacoes_brinde_brinde_id_fkey"
  FOREIGN KEY ("brinde_id") REFERENCES "brindes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "notificacao_preferencias"
  ADD CONSTRAINT "notificacao_preferencias_reseller_id_fkey"
  FOREIGN KEY ("reseller_id") REFERENCES "resellers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "revendedora_leads"
  ADD CONSTRAINT "revendedora_leads_colaboradora_id_fkey"
  FOREIGN KEY ("colaboradora_id") REFERENCES "resellers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
