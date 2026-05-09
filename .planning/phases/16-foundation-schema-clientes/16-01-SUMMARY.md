# Plan 16-01 Summary — Migration Prisma v1.4

**Phase:** 16-foundation-schema-clientes  
**Plan:** 01  
**Wave:** 1  
**Status:** ✅ Complete  
**Completed:** 2026-05-08

## What Was Built

Schema Prisma v1.4 com todos os models, enums e relações necessários para o PDV e gestão de clientes.

### Schema Changes

- **Enums novos:**
  - `ClienteOrigem` (LOJA | REVENDEDORA)
  - `Moneda` (PYG | USD | BRL)

- **Enum alterado:**
  - `EstoqueMovimentoTipo` — adicionado valor `venda_loja`

- **Models novos:**
  - `CotizacionDia` — taxas de câmbio BRL→PYG e USD→PYG
  - `Cliente` — cadastro de clientes da loja (RUC único, cidade, telefone, origem)
  - `VentaLoja` — venda física da loja com snapshot de cotação
  - `VentaLojaItem` — itens de cada venda (produto, quantidade, preço, subtotal)

- **Relações inversas:**
  - `ProductVariant.venta_loja_itens`
  - `EstoqueMovimento.venta_loja` / `venta_loja_id`

### Migration

- Migration SQL criada em `prisma/migrations/20260508_add_pdv_schema/migration.sql`
- Aplicada via `npx prisma db push` (shadow database com uuid-ossp incompatível com `migrate dev`)
- Prisma Client regenerado em `src/generated/prisma/`

### Seed

- Row inserido em `CotizacionDia` com valores padrão: BRL→PYG = 1400.00, USD→PYG = 7500.00

## Key Files Created/Modified

| File | Action |
|------|--------|
| `prisma/schema.prisma` | Modified — enums, models, relações |
| `prisma/migrations/20260508_add_pdv_schema/migration.sql` | Created |
| `src/generated/prisma/*` | Regenerated (17 arquivos) |

## Self-Check

- ✅ Schema validado via `npx prisma validate`
- ✅ Database sincronizado via `npx prisma db push`
- ✅ Prisma Client regenerado com novos types
- ✅ Seed row inserido em `cotizacion_dia`
- ✅ Build passa (`npm run build`)
- ✅ Lint sem novos erros nos arquivos modificados

## Notable Deviations

- Usado `npx prisma db push` em vez de `prisma migrate dev` porque a shadow database do Prisma não suporta a extensão `uuid-ossp` usada nas migrations anteriores. O SQL da migration foi salvo manualmente para documentação.

## Next Up

Plan 16-02 — Server Actions `actions-clientes.ts` (criarCliente, editarCliente, buscarClientePorRuc, getClientes)
