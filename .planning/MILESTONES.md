# Milestones — NEXT-MONARCA

## v1.0 — Operação e Visibilidade

**Started:** 2026-05-04
**Shipped:** 2026-05-05
**Status:** ✅ ARCHIVED

**Goal:** Fechar o ciclo operacional que está 80% pronto, finalizar as telas do app revendedora e dar visibilidade real para admin e revendedoras.

**Phases:** 5 (1-5) | **Plans:** 19 | **Tests:** 229 passing

**Key Accomplishments:**
1. Error handling infrastructure — `ActionResult<T>`, `safeAction()`, `mapError()` with Prisma error mapping; `BusinessError` class; zero `BUSINESS:` throws in 9 files
2. Notification template system — `substituirVariaveis()` with whitelist, DOMPurify sanitization, admin editor with variable chips, wired into cron jobs and Server Actions
3. Lead pipeline — landing submission, admin approval/rejection, Supabase Auth creation, Brevo emails, idempotency, race-protected transactions
4. Admin config — CRUD for commission tiers, gamification levels, and contracts (R2 PDF upload); contract integration in onboarding
5. Reseller performance dashboard — `/app/desempeno` with metric cards, period filtering, recharts bar chart, top 10 products
6. Admin dashboard polish — period filter (7d/30d/3m/12m), skeleton loading states, RBAC scope enforcement
7. Build optimization — ISR (`revalidate = 60`) on public pages, centralized `invalidateCache` helper wired into 14 mutation actions
8. Security validation — 12 XSS tests, OneSignal plain-text enforcement, RLS policy verification (10+ policies)
9. Performance validation — 34 composite index presence tests, brace-aware Prisma schema parser
10. Critical acceptance tests — 19 tests covering timezone, commission, stock movement, lead idempotency
11. RBAC scope leak suite — 23 isolation tests documenting horizontal/vertical boundaries, all passing
12. CI/CD quality gate — GitHub Actions workflow with lint, typecheck, test, and build gates

**Stats:**
- Commits: 33 (2026-05-04 → 2026-05-05)
- Files changed: 124 (+8,839 / −909)
- TypeScript LOC: ~150,499
- Timeline: ~21.5 hours

**Archive:**
- `.planning/milestones/v1.0-ROADMAP.md`
- `.planning/milestones/v1.0-REQUIREMENTS.md`

**Tag:** `v1.0`

---

## v1.1 — Visibilidade e Polimento

**Started:** 2026-05-05
**Status:** 🔄 IN PROGRESS

**Goal:** Lançar vitrina pública por revendedora com SEO, padronizar comunicação visual dos emails, e expandir analytics operacional no admin.

**Phases:** 2/3 complete | **Plans:** 7/7 complete

**Target Features:**
1. ✅ Vitrina pública `/vitrina/[slug]` com SEO e tracking — Phase 6 concluída (2026-05-05)
2. ✅ Padronizar layout/branding dos emails transacionais — Phase 7 concluída (2026-05-06)
3. 🔄 Analytics agregados admin além de campanhas push — Phase 8 pendente

---

## Next Milestone

TBD — v1.2 (Produção e Qualidade: E2E, Observabilidade, Rate Limiting)
