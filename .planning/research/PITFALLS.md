# Pitfalls Research — PDV / Multi-Currency (v1.4)

**Domain:** POS (PDV) with multi-currency (PYG/USD/BRL) on existing Next.js 15 + Prisma 7 + Supabase admin
**Researched:** 2026-05-08
**Overall confidence:** HIGH — based on direct codebase inspection + established technical facts about Prisma/PostgreSQL/POS patterns

---

## Critical Pitfalls

| Pitfall | Impact | Prevention | Phase |
|---------|--------|------------|-------|
| `Number(decimal)` on currency values before arithmetic | Silent floating-point rounding errors accumulate in multi-currency totals | Round each line to integer PYG before summing; never chain `toNumber()` for financial math | Phase 1 (schema + action layer) |
| Using `$transaction(async tx => {})` for sale + stock decrement | Runtime crash in production — PrismaPg adapter does not support interactive transactions | Always use `$transaction([...ops])` batch array form | Phase 1 (any action touching estoque) |
| Exchange rate NOT snapshotted on the sale record | Historical totals recalculate differently every time rate changes | Store `cotizacion_usd_pyg`, `cotizacion_brl_pyg`, `total_pyg` as columns on `VentaLoja` at creation | Phase 1 (schema design) |
| Reading cotizacion from client payload instead of DB | Rate manipulation by tampered requests | Always re-read rate from DB inside the Server Action — never trust client-supplied rate | Phase 1 (PDV action) |
| Stock read-then-write race condition without DB-level check | Two concurrent operations pass stock validation but together decrement below zero | Add `CHECK (stock_quantity >= 0)` constraint so PostgreSQL rejects the second decrement | Phase 1 (schema migration) |
| `venda_loja` enum value missing from `EstoqueMovimentoTipo` | Prisma validation error at runtime when creating stock movement for PDV sale | Add `venda_loja` to the enum in `schema.prisma` before implementing the PDV action | Phase 1 (schema migration) |
| RUC stored without normalisation | Same client stored twice as `80001234-5` and `800012345` | Normalise on write: strip hyphens and spaces, re-insert canonical hyphen before last digit | Phase 1 (validator layer) |
| PYG displayed with decimal places (Gs. 5.000,00) | Looks wrong — Guarani has no sub-unit | `maximumFractionDigits: 0` in all `Intl.NumberFormat` calls for PYG | Phase 1 (formatting helpers) |
| No seed row in cotizacion table | PDV crashes on first use if no rate exists | Include seed INSERT in the migration file | Phase 1 (schema migration) |

---

## Currency Precision

### The Core Risk: `Number()` Coercion Before Arithmetic

Prisma maps `@db.Decimal(12,2)` columns to a `Decimal` object from `decimal.js`. When you call `Number(decimal)` the value becomes an IEEE 754 double, which cannot exactly represent many decimal fractions.

**The existing codebase already carries this pattern** in `conferirEFecharMaleta` (`actions-maletas.ts`):

```ts
// Existing pattern — works for single-currency PYG because PYG values are integers
const valorTotalVendido = maleta.itens.reduce(
  (sum, item) => sum + Number(item.preco_fixado ?? 0) * item.quantidade_vendida,
  0
);
```

For single-currency PYG totals with a small number of items this rarely causes observable errors because PYG prices are typically whole integers (1000 Gs, 5000 Gs). For multi-currency totals — especially when multiplying a USD or BRL price by an exchange rate — the compounding rounding error becomes observable in the last 1–2 digits.

**Concrete example:**
```
USD price = 12.99
Rate = 7580.50 PYG/USD
Correct result: 12.99 * 7580.50 = 98,490.195 -> rounds to 98,490 Gs.
JS result: 12.99 * 7580.50 = 98490.19499999999...
// Math.round gives 98490 -- fine here in isolation
// BUT: sum of 5 items with different USD prices and the same rate:
// floating-point accumulation can produce +/-1 Gs divergence from
// the sum of individually-rounded lines
```

For the v1.4 report layer a 1-Gs discrepancy is cosmetically acceptable. For v1.5 factura emission (where the total stored MUST equal the sum of line totals for SET compliance), even a 1-Gs mismatch is a conformity issue.

**Prevention strategy for v1.4:**

Round each line total to an integer PYG value before summing. Sum integers — no floating-point accumulation:
```ts
// In the PDV sale action:
const lineTotalPYG = Math.round(
  Number(item.precio_unitario) * Number(cotizacion.usd_a_pyg) * item.cantidad
);
// Sum of integer PYGs has no rounding error
const totalPYG = lineItems.reduce((sum, line) => sum + line.lineTotalPYG, 0);
```

**Do NOT use** `toNumber()` from `action-utils.ts` for intermediate multiplication in the PDV action. Use it only for display formatting where sub-1-unit errors are irrelevant.

**Rule for PYG storage:** `@db.Decimal(12,0)` for any column that stores an amount in Guaranies. No fractions exist in PYG.

**Rule for rates:** `@db.Decimal(12,4)` minimum. BRL->PYG is ~1245.67 and USD->PYG is ~7580.50 — four decimal places give adequate precision for the multiplication.

---

## Atomic Stock Decrement Without `$transaction(async)`

### Exactly What the Constraint Means

From the Key Decisions in PROJECT.md and the comment at the top of `actions-maletas.ts`:

> "Prisma 7 com operacoes sequenciais em vez de `$transaction(async)` -- Driver adapter PrismaPg nao suporta `$transaction(async tx)`"

The `$transaction(async tx => { ... })` form (interactive transaction) requires the driver adapter to hold a connection open for the duration of the async callback. PrismaPg (the Neon/Supabase-compatible pooler adapter) does not support this.

**What DOES work — confirmed in `conferirEFecharMaleta`:**
```ts
const ops: Prisma.PrismaPromise<unknown>[] = [];
ops.push(prisma.maletaItem.update({ ... }));
ops.push(prisma.productVariant.update({ data: { stock_quantity: { increment: n } } }));
ops.push(prisma.estoqueMovimento.create({ data: { tipo: "devolucao_maleta", ... } }));
await prisma.$transaction(ops); // batch array form -- WORKS
```

### For PDV: Use the Same Batch Form

A PDV sale requires three writes to succeed together:
1. `VentaLoja.create` — the sale record
2. `ProductVariant.update` — decrement `stock_quantity`
3. `EstoqueMovimento.create` — `tipo: "venda_loja"` audit trail

Model it exactly like `conferirEFecharMaleta`:
```ts
// Pre-read: validate stock BEFORE building ops (outside transaction)
const variant = await prisma.productVariant.findUnique({
  where: { id: input.product_variant_id },
  select: { stock_quantity: true },
});
if (!variant || variant.stock_quantity < input.cantidad) {
  throw new BusinessError("Stock insuficiente para este producto.");
}

// Pre-generate UUID so it can be referenced in the movement log
const ventaId = crypto.randomUUID();

const ops: Prisma.PrismaPromise<unknown>[] = [
  prisma.ventaLoja.create({ data: { id: ventaId, ...rest } }),
  prisma.productVariant.update({
    where: { id: input.product_variant_id },
    data: { stock_quantity: { decrement: input.cantidad } },
  }),
  prisma.estoqueMovimento.create({
    data: {
      product_variant_id: input.product_variant_id,
      cantidad: input.cantidad,
      tipo: "venda_loja",
      motivo: `Venta PDV #${ventaId.slice(-8)}`,
      // No maleta_id -- this is a direct store sale
    },
  }),
];

await prisma.$transaction(ops);
```

**The static array form limitation:** You cannot use the result of `op1` inside `op2` within the same ops array. By pre-generating the UUID with `crypto.randomUUID()`, the sale ID is available before any DB writes — solving the most common cross-op dependency.

### The Remaining Gap: Race Condition on Last Unit

The stock validation (pre-read) runs in a separate query before `$transaction`. Between the read and the transaction, another concurrent operation (another PDV sale, a maleta creation) could decrement the same variant to 0.

**Severity in this context:** Low-moderate. The PDV is operated by a single admin user. Two concurrent PDV sales on the exact same variant within a 50ms window are unlikely. However, a maleta creation could compete with a PDV sale.

**Prevention:** Add a PostgreSQL `CHECK` constraint:
```sql
ALTER TABLE product_variants ADD CONSTRAINT stock_non_negative
  CHECK (stock_quantity >= 0);
```

With this constraint, if the race condition occurs, PostgreSQL rejects the decrement and `$transaction` throws a `P2002`-class error. The existing `mapError` in `action-utils.ts` already returns a user-friendly message for constraint violations. Cost: one line in a Prisma migration file.

Do NOT try to implement optimistic concurrency (version columns + retries) for v1.4 — it is over-engineered for the usage pattern.

### Do NOT Replicate the `criarMaleta` Pattern for PDV

`criarMaleta` uses sequential ops with compensating rollback (create maleta first, then decrement in a loop, then delete maleta if decrement fails). This approach was used because it involves a `create` with nested `create` (itens) which cannot be expressed as a flat array of `PrismaPromise`. PDV sales are simpler: flat ops that fit cleanly into the batch form. Use `$transaction([...ops])` — do not reach for the sequential + compensate pattern unless the batch form genuinely cannot express the writes.

---

## Exchange Rate Staleness

### The Three Distinct Problems

**Problem 1: Rate applied at display time, not confirmed at save time.**
The PDV UI will show the PYG total using the current rate. If the admin changes the rate between when the operator opens the cart and when they press "Confirmar venta," the confirmed amount differs from what was shown.

**Problem 2: Historical totals recalculate when rate changes.**
If `VentaLoja` stores only `precio_en_moneda_original` (e.g. USD 12.99) and no rate snapshot, the "total PYG" column in `/admin/ventas-loja` will show different values depending on which day you query it. This makes financial reporting unreliable.

**Problem 3: No cotizacion row on first boot.**
If the `cotizacion_dia` table has no rows (after first deployment, before the admin configures rates), the PDV action will receive `null` from `findFirst()` and either crash or silently use 0 as the rate.

**Prevention:**

1. Store the rate snapshot on every sale row:
   ```prisma
   model VentaLoja {
     // ...
     moneda              String   // "PYG" | "USD" | "BRL"
     precio_unitario     Decimal  @db.Decimal(12, 2)   // in original currency
     cotizacion_usd_pyg  Decimal? @db.Decimal(12, 4)   // null if moneda = PYG
     cotizacion_brl_pyg  Decimal? @db.Decimal(12, 4)   // null if moneda = PYG
     total_pyg           Decimal  @db.Decimal(12, 0)   // denormalised for reports
   }
   ```

2. Read the rate inside the Server Action — never accept it from the client:
   ```ts
   const cotizacion = await prisma.cotizacionDia.findFirst({
     orderBy: { created_at: "desc" },
   });
   if (!cotizacion) throw new BusinessError(
     "No hay cotizacion configurada. Ve a Configuracion > Cotizacion del dia."
   );
   ```

3. Seed a default rate in the migration:
   ```sql
   INSERT INTO cotizacion_dia (usd_a_pyg, brl_a_pyg)
   VALUES (7500.0000, 1250.0000)
   ON CONFLICT DO NOTHING;
   ```

4. Show a staleness warning in the PDV UI: if the latest cotizacion row is older than 48 hours, display a yellow badge "Cotizacion desactualizada — hace X dias." Display hint only, not a blocker.

### CotizacionDia Table Design

```prisma
model CotizacionDia {
  id         String   @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  usd_a_pyg  Decimal  @db.Decimal(12, 4)
  brl_a_pyg  Decimal  @db.Decimal(12, 4)
  updated_by String?  @db.Uuid
  created_at DateTime @default(now()) @db.Timestamptz()

  @@index([created_at])
  @@map("cotizacion_dia")
}
```

New rates are INSERTs (not UPDATEs) — full history preserved for audit. The PDV always reads `findFirst({ orderBy: { created_at: "desc" } })`. The config page shows the current rate and lets admin insert a new one. No delete functionality needed.

---

## RUC Validation

### Paraguay RUC Format

The RUC (Registro Unico del Contribuyente) is issued by Paraguay's SET (Subsecretaria de Estado de Tributacion).

**Structure:**
- Base number: 1 to 8 digits
- Separator: hyphen (optional in input, required in canonical form)
- Check digit: single digit 0-9 (Modulo 11 algorithm)
- Full format: `{1-8 digits}-{1 digit}`
- Examples: `123456-7`, `1234567-8`, `80001234-5`

**Edge cases that break naive validation:**

| Case | Example | Risk |
|------|---------|------|
| Hyphen omitted in input | `800012345` instead of `80001234-5` | Fails regex, is valid RUC |
| Trailing or leading space | `80001234-5 ` | Fails exact match, passes visual inspection |
| Cedula used as RUC | `3456789-1` | Valid format — natural persons use their cedula as RUC |
| Check digit `0` | `12345678-0` | Valid — `0` is a legitimate check digit; must not be special-cased |
| No RUC (foreign or anonymous customer) | empty / null | Field must accept null — not all clients have a Paraguay RUC |
| Legacy systems without check digit | `1234567` | Some old records have no check digit — 7-digit base only |

**Modulo 11 check digit algorithm:**
1. Multiply digits of the base number by weights 2, 3, 4, 5, 6, 7, 2, 3, ... (right to left, cycling at 7)
2. Sum the products
3. Remainder = sum mod 11
4. Check digit = (remainder == 0 or remainder == 1) ? remainder : (11 - remainder)

Implement the check digit verification server-side but treat a failing check digit as a **warning, not a blocking error**. Some RUCs in legacy Paraguay databases have incorrect check digits due to early SET data entry errors. Blocking the form will frustrate operators.

**Normalisation function:**
```ts
// src/lib/validators/ruc.ts
export function normalizeRuc(raw: string): string | null {
  if (!raw || raw.trim() === "") return null;
  const stripped = raw.replace(/[\s\-]/g, "");
  if (!/^\d{2,9}$/.test(stripped)) return null; // not a plausible RUC
  return stripped.slice(0, -1) + "-" + stripped.slice(-1);
}

export function isValidRucFormat(ruc: string): boolean {
  const normalized = normalizeRuc(ruc);
  if (!normalized) return false;
  return /^\d{1,8}-\d$/.test(normalized);
}
```

**DB storage:**
- Store always in the normalised `{base}-{digit}` form
- Make RUC nullable on `Cliente` — not all clients have or provide a RUC
- Partial unique index to prevent duplicates while allowing null:
  ```sql
  CREATE UNIQUE INDEX clientes_ruc_unique ON clientes (ruc) WHERE ruc IS NOT NULL;
  ```
  Prisma does not support partial unique indexes natively; add this as a raw SQL statement in the migration file alongside the Prisma-generated DDL.

---

## UX Pitfalls in POS Flows

### 1. Cart Lost on Accidental Navigation

If the operator adds 5 items to the PDV cart and accidentally presses the browser back button, the entire cart is gone. In a physical retail scenario this interrupts the sale and requires restarting.

**Prevention:** Persist the current cart in `sessionStorage` (not `localStorage` — the cart should not survive a full browser session, only the current window). On mount, check for and restore in-progress cart. Nothing is written to the database until the operator presses "Confirmar venta."

### 2. Currency Switching Ambiguity

If the PDV allows switching the sale currency after items are already in the cart, operators are confused about whether prices re-convert or stay the same.

**The correct behaviour:** Currency selection determines the payment method (which currency the customer is handing over), not the catalog price. System prices are in PYG. The conversion is display-only.

**Prevention:** Label the selector "Moneda de cobro" (not "Moneda de precios"). Make it clear that switching from PYG to USD shows the equivalent price in USD for informational purposes only. The stored `precio_unitario` is always the catalog PYG value; only `moneda` and `cotizacion_*` vary.

Alternatively, for v1.4 simplicity: set currency at the start of the sale (before adding items), disable currency switching mid-cart. This is less flexible but far less confusing.

### 3. Stock Shows 0 But Item Exists in Store (Maleta Reservation Confusion)

When a maleta is created, `stock_quantity` is decremented by the reserved quantity. If all 10 units of a variant are in active maletas, the PDV stock shows 0 even though the items are physically in the store. Operators will search for a product and see "sin stock" without understanding why.

**Prevention for v1.4:** Show a secondary indicator in the PDV product search results:
```
[Product name] -- Stock: 0 (3 en consignacion activa)
```
This requires a sub-query counting active `reserva_maleta` movements. Document this as a known behaviour: items in active maletas are considered reserved and cannot be sold through the PDV without first closing the maleta.

### 4. RUC Search Mismatch Creates Duplicate Clients

Operator types `800012345` (no hyphen). Client was stored as `80001234-5`. Search returns no results. Operator creates a new client — now there are two records for the same person.

**Prevention:** Normalise the search term before querying:
```ts
const normalizedSearch = searchTerm.replace(/[\s\-]/g, "");
const clientes = await prisma.cliente.findMany({
  where: {
    OR: [
      { nombre: { contains: searchTerm, mode: "insensitive" } },
      // Use ILIKE against stripped RUC since stored value has canonical hyphen
      { ruc: { contains: normalizedSearch, mode: "insensitive" } },
    ],
  },
  take: 10,
});
```

Since stored RUC always has the canonical hyphen (`80001234-5`), a search for `800012345` will not match unless PostgreSQL strips hyphens from both sides. More reliable: use `$queryRaw` with `REPLACE(ruc, '-', '') ILIKE $1` for the RUC search path.

### 5. No Keyboard Navigation for POS Speed

Desktop POS operators expect Tab and Enter navigation. A checkout flow that requires mouse clicks adds 5-10 seconds per sale.

**Prevention:** Ensure correct `tabIndex` order:
1. Client search input (auto-focused on page load)
2. Product search input
3. Quantity field (per item)
4. Currency selector
5. Confirm button (responds to Enter)

### 6. Double Submit on Slow Network

A slow network response causes the operator to press "Confirmar" twice. Two `VentaLoja` records are created, stock is decremented twice.

**Prevention:**
- Disable the confirm button immediately after first click (`isSubmitting = true`)
- Use `useTransition` from React 19 — pending state is automatically managed
- Pre-generate a `venta_uuid` client-side and add a `UNIQUE` constraint on it — the second insert throws P2002 which `mapError` already handles gracefully as a user-friendly message

---

## Prisma 7 Specific

### Transaction Form Reference Table

| Form | Status | When to use |
|------|--------|-------------|
| `$transaction(async tx => { ... })` | BROKEN — PrismaPg adapter does not support interactive transactions | NEVER |
| `$transaction([op1, op2, op3])` | WORKS — confirmed in `conferirEFecharMaleta` | PDV sale + stock decrement + movement log |
| Sequential ops with compensating rollback | WORKS — used in `criarMaleta` | Only when batch form cannot express the writes (e.g. nested creates where ID is not pre-known) |
| `$executeRaw` / `$queryRaw` | WORKS | Conditional update idiom, partial index DDL, RUC search with REPLACE |

### Static Array Form Limitation: Cross-Op ID References

The `$transaction([...ops])` batch form requires all `PrismaPromise` objects to be built before the call. You cannot use the return value of `op1` as input to `op2`.

**Solution:** Pre-generate UUIDs with `crypto.randomUUID()` in the Server Action:
```ts
import { randomUUID } from "crypto";

const ventaId = randomUUID(); // available before any DB writes
const ops = [
  prisma.ventaLoja.create({ data: { id: ventaId, ...rest } }),
  prisma.estoqueMovimento.create({ data: { venta_loja_id: ventaId, ... } }),
];
await prisma.$transaction(ops);
```

Passing `id: ventaId` explicitly overrides the schema default `@id @default(dbgenerated("uuid_generate_v4()"))`. This is valid and intended — both produce v4 UUIDs, the only difference is whether JS or PostgreSQL generates them.

### `venda_loja` Enum Gap — Schema Migration Required

The current `EstoqueMovimentoTipo` enum in `schema.prisma`:
```prisma
enum EstoqueMovimentoTipo {
  reserva_maleta
  devolucao_maleta
  ajuste_manual
  venda_direta   // NOT the same as venda_loja
}
```

PROJECT.md milestone requirement specifies `tipo: venda_loja`. This enum value does not exist and must be added in the first schema migration of v1.4.

**PostgreSQL DDL warning:** `ALTER TYPE ... ADD VALUE` is a DDL operation that commits immediately and **cannot be wrapped in a transaction block**. Prisma generates this correctly in its migration files. If you write a raw migration, do NOT wrap `ALTER TYPE ... ADD VALUE` in `BEGIN/COMMIT`.

### The `toNumber()` Helper Is Not Decimal-Safe for Financial Math

```ts
// action-utils.ts -- existing helper
export function toNumber(val: unknown): number | null {
  if (val === null || val === undefined) return null;
  return Number(val);  // loses Decimal precision guarantee
}
```

Using `toNumber()` inside a `reduce` for multi-currency totals introduces the floating-point accumulation described in the Currency Precision section. For the PDV action total calculation, use `Math.round(Number(price) * Number(rate))` per line (rounding at line level prevents accumulation) rather than chaining `toNumber()` calls through an accumulator.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Schema migration | Missing `venda_loja` in `EstoqueMovimentoTipo` enum | Add enum value first; let Prisma generate `ALTER TYPE ... ADD VALUE` |
| Schema migration | `ALTER TYPE ... ADD VALUE` inside transaction block in raw migration | Do NOT wrap it in `BEGIN/COMMIT` |
| Schema migration | `CotizacionDia` table with no seed row | Include `INSERT ... ON CONFLICT DO NOTHING` in migration |
| Schema migration | `stock_quantity` has no non-negative constraint | Add `CHECK (stock_quantity >= 0)` in the same migration |
| Schema migration | `VentaLoja` missing rate snapshot columns | Include `cotizacion_usd_pyg`, `cotizacion_brl_pyg`, `total_pyg` from the start — free to add now, painful to retrofit for v1.5 factura |
| PDV action | Using `$transaction(async tx)` instead of batch form | Always `$transaction([...ops])` — copy `conferirEFecharMaleta` pattern |
| PDV action | Accepting cotizacion from client payload | Re-read from DB inside Server Action |
| PDV action | Double submit on slow network | Disable button on first click; pre-generate idempotency UUID with `UNIQUE` constraint |
| Cliente CRUD | Duplicate clients from RUC normalisation mismatch | Normalise on write; partial unique index; normalise search term |
| RUC validation | Blocking form on invalid check digit | Check digit failure = warning only, not blocking error |
| PYG formatting | Displaying Gs. with decimal places | `Intl.NumberFormat("es-PY", { currency: "PYG", maximumFractionDigits: 0 })` |
| Multi-currency totals | Float accumulation in PYG conversions | `Math.round(Number(price) * Number(rate))` per line, sum integers |
| PDV UX | Cart lost on back button | Persist cart in `sessionStorage` |
| PDV UX | Currency selector semantics confusion | Label "Moneda de cobro", not "Moneda de precios" |
| PDV UX | Stock shows 0 because all units are in maletas | Show secondary "X en consignacion" indicator in product search |

---

## Sources

- Codebase — `src/app/admin/actions-maletas.ts`: Confirmed `$transaction([...ops])` batch form works; confirmed sequential ops + compensating rollback pattern for `criarMaleta`; confirmed `Number(decimal)` coercion pattern in commission math; confirmed stock decrement approach. (HIGH confidence)
- Codebase — `prisma/schema.prisma`: Confirmed `@db.Decimal(12,2)` for prices; confirmed `EstoqueMovimentoTipo` enum does NOT include `venda_loja`; confirmed no `Cliente`, `VentaLoja`, or `CotizacionDia` models exist yet. (HIGH confidence)
- Codebase — `src/lib/action-utils.ts`: Confirmed `toNumber()` uses `Number(val)` conversion; confirmed `safeAction`, `mapError`, `BusinessError` patterns. (HIGH confidence)
- Codebase — `.planning/codebase/CONCERNS.md`: Confirmed Prisma 7 / PrismaPg transaction constraint documented as architecture concern. (HIGH confidence)
- Codebase — `.planning/PROJECT.md`: Confirmed Key Decision on transaction form; confirmed milestone requirements for `venda_loja` tipo and exchange rate config. (HIGH confidence)
- PostgreSQL: `ALTER TYPE ... ADD VALUE` cannot be executed inside a transaction block — standard DDL behaviour. (HIGH confidence)
- Prisma: `$transaction([])` batch form is the supported non-interactive transaction path for adapter mode. (HIGH confidence)
- Paraguay SET: RUC format is base number (1-8 digits) + hyphen + check digit (1 digit), Modulo 11 algorithm. (HIGH confidence)
- IEEE 754: Floating-point accumulation errors on decimal fractions are a known, documented property of JavaScript's `number` type. (HIGH confidence)
