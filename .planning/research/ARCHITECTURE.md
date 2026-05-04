# Architecture Research: NEXT-MONARCA Milestone v1.0

**Project:** NEXT-MONARCA — Plataforma de gestão de revendedoras Monarca Semijoyas
**Research Date:** 2026-05-04
**Scope:** Integration of v1.0 features with existing Next.js 15 + Prisma + Supabase architecture
**Confidence:** HIGH (based on live codebase analysis + SPEC documentation)

---

## 1. Executive Summary

The v1.0 milestone adds **8 feature areas** to an already mature brownfield codebase (23 tables, validated RBAC, operational maleta cycle, gamification, notifications). All new features integrate through **existing architectural seams**: Prisma ORM for data, Server Actions for mutations, React.cache() for deduplication, and defense-in-depth auth (middleware + guard + RLS).

**Critical insight:** The existing architecture is well-structured for these additions. No new infrastructure is required. The main work is:
1. **Wiring** existing stubs (leads actions, config pages)
2. **Refactoring** hardcoded notification strings to use `NotificacaoTemplate`
3. **Aggregating** existing analytics tables into new views (reseller desempenho, admin dashboard)
4. **Standardizing** error handling and UI states across the codebase

**No breaking changes** to existing validated features are needed if integration follows established patterns.

---

## 2. Feature Integration Points

### 2.1 Notification Template Engine

**Current State:**
- `NotificacaoTemplate` table exists in schema (seeded with 7 templates)
- Admin config page `/admin/config/notif-push` exists with template editor UI
- Cron jobs exist but use **hardcoded strings** in Edge Functions
- `src/lib/notifications.ts` has `notificarRevendedora()` but constructs messages ad-hoc

**Integration Required:**

| Component | Current | Target |
|-----------|---------|--------|
| Cron jobs (Edge Functions) | Hardcoded `contents.es` strings | Read from `NotificacaoTemplate` + `substituirVariaveis()` |
| Server Actions (`criarMaleta`, `closeMaleta`, etc.) | Inline message construction | Use template lookup + variable substitution |
| `src/lib/notifications.ts` | Ad-hoc messages | Template-aware helper |

**New Component: `src/lib/notifications/template-engine.ts`**
```ts
// Helper: substituirVariaveis
export function substituirVariaveis(
  template: string,
  vars: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ''));
}

// Helper: getTemplateAtivo(tipo) → reads NotificacaoTemplate from DB
export async function getTemplateAtivo(tipo: string): Promise<NotificacaoTemplate | null>

// Helper: notificarComTemplate(tipo, resellerId, vars)
export async function notificarComTemplate(
  tipo: TipoNotificacao,
  resellerId: string,
  vars: Record<string, string | number>,
  authUserId?: string | null
)
```

**Files to Modify:**
- `supabase/functions/check-maleta-prazo/index.ts` — read template from DB instead of hardcoded
- `supabase/functions/marcar-maletas-atrasadas/index.ts` — same
- `src/lib/notifications.ts` — add `notificarComTemplate()`; refactor existing callers
- `src/app/admin/actions-maletas.ts` — `createMaleta`, `closeMaleta` use templates
- `src/app/admin/actions-gamificacao.ts` — `awardPoints` uses template
- `src/app/app/actions-revendedora.ts` — `registrarVenda`, `submitDevolucao` use templates

**Database:** No schema changes. `NotificacaoTemplate` already exists.

---

### 2.2 Analytics Dashboard for Resellers (`/app/desempenho`)

**Current State:**
- `AnalyticsAcesso` and `AnalyticsDiario` tables exist
- Cron `agrega-analytics-diario` consolidates daily
- Tracking endpoint `/api/track-evento` exists
- **Route `/app/desempenho` does NOT exist yet**

**Integration Required:**

| Data Source | Table | Query Pattern |
|-------------|-------|---------------|
| Acessos ao Catálogo | `AnalyticsAcesso` | `COUNT WHERE tipo_evento = 'catalogo_revendedora'` |
| Visitantes Únicos | `AnalyticsAcesso` | `COUNT(DISTINCT visitor_id)` |
| Clics WhatsApp | `AnalyticsAcesso` | `COUNT WHERE tipo_evento = 'clique_whatsapp'` |
| Peças Vendidas | `VendaMaleta` | `COUNT via Maleta → reseller_id` |
| Visitas Diárias (gráfico) | `AnalyticsDiario` | `GROUP BY data` |
| Produtos Populares | `AnalyticsAcesso` | `GROUP BY produto_id ORDER BY COUNT` |

**New Components:**
- `src/app/app/desempenho/page.tsx` — Client Component (time range interactive)
- `src/app/app/desempenho/actions.ts` — Server Action `getMetricasDesempenho(resellerId, rango)`
- `src/components/app/desempenho/MetricCardTrend.tsx`
- `src/components/app/desempenho/VisitasDiariasChart.tsx` (recharts BarChart)
- `src/components/app/desempenho/ProductosPopularesList.tsx`
- `src/components/app/desempenho/TimeRangeSelector.tsx`

**Data Flow:**
```
/app/desempenho (Client)
  → getMetricasDesempenho(resellerId, 'semana')
    → Promise.all([
        getMetricasPeriodo(resellerId, start, end),      // AnalyticsAcesso
        getMetricasPeriodo(resellerId, prevStart, prevEnd), // tendência
        getVisitasDiarias(resellerId, start, end),       // AnalyticsDiario
        getProductosPopulares(resellerId, start, end),   // AnalyticsAcesso
      ])
```

**Caching:** Analytics data is **volatile** — do NOT cache. Use `force-dynamic` on page.

**Database:** No schema changes. Existing `AnalyticsAcesso`, `AnalyticsDiario`, `VendaMaleta` sufficient.

---

### 2.3 Admin Dashboard with Global/Group KPIs (`/admin`)

**Current State:**
- `/admin/page.tsx` exists with KPI cards, alertas, ranking, docs
- `actions-dashboard.ts` has `getDashboardMetricas`, `getAlertasMaletas`, `getRankingColaboradoras`, `getRankingRevendedoras`, `getMinhaComissao`
- **Functional but basic** — missing: time range filter, product rankings, export

**Integration Required:**

The existing dashboard is ~70% complete. v1.0 needs:

| Gap | Solution |
|-----|----------|
| Time range filter (7d/30d/3m/12m) | Add `periodDays` param to existing actions |
| Productos más vendidos section | Reuse `getAnalyticsProdutosMaisVendidos` from `actions-analytics.ts` |
| Export CSV | Add `exportToCSV` Server Action or API route |
| Real-time alert bell | Already implemented in `AdminLayoutClient` with `alertCount` SSR |
| Missing docs integration | Wire `DocsCard` to actual `ResellerDocumento` query |

**Files to Modify:**
- `src/app/admin/actions-dashboard.ts` — add `periodDays` param; wire docs query
- `src/app/admin/page.tsx` — add `DateRangeSelector` client component; integrate product ranking
- `src/app/admin/actions-analytics.ts` — already has product ranking — expose to dashboard

**No new database tables needed.**

---

### 2.4 Lead Pipeline (`/seja-revendedora` → `/admin/leads`)

**Current State:**
- `RevendedoraLead` table exists in schema
- `/admin/leads/page.tsx` exists (stub)
- `actions-leads.ts` exists but **returns errors** — "Tabela LeadRevendedora não existe mais"
- Landing page `/seja-revendedora` exists
- **Schema mismatch:** The code references old table name; schema has `revendedora_leads`

**Integration Required:**

This is primarily **fixing existing stubs** to use correct schema.

| Action | Current | Fix |
|--------|---------|-----|
| `submitLead()` | Returns error | Implement Prisma `revendedoraLead.create()` |
| `getLeads(status)` | Returns empty array | Implement Prisma query with status filter |
| `aprovarLead()` | Returns error | Full flow: create Supabase user → create Reseller → update lead → send email |
| `recusarLead()` | Returns error | Update lead status → send rejection email |

**New/Modified Components:**
- `src/app/admin/leads/page.tsx` — tabs (Pendientes/Aprobadas/Rechazadas)
- `src/components/admin/leads/LeadCard.tsx`
- `src/components/admin/leads/AprovarModal.tsx` — select consultora + taxa
- `src/components/admin/leads/RecusarModal.tsx` — motivo field

**Server Actions in `actions-leads.ts`:**
```ts
getLeads(status?: LeadStatus) → LeadItem[]
aprovarLead(leadId, { colaboradoraId, taxaComissao }) → ActionResult
recusarLead(leadId, observacao?) → ActionResult
```

**Email Integration:** Use existing Brevo client in `src/lib/emails.ts` (not Supabase Admin API as shown in old SPEC — project already uses Brevo).

**Database:** No schema changes. `RevendedoraLead` already exists.

---

### 2.5 Admin Global Configuration (Tiers, Levels, Contracts)

**Current State:**
- `CommissionTier` table exists
- `NivelRegra` table exists
- `Contrato` table exists
- **Routes `/admin/commission-tiers` and `/admin/contratos` exist but are stubs/placeholders**
- Gamificação page `/admin/gamificacao` exists with regras editor

**Integration Required:**

| Config | Table | UI Route | Status |
|--------|-------|----------|--------|
| Commission Tiers | `CommissionTier` | `/admin/commission-tiers` | Stub — needs CRUD |
| Gamification Levels | `NivelRegra` | `/admin/gamificacao` | Partial — needs nivel editor |
| Contracts | `Contrato` | `/admin/contratos` | Stub — needs upload + list |

**New/Modified Server Actions:**
- `src/app/admin/actions-config.ts` (new file recommended):
  ```ts
  getCommissionTiers() → CommissionTier[]
  upsertCommissionTier(data) → ActionResult<CommissionTier>
  deleteCommissionTier(id) → ActionResult
  getContratos() → Contrato[]
  uploadContrato(data, file) → ActionResult<Contrato>
  deleteContrato(id) → ActionResult
  ```

**Components:**
- `src/components/admin/config/TierForm.tsx` — modal create/edit
- `src/components/admin/config/ContratoUploadModal.tsx` — drag-drop PDF

**File Upload:** Reuse existing R2 upload pattern via `/api/upload-r2` or direct Server Action with `@aws-sdk/client-s3`.

**Database:** No schema changes.

---

### 2.6 Centralized Error Handling (ActionResult Pattern)

**Current State:**
- `src/lib/action-utils.ts` has `ActionResult<T>` type and `safeAction()` wrapper
- `src/lib/user.ts` has `requireAuth()` that throws `BUSINESS:` prefixed errors
- **Inconsistent adoption:** Some actions use `safeAction`, others use manual try/catch, others throw raw

**Integration Required:**

Standardize ALL server actions to use `ActionResult<T>` + `safeAction()`.

**Target Pattern:**
```ts
'use server';
import { safeAction, type ActionResult } from '@/lib/action-utils';

export async function createItem(input: Input): Promise<ActionResult<Item>> {
  return safeAction(async () => {
    // ... validation, auth, business logic
    return item;
  });
}
```

**Files to Migrate (in priority order):**
1. `src/app/admin/actions-leads.ts` — currently broken, rewrite with pattern
2. `src/app/admin/actions-config.ts` (new) — use pattern from start
3. `src/app/app/actions-revendedora.ts` — high traffic, high impact
4. `src/app/admin/actions-maletas.ts` — critical business logic
5. `src/app/admin/actions-products.ts`, `actions-categories.ts` — medium priority
6. `src/app/admin/actions-gamificacao.ts` — medium priority

**UI Consumption Pattern:**
```tsx
const result = await createItem(input);
if (!result.success) {
  toast.error(result.error); // already in Spanish
  return;
}
// use result.data
```

**No new files needed** — extend existing `action-utils.ts` if needed (e.g., add error code enum as per SPEC).

---

### 2.7 Consistent Skeleton/Empty/Error States

**Current State:**
- `SPEC_SKELETON_EMPTY_STATES.md` defines comprehensive patterns
- **Partial implementation** — some pages have skeletons, others don't
- No centralized `SkeletonCard`, `EmptyState`, `ErrorState` components exist yet

**Integration Required:**

Create reusable components and apply to all routes.

**New Components:**
- `src/components/ui/skeleton-card.tsx` — `SkeletonCard`, `SkeletonList`, `SkeletonMetricDashboard`
- `src/components/ui/empty-state.tsx` — `EmptyState` with icon, title, description, optional CTA
- `src/components/ui/error-state.tsx` — `ErrorState` with retry button and back link

**Application Pattern (Server Component):**
```tsx
import { Suspense } from 'react';
import { SkeletonList } from '@/components/ui/skeleton-list';
import { ErrorState } from '@/components/ui/error-state';

export default function Page() {
  return (
    <Suspense fallback={<SkeletonList count={5} />}>
      <DataList />
    </Suspense>
  );
}

async function DataList() {
  try {
    const data = await getData();
    if (data.length === 0) return <EmptyState icon="📋" title="No hay datos" />;
    return <List items={data} />;
  } catch {
    return <ErrorState message="Error al cargar" />;
  }
}
```

**Routes to Cover (priority):**
1. `/app` (home) — `SkeletonMetricDashboard`
2. `/app/maleta` — `SkeletonList`
3. `/app/catalogo` — Grid skeleton
4. `/app/desempenho` — NEW page, implement from start
5. `/admin/maletas` — Table skeleton
6. `/admin/leads` — NEW page, implement from start
7. `/admin/analytics` — Card + chart skeletons

---

### 2.8 Build Optimization (Remove force-dynamic, ISR)

**Current State:**
- `force-dynamic` on ALL authenticated pages (`/app/*`, `/admin/*`)
- **Public pages** (`/`, `/catalogo`, `/produto/[slug]`) already use `revalidate: 60` (ISR)
- Build fails without `DATABASE_URL` because Prisma tries to connect during static generation

**Integration Required:**

| Page Type | Current | Target |
|-----------|---------|--------|
| Public pages (`/`, `/catalogo`, `/produto/[slug]`) | `revalidate: 60` | Keep ISR; ensure `DATABASE_URL` available at build |
| Public pages that don't need DB | `revalidate: 60` | Remove, let them be fully static |
| Authenticated pages (`/app/*`, `/admin/*`) | `force-dynamic` | **Keep** — these need real-time data |
| **Exception:** `/app/login`, `/admin/login` | `force-dynamic` | Can be static |

**The Real Fix:**
The problem is not `force-dynamic` on authenticated pages — it's correct there. The problem is:
1. **Build-time Prisma connection** — Vercel build doesn't have `DATABASE_URL`
2. **Solution A:** Add `DATABASE_URL` to Vercel build environment
3. **Solution B:** For pages that truly need dynamic data, keep `force-dynamic`; for others, use `export const dynamic = 'error'` to catch accidental dynamic dependencies

**Recommended Approach:**
```ts
// For public pages that fetch from DB but can tolerate stale data
export const revalidate = 60;

// For authenticated pages (correct — keep)
export const dynamic = 'force-dynamic';

// For login pages (can be static)
// No export needed — default is static
```

**Migration Steps:**
1. Audit all `/app/*` and `/admin/*` pages — remove `force-dynamic` from pages that don't call `headers()`, `cookies()`, or Prisma
2. Add `DATABASE_URL` to Vercel environment variables for build step
3. For pages that call `getCurrentUser()` (which calls `supabase.auth.getUser()` which reads cookies), they **must** be dynamic

**Pages that CAN be static:**
- `/app/login`
- `/app/bienvenida` (if no auth check — but it probably redirects)
- `/admin/login`
- `/admin/login/recuperar`

**Pages that MUST be dynamic:**
- Any page calling `getCurrentUser()`
- Any page calling `headers()` or `cookies()`
- Any Server Action invoked from the page

---

## 3. New Components & Services Summary

### 3.1 New Files to Create

| File | Purpose | Feature |
|------|---------|---------|
| `src/lib/notifications/template-engine.ts` | Variable substitution + template lookup | Notification Engine |
| `src/app/app/desempenho/page.tsx` | Reseller analytics dashboard | Reseller Analytics |
| `src/app/app/desempenho/actions.ts` | `getMetricasDesempenho` Server Action | Reseller Analytics |
| `src/components/app/desempenho/*.tsx` | Metric cards, chart, product list | Reseller Analytics |
| `src/app/admin/actions-config.ts` | CRUD for tiers, contracts, levels | Admin Config |
| `src/app/admin/commission-tiers/page.tsx` | Tier management UI | Admin Config |
| `src/app/admin/contratos/page.tsx` | Contract upload/list UI | Admin Config |
| `src/components/admin/config/*.tsx` | TierForm, ContratoUploadModal | Admin Config |
| `src/components/admin/leads/*.tsx` | LeadCard, AprovarModal, RecusarModal | Lead Pipeline |
| `src/components/ui/skeleton-card.tsx` | Reusable skeleton components | Skeleton States |
| `src/components/ui/empty-state.tsx` | Reusable empty state | Empty States |
| `src/components/ui/error-state.tsx` | Reusable error state with retry | Error States |
| `src/lib/cache/invalidate.ts` | Centralized cache invalidation helpers | Caching |

### 3.2 Existing Files to Modify

| File | Changes | Feature |
|------|---------|---------|
| `supabase/functions/check-maleta-prazo/index.ts` | Read template from DB | Notification Engine |
| `supabase/functions/marcar-maletas-atrasadas/index.ts` | Read template from DB | Notification Engine |
| `src/lib/notifications.ts` | Add `notificarComTemplate()` | Notification Engine |
| `src/app/admin/actions-maletas.ts` | Use template engine | Notification Engine |
| `src/app/admin/actions-gamificacao.ts` | Use template engine | Notification Engine |
| `src/app/app/actions-revendedora.ts` | Use template engine + ActionResult | Notification Engine + Error Handling |
| `src/app/admin/actions-leads.ts` | Full rewrite with correct schema | Lead Pipeline |
| `src/app/admin/leads/page.tsx` | Implement full UI | Lead Pipeline |
| `src/app/admin/actions-dashboard.ts` | Add period filter, docs query, product ranking | Admin Dashboard |
| `src/app/admin/page.tsx` | Add DateRangeSelector, wire product ranking | Admin Dashboard |
| `src/app/admin/layout.tsx` | Update restricted paths for new config routes | Admin Config |
| `src/middleware.ts` | Add new SUPER_ADMIN_ONLY paths if needed | RBAC |
| `src/app/admin/gamificacao/page.tsx` | Add nivel editor | Admin Config |

---

## 4. Data Flow Changes

### 4.1 Notification Template Engine Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│  TRIGGER (Cron or Server Action)                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ createMaleta│  │  closeMaleta│  │  check-maleta-prazo │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
│         │                │                     │             │
│         ▼                ▼                     ▼             │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  notificarComTemplate(tipo, resellerId, vars)          │  │
│  │  1. getTemplateAtivo(tipo) → NotificacaoTemplate       │  │
│  │  2. substituirVariaveis(template.body_es, vars)        │  │
│  │  3. criarNotificacao({reseller_id, tipo, titulo, msg}) │  │
│  │  4. enviarPushSePermitido(authUserId, resellerId, ...) │  │
│  └────────────────────────────────────────────────────────┘  │
│         │                           │                        │
│         ▼                           ▼                        │
│  ┌─────────────┐            ┌─────────────┐                  │
│  │  notificacoes│            │   OneSignal │                  │
│  │   (banco)   │            │   (push)    │                  │
│  └─────────────┘            └─────────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Lead Pipeline Data Flow

```
Landing Page (/seja-revendedora)
  → submitLead(formData)
    → Prisma: revendedoraLead.create({...})
      → Status: pendente

Admin (/admin/leads)
  → getLeads('pendente')
    → Prisma: revendedoraLead.findMany({ where: { status: 'pendente' } })

Admin Action: Aprovar
  → aprovarLead(leadId, { colaboradoraId, taxaComissao })
    → 1. Prisma: revendedoraLead.findUnique()
    → 2. Supabase Auth: createUser(email, tempPassword)
    → 3. Prisma: reseller.create({...lead data..., auth_user_id, manager_id, taxa_comissao})
    → 4. Prisma: revendedoraLead.update({ status: 'aprovado' })
    → 5. Brevo: sendWelcomeEmail(email, nome, tempPassword)
    → 6. ActionResult: success

Admin Action: Rechazar
  → recusarLead(leadId, observacao)
    → 1. Prisma: revendedoraLead.update({ status: 'rejeitado', observacao_admin })
    → 2. Brevo: sendRejectionEmail(email, nome)
    → 3. ActionResult: success
```

**Critical:** Steps 2-5 in aprovarLead must be **idempotent** (check if Reseller already exists by email before creating). No DB transaction can span Supabase Auth + Prisma, so implement compensating logic:
- If Supabase user created but Reseller create fails → delete Supabase user (or log for manual cleanup)
- If Reseller created but email fails → lead is approved, admin sees warning, can resend email

### 4.3 Reseller Analytics Data Flow

```
/app/desempenho (Client Component)
  → getMetricasDesempenho(resellerId, 'semana')
    → getDateRange('semana') → { start, end, prevStart, prevEnd }
    → Promise.all([
        getMetricasPeriodo(resellerId, start, end),
        getMetricasPeriodo(resellerId, prevStart, prevEnd), // tendência
        getVisitasDiarias(resellerId, start, end),          // AnalyticsDiario
        getProductosPopulares(resellerId, start, end),      // AnalyticsAcesso
      ])
    → Return: { actual, anterior, grafico, productos }
```

### 4.4 Admin Dashboard Data Flow

```
/admin (Server Component)
  → getCurrentUser()
  → detect role (ADMIN vs COLABORADORA)
  → getResellerScope(user) → scope filter
  → Promise.all([
      getDashboardMetricas(scope, period),     // KPI cards
      getAlertasMaletas(scope),                // Attention list
      getRanking(scope, period),               // Admin→consultoras, COLAB→revendedoras
      getMinhaComissao(scope),                 // COLAB only
      getDocumentosPendentes(scope),           // Docs card
    ])
  → Render with sub-components
```

---

## 5. Database Schema Additions

**No new tables are required for v1.0.** All needed tables already exist:

| Feature | Existing Tables | Notes |
|---------|----------------|-------|
| Notification Templates | `notificacao_templates` | Already seeded |
| Notification Logs | `notificacao_logs` | Already exists |
| Leads | `revendedora_leads` | Already exists |
| Analytics | `analytics_acessos`, `analytics_diario` | Already exists |
| Commission Tiers | `commission_tiers` | Already exists |
| Gamification Levels | `nivel_regras` | Already exists |
| Contracts | `contratos` | Already exists |

**Potential minor additions (optional):**
- Add `commission_tiers.label` field if not present (SPEC shows label "Bronze", "Prata", etc.)
- Verify `analytics_diario` has `reseller_id` indexed (already in schema)

---

## 6. API Changes (Server Actions)

### 6.1 New Server Actions

```ts
// src/lib/notifications/template-engine.ts
async function getTemplateAtivo(tipo: string): Promise<NotificacaoTemplate | null>
function substituirVariaveis(template: string, vars: Record<string, string | number>): string
async function notificarComTemplate(tipo: TipoNotificacao, resellerId: string, vars: object, authUserId?: string): Promise<Notificacao | null>

// src/app/app/desempenho/actions.ts
async function getMetricasDesempenho(resellerId: string, rango: TimeRange): Promise<DesempenhoData>

// src/app/admin/actions-config.ts (new file)
async function getCommissionTiers(): Promise<CommissionTier[]>
async function upsertCommissionTier(data: CommissionTierInput): Promise<ActionResult<CommissionTier>>
async function deleteCommissionTier(id: string): Promise<ActionResult>
async function getContratos(): Promise<Contrato[]>
async function uploadContrato(data: ContratoInput, file: File): Promise<ActionResult<Contrato>>
async function deleteContrato(id: string): Promise<ActionResult>

// src/app/admin/actions-leads.ts (rewrite)
async function getLeads(status?: LeadStatus): Promise<LeadItem[]>
async function aprovarLead(leadId: string, params: { colaboradoraId: string; taxaComissao: number }): Promise<ActionResult>
async function recusarLead(leadId: string, observacao?: string): Promise<ActionResult>
```

### 6.2 Modified Server Actions

```ts
// src/app/admin/actions-maletas.ts
// Add: notificarComTemplate calls in createMaleta, closeMaleta

// src/app/admin/actions-gamificacao.ts
// Add: notificarComTemplate in awardPoints

// src/app/app/actions-revendedora.ts
// Add: notificarComTemplate in registrarVenda, submitDevolucao
// Refactor: wrap all exports with safeAction() for ActionResult

// src/app/admin/actions-dashboard.ts
// Add: periodDays param to getDashboardMetricas
// Add: getDocumentosPendentes query
```

---

## 7. Suggested Build Order with Rationale

### Phase 1: Foundation (Week 1)
**Goal:** Establish patterns that all other features depend on.

1. **Error Handling Standardization** (`src/lib/action-utils.ts` + migration of high-traffic actions)
   - Why first: All new features should use the pattern from day one
   - Scope: `actions-revendedora.ts`, `actions-maletas.ts`, `actions-leads.ts` (rewrite)

2. **Skeleton/Empty/Error Components** (`src/components/ui/`)
   - Why first: Required by all new UI pages
   - Scope: Create 3 base components; apply to existing pages as proof of concept

3. **Cache Invalidation Helper** (`src/lib/cache/invalidate.ts`)
   - Why first: Notification engine and config changes need to invalidate cache
   - Scope: Extract from SPEC_CACHING_STRATEGY.md into code

### Phase 2: Core Business Logic (Week 2)
**Goal:** Enable operational features.

4. **Notification Template Engine** (`template-engine.ts` + cron updates)
   - Why second: Other features (maleta, gamification) will use it
   - Scope: Create helper; update Edge Functions; migrate 1-2 Server Actions as pilot

5. **Lead Pipeline** (`/admin/leads` full implementation)
   - Why second: Unblocks onboarding of new resellers
   - Scope: Rewrite `actions-leads.ts`; build UI; integrate Brevo emails
   - Depends on: Error handling pattern (Phase 1)

6. **Admin Global Config** (`/admin/commission-tiers`, `/admin/contratos`, `/admin/gamificacao` nivel editor)
   - Why second: Needed before new resellers are onboarded (lead pipeline assigns tiers)
   - Scope: CRUD Server Actions; UI forms; R2 upload for contracts
   - Depends on: Error handling pattern (Phase 1)

### Phase 3: Visibility & Analytics (Week 3)
**Goal:** Give users visibility into their performance.

7. **Reseller Analytics** (`/app/desempenho`)
   - Why third: Data already exists; just needs aggregation and UI
   - Scope: Server Action with date math; recharts chart; metric cards
   - Depends on: Skeleton components (Phase 1)

8. **Admin Dashboard Enhancements** (`/admin` period filters, product ranking, export)
   - Why third: Builds on existing dashboard; adds missing features
   - Scope: Modify `actions-dashboard.ts`; add client-side period selector; wire existing analytics actions
   - Depends on: Skeleton components (Phase 1)

### Phase 4: Polish & Optimization (Week 4)
**Goal:** Stabilize and optimize.

9. **Complete Notification Migration**
   - Why fourth: Lower risk once core features are stable
   - Scope: Migrate all remaining Server Actions to use `notificarComTemplate()`

10. **Build Optimization**
    - Why fourth: Requires understanding which pages truly need dynamic data
    - Scope: Audit `force-dynamic` usage; configure `DATABASE_URL` in Vercel; test ISR on public pages

11. **Apply Skeleton/Error States to All Pages**
    - Why fourth: Final polish pass
    - Scope: Wrap all async data fetches in Suspense with appropriate fallbacks

---

## 8. RBAC & Security Considerations

### 8.1 Route Access Matrix

| Route | ADMIN | COLABORADORA | REVENDEDORA | Notes |
|-------|-------|--------------|-------------|-------|
| `/admin/leads` | ✓ | ✗ | ✗ | SUPER_ADMIN only per SPEC |
| `/admin/commission-tiers` | ✓ | ✗ | ✗ | Already in restrictedPaths |
| `/admin/contratos` | ✓ | ✗ | ✗ | Already in restrictedPaths |
| `/admin/analytics` | ✓ | ✓ | ✗ | Existing, COLAB sees group scope |
| `/admin/config/notif-push` | ✓ | ✗ | ✗ | Already SUPER_ADMIN only |
| `/app/desempenho` | ✗ | ✗ | ✓ | Own data only |

### 8.2 Middleware Updates

The existing `middleware.ts` only refreshes JWT — **no changes needed** for v1.0 features.

However, `src/app/admin/layout.tsx` has `restrictedPaths` for COLABORADORA. If new config routes are added under `/admin/config/*`, verify they're included:
```ts
const restrictedPaths = [
  "/admin/productos",
  "/admin/gamificacion",
  "/admin/brindes",
  "/admin/commission-tiers",
  "/admin/contratos",
  "/admin/equipo/consultoras",
  "/admin/config", // ← add if creating unified config section
];
```

### 8.3 RLS Considerations

No new RLS policies needed — all new features operate on existing tables with existing policies:
- `RevendedoraLead` — admin-only access (no reseller relation, so no RLS needed or admin-only)
- `NotificacaoTemplate` — admin-only (no user-specific rows)
- `AnalyticsAcesso` / `AnalyticsDiario` — already scoped by `reseller_id`
- `CommissionTier`, `NivelRegra`, `Contrato` — admin-only reads/writes

---

## 9. Integration Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Lead approval fails mid-flow (Supabase user created, Reseller not) | Medium | High | Idempotency check + compensating deletion + admin UI shows status |
| Edge Functions fail to read `NotificacaoTemplate` (network/permission) | Low | Medium | Fallback to hardcoded strings in catch block; log to Sentry |
| Analytics queries slow on large datasets | Medium | Medium | Use `AnalyticsDiario` (pre-aggregated) for charts; index `analytics_acessos(reseller_id, created_at, tipo_evento)` |
| Build still fails after removing force-dynamic from some pages | Medium | High | Test each page individually; keep `force-dynamic` on any page using `getCurrentUser()` |
| ActionResult migration breaks existing UI that expects throws | Medium | High | Migrate UI consumption pattern simultaneously; never change action signature without updating all callers |

---

## 10. Files Referenced

### SPECs
- `docs/admin/SPEC_ADMIN_LEADS.md`
- `docs/admin/SPEC_ADMIN_DASHBOARD.md`
- `docs/admin/SPEC_ADMIN_CONFIG.md`
- `docs/admin/SPEC_ADMIN_ANALYTICS_NOTIFICATIONS.md`
- `docs/revendedoras/SPEC_DESEMPENHO.md`
- `docs/revendedoras/SPEC_NOTIFICACOES.md`
- `docs/sistema/SPEC_CRON_JOBS.md`
- `docs/sistema/SPEC_ERROR_HANDLING.md`
- `docs/sistema/SPEC_SKELETON_EMPTY_STATES.md`
- `docs/sistema/SPEC_CACHING_STRATEGY.md`
- `docs/sistema/SPEC_BACKEND.md`

### Codebase
- `prisma/schema.prisma`
- `src/lib/notifications.ts`
- `src/lib/action-utils.ts`
- `src/lib/user.ts`
- `src/app/admin/actions-dashboard.ts`
- `src/app/admin/actions-leads.ts`
- `src/app/admin/actions-analytics.ts`
- `src/app/admin/page.tsx`
- `src/app/admin/layout.tsx`
- `src/middleware.ts`
- `supabase/functions/check-maleta-prazo/index.ts`
- `supabase/functions/marcar-maletas-atrasadas/index.ts`

---

*Research completed: 2026-05-04*
*Confidence: HIGH — all recommendations based on direct codebase inspection and validated SPECs.*
