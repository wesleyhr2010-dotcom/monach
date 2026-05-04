# Phase 1: Foundation — Error Handling & UI States - Context

**Gathered:** 2026-05-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Standardize error handling across all Server Actions via `ActionResult<T>` and `safeAction()`, create reusable UI-state components (`SkeletonCard`, `EmptyState`, `ErrorState`) for consistent loading/empty/error states across PWA and Admin, and unify toast notifications via `sonner` with severity-based durations.

**In scope:**
- Migrate high-traffic Server Actions to `ActionResult<T>` pattern
- Create `SkeletonCard`, `EmptyState`, `ErrorState` in `src/components/ui/`
- Integrate UI state components into ≥3 PWA routes and ≥3 Admin routes
- Install and mount `sonner` `<Toaster />` in both root layouts
- Replace inline admin toast divs with `sonner` API calls
- Create client-side helpers (`useAction`, `handleAction`) for `ActionResult` consumption
- Create `showToast()` wrapper enforcing SPEC durations
- Add ESLint rule + CI script preventing new `BUSINESS:` throws

**Out of scope:**
- Migrating low-traffic action files (tracked as deferred backlog)
- Updating all client call sites manually (handled via compatibility helpers)
- E2E tests for error handling (deferred to Phase 5)
- Observability/Sentry integration (deferred to v1.1)
</domain>

<decisions>
## Implementation Decisions

### Migration Completeness
- **D-01:** Migrate only the 5 high-traffic action files as defined in existing plans (`actions-revendedora.ts`, `actions-maletas.ts`, `actions-leads.ts`, `actions-equipe.ts`, `actions-gamificacao.ts`)
- **D-02:** **Include `src/lib/user.ts`** in Phase 1 migration (core auth guards with 3 `BUSINESS` throws)
- **D-03:** Create documented backlog (`.planning/STATE.md` or `BACKLOG.md`) + `// FIXME` comments in the ~5 remaining files with `BUSINESS` throws
- **D-04:** Add **ESLint custom rule** + **CI verification script** (`npm run check:business-throws`) to prevent new `throw new Error('BUSINESS:...')` patterns

### EmptyState / ErrorState Component Design
- **D-05:** `EmptyState` accepts a **string key** (e.g., `icon="package"`) and internally maps to Lucide icons. Rejects emojis as primary input.
- **D-06:** Icon size is **fixed at 48px** with color from design system tokens (`--app-text-muted` / `--admin-text-muted`), auto-detecting PWA vs Admin context
- **D-07:** Invalid/missing icon keys fallback to `<PackageOpen />` + emit `console.warn('[EmptyState] Ícone desconhecido: "x"')` in development

### Client-Side Adaptation
- **D-08:** Create **compatibility helpers** instead of rewriting all client call sites
- **D-09:** Provide **two helpers**: `useAction(action)` (React hook with loading state) and `handleAction(action, { onSuccess, onError })` (plain utility function)
- **D-10:** Toast integration via **optional `onError` callback** — if omitted, helper calls `toast.error()` automatically

### Toast Severity Enforcement
- **D-11:** Create **`showToast({ severity, message })`** wrapper in `src/lib/toast.ts` mapping severity → duration: `success: 3000ms`, `info: 4000ms`, `error: 5000ms`, `critical: 7000ms`
- **D-12:** Add **ESLint rule** detecting direct `toast.success()`/`toast.error()` usage without explicit duration and suggesting `showToast()`
- **D-13:** `useAction` / `handleAction` **use `showToast()` internally** for all automatic toast notifications

### the agent's Discretion
- Exact ESLint rule implementation details (severity, auto-fix capability)
- Exact icon key-to-Lucide mapping table (implementer should cover all keys referenced in SPEC_SKELETON_EMPTY_STATES.md)
- `useAction` hook state shape (loading, error, data) — follow React Query patterns for familiarity

### Folded Todos
None — no todos were cross-referenced into this phase's scope.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Specifications
- `.planning/ROADMAP.md` — Phase 1 goal, success criteria, and plan breakdown
- `.planning/REQUIREMENTS.md` — TECH-01..TECH-06 requirements mapped to Phase 1
- `.planning/PROJECT.md` — Stack, constraints, established patterns (ActionResult, safeAction, design system tokens)
- `docs/sistema/SPEC_ERROR_HANDLING.md` — ActionResult<T> format, error catalog by module, mapError spec, toast durations, Zod error map
- `docs/sistema/SPEC_SKELETON_EMPTY_STATES.md` — Component specs (SkeletonCard, EmptyState, ErrorState), usage per screen, accessibility rules

### Existing Plans
- `.planning/phases/01-foundation-error-handling-ui-states/01-01-PLAN.md` — Error Handling Infrastructure (action-utils, mapError, migrate actions-revendedora.ts)
- `.planning/phases/01-foundation-error-handling-ui-states/01-02-PLAN.md` — UI State Components (SkeletonCard, EmptyState, ErrorState + route integration)
- `.planning/phases/01-foundation-error-handling-ui-states/01-03-PLAN.md` — Toast System & Remaining Migrations (sonner, Toaster in layouts, migrate admin actions, replace inline toasts)

### Codebase Context
- `.planning/codebase/STACK.md` — Technology stack (Next.js 16, React 19, Tailwind v4, Lucide React, sonner)
- `.planning/codebase/CONVENTIONS.md` — Paper-first UI, design system tokens, TypeScript patterns, Server Action guard sequence
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`src/lib/action-utils.ts`** — Already exports `ActionResult<T>` and `safeAction()` (used by `actions-products.ts` and `actions-categories.ts`). Needs `mapError()` enhancement for Prisma error codes.
- **`src/components/ui/skeleton.tsx`** — Base `Skeleton` component from shadcn/ui (animate-pulse, rounded-md, bg-accent). `SkeletonCard` should wrap this.
- **Lucide React** — Icon library already installed. EmptyState internal mapping should use this.

### Established Patterns
- **`BUSINESS:` prefix** — Currently distinguishes user-facing errors. After migration, `safeAction` wrapper replaces this pattern with `ActionResult<T>`.
- **Admin inline toasts** — Use CSS classes `admin-toast`, `admin-toast-success`, `admin-toast-error` in `src/app/admin/admin.css`. All must be replaced with `sonner`.
- **Server-first architecture** — Pages are Server Components; interactive parts use `"use client"`. UI state components must work in both contexts.

### Integration Points
- **`src/app/app/layout.tsx`** — PWA root layout. Must mount `<Toaster position="top-center" richColors />`.
- **`src/app/admin/layout.tsx`** — Admin root layout. Must mount `<Toaster position="top-right" richColors />`.
- **High-traffic action files** — `actions-revendedora.ts` (5 BUSINESS throws), `actions-maletas.ts`, `actions-leads.ts`, `actions-equipe.ts` (3 throws), `actions-gamificacao.ts` (3 throws), plus `src/lib/user.ts` (3 throws).
- **Client call sites** — PWA routes (`/app/maleta`, `/app/catalogo`, `/app`) and Admin routes (`/admin/produtos`, `/admin/revendedoras`, `/admin/maleta`) call migrated actions and must adapt to `ActionResult` shape via helpers.
</code_context>

<specifics>
## Specific Ideas

- **Icon mapping for EmptyState:** Cover at minimum these keys from SPEC tables: `package` (maletas), `shopping` (catálogo), `star` (pontos), `bell` (notificações), `gift` (brindes), `users` (equipe), `alert-triangle` (ErrorState default)
- **Migration backlog tracking:** Add section to `.planning/STATE.md` under "Deferred Items" listing all files with remaining BUSINESS throws and the rule: "When editing a file with BUSINESS throws, migrate it before making the primary change."
- **ESLint rule scope:** Apply only to `src/app/**/actions*.ts` and `src/lib/user.ts` — do not enforce on test files or legacy scripts.
</specifics>

<deferred>
## Deferred Ideas

### Reviewed Todos (not folded)
None — discussion stayed within phase scope.

### Future Phase Ideas
- **Complete BUSINESS throw migration** — Remaining ~5 files with ~10 throws (perfil, progreso, brindes, notif-push, assert-in-group). Migrate when each file is modified.
- **Client call site manual migration** — After helpers are proven, gradually replace `useAction`/`handleAction` with direct `result.success` checks in performance-critical paths.
- **Toast animation customization** — Custom enter/exit animations for sonner (beyond richColors). Not required by SPEC.
</deferred>

---

*Phase: 1-Foundation — Error Handling & UI States*
*Context gathered: 2026-05-04*
