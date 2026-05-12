---
phase: 18-historico-de-ventas
plan: 02
subsystem: ui
tags: [nextjs, react, typescript, tailwind, lucide-react, sonner]

# Dependency graph
requires:
  - phase: 18-01
    provides: VentaLoja schema with cancelled_at, 5 Server Actions, sidebar nav entry
provides:
  - /admin/ventas list page with KPIs, date range filter, period presets, search, pagination
  - /admin/ventas/[id] detail page with full sale info, items table, exchange rates
  - CancelarVentaModal with confirmation dialog and toast feedback
  - VentasKpiCards, VentasTable, VentasDateRangeSelect, VentasSearchInput, VentasCsvDownload components
affects: [18-03, 18-04] # future plans may add print/export features

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Server Component pages with force-dynamic for authenticated admin routes"
    - "Client components for interactive elements (search, date picker, CSV download, modal)"
    - "URL state via searchParams for filters (period, from/to, search, sort, dir, page)"
    - "Inline status badges for non-MaletaStatus values (Confirmada/Cancelada)"

key-files:
  created:
    - src/app/admin/ventas/page.tsx
    - src/app/admin/ventas/[id]/page.tsx
    - src/app/admin/ventas/VentasKpiCards.tsx
    - src/app/admin/ventas/VentasTable.tsx
    - src/app/admin/ventas/VentasDateRangeSelect.tsx
    - src/app/admin/ventas/VentasSearchInput.tsx
    - src/app/admin/ventas/VentasCsvDownload.tsx
    - src/app/admin/ventas/CancelarVentaModal.tsx
  modified:
    - src/app/admin/actions-ventas.ts

key-decisions:
  - "Used inline styled status badges instead of AdminStatusBadge for Confirmada/Cancelada (AdminStatusBadge only accepts MaletaStatus enum)"
  - "Re-exported getRangeFromParams from actions-analytics into actions-ventas for shared date range logic"
  - "Removed textDecoration: line-through from cancelled rows, kept opacity: 0.6 for better readability"

patterns-established:
  - "VentasTable: sortable columns with URL state persistence (sort, dir params)"
  - "VentasSearchInput: debounced search (400ms) with URL state sync"
  - "VentasCsvDownload: client-side blob download from Server Action CSV string"

requirements-completed:
  - PDV-04
  - PDV-05
  - PDV-06
  - PDV-07

# Metrics
duration: 15 min
completed: 2026-05-09
---

# Phase 18 Plan 02: Frontend UI for Sales History Summary

**Complete /admin/ventas/* route tree with list page (KPIs, filters, sortable table, pagination, CSV export) and detail page (full sale info, items table, cancel action)**

## Performance

- **Duration:** 15 min
- **Started:** 2026-05-09T00:00:00Z
- **Completed:** 2026-05-09T00:15:00Z
- **Tasks:** 2
- **Files modified:** 8 (7 created, 1 modified)

## Accomplishments

- Created /admin/ventas list page with KPI cards, date range picker, period presets (7d/30d/3m/12m), search input, sortable table, pagination, and CSV export
- Created /admin/ventas/[id] detail page with client info, totals, exchange rate snapshot, creator, and items table
- Created CancelarVentaModal with confirmation dialog, toast feedback, and page refresh on success
- All components follow admin design system with --admin-* CSS tokens (zero hardcoded hex values)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create list page and reusable components** - `9e7eb0a` (feat)
2. **Task 2: Create detail page and cancel modal** - `b1d34d4` (feat)
3. **Fix type error and lint violation** - `8a5af72` (fix)

## Files Created/Modified

- `src/app/admin/ventas/page.tsx` — Sales list page with KPIs, filters, table, pagination (NEW)
- `src/app/admin/ventas/[id]/page.tsx` — Sale detail page with cancel action (NEW)
- `src/app/admin/ventas/VentasKpiCards.tsx` — 4 KPI cards using MetricCard component (NEW)
- `src/app/admin/ventas/VentasTable.tsx` — Sortable, clickable sales table with status badges (NEW)
- `src/app/admin/ventas/VentasDateRangeSelect.tsx` — Date range picker with URL state (NEW)
- `src/app/admin/ventas/VentasSearchInput.tsx` — Debounced search input (NEW)
- `src/app/admin/ventas/VentasCsvDownload.tsx` — CSV export button with blob download (NEW)
- `src/app/admin/ventas/CancelarVentaModal.tsx` — Cancel confirmation modal (NEW)
- `src/app/admin/actions-ventas.ts` — Added getRangeFromParams re-export (MODIFIED)

## Decisions Made

- Used inline styled status badges instead of AdminStatusBadge for Confirmada/Cancelada statuses — AdminStatusBadge only accepts MaletaStatus enum types (ativa, atrasada, aguardando_revisao, concluida)
- Re-exported getRangeFromParams from actions-analytics into actions-ventas.ts — plan imports it from actions-ventas but it only existed in actions-analytics (Rule 3 blocking fix)
- Removed textDecoration: line-through from cancelled sale rows, kept opacity: 0.6 — line-through made text hard to read while opacity still provides clear visual distinction

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added getRangeFromParams re-export to actions-ventas.ts**
- **Found during:** Task 1 (list page creation)
- **Issue:** Plan imports getRangeFromParams from actions-ventas.ts but it only existed in actions-analytics.ts
- **Fix:** Added `export { getRangeFromParams } from "./actions-analytics"` to actions-ventas.ts
- **Files modified:** src/app/admin/actions-ventas.ts
- **Verification:** Import resolves correctly, TypeScript compiles without errors
- **Committed in:** 9e7eb0a (Task 1 commit)

**2. [Rule 1 - Bug] Replaced AdminStatusBadge with inline styled spans**
- **Found during:** Task 1 (VentasTable creation)
- **Issue:** AdminStatusBadge only accepts MaletaStatus enum type, not arbitrary strings like "Confirmada" or "Cancelada", and doesn't accept variant prop
- **Fix:** Created inline StatusBadge component in VentasTable and detail page with success/danger variant support
- **Files modified:** src/app/admin/ventas/VentasTable.tsx, src/app/admin/ventas/[id]/page.tsx
- **Verification:** Status badges render correctly with proper colors
- **Committed in:** 9e7eb0a (Task 1 commit)

**3. [Rule 2 - Missing Critical] Fixed ActionResult discriminated union type error**
- **Found during:** TypeScript typecheck
- **Issue:** Accessing .error property on success branch of ActionResult union type
- **Fix:** Changed to `!listResult.success ? listResult.error : "Intentá de nuevo."`
- **Files modified:** src/app/admin/ventas/page.tsx
- **Verification:** tsc --noEmit passes for ventas files
- **Committed in:** 8a5af72 (fix commit)

**4. [Rule 1 - Bug] Moved SortIcon outside VentasTable render function**
- **Found during:** ESLint
- **Issue:** SortIcon defined inside component render, violating eslint rule about components created during render
- **Fix:** Moved SortIcon to module scope, added sort/dir as explicit props
- **Files modified:** src/app/admin/ventas/VentasTable.tsx
- **Verification:** eslint passes with zero warnings
- **Committed in:** 8a5af72 (fix commit)

---

**Total deviations:** 4 auto-fixed (1 blocking, 1 bug, 1 missing critical, 1 bug)
**Impact on plan:** All auto-fixes necessary for correctness and type safety. No scope creep.

## Issues Encountered

- None beyond the deviations documented above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Frontend UI for sales history is complete and functional
- Plans 18-03 and 18-04 can build on this foundation
- TypeScript typecheck passes for all ventas files
- ESLint passes with zero warnings
- Server Actions from plan 01 are properly consumed

## Self-Check: PASSED

- All 8 files exist on disk
- git log shows 3 commits for 18-02
- TypeScript compiles without ventas-related errors
- ESLint passes with zero warnings

---
*Phase: 18-historico-de-ventas*
*Completed: 2026-05-09*
