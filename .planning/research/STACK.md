# Stack Research

**Project:** next-monarca — v1.4 PDV e Ventas de Loja
**Researched:** 2026-05-08
**Confidence:** HIGH — all conclusions drawn from direct inspection of the actual codebase

---

## Summary

v1.4 requires zero new npm packages. Every capability needed for the PDV multi-currency,
client management with RUC, and store stock movement milestone is already present in the
existing stack.

---

## New Dependencies Needed

None.

| Package | Version | Purpose | Justification |
|---------|---------|---------|---------------|
| (none) | — | — | All capabilities already exist in the installed stack |

---

## No New Dependencies Needed For

### Client Entity with RUC Field
**Covered by:** Prisma schema + `zod ^4.3.6`

`Cliente` is a standard Prisma model addition. RUC validation (`/^\d{6,8}-\d$/`) is a
single `z.string().regex()` call — no external validation library needed. The `P2002`
unique constraint violation on RUC is already handled by the existing `mapError()` helper
in `src/lib/action-utils.ts`.

### Multi-Currency Support (PYG / USD / BRL)
**Covered by:** Native `Intl.NumberFormat` (Node.js 20+, zero dependency)

Currency conversion is `amount_foreign * exchange_rate = amount_pyg`. No currency library
needed. `Prisma Decimal(12,2)` backed by PostgreSQL NUMERIC already handles monetary
precision. Display formatting uses `Intl.NumberFormat` which ships with Node.js — no `dinero.js`,
`currency.js`, or similar package is warranted for two conversion rates.

### Exchange Rate Storage (COT-01 BRL→PYG, COT-02 USD→PYG)
**Covered by:** Prisma + PostgreSQL via a new `ConfigSistema` model

Exchange rates are admin-entered daily values — not live rates. A simple key-value Prisma
model (`chave`, `valor`) follows the same CRUD pattern already used by `CommissionTier`,
`NivelRegra`, and `Contrato` in `actions-config.ts`. No external rate API, no Redis, no
additional caching layer needed. The existing `@upstash/redis` must not be repurposed here —
it is optional infrastructure used exclusively for rate limiting.

### New `venda_loja` Stock Movement Type
**Covered by:** Existing `EstoqueMovimentoTipo` enum (schema migration only)

Adding `venda_loja` to the enum is one line in `schema.prisma` + a Prisma migration.
The stock decrement logic in `actions-maletas.ts` is the direct reference implementation.

### PDV Sale Transaction (atomicity across multiple tables)
**Covered by:** Prisma 7 batch `$transaction([...ops])` pattern

The batch format `$transaction([...operations])` is already the established and documented
pattern in this codebase. The interactive form `$transaction(async tx => {...})` is NOT
supported with the `PrismaPg` driver adapter — this is documented in `actions-maletas.ts`
and in `PROJECT.md` Key Decisions. The PDV sale action must follow the same batch approach
used for maleta close/return operations.

### PDV UI (product search, RUC lookup, currency selector, totals)
**Covered by:** TanStack React Query 5 (already installed) + Tailwind v4 + existing Radix primitives

Product search with debounce uses TanStack Query which is already installed and used in the
admin dashboard. The `react-day-picker ^9.14.0` and `DatePickerWithRange` component confirm
that Radix/Shadcn UI patterns are already integrated. No new UI library needed.

### Histórico de Vendas (`/admin/ventas-loja`)
**Covered by:** Existing table/list component pattern from `/admin/maleta`, `/admin/leads`, `/admin/relatorios`

### Currency Formatting
**Covered by:** `src/lib/currency.ts` — new file, no import, pure TypeScript using `Intl.NumberFormat`

---

## Integration Points

### New: `ConfigSistema` Prisma model (exchange rates + extensible system config)

```prisma
model ConfigSistema {
  chave      String   @id          // "COT-01" | "COT-02"
  valor      String                // stringified decimal, e.g. "7500"
  updated_at DateTime @updatedAt @db.Timestamptz()

  @@map("config_sistema")
}
```

Read in PDV server action: `prisma.configSistema.findMany({ where: { chave: { in: ["COT-01","COT-02"] } } })`.
Upsert at `/admin/config/cotizacion` following the `upsertCommissionTier` pattern in `actions-config.ts`.
No dedicated cache tag needed — pages that use this are `force-dynamic`.

### New: `Cliente` Prisma model

```prisma
model Cliente {
  id         String   @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  ruc        String   @unique
  nombre     String
  ciudad     String   @default("")
  telefono   String   @default("")
  origen     String   @default("loja")   // "loja" | "revendedora"
  created_at DateTime @default(now()) @db.Timestamptz()
  updated_at DateTime @updatedAt @db.Timestamptz()

  ventas_loja VendaLoja[]

  @@index([ruc])
  @@map("clientes")
}
```

RUC lookup at PDV: `prisma.cliente.findUnique({ where: { ruc } })`. Returns match or null
(prompts client creation inline).

### New: `venda_loja` enum value on `EstoqueMovimentoTipo`

```prisma
enum EstoqueMovimentoTipo {
  reserva_maleta
  devolucao_maleta
  ajuste_manual
  venda_direta
  venda_loja      // NEW — store sale via PDV

  @@map("estoque_movimento_tipo")
}
```

The existing `EstoqueMovimento` model requires no structural changes — `maleta_id` is
already nullable (`String? @db.Uuid`), so `venda_loja` movements simply leave it null.

### New: `VendaLoja` + `VendaLojaItem` Prisma models

`VendaLoja` fields: `cliente_id`, `operador_id` (ADMIN/COLABORADORA Reseller FK),
`moeda` (PYG/USD/BRL — String enum), `taxa_cotizacion_aplicada` (Decimal snapshot —
immutable after creation), `total_pyg` (converted total snapshot — immutable),
`created_at`. Fields reserved for factura without UI: `talonario String?`,
`numero_factura String?`, `tipo_operacion String?`.

`VendaLojaItem` fields: `venda_loja_id`, `product_variant_id`, `cantidad Int`,
`precio_unitario_pyg Decimal` (snapshot at sale time — immutable, follows the same
snapshot-immutability rule as `VendaMaleta.preco_unitario`).

### Transaction pattern — batch only (not interactive)

```typescript
// Correct pattern — from actions-maletas.ts
const ops = [
  prisma.vendaLoja.create({ data: ventaData }),
  prisma.vendaLojaItem.createMany({ data: itemsData }),
  // one update per variant (batch form, not updateMany with different values)
  ...variants.map(v =>
    prisma.productVariant.update({
      where: { id: v.id },
      data: { stock_quantity: { decrement: v.cantidad } },
    })
  ),
  ...variants.map(v =>
    prisma.estoqueMovimento.create({
      data: {
        product_variant_id: v.id,
        quantidade: -v.cantidad,
        tipo: "venda_loja",
        motivo: `PDV venda #${ventaId}`,
      },
    })
  ),
];
await prisma.$transaction(ops);
```

### New utility: `src/lib/currency.ts` (zero dependencies)

```typescript
export type Moeda = "PYG" | "USD" | "BRL";

export function formatCurrency(amount: number, moeda: Moeda): string {
  const configs: Record<Moeda, Intl.NumberFormatOptions> = {
    PYG: { style: "currency", currency: "PYG", maximumFractionDigits: 0 },
    USD: { style: "currency", currency: "USD", minimumFractionDigits: 2 },
    BRL: { style: "currency", currency: "BRL", minimumFractionDigits: 2 },
  };
  return new Intl.NumberFormat("es-PY", configs[moeda]).format(amount);
}

export function toPYG(
  amount: number,
  moeda: Moeda,
  rates: { "COT-01": number; "COT-02": number }
): number {
  if (moeda === "PYG") return amount;
  if (moeda === "BRL") return Math.round(amount * rates["COT-01"]);
  if (moeda === "USD") return Math.round(amount * rates["COT-02"]);
  return amount;
}
```

### Cache invalidation

Reuse the existing `invalidateCache` helper pattern. Add entries for:
- `ventas_loja` list: `revalidatePath("/admin/ventas-loja")`
- `config/cotizacion`: `revalidatePath("/admin/config/cotizacion")`
- Stock changes (existing): `invalidateCache.catalog()` for public product pages if PDV
  causes an out-of-stock state.

---

## Recommendation

**Add zero new npm packages.** The PDV milestone is implementable with:

1. Two new Prisma models: `ConfigSistema` + `Cliente`
2. Two new Prisma models: `VendaLoja` + `VendaLojaItem`
3. One enum value addition: `venda_loja` on `EstoqueMovimentoTipo`
4. One new utility file: `src/lib/currency.ts` (pure TypeScript, no imports)
5. New server action files following the established `safeAction()` / `requireAuth()` /
   `ActionResult<T>` / batch `$transaction` pattern in `src/app/admin/actions-pdv.ts`
   and `src/app/admin/actions-clientes.ts`
6. New admin pages at `/admin/pdv`, `/admin/clientes`, `/admin/ventas-loja`,
   `/admin/config/cotizacion` using Tailwind v4 + design system tokens

### What NOT to add

| Do NOT add | Reason |
|-----------|--------|
| `dinero.js` / `currency.js` / `big.js` | Two multiplication operations + `Intl.NumberFormat` cover all needs. Adding a library for 10 lines of arithmetic is over-engineering. |
| External exchange rate API | Business requirement is admin-entered daily rates, not live rates. No API key, no network dependency, no failure mode. |
| `@upstash/redis` for rate caching | Rates are fetched once per PDV page load from Postgres — one query, no caching layer needed. Redis is already optional infrastructure for rate limiting only. |
| `react-hook-form` | Not in the codebase. PDV form uses controlled components + Zod validation in the server action, consistent with every other form in the project. |
| Supabase Realtime | PDV is a sequential single-operator admin action. No multi-user live sync required. |
| New UI library for PDV interface | The select, input, table, button, and drawer primitives needed for PDV are already available via Radix UI + Tailwind v4. |
| `zxcvbn` or barcode-scan libraries | Not scoped — PDV uses text-based RUC and product search. Barcode scanning is a v2+ feature. |

### Critical constraint to enforce in implementation

`$transaction(async tx => {...})` interactive form is NOT supported with Prisma 7 +
PrismaPg driver adapter. The PDV sale Server Action MUST use `$transaction([...ops])`
batch format (array of pre-built operations), matching the pattern in `actions-maletas.ts`.
Attempting the interactive form will fail silently or throw at runtime.

---

*Sources: direct inspection of `prisma/schema.prisma`, `package.json`, `src/lib/action-utils.ts`,
`src/app/admin/actions-maletas.ts`, `src/app/admin/actions-config.ts`,
`src/lib/cache/invalidate.ts`, `src/lib/config.ts`, `.planning/PROJECT.md`,
`.planning/codebase/STACK.md`*
