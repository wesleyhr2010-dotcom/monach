---
plan: 12-01
phase: 12
status: complete
completed: 2026-05-07
---

# Plan 12-01 Summary: Auth Guards on Export Routes (SEC-01)

## What was built

Added `requireAuth(["ADMIN", "COLABORADORA"])` authentication guards to both export API routes that were previously serving PII data without any session verification:

- **`src/app/api/export/route.ts`** — xlsx/csv export route now returns 401 for unauthenticated requests
- **`src/app/api/export/pdf/route.ts`** — PDF export route now returns 401 for unauthenticated requests
- **`src/__tests__/security/export-auth.test.ts`** — 5 regression tests verifying auth behavior

## Key files created/modified

| File | Action | Description |
|------|--------|-------------|
| `src/app/api/export/route.ts` | Modified | Added requireAuth guard before data access |
| `src/app/api/export/pdf/route.ts` | Modified | Added requireAuth guard before data access |
| `src/__tests__/security/export-auth.test.ts` | Created | Auth regression tests (5 tests, all passing) |

## Self-Check: PASSED

- [x] Both routes have `import { requireAuth } from "@/lib/user"` and `await requireAuth(["ADMIN", "COLABORADORA"])`
- [x] Guard is in separate try/catch before the main handler logic
- [x] Unauthenticated requests return 401 with `{ error: "No autorizado" }`
- [x] All 5 tests pass: `npx vitest run src/__tests__/security/export-auth.test.ts`
- [x] TypeScript compiles without errors: `npx tsc --noEmit`
- [x] No modifications to existing business logic — only auth guard added

## Notable decisions

- Used the established `requireAuth` pattern from `src/lib/user.ts` (throws BusinessError, caught and converted to 401)
- Test file follows the same mock pattern as `rbac-regression.test.ts`
- Mock Request objects include `nextUrl` property to match Next.js route handler expectations
