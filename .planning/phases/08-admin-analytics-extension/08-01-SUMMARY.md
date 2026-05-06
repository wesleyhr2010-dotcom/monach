# Plan 08-01 Summary — Backend Data Layer: Vitrina Analytics Server Actions

**Phase:** 08-admin-analytics-extension  
**Plan:** 01  
**Wave:** 1  
**Status:** Complete  
**Executed:** 2026-05-06

---

## What Was Built

Extended `src/app/admin/actions-analytics.ts` with five new server actions for vitrina (public showcase) analytics:

### New Types
- `VitrinaKPIs` — totalVisitas, visitantesUnicos, cliquesWhatsApp, ctrCheckout, ctrContato
- `VitrinaDia` — { dia: string, visitas: number } for time-series chart data
- `VitrinaRankingItem` — engagement metrics per reseller with avatar

### New Server Actions
1. **`getVitrinaKPIs(periodDays, resellerId?)`** — Returns aggregated KPIs with hybrid freshness:
   - Historical data from `AnalyticsDiario` (daily aggregates)
   - Real-time "today" data from `AnalyticsAcesso` (raw events since 00:00)
   - Two CTR calculations: checkout vs contact
   - Respects RBAC scope (COLABORADORA sees only her group)

2. **`getVitrinaVisitasSeries(periodDays, resellerId?)`** — Returns gap-filled daily visit counts for the selected period, suitable for recharts BarChart.

3. **`getVitrinaRankingRevendedoras(periodDays, limit?)`** — Returns resellers sorted by total visits descending, with unique visitors, WhatsApp clicks, and CTR. Pre-loads reseller names to avoid N+1.

4. **`exportVitrinaAnalyticsCSV(periodDays)`** — Returns CSV string with columns: slug, periodo, total_visitas, visitantes_unicos, cliques_whatsapp, ctr_checkout, ctr_contato. Uses reseller `slug` instead of name to avoid PII leakage (per D-14).

5. **`getResellersForAnalytics()`** — Returns scoped reseller list for the dropdown selector. Reuses RBAC pattern from `getActiveResellers`.

### Helper
- `buildAnalyticsScopeParams(user, baseParams, tableAlias)` — Generates parameterized SQL scope clauses for COLABORADORA filtering.

---

## Key Decisions Applied

- **D-10..D-12 (Hybrid Freshness):** `AnalyticsDiario` for historical + `AnalyticsAcesso` for today
- **D-08..D-09 (Two CTRs):** ctrCheckout (cart clicks / unique visitors) and ctrContato (any WhatsApp click / unique visitors)
- **D-13..D-15 (CSV without PII):** Exports only `slug`, no name/email/whatsapp
- **D-06 (RBAC Scope):** COLABORADORA queries include `colaboradora_id` subquery

---

## Threat Model Verification

| Threat | Status |
|--------|--------|
| T-08-01 SQL Injection | Mitigated — all user input parameterized |
| T-08-02 RBAC Bypass | Mitigated — `requireAuth` + scope helper on every action |
| T-08-03 CSV PII Leak | Mitigated — only slug exported |
| T-08-04 periodDays tampering | Accepted — validated downstream in page.tsx |

---

## Self-Check

- [x] All 5 server actions compile without TypeScript errors
- [x] `npm run typecheck` passes for `actions-analytics.ts`
- [x] Each action enforces RBAC: COLABORADORA cannot see data outside her group
- [x] CSV output contains only slug, no PII fields

---

## Files Changed

- `src/app/admin/actions-analytics.ts` (+322 lines, -1 line)
  - Added `Prisma` to existing type import

## Key Links

- Downstream: Plan 08-02 consumes `VitrinaKPIs`, `VitrinaDia`, `VitrinaRankingItem` types and all 5 server actions
- Downstream: Plan 08-03 wires these into `page.tsx`
