# Plan 10-03 Summary — Server Action Integration + Error Context

## Objective
Wire Sentry into the application's error handling flow so that all server action errors are reported with user context (userId, action name) and unhandled client errors are captured by a global error boundary.

## Tasks Completed

### Task 1: Create Sentry helpers and wire into safeAction
- Created `src/lib/sentry.ts` with:
  - `captureServerActionError`: captures errors to Sentry with action tag, user scope, and sanitized context
  - `setUserContext`: sets Sentry user with id and redacted email
  - `clearUserContext`: clears Sentry user context
- Updated `src/lib/action-utils.ts`:
  - `safeAction` now accepts optional `options` parameter with `actionName` and `userId`
  - When `actionName` is provided, errors are sent to Sentry before returning to client
  - Fully backward compatible — calls without options work exactly as before

### Task 2: Add user context to getCurrentUser and create global error boundary
- Updated `src/lib/user.ts`:
  - `getCurrentUser` calls `setUserContext(profile.id, user.email)` when profile is found
  - `getCurrentUser` calls `clearUserContext()` when no profile is found
- Created `src/app/global-error.tsx`:
  - Client-side error boundary that calls `Sentry.captureException(error)` via useEffect

## Key Files Created/Modified

| File | Status | Purpose |
|------|--------|---------|
| src/lib/sentry.ts | Created | Sentry helpers for app integration |
| src/lib/action-utils.ts | Modified | safeAction captures errors to Sentry |
| src/lib/user.ts | Modified | Sets/clears Sentry user context |
| src/app/global-error.tsx | Created | Global client error boundary |

## Self-Check

- [x] `src/lib/sentry.ts` exists with `captureServerActionError`, `setUserContext`, `clearUserContext`
- [x] `safeAction` accepts optional `options` parameter with `actionName` and `userId`
- [x] When `actionName` is provided, errors are sent to Sentry before returning to client
- [x] `npm run build` passes
- [x] Existing calls to `safeAction` without options still compile
- [x] `getCurrentUser` calls `setUserContext(profile.id, user.email)` when profile is found
- [x] `getCurrentUser` calls `clearUserContext()` when no profile is found
- [x] `src/app/global-error.tsx` exists and exports a default component
- [x] `global-error.tsx` uses `useEffect` to call `Sentry.captureException(error)`

## Deviations

- None.

## Next Steps

Plan 10-04 (Performance Monitoring + Alerts + Tests) will add browser tracing, CI release tracking, and tests.
