-- CreateEnum
CREATE TYPE "public"."estoque_movimento_tipo" AS ENUM ('reserva_maleta', 'devolucao_maleta', 'ajuste_manual', 'venda_direta');

-- CreateTable
CREATE TABLE "public"."estoque_movimentos" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "product_variant_id" UUID NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "tipo" "public"."estoque_movimento_tipo" NOT NULL,
    "motivo" TEXT NOT NULL DEFAULT '',
    "maleta_id" UUID,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT "estoque_movimentos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "estoque_movimentos_product_variant_id_idx" ON "public"."estoque_movimentos"("product_variant_id");
CREATE INDEX "estoque_movimentos_tipo_idx" ON "public"."estoque_movimentos"("tipo");
CREATE INDEX "estoque_movimentos_created_at_idx" ON "public"."estoque_movimentos"("created_at");

-- AddForeignKeys
ALTER TABLE "public"."estoque_movimentos" ADD CONSTRAINT "estoque_movimentos_product_variant_id_fkey" FOREIGN KEY ("product_variant_id") REFERENCES "public"."product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."estoque_movimentos" ADD CONSTRAINT "estoque_movimentos_maleta_id_fkey" FOREIGN KEY ("maleta_id") REFERENCES "public"."maletas"("id") ON DELETE SET NULL ON UPDATE CASCADE;