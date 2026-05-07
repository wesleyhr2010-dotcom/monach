---
phase: 11-rate-limiting
plan: 02
status: complete
completed: "2026-05-06"
---

# Plan 11-02 Summary: Authenticated Endpoints & Admin Bypass

## What Was Built

Applied userId-based rate limiting to the authenticated file upload endpoint (`/api/upload-r2`) with admin/COLABORADORA bypass, ensuring expensive upload operations are protected from abuse while internal users remain unblocked.

## Tasks Completed

### Task 1: Add admin bypass helper to rate-limit library
- Added `isAdminRole(role)` helper to `src/lib/rate-limit.ts` — returns `true` for `"ADMIN"` or `"COLABORADORA"`
- All previous exports remain intact

### Task 2: Apply userId-based rate limiting to /api/upload-r2 with admin bypass
- Modified `src/app/api/upload-r2/route.ts`:
  - Added imports for `checkRateLimit`, `isAdminRole`, `createRateLimitResponse`, `RATE_LIMIT_MESSAGES`
  - Rate limit check inserted AFTER Supabase auth and Prisma role lookup, BEFORE FormData parsing
  - Admin and COLABORADORA users bypass rate limit entirely (`!isAdminRole(reseller.role)`)
  - Non-admin users limited by `user:${user.id}` key using `rateLimiters.upload` (10 req/min)
  - 429 response uses `RATE_LIMIT_MESSAGES.upload` in Spanish paraguayan
  - All existing file validation, path validation (`validateKey`), and R2 upload logic preserved

## Key Files Modified

| File | Action | Purpose |
|------|--------|---------|
| `src/lib/rate-limit.ts` | modified | Added `isAdminRole()` export |
| `src/app/api/upload-r2/route.ts` | modified | UserID-based rate limiting with role bypass |

## Deviations

None.

## Self-Check

- [x] `npm run build` passes
- [x] `npm run lint` passes for modified files (no new lint errors introduced)
- [x] Rate limit check is AFTER auth, BEFORE expensive FormData parsing
- [x] Admin/COLABORADORA bypass confirmed
- [x] Graceful fallback preserved (Redis null → allow all)

## Next

Plan 11-03 will write automated tests and documentation for the rate limiting system.
