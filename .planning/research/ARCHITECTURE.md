# Architecture Research

**Project:** NEXT-MONARCA v1.4 — PDV e Ventas de Loja
**Researched:** 2026-05-08
**Scope:** PDV, Client Management, Multi-Currency integration with existing Next.js 15 + Prisma codebase

---

## New Prisma Models

Add to `prisma/schema.prisma` after Module 3a (EstoqueMovimento). All models belong in a new "Module 3b — PDV" section.

### Enums

```prisma
enum ClienteOrigem {
  LOJA
  REVENDEDORA

  @@map("cliente_origem")
}

enum Moneda {
  PYG
  USD
  BRL

  @@map("moneda")
}
```

### Cliente

```prisma
model Cliente {
  id         String        @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  nome       String
  ruc        String?       @unique
  cidade     String?
  telefone   String
  origem     ClienteOrigem @default(LOJA)
  created_at DateTime      @default(now()) @db.Timestamptz()
  updated_at DateTime      @default(now()) @updatedAt @db.Timestamptz()

  vendas_loja VentaLoja[]

  @@index([ruc])
  @@index([origem])
  @@index([created_at])
  @@map("clientes")
}
```

`ruc` is `String? @unique`. PostgreSQL treats each NULL as distinct, so multiple REVENDEDORA-origin clients without a RUC will not trigger a unique violation — correct behavior.

### CotizacionDia

```prisma
model CotizacionDia {
  id         String   @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  brl_pyg    Decimal  @db.Decimal(12, 4)
  usd_pyg    Decimal  @db.Decimal(12, 4)
  updated_at DateTime @default(now()) @updatedAt @db.Timestamptz()
  updated_by String   @db.Uuid

  @@map("cotizacion_dia")
}
```

Singleton-style: the application always reads the latest row (`ORDER BY updated_at DESC LIMIT 1`). `updated_by` stores the admin's `reseller.id` as a plain UUID — no FK declared to avoid bidirectional dependency with Reseller.

### VentaLoja

```prisma
model VentaLoja {
  id                    String   @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  cliente_id            String   @db.Uuid
  vendedor_id           String   @db.Uuid
  moneda                Moneda
  total_moneda_original Decimal  @db.Decimal(12, 2)
  total_pyg             Decimal  @db.Decimal(12, 2)
  cotizacion_brl_pyg    Decimal? @db.Decimal(12, 4)
  cotizacion_usd_pyg    Decimal? @db.Decimal(12, 4)
  condicion_venta       String   @default("CONTADO")
  nota_factura          String?
  talonario             String?
  numero_factura        String?
  tipo_operacion        String?
  created_at            DateTime @default(now()) @db.Timestamptz()

  cliente Cliente       @relation(fields: [cliente_id], references: [id])
  itens   VentaLojaItem[]

  @@index([cliente_id])
  @@index([vendedor_id])
  @@index([created_at])
  @@map("ventas_loja")
}
```

`cotizacion_brl_pyg` and `cotizacion_usd_pyg` are immutable snapshots of the rate at the time of sale. For PYG-denominated sales they are stored as `null`. `talonario`, `numero_factura`, `tipo_operacion` are persisted without UI in v1.4 — reserved for factura emissão in v1.5.

### VentaLojaItem

```prisma
model VentaLojaItem {
  id                     String   @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  venta_loja_id          String   @db.Uuid
  product_variant_id     String   @db.Uuid
  cantidad               Int
  precio_unitario_moneda Decimal  @db.Decimal(12, 2)
  precio_unitario_pyg    Decimal  @db.Decimal(12, 2)

  venta_loja      VentaLoja      @relation(fields: [venta_loja_id], references: [id], onDelete: Cascade)
  product_variant ProductVariant @relation(fields: [product_variant_id], references: [id])

  @@index([venta_loja_id])
  @@index([product_variant_id])
  @@map("ventas_loja_itens")
}
```

---

## Modified Models

### `EstoqueMovimentoTipo` enum — add `venda_loja`

```prisma
enum EstoqueMovimentoTipo {
  reserva_maleta
  devolucao_maleta
  ajuste_manual
  venda_direta   // existing — do not rename
  venda_loja     // NEW — PDV store sale

  @@map("estoque_movimento_tipo")
}
```

The existing schema uses `venda_direta` (not `venda_loja`). Add `venda_loja` as a new value alongside `venda_direta` — renaming the existing value would be a destructive migration.

### `EstoqueMovimento` — add optional `venta_loja_id` FK

```prisma
model EstoqueMovimento {
  // ... all existing fields unchanged ...
  venta_loja_id String? @db.Uuid  // NEW

  // existing relations:
  product_variant ProductVariant @relation(...)
  maleta          Maleta?        @relation(...)
  // NEW:
  venta_loja      VentaLoja?     @relation(fields: [venta_loja_id], references: [id])
}
```

Mirrors the existing nullable `maleta_id` pattern. Provides auditability without making the FK mandatory.

### `ProductVariant` — back-relation for `VentaLojaItem`

```prisma
model ProductVariant {
  // ... existing fields and relations ...
  ventas_loja_itens VentaLojaItem[]  // NEW back-relation
}
```

### `VentaLoja` back-relation for `EstoqueMovimento`

```prisma
model VentaLoja {
  // ... existing fields ...
  estoque_movimentos EstoqueMovimento[]  // back-relation (add after VentaLojaItem[] relation)
}
```

---

## New Files

### Schema layer

| File | Action |
|------|--------|
| `prisma/schema.prisma` | 4 new models + 2 new enums + modifications above |
| `prisma/migrations/YYYYMMDD_add_pdv/migration.sql` | Generated by `prisma migrate dev` — run once for all new models |

### Validators (`src/lib/validators/`)

| File | Contents |
|------|----------|
| `src/lib/validators/cliente.schema.ts` | `createClienteSchema`, `updateClienteSchema` (nome, ruc, cidade, telefone, origem) |
| `src/lib/validators/pdv.schema.ts` | `criarVentaLojaSchema` (cliente_id, moneda, items array), `setCotizacionSchema` (brl_pyg, usd_pyg) |

### Server Actions (`src/app/admin/`)

| File | Exports |
|------|---------|
| `src/app/admin/actions-clientes.ts` | `getClientes`, `createCliente`, `updateCliente`, `buscarClientePorRuc` |
| `src/app/admin/actions-pdv.ts` | `getCotizacion`, `setCotizacion`, `criarVentaLoja`, `getVentasLoja` |

All follow the established pattern: `"use server"`, `requireAuth(["ADMIN"])`, `safeAction()`, return `ActionResult<T>`.

### Types (`src/lib/types.ts`) — append

| Type | Shape |
|------|-------|
| `ClienteListItem` | `{ id, nome, ruc, cidade, telefone, origem, created_at }` |
| `VentaLojaListItem` | `{ id, cliente: {nome, ruc}, vendedor_nombre, moneda, total_moneda_original, total_pyg, created_at, itens_count }` |
| `CotizacionDiaDTO` | `{ id, brl_pyg, usd_pyg, updated_at }` |

### Pages and Client Components

| Route | Files |
|-------|-------|
| `/admin/clientes` | `src/app/admin/clientes/page.tsx`, `ClientesClient.tsx`, `ClienteForm.tsx` |
| `/admin/pdv` | `src/app/admin/pdv/page.tsx`, `PdvClient.tsx` |
| `/admin/config/cotizacion` | `src/app/admin/config/cotizacion/page.tsx`, `CotizacionClient.tsx` |
| `/admin/ventas-loja` | `src/app/admin/ventas-loja/page.tsx`, `VentasLojaClient.tsx` |

All page.tsx files must include `export const dynamic = "force-dynamic"` (authenticated admin routes).

### Navigation (`src/components/admin/AdminLayoutClient.tsx`)

Add a new `{ type: "section", label: "Ventas", roles: ["ADMIN"] }` section with entries for Clientes, PDV, and Ventas Loja. Add Cotización under the existing "Configurações" section. ADMIN-only for all new entries.

---

## Integration Points

### 1. Stock Decrement via `estoqueMovimento` (central integration)

`criarVentaLoja` orchestrates the same sequential-operations pattern as `criarMaleta`:

1. Create `VentaLoja` + `VentaLojaItem` records.
2. For each item: `prisma.productVariant.update({ data: { stock_quantity: { decrement: cantidad } } })`.
3. For each successfully decremented item: `prisma.estoqueMovimento.create({ tipo: "venda_loja", venta_loja_id })`.
4. On any decrement failure: `prisma.ventaLoja.delete({ id })` (cascades to items via `onDelete: Cascade`), return `{ success: false }`.

No `$transaction(async)` — the PrismaPg adapter does not support it (documented in PROJECT.md Key Decisions). The compensation pattern is the same as in `criarMaleta`.

### 2. Product catalog reuse

The PDV product picker reads from the existing `Product` + `ProductVariant` tables. The `getAvailableVariants` query used in `actions-maletas.ts` can be called directly from `actions-pdv.ts` or extracted to a shared function in `actions-products.ts`. No new catalog table needed.

### 3. Admin user as `vendedor`

`VentaLoja.vendedor_id` = `user.profileId` from `requireAuth(["ADMIN"])`. This is the `resellers.id` UUID of the logged-in admin. When displaying the responsible vendor on sales history, join `resellers` by `vendedor_id` to get the name.

### 4. Cotizacion snapshot at sale time

`criarVentaLoja` reads the latest `CotizacionDia` row immediately before writing the `VentaLoja` record. The rates are written into `cotizacion_brl_pyg` / `cotizacion_usd_pyg` on the sale row and never updated after. This follows the same immutability principle as maleta financial snapshots.

### 5. Unified client list (CLI-04)

`getClientes` uses a SQL UNION strategy in Prisma raw query or two separate queries merged in application code:

- Branch A: `prisma.cliente.findMany()` — loja + revendedora origins from the `clientes` table.
- Branch B: `prisma.vendaMaleta.findMany({ distinct: ["cliente_nome", "cliente_telefone"] })` — unique name+phone pairs from maleta sales, mapped to synthetic `ClienteListItem` with `origem: "REVENDEDORA"` and no ruc/cidade.

Merge and deduplicate in the action before returning. Filter by `origem` is applied to the appropriate branch. This avoids adding a sync step to `VendaMaleta` creation.

### 6. Cache invalidation

`criarVentaLoja` calls:
- `revalidatePath("/admin/pdv")` — stock counts updated
- `revalidatePath("/admin/ventas-loja")` — new sale in list
- `invalidateCache.catalog()` — public catalog stock counts changed

`setCotizacion` calls:
- `revalidatePath("/admin/config/cotizacion")`
- `revalidatePath("/admin/pdv")` — cotizacion affects PDV display

`createCliente` / `updateCliente` call:
- `revalidatePath("/admin/clientes")`

No new `revalidateTag` keys needed for v1.4.

---

## Suggested Build Order

### Phase 16 — Foundation: Schema + Client Management (CLI-01..05, VIS-01..02)

All downstream phases depend on schema migrations and the `Cliente` model existing.

Steps:
1. Add all 4 new models + 2 new enums + modifications to `schema.prisma`. Run `prisma migrate dev` once to generate a single migration covering everything. Running all schema changes together avoids sequential migration dependencies.
2. Create `src/lib/validators/cliente.schema.ts`.
3. Create `src/app/admin/actions-clientes.ts`.
4. Build `/admin/clientes` — page + client + form.
5. Wire nav in `AdminLayoutClient.tsx`.

Deliver: Working client list with create/edit, unified UNION view of loja + revendedora clients, RUC deduplication check on create.

### Phase 17 — PDV Core: Cotizacion + Sale Flow (PDV-01..06, COT-01..02)

Requires Phase 16 migration to be applied. The cotizacion config is a prerequisite for PDV total calculation.

Steps:
1. Create `src/lib/validators/pdv.schema.ts`.
2. Create `src/app/admin/actions-pdv.ts` — `getCotizacion`, `setCotizacion`, `criarVentaLoja`.
3. Build `/admin/config/cotizacion`.
4. Build `/admin/pdv` (multi-step flow: client selection → item builder → currency/total → confirmation).
5. Wire nav entries.

`criarVentaLoja` is the most complex action in v1.4. It must: validate input, auth guard, read cotizacion snapshot, create VentaLoja + items, decrement stock sequentially, create estoqueMovimento entries, compensate on failure, invalidate cache.

### Phase 18 — Sales History (VLJ-01..02)

Pure read path. No schema work. Depends on Phase 17 producing real data to display.

Steps:
1. Add `getVentasLoja` with date range filter to `actions-pdv.ts`.
2. Build `/admin/ventas-loja` — page + client table with date range filter.

The date range filter UI should reuse the same pattern as the analytics date range picker introduced in v1.3 (already validated in the codebase).

---

## Data Flow: PDV Sale (end to end)

```
Admin navigates to /admin/pdv
  page.tsx (Server Component)
    getCotizacion()       → latest CotizacionDia row
    getAvailableVariants() → ProductVariant[] with stock > 0

  PdvClient.tsx (Client Component, "use client")
    Step 1: search client by RUC → buscarClientePorRuc(ruc)
    Step 2: add items → quantity selector per ProductVariant
    Step 3: select Moneda (PYG/USD/BRL)
    Step 4: review total (client-side calc using cotizacion from props)
    Step 5: confirm → criarVentaLoja(payload)

  criarVentaLoja — Server Action
    requireAuth(["ADMIN"])
    validate with criarVentaLojaSchema
    read getCotizacion() → snapshot rates
    prisma.ventaLoja.create({ data: {...snapshots}, itens: { create: [...] } })
    for each item:
      prisma.productVariant.update({ decrement: cantidad })
      on error → prisma.ventaLoja.delete({ id }) + return failure
    for each item:
      prisma.estoqueMovimento.create({ tipo: "venda_loja", venta_loja_id })
    invalidateCache
    return { success: true, data: { id } }

  PdvClient.tsx
    toast.success("Venta registrada")
    reset form state
```

---

## Scalability Considerations

| Concern | v1.4 Approach | Future Note |
|---------|---------------|-------------|
| Client deduplication | RUC unique constraint + pre-create check in action | Full merge/dedupe UI in CRM v1.5 |
| Concurrent stock decrements | Sequential ops with compensation (no distributed lock) | Advisory lock or optimistic stock field if concurrency becomes real |
| Cotizacion freshness | Admin-managed singleton row | Automated rate pull from BCP/API in future |
| Unified client list performance | Two-query merge in application code | Materialized view if list exceeds 50K rows |
| Factura fields | Stored as nullable strings, no UI | Full emission flow in v1.5 |

---

## Sources

- Codebase (HIGH confidence — direct inspection):
  - `prisma/schema.prisma` — existing models, enums, patterns
  - `src/app/admin/actions-maletas.ts` — `criarMaleta` sequential-ops pattern, estoqueMovimento creation, compensation
  - `src/lib/action-utils.ts` — `ActionResult<T>`, `safeAction`, `BusinessError`
  - `src/lib/cache/invalidate.ts` — `invalidateCache` helper
  - `src/lib/user.ts` — `requireAuth`, `getCurrentUser`
  - `src/app/admin/actions-config.ts` — config CRUD pattern with Zod validation
  - `src/components/admin/AdminLayoutClient.tsx` — nav structure
  - `src/lib/types.ts` — DTO conventions
- PROJECT.md Key Decisions: PrismaPg `$transaction(async)` limitation documented
- REQUIREMENTS.md v1.4: CLI-01..05, PDV-01..06, COT-01..02, VLJ-01..02
