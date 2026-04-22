-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."maleta_status" AS ENUM ('ativa', 'atrasada', 'aguardando_revisao', 'concluida');

-- CreateEnum
CREATE TYPE "public"."user_role" AS ENUM ('ADMIN', 'COLABORADORA', 'REVENDEDORA');

-- CreateTable
CREATE TABLE "public"."analytics_acessos" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "reseller_id" UUID,
    "visitor_id" TEXT,
    "tipo_evento" TEXT NOT NULL,
    "page_url" TEXT NOT NULL,
    "data_acesso" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_bot" BOOLEAN NOT NULL DEFAULT false,
    "referrer" TEXT NOT NULL DEFAULT '',
    "user_agent" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "analytics_acessos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."analytics_diario" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "data" DATE NOT NULL,
    "reseller_id" UUID,
    "tipo" TEXT NOT NULL,
    "total_visitas" INTEGER NOT NULL DEFAULT 0,
    "visitantes_unicos" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "analytics_diario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."categories" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "parent_id" UUID,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."gamificacao_regras" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "nome" TEXT NOT NULL,
    "descricao" TEXT NOT NULL DEFAULT '',
    "acao" TEXT NOT NULL,
    "pontos" INTEGER NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gamificacao_regras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."maleta_itens" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "maleta_id" UUID NOT NULL,
    "product_variant_id" UUID NOT NULL,
    "quantidade_enviada" INTEGER NOT NULL,
    "quantidade_vendida" INTEGER NOT NULL DEFAULT 0,
    "preco_fixado" DECIMAL(12,2),

    CONSTRAINT "maleta_itens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."maletas" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "reseller_id" UUID NOT NULL,
    "status" "public"."maleta_status" NOT NULL DEFAULT 'ativa',
    "data_envio" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_limite" TIMESTAMPTZ(6) NOT NULL,
    "comprovante_devolucao_url" TEXT,
    "valor_total_vendido" DECIMAL(12,2),
    "valor_comissao_revendedora" DECIMAL(12,2),
    "valor_comissao_colaboradora" DECIMAL(12,2),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maletas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."pontos_extrato" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "reseller_id" UUID NOT NULL,
    "regra_id" UUID,
    "pontos" INTEGER NOT NULL,
    "descricao" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pontos_extrato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."product_categories" (
    "product_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("product_id","category_id")
);

-- CreateTable
CREATE TABLE "public"."product_variants" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "product_id" UUID NOT NULL,
    "attribute_name" TEXT NOT NULL,
    "attribute_value" TEXT NOT NULL,
    "price" DECIMAL(12,2),
    "sku" TEXT,
    "in_stock" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stock_quantity" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."products" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "short_description" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "price" DECIMAL(12,2),
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "product_type" TEXT NOT NULL DEFAULT 'simple',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."reseller_products" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "reseller_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "custom_price" DECIMAL(12,2),
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "added_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reseller_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."resellers" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "email" TEXT NOT NULL DEFAULT '',
    "avatar_url" TEXT NOT NULL DEFAULT '',
    "bio" TEXT NOT NULL DEFAULT '',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "auth_user_id" UUID,
    "colaboradora_id" UUID,
    "documentos_url" JSONB NOT NULL DEFAULT '[]',
    "perfil_completo" BOOLEAN NOT NULL DEFAULT false,
    "taxa_comissao" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "role" "public"."user_role" NOT NULL DEFAULT 'REVENDEDORA',

    CONSTRAINT "resellers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."resgates" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "reseller_id" UUID NOT NULL,
    "pontos" INTEGER NOT NULL,
    "premio" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resgates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."vendas_maleta" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "maleta_item_id" UUID NOT NULL,
    "cliente_nome" TEXT NOT NULL,
    "cliente_telefone" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL DEFAULT 1,
    "preco_unitario" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendas_maleta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "analytics_acessos_data_acesso_idx" ON "public"."analytics_acessos"("data_acesso" ASC);

-- CreateIndex
CREATE INDEX "analytics_acessos_is_bot_idx" ON "public"."analytics_acessos"("is_bot" ASC);

-- CreateIndex
CREATE INDEX "analytics_acessos_reseller_id_idx" ON "public"."analytics_acessos"("reseller_id" ASC);

-- CreateIndex
CREATE INDEX "analytics_acessos_tipo_evento_idx" ON "public"."analytics_acessos"("tipo_evento" ASC);

-- CreateIndex
CREATE INDEX "analytics_diario_data_idx" ON "public"."analytics_diario"("data" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "analytics_diario_data_reseller_id_tipo_key" ON "public"."analytics_diario"("data" ASC, "reseller_id" ASC, "tipo" ASC);

-- CreateIndex
CREATE INDEX "analytics_diario_reseller_id_idx" ON "public"."analytics_diario"("reseller_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "public"."categories"("name" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "public"."categories"("slug" ASC);

-- CreateIndex
CREATE INDEX "maleta_itens_maleta_id_idx" ON "public"."maleta_itens"("maleta_id" ASC);

-- CreateIndex
CREATE INDEX "maleta_itens_product_variant_id_idx" ON "public"."maleta_itens"("product_variant_id" ASC);

-- CreateIndex
CREATE INDEX "maletas_created_at_idx" ON "public"."maletas"("created_at" ASC);

-- CreateIndex
CREATE INDEX "maletas_reseller_id_idx" ON "public"."maletas"("reseller_id" ASC);

-- CreateIndex
CREATE INDEX "maletas_status_idx" ON "public"."maletas"("status" ASC);

-- CreateIndex
CREATE INDEX "pontos_extrato_reseller_id_idx" ON "public"."pontos_extrato"("reseller_id" ASC);

-- CreateIndex
CREATE INDEX "product_categories_category_id_idx" ON "public"."product_categories"("category_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_product_id_attribute_name_attribute_value_key" ON "public"."product_variants"("product_id" ASC, "attribute_name" ASC, "attribute_value" ASC);

-- CreateIndex
CREATE INDEX "product_variants_product_id_idx" ON "public"."product_variants"("product_id" ASC);

-- CreateIndex
CREATE INDEX "product_variants_sku_idx" ON "public"."product_variants"("sku" ASC);

-- CreateIndex
CREATE INDEX "products_created_at_idx" ON "public"."products"("created_at" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "public"."products"("sku" ASC);

-- CreateIndex
CREATE INDEX "reseller_products_product_id_idx" ON "public"."reseller_products"("product_id" ASC);

-- CreateIndex
CREATE INDEX "reseller_products_reseller_id_idx" ON "public"."reseller_products"("reseller_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "reseller_products_reseller_id_product_id_key" ON "public"."reseller_products"("reseller_id" ASC, "product_id" ASC);

-- CreateIndex
CREATE INDEX "resellers_auth_user_id_idx" ON "public"."resellers"("auth_user_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "resellers_auth_user_id_key" ON "public"."resellers"("auth_user_id" ASC);

-- CreateIndex
CREATE INDEX "resellers_colaboradora_id_idx" ON "public"."resellers"("colaboradora_id" ASC);

-- CreateIndex
CREATE INDEX "resellers_is_active_idx" ON "public"."resellers"("is_active" ASC);

-- CreateIndex
CREATE INDEX "resellers_role_idx" ON "public"."resellers"("role" ASC);

-- CreateIndex
CREATE INDEX "resellers_slug_idx" ON "public"."resellers"("slug" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "resellers_slug_key" ON "public"."resellers"("slug" ASC);

-- CreateIndex
CREATE INDEX "resgates_reseller_id_idx" ON "public"."resgates"("reseller_id" ASC);

-- CreateIndex
CREATE INDEX "vendas_maleta_created_at_idx" ON "public"."vendas_maleta"("created_at" ASC);

-- CreateIndex
CREATE INDEX "vendas_maleta_maleta_item_id_idx" ON "public"."vendas_maleta"("maleta_item_id" ASC);

-- AddForeignKey
ALTER TABLE "public"."analytics_acessos" ADD CONSTRAINT "analytics_acessos_reseller_id_fkey" FOREIGN KEY ("reseller_id") REFERENCES "public"."resellers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."analytics_diario" ADD CONSTRAINT "analytics_diario_reseller_id_fkey" FOREIGN KEY ("reseller_id") REFERENCES "public"."resellers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."maleta_itens" ADD CONSTRAINT "maleta_itens_maleta_id_fkey" FOREIGN KEY ("maleta_id") REFERENCES "public"."maletas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."maleta_itens" ADD CONSTRAINT "maleta_itens_product_variant_id_fkey" FOREIGN KEY ("product_variant_id") REFERENCES "public"."product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."maletas" ADD CONSTRAINT "maletas_reseller_id_fkey" FOREIGN KEY ("reseller_id") REFERENCES "public"."resellers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pontos_extrato" ADD CONSTRAINT "pontos_extrato_reseller_id_fkey" FOREIGN KEY ("reseller_id") REFERENCES "public"."resellers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."product_categories" ADD CONSTRAINT "product_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."product_categories" ADD CONSTRAINT "product_categories_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."product_variants" ADD CONSTRAINT "product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reseller_products" ADD CONSTRAINT "reseller_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reseller_products" ADD CONSTRAINT "reseller_products_reseller_id_fkey" FOREIGN KEY ("reseller_id") REFERENCES "public"."resellers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."resellers" ADD CONSTRAINT "resellers_colaboradora_id_fkey" FOREIGN KEY ("colaboradora_id") REFERENCES "public"."resellers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."resgates" ADD CONSTRAINT "resgates_reseller_id_fkey" FOREIGN KEY ("reseller_id") REFERENCES "public"."resellers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vendas_maleta" ADD CONSTRAINT "vendas_maleta_maleta_item_id_fkey" FOREIGN KEY ("maleta_item_id") REFERENCES "public"."maleta_itens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

