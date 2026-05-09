---
phase: 18-historico-de-ventas
plan: 01
subsystem: database
tags: [prisma, server-actions, postgres, typescript, nextjs]

# Dependency graph
requires: []
provides:
  - VentaLoja model with cancelled_at field for sale cancellation
  - 5 Server Actions for sales history (list, detail, cancel, KPIs, CSV export)
  - Admin sidebar navigation entry for /admin/ventas
affects: [18-02, 18-03, 18-04] # frontend plans that consume these actions

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "safeAction + requireAuth([\"ADMIN\"]) guard pattern for all Server Actions"
    - "buildVentasWhere helper for shared filter logic"
    - "Sequential stock compensation on cancel (same as actions-pdv.ts)"
    - "Promise.all for parallel aggregate queries in KPIs"

key-files:
  created:
    - src/app/admin/actions-ventas.ts
  modified:
    - prisma/schema.prisma
    - src/components/admin/AdminLayoutClient.tsx

key-decisions:
  - "Used cancelled_at timestamp instead of status enum for sale cancellation (simpler, supports audit trail)"
  - "Export CSV has no pagination — ADMIN-only and bounded by date range (per threat model T-18-04)"
  - "Search filter strictly excludes Consumidor Final sales when active (D-18-10)"

patterns-established:
  - "buildVentasWhere: shared where clause builder used by listVentas, getKPIsVentas, exportVentasCSV"
  - "cancelarVenta: pre-read validation → update → sequential stock restore → reverse movements → invalidate cache"

requirements-completed:
  - PDV-01
  - PDV-02
  - PDV-03

# Metrics
duration: 12 min
completed: 2026-05-09
---

# Phase 18 Plan 01: Database Schema and Server Actions Summary

**Extended VentaLoja schema with cancelled_at field, created 5 Server Actions for sales history backend, and added sidebar navigation entry**

## Performance

- **Duration:** 12 min
- **Started:** 2026-05-09T00:00:00Z
- **Completed:** 2026-05-09T00:12:00Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- VentaLoja model extended with `cancelled_at DateTime?` field, database synchronized
- Created `actions-ventas.ts` with 5 Server Actions: listVentas, getVentaById, cancelarVenta, getKPIsVentas, exportVentasCSV
- All actions guarded by `requireAuth(["ADMIN"])` using safeAction pattern
- Admin sidebar now includes "Ventas" link with Receipt icon

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend VentaLoja schema and push to database** - `273d8d7` (feat)
2. **Task 2: Create actions-ventas.ts Server Actions** - `63021d0` (feat)
3. **Task 3: Add /admin/ventas to sidebar navigation** - `fd7cd57` (feat)

## Files Created/Modified

- `prisma/schema.prisma` — Added `cancelled_at DateTime?` field to VentaLoja model
- `src/app/admin/actions-ventas.ts` — 5 Server Actions for sales history (NEW)
- `src/components/admin/AdminLayoutClient.tsx` — Added Ventas nav entry with Receipt icon

## Decisions Made

- Used `cancelled_at` timestamp field instead of a status enum — simpler, supports audit trail (when was it cancelled)
- Export CSV has no pagination limit — ADMIN-only access and bounded by date range filter (per threat model T-18-04)
- Search filter strictly excludes "Consumidor Final" sales when active — matches D-18-10 decision from CONTEXT.md

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Backend foundation complete for sales history feature
- Frontend plans (18-02, 18-03, 18-04) can now consume the Server Actions
- Database schema synchronized, Prisma client regenerated

---
*Phase: 18-historico-de-ventas*
*Completed: 2026-05-09*
