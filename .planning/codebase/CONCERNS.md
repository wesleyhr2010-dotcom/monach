# CONCERNS.md
# Technical Concerns & Debt — NEXT-MONARCA
# Mapped: 2026-05-04

## 🔴 Active / Blocking

### 1. Public pages force-dynamic workaround
**File**: `src/app/page.tsx`, `src/app/catalogo/*`, `src/app/produto/*`
**Issue**: All pages (including public ones) use `export const dynamic = "force-dynamic"` because the Vercel build environment doesn't have a valid `DATABASE_URL`, causing Prisma to fail at prerender time. This disables ISR/static generation for catalog pages — degrading performance significantly.
**Impact**: Every public page render hits the database. No edge caching.
**Fix**: Configure `DATABASE_URL` in Vercel build environment variables, then switch public pages to `export const revalidate = 60`.
**Ref**: `docs/sistema/SPEC_CACHING_STRATEGY.md`, `docs/sistema/SPEC_DEPLOY_STRATEGY.md`

### 2. NotificacaoTemplate editor is dead code
**File**: `src/app/admin/config/notif-push/` (template editor UI) + `src/app/api/cron/check-overdue-maletas/route.ts:39-50`
**Issue**: The template editor in `/admin/config/notif-push` allows admins to edit notification templates and variables. However, the cron job (`check-overdue-maletas`) and other notification generators (`registrarVenda`, `conferirEFecharMaleta`, `submitDevolucao`) ignore the `NotificacaoTemplate` table and send hardcoded Spanish strings instead.
**Impact**: Admin customization of notification text has no effect.
**Fix**: Write `substituirVariaveis(template, contexto)` helper in `src/lib/notifications.ts`; refactor all generators to read from `NotificacaoTemplate` by `tipo`.
**Ref**: `docs/admin/SPEC_ADMIN_ANALYTICS_NOTIFICATIONS.md` §2

### 3. Pipeline de Leads não implementado
**File**: `src/app/admin/leads/page.tsx` (stub), `src/app/seja-revendedora/page.tsx`
**Issue**: The "Seja Revendedora" landing page collects lead data, but the admin lead pipeline (`/admin/leads`) is not implemented. Leads may be stored but the review/approval workflow is missing.
**Impact**: New reseller recruitment is manually managed.
**Fix**: Implement lead pipeline per `docs/admin/SPEC_ADMIN_LEADS.md`.

### 4. Dashboard admin sem KPIs implementados
**File**: `src/app/admin/` (no dashboard page found)
**Issue**: The admin dashboard with global KPIs is not yet implemented.
**Ref**: `docs/admin/SPEC_ADMIN_DASHBOARD.md`

## 🟡 Medium Priority Debt

### 5. Minimal test coverage
**Files**: All `src/app/app/`, `src/app/admin/`, `src/components/`
**Issue**: Most features have no unit or integration tests. The security regression suite (11 tests) and validator tests exist, but mutating Server Actions, page components, API routes, and complex UI are largely untested.
**Risk**: Regressions from refactoring or new features will not be caught automatically.
**Fix**: Add Vitest unit tests for critical Server Actions; add Playwright E2E for golden paths.
**Ref**: `docs/sistema/SPEC_TESTING_STRATEGY.md`

### 6. Legado cron em route handlers
**File**: `src/app/api/cron/` (if remaining handlers exist post-migration)
**Issue**: Cron jobs are being migrated from Next.js Route Handlers to Supabase Edge Functions. Some legacy handlers may still exist alongside the new Edge Functions, causing confusion about which is authoritative.
**Fix**: Confirm all cron jobs are in Edge Functions, remove any remaining route handlers.
**Ref**: `docs/sistema/SPEC_CRON_JOBS.md`

### 7. Email template branding inconsistente
**Files**: `src/lib/email-templates/*.ts` (6 templates)
**Issue**: Email templates exist functionally but have inconsistent visual identity and copy. Some may still be in Portuguese or have placeholder content.
**Impact**: Professional appearance of transactional emails.
**Fix**: Standardize visual identity, Spanish Paraguayan copy, and reusable components per `docs/sistema/SPEC_EMAILS.md`.

### 8. Error handling não centralizado
**Files**: Server actions spread across `src/app/admin/actions-*.ts`, `src/app/app/actions-revendedora.ts`
**Issue**: Error handling patterns are applied manually in each action. `ActionResult<T>` exists in `action-utils.ts` but consistency of application is uncertain.
**Fix**: Implement centralized error handling per `docs/sistema/SPEC_ERROR_HANDLING.md`.

### 9. Skeleton / empty states inconsistentes
**Files**: Loading files across `src/app/app/*/loading.tsx`, `src/app/admin/*/loading.tsx`
**Issue**: Loading skeletons and empty states were recently improved but may still be inconsistent across all pages.
**Ref**: `docs/sistema/SPEC_SKELETON_EMPTY_STATES.md`

## 🟢 Low Priority / Future

### 10. Domínio ainda não migrado para produção
**Issue**: App likely still running on Vercel preview URL or temporary domain, not `monarcasemijoyas.com.py`.
**Checklist exists**: `docs/sistema/SPEC_DOMAIN_MIGRATION.md` covers DNS, Supabase Auth, Brevo, R2, OneSignal, OAuth, PWA.
**Note**: Auth callback already validated on preview domain.

### 11. Sem observabilidade
**Issue**: No Sentry integration, no structured logging, no performance alerts.
**Risk**: Production errors are invisible until users report them.
**Ref**: `docs/sistema/SPEC_LOGGING_MONITORING.md`

### 12. Sem rate limiting
**Issue**: Sensitive endpoints (auth, Server Actions, upload) have no rate limiting.
**Fix**: Implement Upstash Redis rate limiting per `docs/sistema/SPEC_SECURITY_API_ENDPOINTS.md`.

### 13. Desempenho individual da revendedora
**File**: `src/app/app/vendas/` (partial?)
**Issue**: Individual analytics/performance screen for revendedoras is not implemented.
**Ref**: `docs/revendedoras/SPEC_DESEMPENHO.md`

### 14. Vitrina pública não implementada
**File**: `src/app/` (no `/vitrina/[slug]` route)
**Issue**: Public reseller showcase page (`/vitrina/[slug]`) for SEO and sharing not yet built.
**Ref**: `docs/revendedoras/SPEC_VITRINE_PUBLICA.md`

### 15. Configurações globais admin
**Issue**: Global settings page for commission tiers, level thresholds, and contract terms not implemented.
**Ref**: `docs/admin/SPEC_ADMIN_CONFIG.md`

## ⚠️ Architecture Concerns

### Prisma 7 + PrismaPg transaction constraint
**Impact**: Cannot use nested async transactions anywhere. All transactional code must use sequential operations with manual compensation OR array-form `$transaction([...])`. This is an ongoing constraint — any new feature requiring multi-table atomicity must follow this pattern carefully.

### Supabase RLS as tertiary (not primary) defense
**Impact**: RLS exists in `scripts/rls-policies.sql` but its application to the live database and correctness of all 23 table policies is not tested automatically. If policies drift, the primary defense (Server Action guards) must not fail.

### Upcoming: Capacitor migration consideration
**Issue**: If the business decides to publish as native iOS/Android (see `docs/sistema/SPEC_CAPACITOR_MIGRATION.md`), significant refactoring of the PWA layer will be needed. Not imminent, but new PWA features should be built with eventual Capacitor compatibility in mind (avoid web-only APIs without fallbacks).

### SCHEMA_VERSION in prisma.ts
**File**: `src/lib/prisma.ts:11`
**Issue**: Schema version is a hardcoded string (`"2026-04-24-notificacao-templates-v3"`). If forgotten to update after a schema change, the global singleton won't be invalidated between deploys, potentially causing stale client issues.

---
*Mapped: 2026-05-04*
