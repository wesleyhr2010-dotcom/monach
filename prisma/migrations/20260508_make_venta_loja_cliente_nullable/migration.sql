-- Make VentaLoja.cliente_id nullable to support "Consumidor Final" sales
ALTER TABLE "ventas_loja" ALTER COLUMN "cliente_id" DROP NOT NULL;
