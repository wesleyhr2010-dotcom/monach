# Architecture: v1.3 Integration Analysis

**Project:** next-monarca  
**Milestone:** v1.3 — Polimento, Segurança e UX Admin  
**Researched:** 2026-05-07  
**Confidence:** HIGH (all conclusions drawn from direct codebase inspection)

---

## Build Order

Recommended phase sequence based on risk, independence, and dependencies:

```
Phase 1: Dependency Update (Next.js 16.1.6 → 16.2.3)
   │  — No feature dependencies; must go first to avoid shipping new features on vulnerable version
   │
Phase 2: Email Templates Admin CRUD
   │  — Independent of analytics; depends only on Prisma migration and emails.ts
   │
Phase 3: Analytics Custom Date Range
   │  — Extends existing analytics; depends only on actions-analytics.ts pattern (no schema change)
   │
Phase 4: Admin UI Audit
      — No code dependencies; visual polish can happen last without blocking anything
```

**Rationale:**
- Security fix first: Snyk vulnerabilities should not be carried into new feature development
- Email templates second: requires a Prisma migration (new `EmailTemplate` model) — migrations should stabilize before UI polish begins
- Analytics date range third: zero schema changes, surgical edit to actions-analytics.ts + page.tsx, can be validated in isolation
- UI audit last: no functional risk, can be done incrementally per route without blocking other phases

---

## Email Templates Integration

### Current State

The current email system has two layers:

1. **`src/lib/email-base.ts`** — rendering engine: `renderEmailBase()`, `emailButton()`, `emailTable()`, `emailAlert()`, `emailDivider()`. Returns `EmailContent { html, text }`. Handles branding, dark mode, footer.

2. **`src/lib/email-templates/*.ts`** — 7 template functions (`emailCandidaturaAprovada`, `emailConviteUsuario`, `emailAcertoConfirmado`, `emailDocumentoPendente`, `emailDocumentoAprovado`, `emailDocumentoRejeitado`, `emailCandidaturaRechazada`). Each:
   - Receives typed params (e.g. `{ email, nome, senhaTemp }`)
   - Sanitizes inputs via `sanitizeTemplateVars()`
   - Builds bodyHtml/bodyText strings
   - Calls `renderEmailBase()` → `sendEmail()`
   - Returns `EmailContent`

3. **`src/lib/emails.ts`** — Brevo SDK transport layer. `sendEmail({ to, subject, htmlContent, textContent? })`. Stateless, no template logic.

### What Needs to Change for Editable Templates

The feature goal is an admin CRUD at `/admin/config/emails` where admins can edit email subject and body. Integration must not break the existing 7 templates.

**Recommended approach: DB-override pattern (not DB-replace).**

The 7 template TypeScript functions remain as the default fallback. The DB stores overrides keyed by template type. At send time, if a DB override exists for that tipo, use it; otherwise fall through to the TypeScript default.

### New Prisma Model

```prisma
model EmailTemplate {
  id         String   @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  tipo       String   @unique   // matches template key, e.g. "candidatura_aprovada"
  assunto    String             // editable subject line
  corpo_html String             // editable HTML body (inner body only, NOT full wrapper)
  corpo_text String             // editable plaintext body
  ativo      Boolean  @default(true)
  updated_at DateTime @updatedAt @db.Timestamptz()
  updated_by String?  @db.Uuid  // reseller_id of the ADMIN who last edited

  @@map("email_templates")
}
```

**Tipo keys** (must match existing templates exactly to avoid ambiguity):
- `candidatura_aprovada`
- `candidatura_rechazada`
- `convite_usuario`
- `acerto_confirmado`
- `documento_pendente`
- `documento_aprovado`
- `documento_rejeitado`

### Send Flow After Change

```
Server Action calls emailCandidaturaAprovada(params)
  │
  ├── sanitizeTemplateVars(params)
  ├── lookup: prisma.emailTemplate.findUnique({ tipo: 'candidatura_aprovada', ativo: true })
  │       │
  │       ├── found: substituirVariaveis(corpo_html, vars) → use as bodyHtml
  │       │          subject = override.assunto
  │       │
  │       └── not found: use existing hardcoded bodyHtml/bodyText (no change)
  │
  └── renderEmailBase({ bodyHtml, bodyText, ... }) → sendEmail()
```

**Variable substitution:** use the existing `substituirVariaveis()` from `src/lib/notifications-server.ts` (already used for push templates — same pattern, same security guarantees). The DB body stores `{{nome}}`, `{{email}}` placeholders; the template function passes a vars map.

### New Files

| File | Type | What |
|------|------|------|
| `prisma/schema.prisma` | Modified | Add `EmailTemplate` model |
| `prisma/migrations/...` | New | Migration for `email_templates` table |
| `src/app/admin/config/emails/page.tsx` | New | CRUD list route (Server Component) |
| `src/app/admin/config/emails/[tipo]/page.tsx` | New | Edit form route |
| `src/app/admin/config/emails/actions.ts` | New | Server Actions: `getEmailTemplates`, `upsertEmailTemplate`, `resetEmailTemplate` |

### Modified Files

| File | Change |
|------|--------|
| `src/lib/email-templates/candidatura-aprovada.ts` | Add DB lookup before building bodyHtml; fall through if no override |
| (same pattern for all 7 templates) | Same |
| `src/app/admin/config/` sidebar/nav | Add "Emails" link |

### Constraints

- The DB body stores **inner HTML only** (the content that goes into `bodyHtml` param of `renderEmailBase`), never the full wrapper. The wrapper (logo, footer, dark mode) is always generated by `renderEmailBase()`. This prevents admins from breaking email structure.
- Sanitization is mandatory: `substituirVariaveis()` already strips unknown tokens; XSS sanitization must be applied to `corpo_html` on write (same regex sanitizer used elsewhere in the project after `isomorphic-dompurify` was removed).
- No Brevo template IDs: system stays with transactional API sends (no Brevo template feature), keeping full control of rendering.

---

## Analytics Date Range Integration

### Current State

The period filter is a **URL search param `?period=N`** where N is the number of days (7, 30, 90, 365). The page validates against `PERIOD_OPTIONS` and redirects to `?period=30` on invalid values.

`getSinceDate(days: number)` in `actions-analytics.ts` computes `now - days` as the start boundary. All 8 exported functions in `actions-analytics.ts` accept `periodDays: number` and pass it to `getSinceDate()`.

The `ResellerSelect` component shows the existing select+form pattern for client-side URL navigation without JavaScript router calls.

### What Changes for Custom Date Range

Custom date range means the URL must carry two dates instead of one period number: `?from=YYYY-MM-DD&to=YYYY-MM-DD`. The preset buttons (7d/30d/3m/12m) remain; they compute `from` from today and set `to` to today.

### Data Flow Changes

**URL shape change:**

```
Before: /admin/analytics?period=30
After:  /admin/analytics?from=2026-04-07&to=2026-05-07
```

The preset buttons become Link components that compute from/to client-side:
- "7d" → `?from={today-7}&to={today}`
- "30d" → `?from={today-30}&to={today}`

**`getSinceDate()` replacement:**

`getSinceDate(days)` is replaced by a `getDateRange(from: Date, to: Date)` pattern. All 8 functions in `actions-analytics.ts` change their signature from `periodDays: number` to `from: Date, to: Date`.

```typescript
// Before
export async function getAnalyticsKPIs(periodDays = 30)
  const since = getSinceDate(periodDays);
  WHERE created_at >= since

// After
export async function getAnalyticsKPIs(from: Date, to: Date)
  WHERE created_at >= from AND created_at <= to
```

**`$queryRawUnsafe` changes:**

The 3 functions using raw SQL (`getAnalyticsKPIs`, `getAnalyticsFluxoMaletas`, and RBAC-scoped variants) pass `since` as `$1`. After the change they pass `from` as `$1` and `to` as `$2`, adding `AND created_at <= $2` to each raw query.

**Page.tsx changes:**

```typescript
// Before
const periodParam = params.period || "30";
const periodDays = parseInt(periodParam, 10);
if (!PERIOD_OPTIONS.some(o => o.days === periodDays)) redirect(...)

// After
const fromParam = params.from;
const toParam = params.to;
// parse + validate: fromParam and toParam are YYYY-MM-DD, from < to, to <= today
// if invalid → redirect to ?from={today-30}&to={today}
const from = new Date(fromParam);
const to = new Date(toParam);
// pass from/to to all action calls
```

### New Component

A `DateRangePicker` Client Component in `src/app/admin/analytics/DateRangePicker.tsx` replaces the current `<div>` of Link period buttons. It renders the 4 preset buttons AND a custom date input (two `<input type="date">` fields or a shadcn Popover with Calendar). On change it navigates to `?from=...&to=...` using `useRouter().push()`.

No new library needed — shadcn/ui already provides `Calendar` and `Popover` components. Avoid importing a heavy date-picker library (react-day-picker is already a transitive dependency of shadcn).

### Files Changed (No New Files Needed)

| File | Change Type | What |
|------|-------------|------|
| `src/app/admin/actions-analytics.ts` | Modified | All 8 functions: `periodDays` → `(from: Date, to: Date)`; `getSinceDate` → direct range |
| `src/app/admin/analytics/page.tsx` | Modified | Parse `?from`/`?to` instead of `?period`; pass `from`/`to` to actions |
| `src/app/admin/analytics/DateRangePicker.tsx` | New | Client Component: preset buttons + custom date inputs |
| `src/app/admin/analytics/ResellerSelect.tsx` | Modified | Replace hidden `period` input with hidden `from`/`to` inputs |
| `src/app/admin/analytics/VitrinaCsvDownload.tsx` | Possibly modified | Filename contains period — update to use from/to dates |

### Backward Compatibility Note

The URL change from `?period=30` to `?from=...&to=...` breaks any bookmarks or links to the old format. Since this is an internal admin page with no external links, this is acceptable. Add a redirect in the page: if `params.period` exists and `params.from` is absent, redirect to the equivalent `?from=...&to=...` URL.

---

## Admin UI Audit Scope

### Routes to Audit

All routes under `src/app/admin/` — each directory is one page:

| Route | File | Priority |
|-------|------|----------|
| `/admin` (dashboard) | `src/app/admin/page.tsx` | High |
| `/admin/analytics` | `src/app/admin/analytics/page.tsx` | High |
| `/admin/maleta/*` | `src/app/admin/maleta/` | High |
| `/admin/equipe` | `src/app/admin/equipe/` | Medium |
| `/admin/revendedoras` | `src/app/admin/revendedoras/` | Medium |
| `/admin/consultoras` | `src/app/admin/consultoras/` | Medium |
| `/admin/produtos` | `src/app/admin/produtos/` | Medium |
| `/admin/categorias` | `src/app/admin/categorias/` | Low |
| `/admin/brindes` | `src/app/admin/brindes/` | Low |
| `/admin/leads` | `src/app/admin/leads/` | Low |
| `/admin/gamificacao` | `src/app/admin/gamificacao/` | Low |
| `/admin/config/*` | `src/app/admin/config/` | Low |

### Components to Audit

All files in `src/components/admin/`:

- `AdminPageHeader.tsx` — used on every route; inconsistency here is global
- `AdminStatCard.tsx` — KPI cards; check token usage
- `AdminStatusBadge.tsx` — check hardcoded color values
- `AdminFilterBar.tsx` — layout consistency
- `AdminEmptyState.tsx` — typography, spacing tokens
- `AdminAlertBell.tsx` — icon sizing, color tokens
- `AdminLayoutClient.tsx` — sidebar structure

### What "Audit" Means

The audit checks each file against:
1. **CSS variables** — `--admin-text`, `--admin-text-muted`, `--admin-bg`, `--admin-border` used consistently. Replace any hardcoded hex values (e.g. `#888`, `#1a1a1a`, `#333`) found in `style={}` props.
2. **Tailwind classes** — Replace ad-hoc `bg-[#1a1a1a]`, `text-[#888]` with admin CSS variables or design system tokens from `docs/design-system/tokens.md`.
3. **Paper artboard match** — Each page is compared against its artboard in Paper MCP before changes. No layout changes without Paper reference.
4. **Dark theme** — Verify cards/tables render correctly against `--admin-bg-card` without light mode artifacts.

**Observed issues in current code** (from reading `analytics/page.tsx`):
- Hardcoded `bg-[#35605A]`, `bg-[#1a1a1a]`, `text-[#888]`, `border border-[#333]` inside Tailwind `className` strings — should use CSS variables
- Inline `style={{ color: "var(--admin-text-muted)" }}` mixed with className Tailwind — inconsistent approach across the page
- `#4ADE80`, `#E05C5C`, `#60A5FA`, `#FACC15`, `#a855f7` hardcoded in status color maps — these should be design system semantic tokens

The audit scope is **visual only** — no functional changes to actions, no schema changes.

---

## Dependency Update Impact

### Versions

- Current: `next@16.1.6`
- Target: `next@16.2.3`
- Increment: patch release within major version 16

### Risk Assessment

Next.js follows semver. A patch release (16.x.y → 16.x.z) should contain no breaking changes. However, within the same minor version (16.1 → 16.2) there may be App Router behavior changes.

**Files most likely to be affected:**

| File | Why |
|------|-----|
| `src/app/admin/analytics/page.tsx` | Uses `Promise<{ period?: string }>` for `searchParams` — Next.js 15+ made searchParams a Promise; verify the API is stable in 16.2 |
| Any `layout.tsx` or `page.tsx` using `cookies()` / `headers()` | These are async in Next.js 15+; if 16.2 changes anything about async request APIs, these pages are the surface area |
| `next.config.ts` | New config options may have changed defaults |
| Middleware (`src/middleware.ts`) | Edge runtime behavior; check for any breaking matcher changes |
| Serwist PWA config (`@serwist/next@^9.5.6`) | Serwist pinned to Next.js peer dep; may need `@serwist/next` update if it locks to 16.1 |

**`brace-expansion` vulnerability:** This is a transitive dep of `glob` which is used by Next.js bundling internals. Updating Next.js to 16.2.3 likely resolves it automatically if Next.js already updated its own `glob` dep. Verify with `npm ls brace-expansion` after update.

**`xlsx`/`jspdf` evaluation:** If these packages are not in `package.json` currently, no action needed. If present, evaluate whether usage can be replaced with server-side CSV generation (already done for vitrina analytics export) or removed.

### Update Procedure

1. `npm install next@16.2.3 eslint-config-next@16.2.3` — always update eslint-config-next in lockstep
2. `npm run build` — catch any breaking changes at build time
3. `npm run typecheck` — Next.js type exports may have minor changes
4. Run existing test suite — 229+ unit/integration tests provide coverage
5. Manual smoke test: login flow, admin dashboard, analytics page, maleta CRUD

**No migrations, no schema changes, no environment variable changes** are expected for this update.

---

## Dependency Graph Summary

```
EmailTemplate model (new)
  └─► /admin/config/emails CRUD (new route + actions)
  └─► src/lib/email-templates/*.ts (modified: DB lookup before TypeScript fallback)

Date range (from/to)
  └─► actions-analytics.ts (modified: all 8 functions)
  └─► analytics/page.tsx (modified: parse from/to, pass to actions)
  └─► analytics/DateRangePicker.tsx (new client component)
  └─► analytics/ResellerSelect.tsx (modified: pass from/to instead of period)

Admin UI audit
  └─► src/app/admin/**/*.tsx (modified: token replacements only)
  └─► src/components/admin/*.tsx (modified: token replacements only)

Next.js update
  └─► package.json (modified)
  └─► package-lock.json (modified)
  └─► No source file changes expected
```

No circular dependencies. Each phase modifies a distinct surface area. The email templates phase requires a migration, which is the only infrastructure change in this milestone.
