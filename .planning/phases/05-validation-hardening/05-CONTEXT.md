# Phase 5: Validation & Hardening - Context

**Gathered:** 2026-05-05
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase delivers comprehensive validation and hardening for all v1.0 features before milestone close. It ensures security, performance, and functional acceptance criteria are met with no critical or high pitfalls remaining unaddressed.

**In scope:**
- Complete migration of all remaining `BUSINESS:` throws to `ActionResult<T>` (10 files)
- Security validation: XSS in notification payloads, RBAC scope leak verification, RLS policy drift check
- Performance validation: `EXPLAIN ANALYZE` on analytics queries with composite indexes if needed
- Functional acceptance tests: idempotent lead approval, race condition protection, timezone accuracy for Paraguay
- RBAC regression suite expansion and adaptation for `ActionResult` pattern
- GitHub Actions CI workflow (lint + typecheck + test)

**Out of scope:**
- New features or capabilities (belongs to future milestones)
- Playwright E2E configuration (deferred to v1.1)
- Sentry observability setup (deferred to v1.1)
- Rate limiting implementation (deferred to v1.1)
- Complete migration of all client call sites to direct `ActionResult` handling (deferred — helpers remain)
</domain>

<decisions>
## Implementation Decisions

### BUSINESS Throw Cleanup Scope
- **D-01:** Migrate ALL 10 remaining files containing `BUSINESS:` throws in a single plan. Files: `src/app/app/bienvenida/actions.ts`, `src/app/app/notificacoes/actions.ts`, `src/app/app/perfil/actions.ts`, `src/app/app/progreso/actions.ts`, `src/app/admin/config/notif-push/actions.ts`, `src/app/admin/brindes/actions.ts`, `src/app/admin/minha-conta/actions.ts`, `src/lib/auth/assert-in-group.ts`, `src/lib/user.ts`, plus adaptation of `src/__tests__/security/rbac-regression.test.ts`
- **D-02:** Validation gate: `npm run build`, `npm run lint`, `npm run typecheck`, `npm test` MUST pass before the migration is considered complete
- **D-03:** Adapt RBAC regression tests (3 tests currently expecting `rejects.toThrow`) to verify `result.error` instead, maintaining security coverage

### Security Validation Method
- **D-04:** Checklist-based manual review + existing DOMPurify sanitization. Review all points where template variables enter emails (DOMPurify) and push notifications (plain-text)
- **D-05:** Enforce plain-text-only for OneSignal push in the central `notificarComTemplate` helper — reject HTML tags in push payloads at the helper level
- **D-06:** Security scope for Phase 5: XSS in notifications + RBAC scope leak + RLS policy drift. Document findings in CONTEXT.md checklist section
- **D-07:** RLS policy drift check: compare `scripts/rls-policies.sql` against live database to confirm policies are applied

### Performance Validation Approach
- **D-08:** Automated tests that run `EXPLAIN` and fail on sequential scans for analytics queries
- **D-09:** Query scope: `getMetricasDesempenho` and admin dashboard KPIs only (most performance-critical)
- **D-10:** Time threshold: 500ms max for dashboard/performance analytics queries; simple queries (daily KPIs) should be < 100ms
- **D-11:** If sequential scans found, add composite indexes via Prisma schema (`@@index([...])`) + migration with `npx prisma migrate dev`

### Test Strategy for v1.0
- **D-12:** Expand Vitest unit/integration tests for 3 critical Server Actions: `aprovarLead` (idempotency + race condition), `registrarVenda` (commission calculation, points), `criarMaleta` (stock reservation, price snapshots)
- **D-13:** Race condition test for `aprovarLead`: simulate concurrency with `Promise.all` of 5 simultaneous calls, verify only 1 Supabase Auth user created
- **D-14:** Timezone accuracy test: verify `getMetricasDesempenho` with `range = 'esta_semana'` correctly handles date boundaries in `America/Asuncion` timezone (GMT-4/-3)
- **D-15:** Adapt existing 11 RBAC regression tests for `ActionResult<T>` pattern (replace `rejects.toThrow` with `result.error` checks)

### RBAC Scope Leak Verification
- **D-16:** Expand RBAC regression suite from 11 to 15+ tests covering all Server Actions that access reseller data
- **D-17:** Mock `requireAuth` to return `COLABORADORA` with fixed `colaboradoraId` for tests
- **D-18:** Test must FAIL (red) if an action does not use `assertIsInGroup` or `getResellerScope` when accessing reseller data — forces immediate correction

### CI/CD Quality Gate
- **D-19:** Create `.github/workflows/ci.yml` with basic workflow: `npm run lint`, `npm run typecheck`, `npm test`
- **D-20:** CI triggers: push to `main` + pull requests
- **D-21:** CI environment: Node 20 LTS, ubuntu-latest, npm cache via `actions/setup-node`
- **D-22:** Use GitHub Secrets with staging credentials for integration tests (DATABASE_URL, SUPABASE_URL, etc.)

### the agent's Discretion
- Exact ESLint custom rule details for preventing new `BUSINESS:` throws (apply to `src/app/**/actions*.ts` and `src/lib/user.ts` only)
- Specific mock implementations for Supabase Auth in race condition tests
- Exact composite index definitions based on `EXPLAIN ANALYZE` findings
- CI workflow file naming and organization details
- Specific test cases for RBAC scope beyond the 4 new tests minimum

### Folded Todos
None — no todos were cross-referenced into this phase's scope.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Roadmap
- `.planning/ROADMAP.md` — Phase 5 goal, success criteria, and dependencies
- `.planning/REQUIREMENTS.md` — All v1.0 requirements mapped to phases (TECH, NOTF, LEAD, DESE, DASH, CONF)
- `.planning/PROJECT.md` — Stack, constraints, established patterns, key decisions
- `.planning/STATE.md` — Current project state, accumulated decisions, deferred items

### Prior Phase Context
- `.planning/phases/01-foundation-error-handling-ui-states/01-CONTEXT.md` — ActionResult<T> pattern, safeAction, mapError, sonner, SkeletonCard/EmptyState/ErrorState decisions
- `.planning/phases/02-core-business-notifications-leads-config/02-CONTEXT.md` — Notification templates, lead pipeline, config CRUD decisions

### Security Specifications
- `docs/sistema/SPEC_SECURITY_RBAC.md` — RBAC rules, role definitions, scope enforcement
- `docs/sistema/SPEC_SECURITY_DATA_PROTECTION.md` — Encryption, PII handling, signed URLs
- `scripts/rls-policies.sql` — Live RLS policies for 25 tables

### Error Handling & UI States
- `docs/sistema/SPEC_ERROR_HANDLING.md` — ActionResult<T> format, error catalog, mapError spec
- `docs/sistema/SPEC_SKELETON_EMPTY_STATES.md` — Component specs, usage per screen

### Performance & Caching
- `docs/sistema/SPEC_CACHING_STRATEGY.md` — Cache invalidation, revalidateTag, ISR strategy
- `src/lib/cache/invalidate.ts` — Centralized cache invalidation helper

### Testing
- `docs/sistema/SPEC_TESTING_STRATEGY.md` — Testing approach, Vitest + Playwright plans
- `src/__tests__/security/rbac-regression.test.ts` — Existing 11-test security regression suite

### Notifications
- `docs/revendedoras/SPEC_NOTIFICACOES.md` — Notification types, OneSignal integration
- `src/lib/notifications.ts` — Central notification helper (includes `notificarComTemplate`)
- `src/lib/notifications-server.ts` — DOMPurify sanitization, htmlToPlainText

### Leads
- `docs/admin/SPEC_ADMIN_LEADS.md` — Lead approval flow, server actions, emails

### Codebase Maps
- `.planning/codebase/TESTING.md` — Test structure, mocking strategy, coverage gaps
- `.planning/codebase/CONCERNS.md` — Active technical concerns (force-dynamic, minimal tests, no CI)
- `.planning/codebase/CONVENTIONS.md` — Server Action pattern, Prisma usage, naming conventions

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`src/lib/action-utils.ts`** — Already exports `ActionResult<T>` and `safeAction()`. Used by actions-products.ts and actions-categories.ts
- **`src/__tests__/security/rbac-regression.test.ts`** — 11 existing security tests. Must be adapted for ActionResult pattern
- **`src/lib/notifications-server.ts`** — DOMPurify sanitization already implemented for email HTML
- **`src/lib/user.ts`** — `getCurrentUser()`, `requireAuth()`, `assertIsInGroup()`, `getResellerScope()` — core auth layer to migrate
- **Vitest configuration** — Already set up in `vitest.config.ts` with Next.js/TypeScript environment

### Established Patterns
- **Server Action guard sequence:** Auth → Zod validation → Ownership/scope check → Business logic → Side effects
- **`BUSINESS:` prefix** — Currently distinguishes user-facing errors. After migration, `ActionResult<T>` replaces this
- **Mock pattern for tests:** `vi.mock("@/lib/user", ...)` + `vi.mock("@/lib/prisma", ...)` — already used in existing tests
- **No nested transactions** — Prisma 7 + PrismaPg constraint. All transactional code uses sequential operations or array-form `$transaction([...])`

### Integration Points
- **`src/app/app/layout.tsx`** and **`src/app/admin/layout.tsx`** — Root layouts where Toaster is mounted (from Phase 1)
- **All mutation Server Actions** — Should call `invalidateCache()` after successful writes (from Phase 4)
- **Supabase Edge Functions** — Cron jobs (`check-maleta-prazo`, `marcar-maletas-atrasadas`) use template-aware notifications

### Files with Remaining BUSINESS Throws (10)
1. `src/app/app/bienvenida/actions.ts`
2. `src/app/app/notificacoes/actions.ts`
3. `src/app/app/perfil/actions.ts`
4. `src/app/app/progreso/actions.ts`
5. `src/app/admin/config/notif-push/actions.ts`
6. `src/app/admin/brindes/actions.ts`
7. `src/app/admin/minha-conta/actions.ts`
8. `src/lib/auth/assert-in-group.ts`
9. `src/lib/user.ts`
10. `src/__tests__/security/rbac-regression.test.ts` (tests expecting throws)

</code_context>

<specifics>
## Specific Ideas

- **Security validation checklist items:** (1) Verify DOMPurify is called before any template variable enters email HTML, (2) Verify `notificarComTemplate` rejects HTML in push channel, (3) Verify all admin actions use `assertIsInGroup` or `getResellerScope` when accessing reseller data, (4) Compare `scripts/rls-policies.sql` against `\dp` output in Supabase SQL Editor
- **Performance test queries to EXPLAIN:** `getMetricasDesempenho` (queries `AnalyticsDiario` and `AnalyticsAcesso` with date ranges), admin dashboard KPIs (aggregations over `maleta`, `vendas_maleta`, `reseller` tables)
- **Index candidates to watch for:** `AnalyticsDiario(reseller_id, data)`, `AnalyticsAcesso(reseller_id, data)`, `Maleta(status, data_envio)`, `VendaMaleta(reseller_id, data_venda)`
- **CI workflow filename:** `.github/workflows/ci.yml` — standard GitHub Actions location
- **GitHub Secrets needed:** `DATABASE_URL` (staging), `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **RBAC test expansion:** Add tests for `getResellerById`, `getMaletasByReseller`, `getMetricasDesempenho`, `getDashboardKPIs` with COLABORADORA from different groups

</specifics>

<deferred>
## Deferred Ideas

### Future Phase Ideas
- **Playwright E2E golden paths** — login → maleta → venda → devolução (v1.1)
- **Sentry observability integration** — error tracking, structured logging, performance alerts (v1.1)
- **Rate limiting with Upstash Redis** — sensitive endpoints protection (v1.1)
- **Complete client call site migration** — Replace `useAction`/`handleAction` helpers with direct `result.success` checks in performance-critical paths (ongoing, when each page is modified)
- **Email template branding standardization** — visual identity, Spanish Paraguayan copy (can be a small phase if needed)

### Reviewed Todos (not folded)
- **Fix `rbac-regression.test.ts` expectations** — Deferred from STATE.md (2026-05-04). Will be resolved as part of D-03 in this phase.

</deferred>

---

*Phase: 05-Validation & Hardening*
*Context gathered: 2026-05-05*
