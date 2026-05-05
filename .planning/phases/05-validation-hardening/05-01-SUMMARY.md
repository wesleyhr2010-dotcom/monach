# Plan 05-01 — BUSINESS Throw Cleanup

**Objective:** Migrate all remaining `BUSINESS:` throw patterns to `ActionResult<T>` across 9 source files and adapt the RBAC regression test suite.

**Completed:** 2026-05-05

---

## What Was Built

1. **BusinessError class** — Added to `src/lib/action-utils.ts` as a dedicated error class for business logic failures. `safeAction` catches `BusinessError` and converts it to `ActionResult.error` without leaking stack traces.

2. **requireAuth migration** — Changed `src/lib/user.ts` to throw `BusinessError` instead of `new Error("BUSINESS:...")`. Added `requireAuthSafe()` variant that returns `ActionResult<CurrentUser>` for callers that prefer explicit error handling.

3. **assertIsInGroup migration** — Changed `src/lib/auth/assert-in-group.ts` to return `ActionResult<void>` instead of throwing. Updated all 11 call sites across the codebase to handle the new return type.

4. **7 action files migrated** — Wrapped throwing functions with `safeAction` and updated all callers:
   - `src/app/app/bienvenida/actions.ts` — `getOnboardingStatus`
   - `src/app/app/notificaciones/actions.ts` — `marcarComoLida`
   - `src/app/app/perfil/actions.ts` — `getPerfilCompleto`
   - `src/app/app/progreso/actions.ts` — `canjearRegalo`
   - `src/app/admin/config/notif-push/actions.ts` — `updateNotificacaoTemplate`, `toggleNotificacaoTemplate`
   - `src/app/admin/brindes/actions.ts` — `cancelarSolicitacion`
   - `src/app/admin/minha-conta/actions.ts` — `getMinhaConta`

5. **RBAC regression tests adapted** — Updated `src/__tests__/security/rbac-regression.test.ts` to verify `ActionResult.error` instead of `.rejects.toThrow()`. All 11 tests pass.

---

## Files Changed

| File | Change |
|------|--------|
| `src/lib/action-utils.ts` | Added `BusinessError` class; updated `mapError` to handle it |
| `src/lib/user.ts` | `requireAuth` throws `BusinessError`; added `requireAuthSafe` |
| `src/lib/auth/assert-in-group.ts` | Returns `ActionResult<void>` instead of throwing |
| `src/app/app/bienvenida/actions.ts` | Wrapped `getOnboardingStatus` with `safeAction` |
| `src/app/app/notificaciones/actions.ts` | `marcarComoLida` returns `ActionResult<void>` |
| `src/app/app/perfil/actions.ts` | Wrapped `getPerfilCompleto` with `safeAction` |
| `src/app/app/progreso/actions.ts` | Wrapped `canjearRegalo` with `safeAction` |
| `src/app/admin/config/notif-push/actions.ts` | Wrapped template mutations with `safeAction` |
| `src/app/admin/brindes/actions.ts` | Wrapped `cancelarSolicitacion` with `safeAction` |
| `src/app/admin/minha-conta/actions.ts` | Wrapped `getMinhaConta` with `safeAction` |
| `src/app/app/bienvenida/page.tsx` | Updated caller for `ActionResult` |
| `src/app/app/perfil/page.tsx` | Updated caller for `ActionResult` |
| `src/app/app/perfil/datos/page.tsx` | Updated caller for `ActionResult` |
| `src/app/app/perfil/bancario/page.tsx` | Updated caller for `ActionResult` |
| `src/app/app/perfil/documentos/page.tsx` | Updated caller for `ActionResult` |
| `src/app/app/perfil/soporte/page.tsx` | Updated caller for `ActionResult` |
| `src/app/app/progreso/regalos/page.tsx` | Updated caller for `ActionResult` |
| `src/app/admin/config/notif-push/NotifPushClient.tsx` | Updated callers for `ActionResult` |
| `src/app/admin/brindes/SolicitudActions.tsx` | Updated caller for `ActionResult` |
| `src/app/admin/minha-conta/page.tsx` | Updated caller for `ActionResult` |
| `src/app/app/actions-revendedora.ts` | Updated `assertIsInGroup` call pattern |
| `src/app/admin/actions-equipe.ts` | Updated `assertIsInGroup` call pattern |
| `src/app/admin/revendedoras/[id]/documentos/actions.ts` | Updated `assertIsInGroup` call pattern |
| `src/lib/data-protection/document-access.ts` | Updated `assertIsInGroup` call pattern |
| `src/__tests__/security/rbac-regression.test.ts` | Adapted tests for `ActionResult` pattern |

---

## Verification

- [x] Zero `throw new Error.*BUSINESS` patterns in all 9 migrated files (grep-verified)
- [x] All 9 files import and use `ActionResult<T>`
- [x] RBAC regression tests pass (11/11)
- [x] Full test suite passes (133/133)
- [x] Build completes successfully

---

## Deviations

- `requireAuth` was kept as a throwing guard (with `BusinessError`) rather than returning `ActionResult` directly, because it has 111 call sites across the codebase. A `requireAuthSafe` variant was added for new code that prefers explicit handling.
- `devolverMaleta` test retains `.rejects.toThrow()` because `actions-maletas.ts` is not in the 9-file migration scope and still propagates `requireAuth` throws.
- Pre-existing lint errors (48 errors, 100 warnings) were not addressed; they predate this plan.

---

## Key Decisions

- **BusinessError over string prefix** — Using a dedicated error class is cleaner than parsing `Error.message` for `"BUSINESS:"` prefixes, and it integrates naturally with `safeAction`.
- **safeAction wrapping for throwing functions** — Functions that previously threw now return `ActionResult<T>` via `safeAction`, making error handling explicit at call sites.
- **assertIsInGroup returns ActionResult** — This helper is now fully non-throwing, which simplifies mocking in tests and makes scope-check logic composable.
