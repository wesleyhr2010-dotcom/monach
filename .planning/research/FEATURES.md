# Features Research — v1.4 PDV e Ventas de Loja

**Domain:** Point-of-sale for small retail, client management, multi-currency conversion
**Researched:** 2026-05-08
**Overall confidence:** HIGH (codebase-grounded) / MEDIUM (Paraguay legal specifics from authoritative regional knowledge)

---

## Table Stakes (must have — missing = product feels broken)

| Feature | Why Expected | Complexity | Dependency |
|---------|--------------|------------|------------|
| Client lookup by RUC before sale | Identifies buyer for invoice trail; prevents duplicates | Low | CLI-03: unique constraint on RUC |
| Inline client creation from PDV | Cashier can't leave sale screen to create client manually | Low | CLI-01 form reused in PDV flow |
| Product search + add to cart | Core PDV interaction — user expects instant search by name/SKU | Medium | Existing `products` + `product_variants` tables |
| Editable unit price per line item | Semi-jewelry retail commonly applies ad-hoc discounts or custom negotiation; price must be overridable | Low | `PDV-02` — already in requirements |
| Currency selector (PYG/USD/BRL) | Cross-border commerce in Paraguay/Brazil border towns is standard | Low | Single enum field + conversion display |
| Live PYG total with exchange rate | Cashier and customer need to see final Guaraní amount at all times | Low | Reads from `cotizacion` config; real-time re-calc on currency change |
| Stock decrement on confirm | Sale without stock decrement produces phantom inventory | Medium | Reuses `EstoqueMovimento` with new `venda_loja` type |
| Sale confirmation summary screen | Review before commit is table stakes; prevents accidental sales | Low | — |
| Sales history list with filters | Admin needs audit trail of all store sales | Low | `VLJ-01/02` |
| Exchange rate config page | Without daily update, displayed prices are meaningless | Low | `COT-01/02` |

---

## Differentiators (nice to have for v1.4)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Unified client list (loja + revendedoras) | Single source of truth for all buyers across channels | Low | CLI-04: join `clientes` table with `vendas_maleta.cliente_nome` — display-only, no merge |
| Client origin filter | Helps admin understand store vs reseller channel mix | Low | CLI-05 |
| Exchange rate timestamp display | Shows admin when rate was last updated; flags stale data | Low | COT-02 — already in requirements |
| Reserved factura fields in DB | Enables instant v1.5 invoice UI without schema migration | Low | PDV-06 — already in requirements |
| Responsible (quem registrou) column in history | Audit trail for multi-operator store environments | Low | VLJ-01 — already in requirements |

---

## Anti-Features (explicitly exclude from v1.4)

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Factura PDF generation | Requires SET-regulated sequential numbering, talonario management, and legal validation — high legal risk if done wrong | Store reserved fields in DB now (PDV-06); implement in v1.5 with proper SET compliance |
| Credit sales / cuotas (parcelas) | Adds credit risk management, payment tracking, and collection workflows — scope creep | Contado-only in v1.4; CRM with credit in v1.5+ |
| Percentage discounts | Requires discount ledger, authorization workflows, margin reporting | Editable unit price covers ad-hoc negotiation; structured discounts in v1.5 |
| AVATI system integration | AVATI has no API/webhook — confirmed in PROJECT.md | Not feasible; excluded from scope |
| Customer-facing receipt printing | Requires printer driver integration (ESC/POS, Bluetooth) — native app territory | Out of scope until Capacitor migration |
| Automatic exchange rate fetch from API (BCP Paraguay) | Adds external dependency; rate may not reflect store's actual buying rate | Manual daily config by admin (COT-01) is simpler and operationally appropriate |
| Multi-operator concurrent PDV sessions | Requires session locking and real-time conflict resolution | Single-admin use case for v1.4; not needed |
| Client deduplication / merge | Complex UX; fuzzy matching on names across channels is unreliable | Strict RUC uniqueness for store clients (CLI-03); reseller clients remain separate display |

---

## Paraguay Factura Basics

**Context:** Paraguay's tax authority is the **Secretaría de Estado de Tributación (SET)**. Facturas are governed by Resolution 59/2015 and subsequent SIFEN (Sistema Integrado de Facturación Electrónica Nacional) regulations.

**Confidence:** MEDIUM — based on authoritative regional knowledge of Paraguayan tax law; verify against SET official documentation at set.gov.py before implementing v1.5 emission.

### Fields Required on a Paraguayan Factura de Contado

| Field | Description | Notes |
|-------|-------------|-------|
| **Talonario** | Authorization number issued by SET to the seller | Issued per talonario block; sequential range per authorization |
| **Número de factura** | Sequential invoice number within the talonario | Must be strictly sequential; no gaps allowed |
| **Fecha de emisión** | Date of issue | Must match sale date |
| **RUC del vendedor** | Seller's RUC (Monarca's RUC) | Format: `XXXXXXXX-N` |
| **Razón social del vendedor** | Seller's registered business name | Must match SET registration |
| **Dirección del vendedor** | Seller's registered address | City and department |
| **RUC o CI del comprador** | Buyer's RUC (companies) or CI (cédula de identidad, individuals) | RUC for legal entities; CI for natural persons |
| **Nombre o razón social del comprador** | Buyer's name | Required |
| **Condición de venta** | "Contado" or "Crédito" | v1.4 is contado-only |
| **Descripción de bienes/servicios** | Line items with description | One row per product type |
| **Cantidad** | Quantity per line | Integer for physical goods |
| **Precio unitario** | Unit price in PYG | All amounts on factura must be in Guaraní |
| **IVA** | VAT — either 10% (goods) or 5% (basic goods/medicines) or exento | Semi-jewelry is typically 10% IVA |
| **Total IVA** | Total tax amount | Calculated per rate |
| **Total general** | Total including all taxes | In PYG |
| **Tipo de operación** | B2B (empresa a empresa) or B2C (empresa a consumidor final) | Determines reporting category |

### SIFEN (Electronic Invoice) Notes

Paraguay is in phased rollout of electronic invoicing (SIFEN). As of 2025:
- Large taxpayers ("grandes contribuyentes") are already required to emit facturas electrónicas via SET's KuDE system
- Small/medium retailers ("pequeños contribuyentes" and "medianos contribuyentes") are being phased in progressively
- Until mandatory for Monarca's taxpayer category, physical talonario facturas remain valid
- The reserved fields in v1.4 (`talonario`, `numero_factura`, `tipo_operacion`) should accommodate both physical and electronic factura paths in v1.5

### What v1.4 Must Store (PDV-06)

These fields must be persisted on `VentaLoja` at creation time, even without emission UI:

```
talonario           String?   // SET authorization number for the talonario block
numero_factura      Int?      // Sequential within talonario (null until physically assigned)
tipo_operacion      String?   // "B2B" | "B2C" | "exento"
ruc_comprador       String?   // Snapshot from cliente.ruc at sale time
nombre_comprador    String?   // Snapshot from cliente.nombre at sale time
condicion_venta     String    // "contado" — default for v1.4, "credito" for v1.5+
```

Snapshotting ruc_comprador and nombre_comprador at sale time is critical — client data may change after sale, but invoice data must be immutable.

---

## Multi-Currency Patterns

**Context:** Paraguay borders Brazil (BRL) and Argentina (ARS); USD is also used in commerce. PYG is the legal tender for any formal invoice or receipt. Exchange rates fluctuate daily; border commerce prices are commonly quoted in USD or BRL.

**Confidence:** HIGH — standard retail pattern across Latin American border commerce

### Recommended Approach: Store-in-PYG, Display-in-Selected-Currency

All monetary values stored in the database in PYG (Guaraní). The selected currency and the exchange rate used at time of sale are stored as metadata for audit purposes.

Why: Simplifies accounting (single currency in all reports), avoids cross-currency decimal precision issues, and aligns with Paraguay's factura requirement that all amounts be in PYG.

### Data Model for a Sale

```
VentaLoja {
  total_pyg          Decimal(12,2)   // canonical amount in PYG — always present
  moeda              Enum            // PYG | USD | BRL
  total_moeda        Decimal(12,2)   // amount in selected currency (equals total_pyg when moeda=PYG)
  taxa_cambio        Decimal(12,4)   // rate used at time of sale (e.g. 7500.0000 for USD→PYG)
  taxa_cambio_at     DateTime        // when the rate was set — for audit
}
```

### Cotización Config Model

```
CotizacionDia {
  id                 UUID
  usd_pyg            Decimal(12,4)   // e.g. 7500.0000 Gs per USD
  brl_pyg            Decimal(12,4)   // e.g. 1380.0000 Gs per BRL
  updated_at         DateTime
  updated_by         String (Reseller.id)
}
```

Only one active record needed. Update replaces in-place (single-row upsert) for simplicity. A new row per day would create an audit trail but adds query complexity; single-row upsert is sufficient for v1.4.

### Conversion Display Rules

1. Admin selects currency → PDV recalculates displayed total in selected currency immediately — client-side calculation, no server round-trip needed
2. Conversion formula: `total_moeda = total_pyg / taxa_cambio` for USD/BRL; `total_moeda = total_pyg` for PYG
3. Display both amounts simultaneously: "Gs. 750.000 / USD 100,00" — PYG total always visible
4. Show exchange rate source below total: "Cotización: 1 USD = Gs. 7.500 (actualizado hoy 09:30)"
5. On confirm: snapshot `taxa_cambio` and `taxa_cambio_at` into the sale record — rate must never change retroactively

### PYG Formatting

Guaraní has no decimal places in practice (smallest denomination is 1 Gs). Display as integer with period as thousand separator (Spanish notation): `7.500.000 Gs`. USD/BRL display with 2 decimal places using comma as decimal separator: `USD 1.250,50`.

---

## Client RUC Validation

**Confidence:** HIGH — RUC format is formally defined by Paraguay's SET

### RUC Format

```
Pattern (regex):  ^\d{1,8}-\d$
Examples:
  Individual:      12345678-9      (up to 8 digits + hyphen + 1 check digit)
  Company:         80012345-6      (registered companies)
  Foreign entity:  44123456-0      (foreign companies registered with SET)
```

### Check Digit Algorithm (Luhn-like, SET-specific)

1. Take the RUC number digits only (left of hyphen)
2. Assign position weights cyclically: 2, 3, 4, 5, 6, 7, 8, 9, 2, 3, ... (from right to left)
3. Multiply each digit by its weight; sum all products
4. Compute: `remainder = sum mod 11`
5. Check digit = `11 - remainder`; if result is 10 → check digit is 0; if result is 11 → check digit is 1

**Implementation recommendation for v1.4:**
- Required: Format validation (`^\d{1,8}-\d$`) — always enforce before save
- Optional: Check digit algorithm — implement as a utility function in `src/lib/validators/`; format-only validation is acceptable for v1.4 since RUC is used for lookup/storage, not tax filing
- DB level: `@unique` constraint on `ruc` in the `clientes` table enforces no duplicates

### CI (Cédula de Identidad) — For Future Reference

Some store clients may be individuals without a RUC (buying as consumidor final). CI format: `^\d{6,8}$` (6 to 8 digits, no hyphen). For v1.4, RUC is the primary identifier; CI support can be added in v1.5 when factura emission requires distinguishing B2B (RUC) vs B2C (CI) buyers.

### Duplicate Prevention UX Flow

```
Admin types RUC in PDV →
  [onBlur or after 500ms debounce] Server Action: findClientByRUC →
    Found:     pre-fill client section, show "Cliente ya registrado" confirmation, allow proceed
    Not found: show inline "Nuevo cliente" form (nombre + ciudad + telefone) to create before sale
    Invalid:   show format error, block proceed
```

This pattern avoids route navigation during a sale and maps directly to CLI-03 uniqueness requirement.

---

## Dependencies on Existing Stock System

**Confidence:** HIGH — derived from direct Prisma schema inspection

### What Exists (from schema.prisma inspection)

- `EstoqueMovimentoTipo` enum: `reserva_maleta`, `devolucao_maleta`, `ajuste_manual`, `venda_direta`
- `EstoqueMovimento` model: tracks `product_variant_id`, `quantidade` (signed int), `tipo`, `maleta_id` (nullable FK)
- Stock quantity lives on `ProductVariant.stock_quantity`
- `EstoqueMovimento` currently only has `maleta_id` as optional FK — no general-purpose `reference_id`

### What v1.4 Must Add to the Schema

1. New enum value `venda_loja` in `EstoqueMovimentoTipo` — do not reuse `venda_direta`; explicit naming is essential for filtering in analytics and future reporting
2. New nullable FK `venda_loja_id` on `EstoqueMovimento` — mirrors `maleta_id` pattern; enables bidirectional query "which stock movements belong to this sale?"
3. New `VentaLoja` model with all required fields (see PDV-05, PDV-06)
4. New `VentaLojaItem` model for line items (mirrors `MaletaItem` pattern)
5. New `Cliente` model for PDV clients
6. New `CotizacionDia` model (single-row config)

### Stock Decrement Pattern

- Decrement happens at sale confirmation, not at cart creation (same as maleta pattern)
- Pre-validate stock availability for all line items before any write — fail fast if any item has insufficient stock
- If pre-validation passes, sequentially create one `EstoqueMovimento` per line item with `tipo: venda_loja` and negative `quantidade`
- Use the same sequential-operations pattern (not `$transaction(async tx)`) — confirmed constraint from KEY DECISIONS in PROJECT.md
- `quantidade` stored as negative integer to decrement (verify sign convention against existing `reserva_maleta` usage before implementing)

---

## Feature Dependencies Map

```
COT-01/02 (cotizacion config)
        │
        └──────────────────────────────┐
                                       ↓
CLI-01/02/03 (client CRUD) ──→ PDV-01 (lookup by RUC)
                                       ↓
                               PDV-02 (add products from catalog)
                                       ↓
                               PDV-03 (select currency)
                                       ↓
                               PDV-04 (display PYG total) ←── cotizacion rate
                                       ↓
                               PDV-05 (confirm sale)
                                 ├──→ EstoqueMovimento (tipo: venda_loja) × N items
                                 ├──→ VentaLoja record (canonical)
                                 └──→ PDV-06 (factura reserved fields snapshotted)
                                       ↓
                               VLJ-01/02 (ventas history)
                                       ↓
                               CLI-04/05 (unified client list — display only)
```

---

## Build Order Recommendation

1. Schema migration — add `venda_loja` enum, `Cliente`, `CotizacionDia`, `VentaLoja`, `VentaLojaItem` models, FK on `EstoqueMovimento`
2. `COT-01/02` — Exchange rate config (simplest; unblocks PDV display)
3. `CLI-01/02/03` — Client CRUD with RUC validation and uniqueness (unblocks PDV lookup)
4. `PDV-01 through PDV-06` — Full PDV flow (depends on clients + cotizacion)
5. `VLJ-01/02` — Sales history (depends on sales existing)
6. `CLI-04/05` — Unified client list with origin filter (cosmetic; deferred to end)

**Defer to v1.5:** Factura PDF, IVA breakdown display, check digit validation algorithm, CI field for individual buyers, automatic BCP exchange rate fetch.
