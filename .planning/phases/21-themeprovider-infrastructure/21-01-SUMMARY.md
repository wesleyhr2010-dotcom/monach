---
phase: 21-themeprovider-infrastructure
plan: 01
subsystem: ui

tags: [react, context, theme, localstorage, dark-mode, tailwind]

requires:
  - phase: 19-css-token-foundation
    provides: "CSS tokens with dark/light variants and @custom-variant dark"
  - phase: 20-app-hardcoded-color-migration
    provides: "PWA without hardcoded hex colors, ready for dynamic theming"

provides:
  - Two independent ThemeProviders (AppThemeProvider for /app, AdminThemeProvider for /admin)
  - useTheme hook with localStorage persistence and OS preference detection
  - ThemeScript anti-flash inline script component
  - ThemeContext for child component consumption
  - Scoped theme state per surface (separate localStorage keys)

affects:
  - phase: 22-toggle-ui
  - src/components/app/AppShell.tsx
  - src/components/admin/AdminLayoutClient.tsx
  - src/app/app/layout.tsx
  - src/app/admin/layout.tsx

tech-stack:
  added: []
  patterns:
    - "Lazy state initialization in useState to avoid setState-in-effect ESLint error"
    - "Self-executing inline script for anti-flash before hydration"
    - "Scoped providers per surface with independent localStorage keys"
    - "Cross-tab sync via StorageEvent dispatch and listener"

key-files:
  created:
    - src/components/theme/types.ts
    - src/components/theme/useTheme.ts
    - src/components/theme/ThemeScript.tsx
    - src/components/theme/ThemeProvider.tsx
    - src/components/theme/AppThemeProvider.tsx
    - src/components/theme/AdminThemeProvider.tsx
  modified:
    - src/components/app/AppShell.tsx
    - src/components/admin/AdminLayoutClient.tsx
    - src/app/app/layout.tsx
    - src/app/admin/layout.tsx

key-decisions:
  - "useTheme uses lazy state initialization (useState(() => ...)) instead of useEffect to read localStorage — avoids react-hooks/set-state-in-effect ESLint error and eliminates an extra render cycle"
  - "ThemeScript wraps logic in try/catch per threat model T-21-03 — prevents hydration blocking on script error"
  - "AdminLayoutClient no longer hardcodes data-theme=dark — the provider now dynamically sets the attribute based on localStorage or OS preference"

patterns-established:
  - "Theme providers are scoped per surface (/app vs /admin) with independent localStorage keys"
  - "Anti-flash script runs synchronously before React hydration via inline <script> in server layout"
  - "Theme context is available for child components to consume via useThemeContext()"

requirements-completed: [INFRA-01, INFRA-02, INFRA-03, INFRA-04]

duration: 25min
completed: 2026-05-16
---

# Phase 21 Plan 01: Core ThemeProviders & Anti-Flash Infrastructure Summary

**Two scoped ThemeProviders with OS preference detection, localStorage persistence, and anti-flash inline script that runs before first paint on both /app and /admin surfaces.**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-05-15T23:53:00Z
- **Completed:** 2026-05-16T00:01:00Z
- **Tasks:** 3
- **Files modified:** 10 (6 created, 4 modified)

## Accomplishments

- Created shared theme infrastructure: types, useTheme hook, and anti-flash ThemeScript
- Built base ThemeProvider with localStorage sync, OS preference detection, and DOM attribute management
- Created thin scoped wrappers: AppThemeProvider (monarca-app-theme) and AdminThemeProvider (monarca-admin-theme)
- Wired providers into AppShell and AdminLayoutClient, preserving existing layout structure
- Added ThemeScript to both app and admin layouts to prevent flash-of-unthemed-content before hydration
- Removed hardcoded `data-theme="dark"` from AdminLayoutClient

## Task Commits

Each task was committed atomically:

1. **Task 1: Create theme types and shared hook** — `6d665d8` (feat)
2. **Task 2: Create AppThemeProvider and AdminThemeProvider** — `d09c611` (feat)
3. **Task 3: Wire providers into AppShell and AdminLayoutClient** — `0302583` (feat)

**Plan metadata:** `TBD` (docs: complete plan)

## Files Created/Modified

- `src/components/theme/types.ts` — Theme type, context interface, and localStorage key constants
- `src/components/theme/useTheme.ts` — Hook for reading/writing theme with localStorage sync, OS preference detection, and cross-tab sync
- `src/components/theme/ThemeScript.tsx` — Inline script component for anti-flash before hydration
- `src/components/theme/ThemeProvider.tsx` — Base provider that manages data-theme DOM attribute via context
- `src/components/theme/AppThemeProvider.tsx` — Scoped provider for /app surface
- `src/components/theme/AdminThemeProvider.tsx` — Scoped provider for /admin surface
- `src/components/app/AppShell.tsx` — Wrapped in AppThemeProvider, added `app-shell` class and `data-theme` fallback
- `src/components/admin/AdminLayoutClient.tsx` — Wrapped in AdminThemeProvider, removed hardcoded `data-theme="dark"`
- `src/app/app/layout.tsx` — Renders `<ThemeScript surface="app" />` before `<AppShell>`
- `src/app/admin/layout.tsx` — Renders `<ThemeScript surface="admin" />` before `<AdminLayoutClient>`

## Decisions Made

- **Lazy state initialization over useEffect for localStorage read**: Initial implementation used `useEffect` to read localStorage and call `setState`, which triggered ESLint `react-hooks/set-state-in-effect`. Refactored to use `useState(() => ...)` lazy initialization, which computes initial state during the first render and avoids the cascading render issue.
- **Try/catch in ThemeScript**: Per threat model T-21-03, the inline script is wrapped in a try/catch block so a localStorage or DOM error never blocks React hydration.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed react-hooks/set-state-in-effect ESLint error in useTheme.ts**
- **Found during:** Task 3 verification (ESLint check)
- **Issue:** `useEffect` calling `setThemeState` and `setResolvedTheme` directly violated `react-hooks/set-state-in-effect` rule, causing a build-blocking ESLint error
- **Fix:** Refactored `useState` calls to use lazy initialization (`useState(() => getInitialTheme(storageKey))` and `useState(() => getInitialResolvedTheme(storageKey))`), removing the initialization `useEffect` entirely
- **Files modified:** `src/components/theme/useTheme.ts`
- **Verification:** `npx eslint src/components/theme/*.ts src/components/theme/*.tsx` returns zero errors and zero warnings
- **Committed in:** `0302583` (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** The fix was necessary for the build to pass. No scope creep — the same files, same behavior, just compliant initialization pattern.

## Issues Encountered

None beyond the auto-fixed ESLint error.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 21 Plan 02 (Sonner Integration & End-to-End Verification) can proceed immediately
- Phase 22 (Toggle UI) has the infrastructure it needs: providers, hooks, and context are ready for manual theme switching
- Both surfaces now dynamically set `data-theme` based on localStorage or OS preference

---
*Phase: 21-themeprovider-infrastructure*
*Completed: 2026-05-16*
