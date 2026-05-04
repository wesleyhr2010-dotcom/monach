# Roadmap: NEXT-MONARCA

## Milestone

**v1.0 — Operação e Visibilidade**

**Goal:** Fechar o ciclo operacional que está 80% pronto, finalizar as telas do app revendedora e dar visibilidade real para admin e revendedoras.

---

## Phases

- [ ] **Phase 1: Foundation — Error Handling & UI States** - Standardized error handling, reusable UI state components, and unified toast system
- [ ] **Phase 2: Core Business — Notifications, Leads & Config** - Template-driven notifications, lead approval pipeline, and editable admin configuration
- [ ] **Phase 3: Visibility & Analytics — Reseller & Admin Dashboards** - Performance analytics for resellers and global KPI dashboard for admin
- [ ] **Phase 4: Build Optimization & Polish** - ISR on public pages, build configuration, and cache invalidation
- [ ] **Phase 5: Validation & Hardening** - Security, performance, and functional acceptance validation

---

## Phase Details

### Phase 1: Foundation — Error Handling & UI States
**Goal**: All Server Actions use standardized error handling; reusable UI state components (`SkeletonCard`, `EmptyState`, `ErrorState`) are available across PWA and Admin; toast notifications are unified via `sonner`.
**Depends on**: Nothing (first phase)
**Requirements**: TECH-01, TECH-02, TECH-03, TECH-04, TECH-05, TECH-06
**Success Criteria** (what must be TRUE):
  1. All high-traffic Server Actions (`actions-revendedora.ts`, `actions-maletas.ts`, `actions-leads.ts`) return `ActionResult<T>` instead of throwing `BUSINESS:` errors
  2. `mapError()` helper maps Prisma errors (`P2002`, `P2025`, `P2014`) to user-friendly Spanish messages
  3. `SkeletonCard`, `EmptyState`, and `ErrorState` components are available in `src/components/ui/` and used in at least 3 routes each
  4. `sonner` toast notifications appear consistently across both PWA and Admin layouts, replacing all inline toast divs
  5. A grep for `throw new Error.*BUSINESS` in migrated action files returns zero matches
**Plans**: 3 plans
**UI hint**: yes

Plans:
- [ ] `01-01-PLAN.md` — Error Handling Infrastructure (ActionResult, safeAction, mapError + migrate actions-revendedora.ts)
- [ ] `01-02-PLAN.md` — UI State Components (SkeletonCard, EmptyState, ErrorState + integration into PWA and Admin routes)
- [ ] `01-03-PLAN.md` — Toast System & Remaining Migrations (sonner install, Toaster in layouts, migrate admin actions, replace inline toasts)

### Phase 2: Core Business — Notifications, Leads & Config
**Goal**: Admin operates autonomously — notifications use editable templates with variable substitution, leads from the landing page convert to verified accounts, and commission tiers / gamification levels / contracts are editable without developer intervention.
**Depends on**: Phase 1
**Requirements**: NOTF-01, NOTF-02, NOTF-03, NOTF-04, NOTF-05, NOTF-06, NOTF-07, NOTF-08, NOTF-09, LEAD-01, LEAD-02, LEAD-03, LEAD-04, LEAD-05, LEAD-06, LEAD-07, CONF-01, CONF-02, CONF-03, CONF-04, CONF-05, CONF-06
**Success Criteria** (what must be TRUE):
  1. Cron jobs `check-maleta-prazo` and `marcar-maletas-atrasadas` read active templates from `NotificacaoTemplate` and substitute variables (`{maleta_id}`, `{dias_restantes}`, `{nome_revendedora}`, `{pontos}`)
  2. Server Actions `registrarVenda`, `conferirEFecharMaleta`, and `submitDevolucao` send templated notifications with variable substitution
  3. Admin can view, filter (todos/pendentes/aprovados/rejeitados), approve, and reject leads at `/admin/leads`; approved leads create Supabase Auth users and `Reseller` profiles automatically
  4. Lead approval is idempotent — re-approving an already approved lead returns success without creating duplicates
  5. Admin edits commission tiers at `/admin/config/comissoes`, gamification levels at `/admin/config/niveis`, and contracts at `/admin/config/contratos`
  6. New revendedoras see the active contract during onboarding; changes to tiers/levels do not affect already closed maletas (snapshots remain immutable)
**Plans**: 5 plans
**UI hint**: yes

Plans:
- [ ] `02-01-PLAN.md` — Notification Template System (substituirVariaveis helper, whitelist, admin editor variable hints, HTML sanitization)
- [ ] `02-02-PLAN.md` — Lead Pipeline (landing submission, admin approval/rejection, Supabase Auth creation, Brevo emails, idempotency)
- [ ] `02-03-PLAN.md` — Admin Config: Tiers & Levels (CommissionTier and NivelRegra CRUD with Zod, /admin/config/comissoes and /admin/config/niveis)
- [ ] `02-04-PLAN.md` — Admin Config: Contracts (Contrato CRUD with R2 PDF upload, /admin/config/contratos, onboarding contract display)
- [ ] `02-05-PLAN.md` — Notification Integration (wire templates into cron jobs and server actions registrarVenda/conferirEFecharMaleta/submitDevolucao)

### Phase 3: Visibility & Analytics — Reseller & Admin Dashboards
**Goal**: Both revendedoras and admin have data-driven visibility into business performance through dashboards with period filtering, trend indicators, and rankings.
**Depends on**: Phase 1 (skeleton/empty/error components), Phase 2 (config data, notification infrastructure)
**Requirements**: DESE-01, DESE-02, DESE-03, DESE-04, DESE-05, DESE-06, DESE-07, DESE-08, DESE-09, DASH-01, DASH-02, DASH-03, DASH-04, DASH-05, DASH-06, DASH-07, DASH-08
**Success Criteria** (what must be TRUE):
  1. Revendedora accesses `/app/desempenho` (via menu "Más" or home link "Análisis") and sees 4 metric cards with current value and trend vs previous period
  2. Revendedora selects period (Esta Semana / Este Mês / Últimos 30 días / Este Año) and all metrics and charts update accordingly
  3. Revendedora sees a bar chart of daily visits and a top 10 products list with image, visits, and units sold
  4. When a revendedora has no access data, she sees a friendly empty state instead of zeroed cards
  5. Admin sees global KPIs (faturamento total, revendedoras ativas, maletas em circulação, taxa de conversão) at `/admin`
  6. COLABORADORA sees group-scoped KPIs (faturamento do grupo, revendedoras ativas do grupo, comissão total) — she cannot see data outside her group
  7. Admin dashboard includes period filter (7d/30d/3m/12m), maleta flow chart by status, product ranking (top 10), and deadline alerts (maletas with ≤7 days remaining)
  8. Dashboard loading states show skeleton cards consistent with the design system
**Plans**: TBD
**UI hint**: yes

### Phase 4: Build Optimization & Polish
**Goal**: Public pages serve via ISR for better performance; Vercel build is fast and reliable; all mutation Server Actions invalidate cache correctly.
**Depends on**: Phase 1, Phase 2, Phase 3
**Requirements**: TECH-07, TECH-08, TECH-09, TECH-10
**Success Criteria** (what must be TRUE):
  1. Public pages (`/`, `/catalogo`, `/produto/[slug]`, `/seja-revendedora`) render with ISR (`revalidate = 60`) and no longer use `force-dynamic`
  2. `DATABASE_URL` is configured in Vercel build environment variables for Production, Preview, and Development
  3. All mutation Server Actions call `revalidateTag` or `revalidatePath` after successful writes
  4. Vercel build completes successfully without static generation errors or Prisma connection failures
  5. Authenticated pages (`/app/*`, `/admin/*`) continue to use `force-dynamic` for real-time data
**Plans**: TBD

### Phase 5: Validation & Hardening
**Goal**: All v1.0 features are validated against security, performance, and functional acceptance criteria; no critical or high pitfalls remain unaddressed.
**Depends on**: Phase 1, Phase 2, Phase 3, Phase 4
**Requirements**: *(validation of all prior phases)*
**Success Criteria** (what must be TRUE):
  1. Security scan confirms no XSS in notification payloads — HTML is sanitized for email, plain-text only for OneSignal push
  2. `EXPLAIN ANALYZE` on analytics queries (`getMetricasDesempenho`, admin dashboard KPIs) shows no sequential scans; composite indexes added if needed
  3. Double-approve lead test passes (idempotent); race condition test with concurrent approvals passes (only one user created)
  4. Timezone accuracy test passes for Paraguay (`America/Asuncion`) — no date boundary errors in analytics
  5. No `throw new Error.*BUSINESS` patterns remain in any action file; all Server Actions use `ActionResult<T>`
  6. RBAC scope leak test passes — COLABORADORA cannot access data from revendedoras outside her group
**Plans**: TBD

---

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 0/3 | Planned | - |
| 2. Core Business | 0/5 | Ready to execute | - |
| 3. Visibility & Analytics | 0/TBD | Not started | - |
| 4. Build Optimization | 0/TBD | Not started | - |
| 5. Validation & Hardening | 0/TBD | Not started | - |

---

## Requirement Coverage

**v1.0 Requirements Mapped:**

| Category | Requirement IDs | Phase | Count |
|----------|----------------|-------|-------|
| Estabilização Técnica | TECH-01 .. TECH-06 | 1 | 6 |
| Notificações | NOTF-01 .. NOTF-09 | 2 | 9 |
| Leads | LEAD-01 .. LEAD-07 | 2 | 7 |
| Configurações Globais | CONF-01 .. CONF-06 | 2 | 22 |
| Desempenho Revendedora | DESE-01 .. DESE-09 | 3 | 9 |
| Dashboard Admin | DASH-01 .. DASH-08 | 3 | 17 |
| Estabilização Técnica (Build) | TECH-07 .. TECH-10 | 4 | 4 |
| **Total** | | | **49** |

✓ All v1.0 requirements mapped to exactly one phase  
✓ No orphaned requirements  
✓ No duplicate assignments

---

*Roadmap created: 2026-05-04*  
*Milestone: v1.0 — Operação e Visibilidade*
