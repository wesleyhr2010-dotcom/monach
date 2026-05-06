---
plan: 09-02
phase: 09-e2e-testing
status: complete
completed: "2026-05-06"
commits: 1
---

# Summary — Plan 09-02: Golden Path Tests

## What was built

4 core E2E tests covering the critical reseller business flow: login → maleta → sale → return.

### Files created

- `tests/e2e/fixtures/scenarios.ts` — Playwright `test.extend` fixture that automatically:
  - Calls `seedScenario()` before each test
  - Calls `cleanupScenario()` after each test
  - Exposes `seededReseller` with reseller profile, auth ID, maleta, products, and password
- `tests/e2e/helpers/navigation.ts` — Navigation abstractions:
  - `navigateToMaleta()` — goes to /app/maleta
  - `navigateToHome()` — goes to /app
  - `waitForAppReady()` — waits for dashboard content
- `tests/e2e/login.spec.ts` — 3 tests:
  - Login with valid credentials redirects to /app
  - Login with wrong password shows error and stays on login page
  - Logout redirects to login
- `tests/e2e/maleta.spec.ts` — 2 tests:
  - View active maleta list
  - Access maleta detail and verify Registrar Venta / Devolver buttons
- `tests/e2e/venda.spec.ts` — 3 tests:
  - Register sale and verify redirect back to maleta detail
  - Sale without selecting item shows disabled submit button
  - Sale without client name shows disabled submit button
- `tests/e2e/devolucao.spec.ts` — 2 tests:
  - Initiate return and access all steps (Resumen)
  - Return with file upload (bypasses camera by using hidden file input with minimal JPEG)

### Key design decisions

- Tests import `test` from `fixtures/scenarios.ts` (not `@playwright/test` directly) to get automatic seed/cleanup
- Devolucao test uploads a minimal valid JPEG (1x1 pixel) via the hidden file input instead of trying to automate camera access
- Selectors use visible text and placeholder attributes rather than data-testid (which the codebase doesn't use extensively)

## Deviations

None.

## Self-Check

✅ PASSED
