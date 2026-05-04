# Technology Stack Research: Milestone v1.0

**Project:** NEXT-MONARCA
**Research Date:** 2026-05-04
**Scope:** Stack additions/changes for notification template engine, analytics dashboards, lead pipeline, admin config panel, centralized error handling, skeleton/empty/error states, and build optimization.

---

## 1. Existing Stack Summary (Validated — Do Not Change)

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Next.js (App Router, Server Components, Server Actions) | 16.1.6 |
| React | React / React DOM | 19.2.3 |
| Language | TypeScript (strict) | 5.x |
| Styling | Tailwind CSS | v4 |
| ORM | Prisma | 7.4.2 |
| Database | PostgreSQL (Supabase) | — |
| Auth | Supabase Auth (email/password) + RLS | 2.98.0 |
| Storage | Cloudflare R2 (S3-compatible) | — |
| Email | Brevo (Sendinblue) | 5.0.4 |
| Push | OneSignal | 3.5.1 |
| Cron | Supabase Edge Functions | — |
| Testing | Vitest | 4.0.18 |
| Validation | Zod | 4.3.6 |
| Icons | Lucide React | 0.576.0 |
| PWA | Serwist | 9.5.6 |
| Query (Client) | TanStack Query (React Query) | 5.90.21 |
| PDF | jsPDF + @react-pdf/renderer | 4.2.0 / 4.3.2 |
| CSV/Excel | PapaParse + csv-parser + xlsx | — |

**Note:** `recharts` is referenced in project docs as "already used in admin analytics" but is **NOT installed** and has **zero imports** in the current codebase. This research treats it as a required addition.

---

## 2. New Stack Additions Needed

### 2.1 Charts & Data Visualization

| Library | Version | Why Needed | Feature Area |
|---------|---------|------------|--------------|
| **recharts** | `^3.8.1` | Bar charts for reseller analytics (`/app/desempenho`), line charts for admin dashboard fluxo de maletas, donut charts for status distribution. Already prescribed in SPECs (`SPEC_DESEMPENHO.md`, `SPEC_ADMIN_DASHBOARD.md`). | Analytics dashboards (PWA + Admin) |

**Rationale:** The project needs bar charts (visitas diárias), line charts (fluxo de maletas temporal), and donut/pie charts (distribuição por status). Recharts is React-native, tree-shakeable, and the team has already specced it. No need to introduce Chart.js or D3 complexity.

**Integration:** Wrap recharts components in Client Components ( `'use client'` ) since they use DOM refs. Use inside `<Suspense>` with skeleton fallbacks. Tailwind colors map directly via `fill="url(#gradient)"` or hex tokens from the design system.

**React 19 compatibility:** Recharts 3.8.1 is actively maintained and compatible with React 18+. No blocking issues with React 19 have been reported in the issue tracker as of May 2026.

---

### 2.2 Toast Notifications & Error Handling

| Library | Version | Why Needed | Feature Area |
|---------|---------|------------|--------------|
| **sonner** | `^2.0.7` | Standardized toast notifications for the `ActionResult` pattern. `SPEC_ERROR_HANDLING.md` explicitly references sonner, but it is **not installed** — the codebase currently uses ad-hoc inline toast divs in every admin page. | Centralized error handling |

**Rationale:** The `ActionResult<T>` pattern requires a unified toast layer. Currently each admin page reimplements its own toast with `useState` + `setTimeout` + fixed positioning. Sonner provides stackable toasts, auto-dismiss, promise toasts, and accessibility out of the box. It is lighter and simpler than `react-hot-toast` or `notistack`.

**Integration:** Mount `<Toaster />` once in the root layouts (`/app/layout.tsx` for PWA, `/admin/layout.tsx` for admin). Server Actions return `ActionResult`; client components call `toast.success()` / `toast.error()`. Supports the SPEC-mandated durations: success 3s, business error 5s, critical error 7s.

---

### 2.3 Form Handling

| Library | Version | Why Needed | Feature Area |
|---------|---------|------------|--------------|
| **react-hook-form** | `^7.75.0` | Complex forms in lead approval modal (select consultora + taxa), commission tier editor, contrato upload. `SPEC_ERROR_HANDLING.md` §7 explicitly prescribes "Zod + React Hook Form" for client-side validation. | Lead pipeline, Admin config |
| **@hookform/resolvers** | `^5.2.2` | Bridges `react-hook-form` with Zod v4 schemas. Required because the project uses Zod 4.3.6 for Server Action validation and wants to reuse the same schemas client-side. | Lead pipeline, Admin config |

**Rationale:** Manual form state (`useState` per field) is error-prone and verbose for multi-field modals like lead approval. React Hook Form provides uncontrolled form optimization (less re-renders), easy integration with Zod via resolvers, and built-in `isSubmitting` state for loading spinners. Version 7.75.0 adds TypeScript 6.0 support and fixes dirty-field pruning.

**Integration:** Reuse existing Zod schemas (e.g., `commissionTierSchema` in `SPEC_ADMIN_CONFIG.md`) in both Server Actions and client forms. No schema duplication. Works inside Radix Dialogs (already available via `radix-ui` package).

---

### 2.4 Date Manipulation

| Library | Version | Why Needed | Feature Area |
|---------|---------|------------|--------------|
| **date-fns** | `^4.1.0` | Time-range calculations for analytics ("Esta Semana", "Este Mes", "Últimos 30 días", "Este Año"), Paraguay timezone (`America/Asuncion`) handling, cron job date math, trend comparisons. | Analytics dashboards, Cron jobs |

**Rationale:** Native `Date` arithmetic is verbose and error-prone across month boundaries and timezone edges. Date-fns v4 is tree-shakeable (import only what you use), supports Paraguay timezone via `TZDate`, and has excellent TypeScript support. It is lighter than `moment` (which is deprecated) and more ergonomic than `luxon` for the simple date math this project needs.

**Integration:** Use in Server Actions for `getDateRange(rango)` helper and in cron Edge Functions for `check-maleta-prazo`. Pair with Prisma's `AT TIME ZONE 'America/Asuncion'` for database-level timezone consistency (already specced in `SPEC_ADMIN_ANALYTICS_NOTIFICATIONS.md`).

---

### 2.5 Notification Template Engine

**Decision: NO new library.**

Variable substitution (`{maleta_id}`, `{dias_restantes}`, `{nome_revendedora}`) is a simple regex replace. A dedicated template engine (Handlebars, Mustache, Nunjucks) is overkill for a system with ~7 template types and simple scalar variables.

**Implementation:**

```ts
// src/lib/notifications/substituir-variaveis.ts
export function substituirVariaveis(
  template: string,
  vars: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? `{${key}}`));
}
```

This is referenced in `PROJECT.md` Active items ("helper `substituirVariaveis`") and aligns with the `NotificacaoTemplate` schema in `SPEC_ADMIN_ANALYTICS_NOTIFICATIONS.md`.

---

## 3. Installation Commands

```bash
# Charts
npm install recharts@^3.8.1

# Toast / error handling
npm install sonner@^2.0.7

# Forms + Zod resolver
npm install react-hook-form@^7.75.0 @hookform/resolvers@^5.2.2

# Date manipulation
npm install date-fns@^4.1.0
```

**Total new runtime dependencies: 4 packages** (plus 1 resolver package).

---

## 4. Integration Notes with Existing Stack

### 4.1 Recharts + Tailwind v4 + Design System

- Recharts does not consume Tailwind classes directly for `fill`/`stroke`. Use design system hex tokens (e.g., `#35605a` → primary green) inline, or define SVG `<linearGradient>` elements inside chart components.
- Wrap all chart usage in `'use client'` components since Recharts reads DOM measurements via refs.
- Place inside `<Suspense fallback={<SkeletonCard />}>` to avoid blocking Server Component renders.

### 4.2 Sonner + ActionResult Pattern

- Mount `<Toaster />` in both `/app/layout.tsx` and `/admin/layout.tsx` with appropriate position (`bottom-center` for mobile PWA, `top-right` for desktop admin).
- Server Actions return `ActionResult<T>`. Client components consume it:
  ```ts
  const result = await createMaleta(data);
  if (!result.success) toast.error(result.error, { duration: 5000 });
  else toast.success('Consignación creada exitosamente.', { duration: 3000 });
  ```
- Sonner's `toast.promise()` is ideal for async Server Actions with loading states.

### 4.3 React Hook Form + Zod + Radix UI

- The project already has `radix-ui` (v1.4.3) installed, providing Dialog, Select, Tabs, Checkbox, etc. Use these for accessible form UI.
- Reuse Zod schemas from Server Actions in client forms via `@hookform/resolvers/zod`:
  ```ts
  const form = useForm<CommissionTierInput>({
    resolver: zodResolver(commissionTierSchema),
  });
  ```
- This avoids duplicating validation logic between client and server.

### 4.4 Date-fns + Prisma + Paraguay Timezone

- Use `date-fns` for client-friendly date formatting (e.g., `format(dia, 'dd/MMM')` for chart axes).
- Use Prisma's `AT TIME ZONE 'America/Asuncion'` for database aggregations (already in SPEC).
- For cron jobs, use `date-fns` to compute `startOfMonth`, `endOfMonth`, `subDays`, etc. in the Edge Function before passing to Prisma queries.

### 4.5 TanStack Query Integration (Already Installed)

- TanStack Query (`@tanstack/react-query` v5.90.21) is installed but appears lightly used. For the analytics dashboards with interactive period filters, wrap `getMetricasDesempenho` and `getDashboardData` in `useQuery` hooks to get caching, refetching, and `isPending` states for free.
- This pairs well with React Hook Form: form submit invalidates query cache, UI auto-refreshes.

---

## 5. Build Optimization (No New Libraries)

**Problem:** Public pages (`/`, `/catalogo`, `/produto/[slug]`, `/vitrina/[slug]`) currently use `export const dynamic = 'force-dynamic'` as a workaround because Vercel build fails without a valid `DATABASE_URL` during static generation.

**Solution (configuration only):**

1. **Configure `DATABASE_URL` in Vercel** as a build-time environment variable (not just runtime). The connection string must be accessible to Prisma during `next build`.
2. **Replace `force-dynamic` with ISR** on public pages:
   ```ts
   export const revalidate = 60;
   ```
   This is already the prescribed strategy in `SPEC_CACHING_STRATEGY.md` §8.
3. **Ensure Prisma generate runs before build** — already in `package.json` scripts:
   ```json
   "build": "prisma generate && next build"
   ```
4. **Verify `max` pool size** in `src/lib/prisma.ts` is set to `10` for serverless (already mentioned in `CLAUDE.md` §3.3).

**No new dependencies required.** This is purely Vercel dashboard config + code removal.

---

## 6. What NOT to Add (Avoid Bloat)

| Category | What to Skip | Why |
|----------|-------------|-----|
| **State Management** | Zustand, Redux, Jotai | Next.js Server Components + Server Actions + URL state eliminate the need for global client state. TanStack Query (already installed) covers server state caching. |
| **Template Engine** | Handlebars, Mustache, Nunjucks | 7 notification templates with scalar variable substitution — regex is sufficient and zero-dependency. |
| **Secondary Chart Library** | Chart.js, Victory, Tremor | Recharts covers all chart types needed (bar, line, donut). Adding a second chart library fragments the visual language and increases bundle size. |
| **Date Library** | Moment.js, Luxon | Moment is deprecated and heavy. Luxon is powerful but overkill for simple range math and formatting. date-fns v4 is tree-shakeable and ideal. |
| **Form Library** | Formik | React Hook Form is lighter, faster, and has better Zod integration. Formik is no longer the community default. |
| **UI Component Library** | shadcn/ui add-ons, Material UI | Radix UI primitives are already installed. Build components with Tailwind + Radix to maintain design system consistency. |
| **Analytics/BI** | Apache ECharts, Metabase embed | The project needs operational dashboards, not a full BI suite. Recharts + Prisma aggregations are sufficient for v1.0. |
| **Build Tools** | @vercel/postgres, next-on-pages | Prisma + Supabase works correctly on Vercel. No need to swap the database adapter. |

---

## 7. Version Confidence Assessment

| Library | Version | Confidence | Notes |
|---------|---------|------------|-------|
| recharts | 3.8.1 | **HIGH** | Verified via GitHub releases. Active maintenance. Compatible with React 18+. No React 19 blockers found. |
| sonner | 2.0.7 | **HIGH** | Verified via GitHub releases. Lightweight, stable. Works with React 19. |
| react-hook-form | 7.75.0 | **HIGH** | Verified via GitHub releases. Latest stable. Explicitly supports TypeScript 6.0. |
| @hookform/resolvers | 5.2.2 | **HIGH** | Verified via GitHub releases. Fixes Zod 4 resolver compatibility (critical for this project). |
| date-fns | 4.1.0 | **HIGH** | Verified via GitHub releases. v4 adds timezone support to format functions, directly relevant for `America/Asuncion`. |

---

## 8. Feature-to-Stack Mapping

| Milestone Feature | New Stack Addition | Existing Stack Used |
|-------------------|-------------------|---------------------|
| Notification template engine (variable substitution) | None — regex helper | Prisma (`NotificacaoTemplate`), OneSignal, Brevo, Supabase Edge Functions |
| Analytics dashboard (reseller `/app/desempenho`) | recharts, date-fns | Prisma (`AnalyticsAcesso`, `AnalyticsDiario`), TanStack Query, Tailwind |
| Admin dashboard (global/group KPIs) | recharts, date-fns | Prisma (`maleta`, `reseller`), RLS, Tailwind |
| Lead pipeline (`/admin/leads`) | react-hook-form, @hookform/resolvers, sonner | Prisma (`RevendedoraLead`), Supabase Auth, Brevo, Radix UI |
| Admin config (tiers, levels, contracts) | react-hook-form, @hookform/resolvers, sonner | Prisma (`CommissionTier`, `Contrato`), R2 upload API, Radix UI |
| Centralized error handling (`ActionResult`) | sonner | Zod, existing `mapError` helper, Sentry (future) |
| Skeleton/empty/error states | None — pure components | Tailwind, React `Suspense`, design system tokens |
| Build optimization (remove `force-dynamic`) | None — config only | Vercel env vars, ISR (`revalidate`), Prisma |

---

## 9. Risk Notes

1. **Recharts + React 19:** While no blocking issues were found, recharts uses `ReactDOM.render` internally in some legacy paths. Monitor for hydration warnings in dev. If issues arise, wrap charts in a client-only boundary.
2. **Zod 4 + @hookform/resolvers:** The resolver package at v5.2.2 explicitly fixes Zod 4 output types. Do NOT use v5.2.1 or earlier, as they may have type mismatches with Zod 4's `.pipe()` and `.transform()`.
3. **Date-fns v4 timezone:** Requires `TZDate` v1.0.2+ for Paraguay timezone support. Install alongside date-fns if using named timezones beyond simple offset math.
4. **Sonner in dual layouts:** PWA and Admin have separate root layouts. Ensure `<Toaster />` is mounted in both, with distinct `richColors` and position props appropriate to each viewport.

---

## Sources

- GitHub Releases (verified): recharts/recharts v3.8.1, emilkowalski/sonner v2.0.7, react-hook-form/react-hook-form v7.75.0, react-hook-form/resolvers v5.2.2, date-fns/date-fns v4.1.0
- Project SPECs: `SPEC_DESEMPENHO.md`, `SPEC_ADMIN_DASHBOARD.md`, `SPEC_ADMIN_LEADS.md`, `SPEC_ADMIN_CONFIG.md`, `SPEC_ERROR_HANDLING.md`, `SPEC_SKELETON_EMPTY_STATES.md`, `SPEC_CACHING_STRATEGY.md`, `SPEC_ADMIN_ANALYTICS_NOTIFICATIONS.md`
- Current codebase audit: `package.json`, grep results for installed/ missing packages
