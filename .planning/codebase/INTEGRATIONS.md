# External Integrations

**Analysis Date:** 2026-05-04

## APIs & External Services

**Push Notifications:**
- OneSignal — web push notifications for resellers (PWA)
  - SDK/Client (browser): `react-onesignal` via `src/components/onesignal/OneSignalWrapper.tsx`
  - SDK/Client (server): direct `fetch` to `https://api.onesignal.com/notifications` in `src/lib/onesignal-server.ts`
  - Auth (server): `Authorization: Key ${ONESIGNAL_REST_API_KEY}`
  - Auth (browser): `NEXT_PUBLIC_ONESIGNAL_APP_ID`
  - Targeting: `external_id` via `include_aliases` (maps to Supabase `auth_user_id`)
  - Push preference per-user stored in `NotificacaoPreferencia` table; checked in `src/lib/notifications.ts` before sending
  - Also used from Supabase Edge Functions (`check-maleta-prazo`, `marcar-maletas-atrasadas`) using Deno env vars

**Email:**
- Brevo (Sendinblue) — transactional email only (NOT auth emails; those come from Supabase Auth)
  - SDK: `@getbrevo/brevo` v5; client in `src/lib/emails.ts`
  - Auth: `BREVO_API_KEY`
  - Sender: configured via `BREVO_FROM_EMAIL` + `BREVO_FROM_NAME`
  - Templates: `src/lib/email-templates/` (7 templates: `acerto-confirmado`, `candidatura-aprovada`, `candidatura-rechazada`, `convite-usuario`, `documento-aprovado`, `documento-pendente`, `documento-rejeitado`)
  - Use cases: welcome, maleta notifications, document approval/rejection, reseller invitation

**WhatsApp:**
- Direct link generation only (no SDK)
  - Helper: `buildWhatsAppUrl()` in `src/lib/config.ts`
  - Pattern: `https://wa.me/{phone}?text={encoded_message}`
  - No API key required; opens WhatsApp natively

## Data Storage

**Databases:**
- Supabase PostgreSQL — primary relational database
  - Runtime connection: `DATABASE_URL` (PgBouncer transaction mode, port 6543)
  - Migration connection: `DIRECT_URL` (session mode, port 5432)
  - Client: Prisma 7 via `@prisma/adapter-pg` + `pg.Pool`; singleton in `src/lib/prisma.ts`
  - Pool config: `max: 10`, `idleTimeoutMillis: 30000`, `connectionTimeoutMillis: 5000`
  - ORM client generated to `src/generated/prisma/`
  - Schema: `prisma/schema.prisma`
  - Encryption: AES-256-GCM applied transparently to `dadosBancarios` fields (`alias_ci_ruc`, `alias_valor`, `cuenta`, `ci_ruc`) via Prisma extension in `encrypt-middleware.ts`; key: `ENCRYPTION_KEY`

**File Storage:**
- Cloudflare R2 — product images and reseller avatars
  - SDK: `@aws-sdk/client-s3` (S3-compatible API); client factory in `src/lib/r2.ts`
  - Auth: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`
  - Bucket: `R2_BUCKET_NAME`
  - Public CDN: `NEXT_PUBLIC_R2_PUBLIC_DOMAIN` (configured as `cdn.monarcasemijoyas.com.py` or `images.monarcasemijoyas.com.py`)
  - Upload helper: `src/lib/upload.ts` — converts images to WebP via `sharp` before upload
  - Presigning: `@aws-sdk/s3-request-presigner` available for presigned URL generation
  - Next.js image remote patterns: `cdn.monarcasemijoyas.com.py`, `images.monarcasemijoyas.com.py`, `pub-933b2a69d9e34d719dd55ee2dcfa0a35.r2.dev`

**Caching:**
- Upstash Redis — planned for rate limiting (optional, not yet fully implemented)
  - Env vars: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
  - Reference: `SPEC_SECURITY_API_ENDPOINTS.md`

## Authentication & Identity

**Auth Provider:**
- Supabase Auth — JWT-based authentication
  - Browser client: `createBrowserClient()` in `src/lib/supabase.ts` (anon key only)
  - SSR client: `createSupabaseSSRClient()` in `src/lib/supabase-ssr.ts` (cookie-based via `@supabase/ssr`)
  - Service role client: `createServerClient()` in `src/lib/supabase.ts` (admin operations only, never browser)
  - Auth token refresh: handled in middleware (`src/lib/middleware-auth.ts`) — middleware does NOT query the database
  - User resolution: `getCurrentUser()` in `src/lib/user.ts` — wrapped in `React.cache()` for per-request deduplication; resolves Supabase JWT user to Prisma `Reseller` record
  - Guard: `requireAuth(allowedRoles?)` in `src/lib/user.ts` — mandatory for all Server Actions; throws `BUSINESS:` error messages
  - RBAC roles: `ADMIN`, `COLABORADORA`, `REVENDEDORA` (enum `UserRole` in Prisma schema)
  - Auto-link: resellers can be auto-linked by email on first login (REVENDEDORA role only; ADMIN/COLABORADORA require explicit admin linking)
  - Password reset: handled via Supabase auth callback at `/auth/callback`; middleware intercepts `?code=` and `?token_hash=` on root path and redirects to `/auth/callback`

**Security Layers:**
- Middleware (`src/middleware.ts` → `src/lib/middleware-auth.ts`): JWT refresh + unauthenticated redirect
- Layout-level: role/`is_active` check via `getCurrentUser()` cached call
- Server Action-level: `requireAuth()` guard
- Database-level: Supabase RLS policies

## Monitoring & Observability

**Error Tracking:**
- Sentry — optional, not currently active in codebase
  - Env vars: `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`
  - No Sentry SDK found in `package.json` dependencies (planned)

**Logs:**
- `console.error` / `console.warn` — used throughout with PII sanitization
- PII sanitizer: `src/lib/errors/sanitize-log.ts` — used in `src/lib/notifications.ts` and other server-side modules
- Data protection utilities: `src/lib/data-protection/` (document access, mask utils, vitrina sanitizer)
- Prisma logs: `["warn", "error"]` in development, `["error"]` in production

## CI/CD & Deployment

**Hosting:**
- Vercel — production deployment
  - Production domain: `https://monarcasemijoyas.com.py`
  - Preview domain: `https://monarca-six.vercel.app` (current active preview)
  - Deploy trigger: push to `main` branch
  - Git remote: `client` → `https://github.com/monarcasemijoyas/monarca.git`

**Supabase Edge Functions:**
- Runtime: Deno (TypeScript)
- Functions directory: `supabase/functions/`
- Deployed functions:
  - `check-maleta-prazo` — checks maleta deadlines (D-3 and D-1 notifications) and triggers push via OneSignal
  - `marcar-maletas-atrasadas` — marks overdue maletas
  - `agrega-analytics-diario` — daily analytics aggregation
  - `_shared/` — shared utilities across functions (notifications helper)
- Project ref: `amlwwakxpungeqpiyxwr`
- Config: `supabase/config.toml`

**CI Pipeline:**
- Not detected (no GitHub Actions or similar config found)

## Environment Configuration

**Required env vars (build will fail without these):**
- `DATABASE_URL` — PgBouncer connection string (transaction mode)
- `DIRECT_URL` — Direct PostgreSQL connection (migration only)
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (server only)
- `R2_ACCOUNT_ID` — Cloudflare account ID
- `R2_ACCESS_KEY_ID` — R2 API token access key
- `R2_SECRET_ACCESS_KEY` — R2 API token secret
- `R2_BUCKET_NAME` — R2 bucket name
- `NEXT_PUBLIC_R2_PUBLIC_DOMAIN` — R2 public CDN domain
- `NEXT_PUBLIC_ONESIGNAL_APP_ID` — OneSignal App ID
- `ONESIGNAL_REST_API_KEY` — OneSignal REST API key (server only)
- `BREVO_API_KEY` — Brevo API key
- `BREVO_FROM_EMAIL` — Verified sender email
- `ENCRYPTION_KEY` — AES-256 key, 32 bytes hex (64 chars) for banking data encryption
- `NEXT_PUBLIC_SITE_URL` — Base URL (no trailing slash)

**Optional env vars:**
- `BREVO_FROM_NAME` — Sender display name (default: "Monarca Semijoyas")
- `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` — Sentry error tracking
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` — Rate limiting

**Secrets location:**
- Development: `.env.local` (gitignored)
- Production/Preview: Vercel Environment Variables dashboard
- Edge Functions: Supabase project secrets (Deno.env)
- Reference template: `SPEC_ENVIRONMENT_VARIABLES.md` (no `.env.example` committed at root; docs serve as reference)

## Webhooks & Callbacks

**Incoming:**
- `/auth/callback` — Supabase Auth callback route (handles OAuth codes and password reset token hashes); middleware redirects `/?code=` and `/?token_hash=` to this route
- Supabase Edge Functions — invoked on schedule (cron) by Supabase scheduler (not HTTP webhooks from external services)

**Outgoing:**
- OneSignal REST API (`https://api.onesignal.com/notifications`) — push notification dispatch from both Next.js server (`src/lib/onesignal-server.ts`) and Supabase Edge Functions
- Brevo transactional email API — email dispatch from Next.js server (`src/lib/emails.ts`)
- WhatsApp deep links — client-side only, no server-to-server calls

---

*Integration audit: 2026-05-04*
