# Plan 10-01 Summary — Sentry SDK Setup + Health Endpoint

## Objective
Install and configure Sentry SDK for Next.js (client + server), set up release tracking via CI, and create a health check endpoint for external monitoring.

## Tasks Completed

### Task 1: Install Sentry SDK and create config files
- Installed `@sentry/nextjs` package
- Created `sentry.client.config.ts` with DSN from env, breadcrumb email sanitization
- Created `sentry.server.config.ts` with basic server initialization
- Created `instrumentation.ts` (Next.js instrumentation hook) to load server config on Node.js runtime
- Updated `next.config.ts` to wrap export with `withSentryConfig`
- Build passes after fixing deprecated `hideSourceMaps` → `sourcemaps.deleteSourcemapsAfterUpload`

### Task 2: Create health endpoint and update env examples
- Created `src/app/api/health/route.ts` returning `{database: boolean, timestamp: string}` with HTTP 200/503
- Added Sentry variables to `.env.local.example`
- Added empty `NEXT_PUBLIC_SENTRY_DSN` to `.env.test.example`

## Key Files Created/Modified

| File | Status | Purpose |
|------|--------|---------|
| package.json | Modified | Added `@sentry/nextjs` dependency |
| package-lock.json | Modified | Lockfile updated |
| sentry.client.config.ts | Created | Client-side Sentry init with PII-safe breadcrumbs |
| sentry.server.config.ts | Created | Server-side Sentry init |
| instrumentation.ts | Created | Next.js instrumentation hook |
| next.config.ts | Modified | Wrapped with `withSentryConfig` |
| src/app/api/health/route.ts | Created | Health check endpoint |
| .env.local.example | Modified | Added Sentry env vars |
| .env.test.example | Modified | Added empty Sentry DSN |

## Self-Check

- [x] `npm run build` passes
- [x] `@sentry/nextjs` is in package.json dependencies
- [x] `sentry.client.config.ts` exists with DSN from env
- [x] `sentry.server.config.ts` exists
- [x] `instrumentation.ts` exists and imports server config
- [x] `next.config.ts` exports `withSentryConfig(nextConfig, {...})`
- [x] `src/app/api/health/route.ts` returns 200 with `{database: true, timestamp: ...}` when DB is up
- [x] `.env.local.example` contains SENTRY_DSN, SENTRY_ORG, SENTRY_PROJECT, SENTRY_AUTH_TOKEN
- [x] `.env.test.example` contains empty `NEXT_PUBLIC_SENTRY_DSN`

## Deviations

- Changed `hideSourceMaps: true` to `sourcemaps: { deleteSourcemapsAfterUpload: true }` to fix SentryBuildOptions type error and deprecation warning.

## Next Steps

Plan 10-02 (Structured Logger + PII Sanitization) can now build on the Sentry foundation.
