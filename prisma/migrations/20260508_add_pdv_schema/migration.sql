-- CreateEnum
CREATE TYPE "cliente_origem" AS ENUM ('LOJA', 'REVENDEDORA');

-- CreateEnum
CREATE TYPE "moneda" AS ENUM ('PYG', 'USD', 'BRL');

-- AlterEnum
ALTER TYPE "estoque_movimento_tipo" ADD VALUE 'venda_loja';

-- AlterTable
ALTER TABLE "estoque_movimentos" ADD COLUMN "venta_loja_id" UUID;

-- CreateTable
CREATE TABLE "cotizacion_dia" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "brl_to_py" DECIMAL(12,2) NOT NULL,
    "usd_to_py" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "cotizacion_dia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "nombre" TEXT NOT NULL,
    "ruc" TEXT NOT NULL,
    "ciudad" TEXT NOT NULL DEFAULT '',
    "telefono" TEXT NOT NULL DEFAULT '',
    "origen" "cliente_origem" NOT NULL DEFAULT 'LOJA',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ventas_loja" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "cliente_id" UUID NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "moneda" "moneda" NOT NULL,
    "total_pyg" DECIMAL(12,2) NOT NULL,
    "talonario" TEXT,
    "numero_factura" TEXT,
    "tipo_operacion" TEXT,
    "cotizacion_snapshot" JSONB NOT NULL DEFAULT '{}',
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ventas_loja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "venta_loja_itens" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "venta_loja_id" UUID NOT NULL,
    "product_variant_id" UUID NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precio_unitario" DECIMAL(12,2) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "venta_loja_itens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clientes_ruc_key" ON "clientes"("ruc");
CREATE INDEX "clientes_origen_idx" ON "clientes"("origen");
CREATE INDEX "clientes_ruc_idx" ON "clientes"("ruc");
CREATE INDEX "ventas_loja_cliente_id_idx" ON "ventas_loja"("cliente_id");
CREATE INDEX "ventas_loja_created_at_idx" ON "ventas_loja"("created_at");
CREATE INDEX "venta_loja_itens_venta_loja_id_idx" ON "venta_loja_itens"("venta_loja_id");
CREATE INDEX "venta_loja_itens_product_variant_id_idx" ON "venta_loja_itens"("product_variant_id");
CREATE INDEX "estoque_movimentos_venta_loja_id_idx" ON "estoque_movimentos"("venta_loja_id");

-- AddForeignKey
ALTER TABLE "estoque_movimentos" ADD CONSTRAINT "estoque_movimentos_venta_loja_id_fkey" FOREIGN KEY ("venta_loja_id") REFERENCES "ventas_loja"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ventas_loja" ADD CONSTRAINT "ventas_loja_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "venta_loja_itens" ADD CONSTRAINT "venta_loja_itens_venta_loja_id_fkey" FOREIGN KEY ("venta_loja_id") REFERENCES "ventas_loja"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "venta_loja_itens" ADD CONSTRAINT "venta_loja_itens_product_variant_id_fkey" FOREIGN KEY ("product_variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
