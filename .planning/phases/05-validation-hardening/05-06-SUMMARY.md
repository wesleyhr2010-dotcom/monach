# Plan 05-06 — CI/CD Quality Gate

**Objective:** Create a GitHub Actions workflow that runs lint, typecheck, tests, and build on every push/PR to main and develop branches.

**Completed:** 2026-05-05

---

## What Was Built

1. **GitHub Actions workflow** — Created `.github/workflows/ci-quality-gate.yml` with the following gates:
   - **Checkout** — Pulls repository code
   - **Setup Node.js 20** — Uses npm cache for faster installs
   - **Install dependencies** — `npm ci` for deterministic installs
   - **Run linter** — `npm run lint` (continue-on-error: true — project has 48 pre-existing errors)
   - **Run typecheck** — `npm run typecheck` (continue-on-error: true — project has pre-existing errors)
   - **Run tests** — `npm test -- --run` (Vitest with no watch mode)
   - **Build** — `npm run build` with all required env secrets

2. **Environment variables** — Build step includes all required environment variables:
   - Supabase (URL, anon key, service role)
   - Database URL
   - Cloudflare R2 (public URL, access key, secret, bucket, endpoint)
   - Brevo API key
   - OneSignal (app ID, REST API key)

---

## Files Changed

| File | Change |
|------|--------|
| `.github/workflows/ci-quality-gate.yml` | New — CI quality gate workflow |

---

## Verification

- [x] Workflow file created with valid YAML syntax
- [x] Triggers on push/PR to `main` and `develop`
- [x] Uses `ubuntu-latest` runner
- [x] Uses Node.js 20 with npm cache
- [x] All required build env vars referenced from secrets
- [x] Lint and typecheck use `continue-on-error: true` to not block on pre-existing issues
- [x] Tests gate is strict (no continue-on-error)
- [x] Build gate is strict (no continue-on-error)

---

## Key Decisions

- **continue-on-error for lint/typecheck** — The project currently has 48 lint errors and typecheck issues. Blocking CI on these would prevent all merges until they're fixed. The workflow still runs these steps and reports results, but doesn't fail the pipeline.
- **Strict gates for test and build** — New code must not break tests or the build. These are non-negotiable gates.
- **npm ci instead of npm install** — Ensures deterministic dependency installation using `package-lock.json`.
- **Secrets-based env vars** — All sensitive configuration is injected via GitHub secrets, avoiding hardcoded values in the workflow.

---

## Next Steps (Post-Phase)

- Fix the 48 pre-existing lint errors and remove `continue-on-error: true` from the lint step
- Fix typecheck errors and remove `continue-on-error: true` from the typecheck step
- Add test coverage reporting (e.g., `vitest --coverage`)
- Add deploy step for Vercel after build passes
