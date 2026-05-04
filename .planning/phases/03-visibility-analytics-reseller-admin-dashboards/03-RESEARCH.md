# Phase 3 Research — Visibility & Analytics

**Phase:** 03 — Visibility & Analytics — Reseller & Admin Dashboards
**Date:** 2026-05-04
**Researcher:** gsd-phase-researcher (inline)

---

## 1. Existing Codebase Audit

### Already Built (Phase 2)
- `/admin/analytics/page.tsx` — Operational analytics with period filter (7d/30d/3m/12m), fluxo chart, donut status, top revendedoras, alertas de prazo ≤7d, produtos mais vendidos. Covers DASH-04, DASH-05, DASH-06 partially.
- `/admin/page.tsx` — Executive dashboard with KPI cards (faturamento, maletas, revendedoras, alertas), alert list, ranking table, docs card. Covers DASH-01, DASH-02, DASH-07 partially.
- `actions-dashboard.ts` — Server actions for main dashboard metrics (hardcoded to current month).
- `actions-analytics.ts` — Server actions for analytics page.

### Missing
- `/app/desempenho` — Reseller performance page (DESE-01..DESE-09)
- Period filter on main `/admin` dashboard (DASH-03)
- Skeleton loading states on `/admin` and `/admin/analytics` (DASH-08)
- `recharts` library not installed

## 2. Technical Approach

### Reseller Analytics (`/app/desempenho`)

**Time Range Utility:**
Create `src/lib/date-range.ts` with `getDateRange(rango: TimeRange)` that returns:
- `start`, `end` for current period
- `prevStart`, `prevEnd` for equivalent previous period

Ranges:
- `semana`: last 7 days
- `mes`: current calendar month
- `30dias`: rolling 30 days
- `anio`: current calendar year

**Timezone:** All dates computed in `America/Asuncion` (Paraguay) per SPEC.

**Server Action `getMetricasDesempenho`:**
Queries in parallel:
1. `AnalyticsDiario` for daily visitas (ranges > 7 days)
2. `AnalyticsAcesso` for counts by event type (ranges ≤ 7 days or as fallback)
3. `VendaMaleta` for pieces sold
4. Product popularity from `AnalyticsAcesso` grouped by `produto_id`

**Chart Library:** `recharts` (BarChart). Install as dependency.

**Components:**
- `TimeRangeSelector` — Client dropdown
- `MetricCardTrend` — Value + trend indicator (green/red/neutral/"Nuevo")
- `VisitasDiariasChart` — recharts BarChart with custom tooltip
- `ProductosPopularesList` — Server-rendered top 10

**Empty State:** Use existing `EmptyState` component from Phase 1.

### Admin Dashboard Polish

**Period Filter on `/admin`:**
- Add `period` query param support to `/admin/page.tsx`
- Extend `actions-dashboard.ts` functions to accept `since: Date` parameter
- Default period: current month (existing behavior)
- Options: 7d / 30d / 3m / 12m (same as `/admin/analytics`)

**Skeleton States:**
- Use existing `SkeletonCard` from `src/components/ui/skeleton-card.tsx`
- Wrap KPI cards, alertas card, ranking table, analytics charts in skeleton fallbacks
- Add `Suspense` boundaries where appropriate

## 3. Database Considerations

**Indexes exist:**
- `AnalyticsAcesso`: `@@index([reseller_id])`, `@@index([data_acesso])`, `@@index([tipo_evento])`
- `AnalyticsDiario`: `@@unique([data, reseller_id, tipo])`, `@@index([data])`, `@@index([reseller_id])`

**Query patterns:**
- For short ranges (≤7d): query `AnalyticsAcesso` directly (more granular)
- For longer ranges: query `AnalyticsDiario` (pre-aggregated by cron)

## 4. Security Considerations

- Reseller analytics MUST filter by `reseller_id` — no cross-reseller data leakage
- Admin dashboard already uses `colaboradora_id` scope in `actions-dashboard.ts`
- All server actions must call `requireAuth()`

## 5. Dependencies

- `recharts` — charting library (new dependency)
- Existing: `sonner`, `lucide-react`, `@/components/ui/*`, `@/lib/user`, `@/lib/prisma`

## 6. Risks

- **Risk:** `AnalyticsDiario` may not have data if cron hasn't run. Mitigation: fallback to `AnalyticsAcesso` raw queries.
- **Risk:** `recharts` adds bundle size. Mitigation: only used on `/app/desempenho` which is already a client-interactive page.
- **Risk:** Timezone boundary errors (Paraguay DST). Mitigation: use `America/Asuncion` consistently; Prisma `AT TIME ZONE` for raw queries.

## 7. Patterns to Follow

- Server Actions return `ActionResult<T>` (Phase 1 pattern)
- Use `safeAction()` wrapper for validation
- UI in Spanish (Paraguayan)
- Currency format: `G$` prefix
- Dark theme for admin, light theme for PWA
- SkeletonCard for loading, EmptyState for no data, ErrorState for errors

---

*Research complete for Phase 3*
