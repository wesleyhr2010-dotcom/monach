---
plan: 09-01
phase: 09-e2e-testing
status: complete
completed: "2026-05-06"
commits: 1
---

# Summary — Plan 09-01: Playwright Setup & Seed

## What was built

Playwright E2E testing infrastructure with reusable helpers for auth and database seeding.

### Files created

- `playwright.config.ts` — Playwright configuration for Next.js App Router with webServer, globalSetup/globalTeardown, Chromium project
- `.env.test.example` — Template for test environment variables (DATABASE_URL, Supabase keys, R2, Brevo, OneSignal)
- `tests/e2e/global-setup.ts` — Validates required env vars and DATABASE_URL safety guard before test suite runs
- `tests/e2e/global-teardown.ts` — Sweeps leftover test data by prefix as a safety net
- `tests/e2e/helpers/db.ts` — Prisma client instance for E2E (isolated from src/lib/prisma.ts extensions)
- `tests/e2e/helpers/test-data.ts` — Factories for test entities with unique identifiers
- `tests/e2e/helpers/seed.ts` — Database seeding and cleanup:
  - `seedUser()` — creates Supabase Auth user + Reseller profile
  - `seedProductAndVariant()` — creates Product + ProductVariant
  - `seedMaleta()` — creates Maleta with MaletaItems
  - `seedScenario()` — orchestrates complete scenario (admin + colaboradora + reseller + 3 products + active maleta)
  - `cleanupScenario()` — deletes all seeded data in reverse dependency order
- `tests/e2e/helpers/auth.ts` — Authentication helpers:
  - `loginAsReseller()` — fills PWA login form at /app/login
  - `loginAsAdmin()` — fills admin login form at /admin/login
  - `loginAsColaboradora()` — same as admin route
  - `logout()` — clears cookies and navigates to login

### package.json updates

Added scripts:
- `test:e2e`: `playwright test`
- `test:e2e:ui`: `playwright test --ui`
- `test:e2e:headed`: `playwright test --headed`

### Verification

- `npx playwright test --list` reports 0 tests (infrastructure ready)
- No secrets committed (only `.env.test.example` in repo)
- `.gitignore` updated to exclude `playwright-report/` and `test-results/`

## Deviations

None.

## Self-Check

✅ PASSED
