---
phase: 01-foundation-error-handling-ui-states
plan: 01
subsystem: lib + app actions
completed_date: 2025-05-04
duration: "45min"
key_files:
  created:
    - src/__tests__/lib/action-utils.test.ts
  modified:
    - src/lib/action-utils.ts
    - src/app/app/actions-revendedora.ts
    - src/app/app/AppDashboardClient.tsx
    - src/app/app/catalogo/compartir/page.tsx
    - src/app/app/maleta/[id]/registrar-venta/RegistrarVentaClient.tsx
commits:
  - hash: 659dc09
    message: "feat(01-01): implement mapError() and enhance safeAction() with Prisma error mapping"
  - hash: 40b386f
    message: "feat(01-01): migrate actions-revendedora.ts to ActionResult<T> pattern"
  - hash: 64b9854
    message: "fix(01-01): update callers to handle ActionResult from safeAction"
---

# Phase 01 Plan 01: Error Handling Infrastructure — Summary

**One-liner:** Enhanced `safeAction()` with Prisma error mapping (`mapError()`) and migrated the highest-traffic PWA action file (`actions-revendedora.ts`) to the `ActionResult<T>` pattern, eliminating all `throw new Error("BUSINESS:...")` patterns.

## What was built

1. **`mapError(err: unknown): string`** — Maps Prisma error codes to user-friendly Spanish messages:
   - `P2002` → "Ya existe un registro con ese valor..."
   - `P2025` → "El registro que buscás no fue encontrado..."
   - `P2014` → "Hay un conflicto en los datos relacionados..."
   - Unknown errors → original message or "Error desconocido"

2. **Enhanced `safeAction<T>()`** — Now calls `mapError(err)` in the catch block instead of leaking raw `err.message`.

3. **20 Vitest tests** covering success path, all three Prisma error codes, unknown errors, and non-Error throws.

4. **Migrated `actions-revendedora.ts`** — All 9 exported functions wrapped in `safeAction()`, zero `BUSINESS:` throws remain.

5. **Updated all callers** — `AppDashboardClient`, `catalogo/compartir`, `registrar-venta` now properly check `result.success`.

## Deviations from Plan

None — plan executed exactly as written.

## Threat Flags

None — `mapError()` strips stack traces and returns only user-friendly Spanish messages, mitigating T-01-01 (Information Disclosure).

## Self-Check: PASSED

- [x] `src/lib/action-utils.ts` exports `mapError`, `safeAction`, `ActionResult`
- [x] `src/__tests__/lib/action-utils.test.ts` exists with 20 passing tests
- [x] `grep -c "throw new Error.*BUSINESS" src/app/app/actions-revendedora.ts` returns 0
- [x] `grep -c "safeAction" src/app/app/actions-revendedora.ts` returns 10
- [x] `npm test -- src/__tests__/lib/action-utils.test.ts` passes
- [x] No new typecheck errors introduced
