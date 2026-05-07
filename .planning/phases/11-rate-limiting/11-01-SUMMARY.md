---
phase: 11-rate-limiting
plan: 01
status: complete
completed: "2026-05-06"
---

# Plan 11-01 Summary: Infrastructure & Public Endpoints

## What Was Built

Installed and configured Upstash Redis rate limiting, created the core rate limit library, and applied IP-based protection to public analytics tracking endpoints.

## Tasks Completed

### Task 1: Install Upstash SDK and create rate limit library
- Installed `@upstash/ratelimit` and `@upstash/redis`
- Created `src/lib/rate-limit.ts` with Redis client, limiter definitions (`trackEvento`, `upload`, `passwordReset`), and `checkRateLimit()` helper with graceful fallback
- Created `src/lib/rate-limit-errors.ts` with `createRateLimitResponse()` factory and Spanish paraguayan messages
- Updated `.env.local.example` with `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`

### Task 2: Apply IP-based rate limiting to public tracking endpoints
- Modified `src/app/api/track/route.ts` — added rate limit check at top of POST handler, returns 429 with Spanish message and `Retry-After` header when exceeded, adds `X-RateLimit-*` headers on success
- Modified `src/app/api/vitrina/track/route.ts` — same pattern applied

## Key Files Created/Modified

| File | Action | Purpose |
|------|--------|---------|
| `package.json` | modified | Added `@upstash/ratelimit` and `@upstash/redis` dependencies |
| `src/lib/rate-limit.ts` | created | Redis client, limiters, `checkRateLimit()`, `isAdminRole()` |
| `src/lib/rate-limit-errors.ts` | created | 429 response factory with Spanish messages |
| `src/app/api/track/route.ts` | modified | IP-based rate limiting (100 req/min) |
| `src/app/api/vitrina/track/route.ts` | modified | IP-based rate limiting (100 req/min) |
| `.env.local.example` | modified | Documented Upstash env vars |

## Deviations

None.

## Self-Check

- [x] `npm run build` passes
- [x] All imports resolve correctly
- [x] Graceful fallback when Redis unavailable (`limiter === null` returns `success: true`)

## Next

Plan 11-02 will apply userId-based rate limiting to `/api/upload-r2` with admin/COLABORADORA bypass.
