---
plan: 17-01
status: complete
completed_at: "2026-05-08T21:00:00.000Z"
---

# 17-01 SUMMARY — Backend Base: Migration + Server Actions

## Objective
Implementar a base backend completa da Fase 17: migration nullable + 2 arquivos de Server Actions.

## What was built

### Migration
- `prisma/schema.prisma`: `VentaLoja.cliente_id` changed from `String` to `String?`
- Relation `Cliente` changed to `Cliente?`
- Migration file: `20260508_make_venta_loja_cliente_nullable/migration.sql`
- Prisma Client regenerated successfully

### actions-cotizacion.ts
- `salvarCotizacion(brlToPyg, usdToPyg)` — creates new CotizacionDia record, invalidates cache
- `getCotizacionAtual()` — returns most recent cotizacion or null
- `getHistorialCotizaciones(limit?)` — returns last N records (default 20, clamped 1-100)
- All functions wrapped in `safeAction`, guarded by `requireAuth(["ADMIN"])`
- Exports types: `CotizacionAtual`, `CotizacionHistorialItem`

### actions-pdv.ts
- `getVariantsParaPdv(params?)` — lists available variants (stock > 0, active, search + category filter)
- `criarVentaLoja(input)` — creates VentaLoja with:
  - Optional clienteId (null = Consumidor Final)
  - Cotização always read from DB (never from client payload)
  - Sequential stock decrement with manual compensation
  - Math.round() per line for subtotal calculation
  - Stock movement logging (best-effort)
- Exports types: `VariantParaPdv`, `CriarVentaLojaInput`

## Key files created/modified
- `prisma/schema.prisma` — 2 lines changed (cliente_id nullable, Cliente? relation)
- `prisma/migrations/20260508_make_venta_loja_cliente_nullable/migration.sql` — new
- `src/app/admin/actions-cotizacion.ts` — new
- `src/app/admin/actions-pdv.ts` — new

## Self-Check: PASSED
- TypeScript compiles with zero errors for both new files
- Migration applied successfully
- Prisma Client regenerated
- All acceptance criteria met

## Deviations
None.
