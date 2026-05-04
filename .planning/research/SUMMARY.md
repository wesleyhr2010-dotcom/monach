# Project Research Summary

**Project:** NEXT-MONARCA
**Domain:** Plataforma de gestão de revendedoras de semijoias (Monarca — Paraguai)
**Milestone:** v1.0 — Operação e Visibilidade
**Researched:** 2026-05-04
**Confidence:** HIGH

---

## Executive Summary

NEXT-MONARCA v1.0 is a **brownfield enhancement milestone** for an operational Next.js + Prisma + Supabase platform managing jewelry resellers in Paraguay. The milestone adds seven feature areas — notification template engine, reseller analytics dashboard, admin KPI dashboard, lead approval pipeline, global admin configuration, centralized error handling, and build optimization — to an already mature codebase with 23 tables, validated RBAC, and an active maleta (consignment) lifecycle.

Research confirms the existing architecture is well-structured for these additions. **No new infrastructure is required** — all database tables already exist, and only four new npm packages are needed. The main work is **wiring existing stubs** (leads actions, config pages), **refactoring hardcoded notification strings** to use the existing `NotificacaoTemplate` table, **aggregating existing analytics data** into new views, and **standardizing error handling** across the codebase. The recommended approach is to establish foundational patterns first (error handling, skeleton states), then build core business features (notifications, leads, config), then layer on visibility (analytics dashboards), and finally optimize the build.

The key risks are **operational, not architectural**: XSS via unsanitized template variables, analytics queries scanning large event tables, race conditions in lead approval creating duplicate users, and partial migration of the `ActionResult` pattern leaving the codebase in an inconsistent state. All of these are preventable with the guards identified in PITFALLS.md.

---

## Key Findings

### Recommended Stack

Only **four new runtime dependencies** (plus one resolver package) are required for the entire milestone. The existing stack — Next.js 16, React 19, Prisma 7, Supabase Auth, Tailwind v4, OneSignal, Brevo — remains unchanged. Build optimization is purely configuration (Vercel env vars + ISR), requiring zero new packages.

**New dependencies:**
- **recharts `^3.8.1`** — Bar/line/donut charts for reseller and admin analytics. React-native, tree-shakeable, compatible with React 19. Must be wrapped in `'use client'` components inside `<Suspense>`.
- **sonner `^2.0.7`** — Toast notifications for the `ActionResult` pattern. Replaces ad-hoc inline toast divs in every admin page. Mount once per root layout (PWA + Admin).
- **react-hook-form `^7.75.0` + @hookform/resolvers `^5.2.2`** — Complex forms (lead approval modal, commission tier editor, contract upload). Bridges with existing Zod v4 schemas to avoid validation duplication.
- **date-fns `^4.1.0`** — Time-range calculations for analytics, Paraguay timezone (`America/Asuncion`) handling, cron job date math. Tree-shakeable and lighter than moment or luxon.

**Explicitly skipped:** Zustand/Redux (Server Components + URL state suffice), Handlebars/Mustache (7 templates with scalar substitution — regex is enough), Chart.js/Tremor (recharts covers all needs), Formik (RHF is lighter and has better Zod integration).

See [STACK.md](./STACK.md) for full integration notes, version confidence, and feature-to-stack mapping.

### Feature Priorities

**Must-have (table stakes):**
- **Error handling centralizado** (`ActionResult<T>` + `mapError` + skeleton/empty/error states) — Foundation for all other features. Without this, every new feature adds technical debt.
- **Build optimization** — Remove `force-dynamic` from public pages, configure `DATABASE_URL` in Vercel build step, adopt ISR (`revalidate = 60`). Low effort, high impact on performance.
- **Admin config (commission tiers + contracts)** — Unblocks autonomous admin operation. Without editable tiers, every commission adjustment requires a developer.
- **Notification template engine** — Connects the existing editor UI to the rest of the system. Without it, the editor remains dead code.
- **Lead pipeline** — Completes the reseller acquisition funnel. Landing page exists but cannot convert to accounts without approval flow.
- **Admin dashboard enhancements** — Gives executive visibility. Builds on existing dashboard (~70% complete); adds period filters, product ranking, and docs integration.
- **Reseller analytics (`/app/desempenho`)** — Closes the visibility loop for resellers. Depends on existing `AnalyticsDiario` cron; data already exists, needs aggregation and UI.

**Should-have (differentiators):**
- Export CSV from admin dashboard
- Commission simulator ("If you sell X, you earn Y")
- Template preview with variable substitution
- Error boundary with support link

**Defer to v1.1+:**
- Real-time analytics with WebSocket
- Full CRM for leads
- Drag-and-drop customizable dashboard
- Sentry integration and structured logging
- Playwright E2E tests
- Rate limiting per endpoint

See [FEATURES.md](./FEATURES.md) for complete dependency graph, complexity assessment (S/M/L), and anti-features to avoid.

### Architecture Notes

The v1.0 features integrate through **existing architectural seams**: Prisma ORM for data, Server Actions for mutations, `React.cache()` for deduplication, and defense-in-depth auth (middleware + guard + RLS). **No new database tables are required** — all schemas (`NotificacaoTemplate`, `RevendedoraLead`, `AnalyticsAcesso`, `AnalyticsDiario`, `CommissionTier`, `Contrato`, `NivelRegra`) already exist.

**Major integration points:**
1. **Notification Template Engine** — New helper `substituirVariaveis()` + `notificarComTemplate()` in `src/lib/notifications/template-engine.ts`. Refactors 5+ cron jobs and server actions from hardcoded strings to DB-driven templates.
2. **Lead Pipeline** — Rewrites broken `actions-leads.ts` to use correct `revendedora_leads` schema. Approval flow is a 5-step transaction (check lead → create Supabase Auth user → create `Reseller` → update lead → send Brevo email) requiring idempotency guards.
3. **Analytics** — Reseller dashboard (`/app/desempenho`) is a new client-component page aggregating `AnalyticsAcesso`, `AnalyticsDiario`, and `VendaMaleta`. Admin dashboard builds on existing `actions-dashboard.ts` (~70% complete).
4. **Admin Config** — Stubs at `/admin/commission-tiers` and `/admin/contratos` need full CRUD. Contract upload reuses existing R2 pattern.
5. **Error Handling + UI States** — Cross-cutting migration of all Server Actions to `safeAction()` + `ActionResult<T>`, plus creation of reusable `SkeletonCard`, `EmptyState`, and `ErrorState` components.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for full data flow diagrams, file modification lists, RBAC route matrix, and integration risk assessment.

### Watch Out For

Top pitfalls that could derail the milestone:

1. **Template variable injection (XSS)** — `substituirVariaveis()` does direct string replacement without sanitization. If a template variable contains HTML/JS, it leaks into push/email payloads. **Prevention:** Whitelist allowed variables per type; escape HTML for email; use plain-text only for OneSignal `contents`.
2. **Analytics N+1 / table scan** — Querying `AnalyticsAcesso` (raw events) for ranges > 7 days causes sequential scans and Vercel timeouts. **Prevention:** Use `AnalyticsDiario` (pre-aggregated) for all ranges > 7 days; add composite index `(reseller_id, created_at, tipo_evento)`.
3. **Lead approval race condition** — Double-submit or concurrent approval creates duplicate Supabase Auth users or orphaned `Reseller` records. **Prevention:** Re-read lead status at start of action; use optimistic lock (`status = 'pendente'` in where clause); disable button during `isPending`; implement compensating deletion if `Reseller` creation fails.
4. **Partial ActionResult migration** — Some actions return `ActionResult` while others still throw `BUSINESS:` errors, breaking UI consumption. **Prevention:** Migrate by **module**, not by action. Use `grep -r "throw new Error.*BUSINESS"` as a gate before marking any phase complete.
5. **Removing `force-dynamic` without `DATABASE_URL` in Vercel build** — Build fails during static generation if Prisma cannot connect. **Prevention:** Configure `DATABASE_URL` in Vercel env vars (Production + Preview + Development) **before** touching any `force-dynamic` declarations.
6. **Editing commission tiers affects closed maletas** — Business rule: closed maleta values are immutable snapshots. If a dashboard query JOINs with current `CommissionTier`, recalculated commissions will be wrong. **Prevention:** Never recalculate `valor_comissao` for `status = 'concluida'`; always use the snapshot field.

See [PITFALLS.md](./PITFALLS.md) for full descriptions, detection strategies, and phase-specific warnings.

---

## Implications for Roadmap

### Phase 1: Foundation — Error Handling & UI States
**Rationale:** All other features depend on standardized error handling and reusable UI state components. Building features without this foundation creates immediate technical debt.
**Delivers:**
- `ActionResult<T>` migration for high-traffic action files (`actions-revendedora.ts`, `actions-maletas.ts`, `actions-leads.ts`)
- Reusable `SkeletonCard`, `EmptyState`, `ErrorState` components in `src/components/ui/`
- `mapError()` helper expanded with Prisma error codes (`P2002`, `P2025`, `P2014`)
- Cache invalidation helper extracted from `SPEC_CACHING_STRATEGY.md`
**Addresses:** Error handling + skeleton/empty/error states (FEATURES.md §2.6, §2.7)
**Avoids:** CP-6 (partial migration), LP-3 (raw Prisma messages in toasts)
**Research flags:** Standard patterns — skip deep research. Pattern is well-documented in SPEC.

### Phase 2: Core Business Logic — Notifications, Leads & Config
**Rationale:** These three features unblock operational autonomy. Notification engine enables all automated messages; lead pipeline completes the acquisition funnel; admin config removes the developer bottleneck for commission adjustments. They share the dependency on Phase 1's error handling pattern.
**Delivers:**
- `src/lib/notifications/template-engine.ts` (variable substitution + template lookup)
- Refactored cron jobs (`check-maleta-prazo`, `marcar-maletas-atrasadas`) reading from `NotificacaoTemplate`
- Full `/admin/leads` UI with approve/reject modals, Brevo email integration, and idempotency guards
- Full `/admin/commission-tiers` and `/admin/contratos` CRUD with R2 PDF upload
- Updated gamification level editor at `/admin/gamificacao`
**Uses:** react-hook-form, @hookform/resolvers, sonner, date-fns (STACK.md §2.2–2.4)
**Avoids:** CP-1 (XSS via whitelist), CP-3 (race condition via locks), HP-1 (cron fallback hierarchy), HP-4 (email failure handling), MP-4 (spam via honeypot), MP-5 (contract versioning)
**Research flags:** Leads need no additional research (Brevo already configured). Notification engine is straightforward regex — skip research.

### Phase 3: Visibility & Analytics — Reseller & Admin Dashboards
**Rationale:** Data already exists; this phase is about aggregation and presentation. It depends on Phase 1's skeleton components and Phase 2's config data (tiers, commissions).
**Delivers:**
- `/app/desempenho` with metric cards (value + trend %), recharts bar chart of daily visits, top 10 products list, and period selector
- Enhanced `/admin` dashboard with time range filter, product ranking, export CSV, and docs integration
- `getMetricasDesempenho()` Server Action with `date-fns` range math
**Uses:** recharts, date-fns (STACK.md §2.1, §2.4)
**Avoids:** CP-2 (N+1 via AnalyticsDiario for ranges > 7d), HP-2 (scope leak via `getResellerScope` in every query), HP-3 (timeout via pre-aggregated data), MP-2 (timezone mismatch via `AT TIME ZONE 'America/Asuncion'`)
**Research flags:** Admin dashboard queries may need performance research at scale (indexes, materialized views). Reseller analytics uses standard recharts — skip research.

### Phase 4: Build Optimization & Polish
**Rationale:** Independent of feature logic, but must be validated against all pages. Placing last ensures we test optimization on the complete feature set.
**Delivers:**
- Audit and remove `force-dynamic` from public pages (`/`, `/catalogo`, `/produto/[slug]`, `/seja-revendedora`)
- Configure `DATABASE_URL` in Vercel build environment (Production, Preview, Development)
- Adopt ISR (`revalidate = 60`) on public pages; keep `force-dynamic` only on authenticated pages
- Add `revalidateTag`/`revalidatePath` to all mutation Server Actions
- Apply skeleton/error states to all remaining routes
**Avoids:** CP-4 (build failure without DB_URL), HP-6 (ISR staleness via invalidation), MP-6 (Prisma client desync via `postinstall`)
**Research flags:** Standard Next.js patterns — skip research. SPEC_CACHING_STRATEGY.md already details the approach.

### Phase 5: Validation & Hardening
**Rationale:** A dedicated QA and hardening phase prevents shipping known pitfalls. The detection checklist from PITFALLS.md becomes the acceptance criteria.
**Delivers:**
- Security validation: XSS scan on notification logs, scope-leak test for COLABORADORA
- Performance validation: `EXPLAIN ANALYZE` on analytics queries, Lighthouse CLS check
- Functional validation: double-approve lead test, timezone accuracy test, cache invalidation test
- Error handling validation: grep for `throw new Error.*BUSINESS` returns empty
**Avoids:** All critical and high pitfalls (CP-1 through CP-6, HP-1 through HP-6)
**Research flags:** May need brief research on Supabase slow query logs if performance issues are found.

### Phase Ordering Rationale

- **Foundation first:** Error handling and UI states are cross-cutting. Every phase that follows must adopt `ActionResult` and use skeleton components.
- **Core business second:** Notifications, leads, and config have the highest operational impact and unblock admin autonomy. They also have the most complex pitfalls (race conditions, XSS, email failures) that are easier to debug when tackled together.
- **Visibility third:** Dashboards are read-only and depend on data produced by the core features. They also have the highest query complexity (aggregations, JOINs), so it's safer to build them after the data model is stable.
- **Optimization fourth:** Build changes affect all pages. Doing this last ensures the full surface area is known and tested.
- **Hardening last:** A dedicated validation phase catches pitfalls that slip through feature development. The detection checklist from PITFALLS.md is the acceptance criteria.

### Research Flags

**Needs deeper research during planning:**
- **Phase 3 (Admin Dashboard):** Query performance at scale. Ranking and KPIs may require indexes or materialized views if the dataset grows. Recommend running `EXPLAIN ANALYZE` during planning.
- **Phase 5 (Validation):** If slow queries are detected, research Supabase query optimization and connection pooling.

**Standard patterns (skip research-phase):**
- **Phase 1 (Error Handling):** Well-documented in `SPEC_ERROR_HANDLING.md` and `SPEC_SKELETON_EMPTY_STATES.md`.
- **Phase 2 (Notifications + Leads + Config):** Brevo already configured; template substitution is regex; lead flow is standard CRUD + email.
- **Phase 4 (Build Optimization):** Standard Next.js ISR + Vercel env vars; `SPEC_CACHING_STRATEGY.md` and `SPEC_DEPLOY_STRATEGY.md` already detail the approach.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | **HIGH** | All 4 new packages verified via GitHub releases. React 19 compatibility confirmed. No blocking issues. |
| Features | **HIGH** | Features map 1:1 to existing SPECs. Dependencies between features are clear. Table stakes are well-defined. |
| Architecture | **HIGH** | Based on direct codebase inspection (23 tables, existing actions, RBAC). No new infrastructure needed. All schemas already exist. |
| Pitfalls | **HIGH** | Six critical and six high pitfalls identified with specific prevention strategies. Detection checklist provided. |

**Overall confidence:** HIGH

### Gaps to Address

| Gap | How to Handle |
|-----|---------------|
| **Recharts + React 19 hydration warnings** | Monitor during Phase 3 development. If warnings appear, wrap charts in a client-only boundary. Fallback: use `dynamic import` with `ssr: false`. |
| **Analytics query performance at scale** | Run `EXPLAIN ANALYZE` on `getMetricasDesempenho` and admin dashboard queries during Phase 3 planning. Add indexes if `seq scan` is detected. |
| **OneSignal external ID mismatch** | Verify during Phase 5 that cron and client use the same ID (`auth_user_id` vs `reseller_id`). Fix if mismatch is found. |
| **Contract versioning in R2** | Decide during Phase 2 planning whether to implement versioned uploads (new R2 key per version) or simple replacement. MP-5 recommends versioning. |
| **Zod 4 + @hookform/resolvers v5.2.1 type mismatch** | Ensure v5.2.2 is installed (fixes Zod 4 `.pipe()` compatibility). Verify in `package.json` during Phase 2. |

---

## Sources

### Primary (HIGH confidence)
- `docs/admin/SPEC_ADMIN_LEADS.md` — Lead approval flow, email integration
- `docs/admin/SPEC_ADMIN_DASHBOARD.md` — KPIs, scope filtering, queries
- `docs/admin/SPEC_ADMIN_CONFIG.md` — Commission tiers, contract upload, gamification levels
- `docs/admin/SPEC_ADMIN_ANALYTICS_NOTIFICATIONS.md` — Notification template schema, cron integration
- `docs/revendedoras/SPEC_DESEMPENHO.md` — Reseller analytics, recharts, time ranges
- `docs/sistema/SPEC_ERROR_HANDLING.md` — `ActionResult<T>`, `mapError`, message catalog
- `docs/sistema/SPEC_SKELETON_EMPTY_STATES.md` — Skeleton, empty, error state patterns
- `docs/sistema/SPEC_CACHING_STRATEGY.md` — ISR, `revalidateTag`, force-dynamic rules
- `docs/sistema/SPEC_DEPLOY_STRATEGY.md` — Build configuration, zero-downtime deploy

### Secondary (MEDIUM confidence)
- GitHub Releases — recharts v3.8.1, sonner v2.0.7, react-hook-form v7.75.0, resolvers v5.2.2, date-fns v4.1.0
- Current codebase audit — `package.json`, `prisma/schema.prisma`, `src/lib/action-utils.ts`, `src/lib/notifications.ts`, `src/app/admin/actions-*.ts`

### Tertiary (LOW confidence)
- Recharts React 19 compatibility — No blocking issues reported as of May 2026, but monitor for hydration warnings in dev

---

*Research completed: 2026-05-04*
*Synthesized from: STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md*
*Ready for roadmap: yes*
