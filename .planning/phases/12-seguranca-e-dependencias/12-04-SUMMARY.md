---
plan: 12-04
phase: 12
status: complete
completed: 2026-05-07
---

# Plan 12-04 Summary: Timezone Fix for Analytics (SEC-05)

## What was built

Fixed `getSinceDate()` in `actions-analytics.ts` to use Paraguay timezone (UTC-3) instead of UTC midnight. The bug caused "last N days" reports to include data from the wrong day depending on when the serverless function executed.

## Key files created/modified

| File | Action | Description |
|------|--------|-------------|
| `src/app/admin/actions-analytics.ts` | Modified | Replaced `setHours(0,0,0,0)` with `PY_OFFSET_MS` constant |
| `src/__tests__/security/analytics-timezone.test.ts` | Created | 5 timezone tests verifying correct behavior |

## Fix details

**Before (buggy):**
```ts
function getSinceDate(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);  // UTC midnight in serverless = 21:00 previous day in PY
  return d;
}
```

**After (fixed):**
```ts
const PY_OFFSET_MS = 3 * 60 * 60 * 1000; // UTC-3, sem DST desde 2024

function getSinceDate(days: number): Date {
  const nowPy = new Date(Date.now() - PY_OFFSET_MS);
  nowPy.setUTCDate(nowPy.getUTCDate() - days);
  nowPy.setUTCHours(0, 0, 0, 0);
  return new Date(nowPy.getTime() + PY_OFFSET_MS);
}
```

## Self-Check: PASSED

- [x] `PY_OFFSET_MS` constant declared at module level
- [x] `setUTCHours` used instead of `setHours`
- [x] Returns 03:00:00 UTC (= 00:00 Asunción) for `getSinceDate(0)`
- [x] All 5 tests pass
- [x] All 7 call sites automatically fixed (no changes needed)
- [x] TypeScript compiles without errors
