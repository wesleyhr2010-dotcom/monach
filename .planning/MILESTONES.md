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
**Shipped:** 2026-05-06
**Status:** ✅ ARCHIVED

**Goal:** Lançar vitrina pública por revendedora com SEO, padronizar comunicação visual dos emails, e expandir analytics operacional no admin.

**Phases:** 3 (6-8) | **Plans:** 10 | **Tests:** 272 passing

**Key Accomplishments:**
1. Vitrina pública por revendedora — ISR page `/vitrina/{slug}` com SEO dinâmico, tracking anônimo, página de detalhe do produto, carrinho localStorage e checkout via WhatsApp (17 requisitos VITR)
2. Sistema de email branding — wrapper `renderEmailBase()` com dark mode, 7 templates transacionais refatorados com fallback plaintext, copy espanhol paraguaio, e templates Supabase Auth com sync via Management API + CI/CD
3. Analytics de vitrina no admin — 5 KPIs, gráfico temporal de visitas, ranking de revendedoras por engajamento, export CSV sem PII, com escopo RBAC (6 requisitos ANLT)
4. RLS policies anônimas — permite leitura pública de maletas e itens sem autenticação, com validação contra enumeração de produtos
5. Tracking pipeline — cookie `mnrc_vid` (30 dias) + endpoint `/api/vitrina/track` com whitelist de eventos e bot detection, integrado ao dashboard admin
6. Test coverage expandida — 43 novas assertions dedicadas a email (23 unit + 20 regressão), mantendo 272 assertions totais passando

**Stats:**
- Commits: 34 (2026-05-05 → 2026-05-06)
- Files changed: 73 (+8,929 / −444)
- TypeScript LOC: ~153,700
- Timeline: ~1.5 days

**Archive:**
- `.planning/milestones/v1.1-ROADMAP.md`
- `.planning/milestones/v1.1-REQUIREMENTS.md`

**Tag:** `v1.1`

---

## Next Milestone

**v1.2 — Produção e Qualidade**

Target features:
- Testes E2E com Playwright — golden paths (login → maleta → venda → devolução)
- Observabilidade — Sentry + logs estruturados + alertas
- Rate limiting nos endpoints sensíveis via Upstash Redis
- Migração para domínio oficial `monarcasemijoyas.com.py`
- Migração PWA → Capacitor (iOS + Android)
- Modo offline do PWA — outbox, sync idempotente, resolução de conflitos
