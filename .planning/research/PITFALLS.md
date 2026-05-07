# Domain Pitfalls — v1.3 Feature Integration

**Project:** NEXT-MONARCA
**Researched:** 2026-05-07
**Scope:** Pitfalls specific to adding v1.3 features to the existing production system.

---

## 1. Email Template DB Editing

### 1.1 XSS via admin-edited HTML injected into emails

**Problem:** When an admin edits an email template body in the UI and that HTML is stored in the DB and later passed directly to `sendEmail({ htmlContent })`, any `<script>`, event handler, or `javascript:` href in the body reaches the recipient's inbox. Modern email clients strip most active content, but some (`<img onerror=...>`, CSS expression) survive in older clients. More critically, if the admin-edited HTML is ever rendered in the browser (e.g., a preview pane using `dangerouslySetInnerHTML`), the XSS executes in the admin's own browser — allowing session theft.

**Why it happens:** The existing `renderEmailBase()` function in `email-base.ts` is explicitly documented as "presentation pure — consumers MUST sanitize inputs." The existing email templates call `escapeHtml()` on individual text variables but were never designed to accept a raw HTML body from a database field. Storing a rich HTML body breaks this assumption entirely. The existing `sanitizeTemplateVars()` in `notifications-server.ts` was designed for push notification plain text — its regex whitelist (`b`, `i`, `strong`, `em`, `br`, `p`, `a`) has a known bypass: `href='javascript:...'` (single quotes) passes through the current rule, which only blocks `href="javascript:..."` in double quotes. The regex is insufficient for HTML email bodies.

**Prevention:**
- Store templates as a structured object (`subject: string, bodyParts: EmailContent[]`) rather than raw HTML blobs. If HTML must be stored, sanitize on read-out (at the point of calling `sendEmail()`), not on write-in. Sanitizing on write silently corrupts legitimate content added by future admins.
- Run the stored HTML through `sanitize-html` (maintained, allowlist of tags plus attributes, no DOM runtime, no ESM/Turbopack SSR issues) rather than the existing regex approach. The regex in `notifications-server.ts` is not sufficient for HTML email bodies.
- For the in-admin preview pane, never use `dangerouslySetInnerHTML`. Render the preview inside a sandboxed `<iframe srcDoc={sanitizedHtml}>` — the iframe sandbox attribute blocks JS execution and same-origin access.
- RBAC: the `/admin/config/emails` route must be `ADMIN`-only, matching the existing pattern in `/admin/config/notif-push/page.tsx`.

**Phase to address:** Phase 1 (template CRUD server action) — sanitization must be in place before the first save action is written, not added later.

---

### 1.2 Migration breaking the 7 hardcoded templates

**Problem:** The 7 existing transactional email templates are hardcoded TypeScript functions in `src/lib/email-templates/*.ts` and are called directly by server actions (e.g., `emailDocumentoAprovado()` in document approval actions, `emailCandidaturaAprovada()` in lead approval). If the v1.3 implementation stores template content in the DB and the server actions are refactored to read from the DB, a missing or malformed DB row causes the email to silently fail — `sendEmail()` already swallows errors with `console.error`. The CI pipeline has no email integration tests.

**Why it happens:** The current architecture has zero coupling between the `NotificacaoTemplate` DB table (push notifications) and the email system (hardcoded TypeScript). If v1.3 introduces a parallel `EmailTemplate` model, any migration that deletes or renames existing code paths before the DB is seeded will break the email flow. The existing `CONCERNS.md` entry #2 documents a related problem: the push `NotificacaoTemplate` table is populated but the send logic still uses hardcoded strings — the pattern of "table exists, code ignores it" has already happened once.

**Prevention:**
- Do not replace the hardcoded TypeScript functions. Keep them as the canonical fallback. Implement a `getEmailTemplate(tipo)` helper that reads from DB and falls back to the hardcoded function if the row is absent or inactive.
- Seed the DB with the current template content as the initial values when the `EmailTemplate` migration runs. Use a Prisma seed script, not a manual admin action. A missing seed = silent email failure = hard to diagnose in production.
- The new `EmailTemplate` Prisma model needs a `tipo` field with a unique constraint matching the enum values used in code. If this constraint is wrong, the fallback lookup will fail to find rows even when they exist.

**Phase to address:** Phase 1 (DB migration + seed).

---

### 1.3 Brevo rate limit exhaustion via test-send button

**Problem:** The free tier allows 300 emails/day. A test-send button in the admin editor that calls `sendEmail()` on each click has no rate limit. An admin could accidentally exhaust the daily quota during a template editing session, blocking all transactional emails (document approvals, lead welcome emails) for the rest of the day. The existing `sendEmail()` swallows errors, so a 429 from Brevo will log silently — the admin sees no feedback.

**Why it happens:** The existing `rateLimiters` in `src/lib/rate-limit.ts` covers `trackEvento`, `upload`, and `passwordReset`. There is no email send limiter. The Upstash fallback (`checkRateLimit` returns `{ success: true }` when Redis is not configured) means test environments also have no gate.

**Prevention:**
- Gate the test-send action behind a per-user Upstash rate limit: `Ratelimit.fixedWindow(5, "1 h")` keyed on the admin's user ID. This mirrors the existing `passwordReset` limiter pattern in `rate-limit.ts`.
- The test-send must always send to the authenticated admin's own email address. Validate the recipient server-side against `user.email` from `getCurrentUser()`. Never accept an arbitrary address from the request body.
- Log every test-send call (template ID, sender user ID, timestamp) to the existing structured logger so quota exhaustion events are traceable in Sentry.
- Propagate the Brevo 429 error back to the UI as a toast rather than swallowing it. The current `sendEmail()` catch block must be bypassed or the test-send path should not use `sendEmail()` directly.

**Phase to address:** Phase 1 (test-send server action).

---

## 2. Custom Date Range Analytics

### 2.1 UTC midnight vs Asuncion midnight in `getSinceDate`

**Problem:** The existing `getSinceDate(days)` function in `actions-analytics.ts` does:

```ts
const d = new Date();
d.setHours(0, 0, 0, 0);
```

`setHours(0,0,0,0)` sets UTC midnight because Vercel serverless functions run in UTC. Paraguay (America/Asuncion) is UTC-4 in winter (April to September) and UTC-3 in summer (October to March). UTC midnight = 8pm or 9pm Asuncion time of the previous day. The existing fixed-period buttons (7d, 30d, 90d, 365d) have this flaw silently, but it is invisible at coarse period granularity. A custom date range picker that lets the admin select a specific day makes the error immediately visible: selecting "May 7" would include records from May 6 20:00 Asuncion time.

**Why it happens:** The flaw is pre-existing in the codebase. `getSinceDate` is called at 7 locations in `actions-analytics.ts`. The day-fill loop uses `toISOString().slice(0, 10)` which produces UTC date strings, compounding the mismatch. A custom date range exposes it because the user has explicit date expectations.

**Prevention:**
- Fix `getSinceDate` to compute Asuncion-local midnight in UTC at the same time the custom range feature is added. A partial fix (custom range correct, fixed periods wrong) would create visible inconsistency between the two picker modes.
- The simplest correct approach: receive the date as a `YYYY-MM-DD` string and append the Paraguay offset: `new Date(`${dateStr}T00:00:00-04:00`)` for the conservative winter offset. For DST-aware handling, use `date-fns-tz` (`fromZonedTime(date, 'America/Asuncion')`), which handles the DST transition correctly.
- The fix must be applied to all 7 `getSinceDate` call sites and to the day-fill loops that use `d.toISOString().slice(0, 10)` — these must produce Asuncion-local date strings, not UTC date strings.
- Note: `formatDatePY` in `analytics/page.tsx` correctly uses `timeZone: 'America/Asuncion'` for display. The bug is only on the query boundary, not on display.

**Phase to address:** Phase 1 (date range picker server action) — fix `getSinceDate` at the same time the custom range is added. Do not defer to a later cleanup.

---

### 2.2 Unbounded date ranges causing slow Prisma queries

**Problem:** A custom date range picker with no server-side validation allows an admin to query "all time" or a multi-year range. The existing analytics page uses `Promise.all` with 10+ concurrent Prisma calls plus raw SQL. Several queries (`getAnalyticsFluxoMaletas`, `getVitrinaVisitasSeries`) generate one entry per day in the result by filling gaps in a loop. A 5-year range = 1825 loop iterations, 10+ concurrent database queries each scanning large timestamp ranges.

**Why it happens:** The current period options are validated via `PERIOD_OPTIONS.some(...)` with a `redirect` on mismatch in the page component. This validation is in the page route, not in the server action. A custom range passed directly to a server action bypasses this gate.

**Prevention:**
- Enforce a maximum date range server-side in the analytics server action: reject ranges over 366 days with a `BusinessError`. Return the error as `ActionResult<T>` so the UI can surface it as a toast.
- Validate that `startDate <= endDate` and that both are valid ISO date strings using Zod `z.string().regex(/^\d{4}-\d{2}-\d{2}$/)` (already available in the codebase).
- For the day-fill loop, cap the iteration count: `const days = Math.min(daysBetween(start, end), 366)`.
- The vitrina analytics queries use raw SQL (`$queryRawUnsafe`) with `WHERE ad.data >= $1`. The `data` column on `analytics_diario` must have an index. Verify this in `prisma/migrations/` before enabling custom ranges.

**Phase to address:** Phase 1 (custom range server action validation) — validation before query execution.

---

### 2.3 Date string client/server timezone mismatch

**Problem:** Browser date pickers (`<input type="date">`) return a `YYYY-MM-DD` string representing the user's local date. If the frontend converts this to a `Date` object and calls `.toISOString()` before sending to the server, the browser applies its own UTC offset, producing a time component that is not midnight in Paraguay. An admin in Brazil (UTC-3) sending "May 14" as `new Date("2026-05-14").toISOString()` produces `"2026-05-14T03:00:00.000Z"` — which is May 14 in Asuncion, but an admin in Spain (UTC+2) would produce `"2026-05-13T22:00:00.000Z"` — May 13 in Paraguay.

**Why it happens:** This is a standard date picker trap. The existing analytics page passes period as a plain integer in URL params (`?period=30`). A custom range adds the first case of passing dates, introducing timezone exposure that did not exist before.

**Prevention:**
- Send date boundaries from the client as plain `YYYY-MM-DD` strings — the raw value of `<input type="date">`, not converted to a `Date` object. Pass them as URL search params (`?from=2026-05-01&to=2026-05-14`) consistent with how `?period=30` works today.
- The server action receives the string and applies the Paraguay timezone offset (see 2.1). Never convert date picker values to ISO timestamp on the client.
- Validate the string format server-side with Zod before parsing.

**Phase to address:** Phase 1 (date picker component and URL param handling).

---

## 3. Admin UI Refactoring

### 3.1 Regressions from broad refactor scope

**Problem:** The admin UI has 36+ TSX files with hardcoded hex color values (`#35605a`, `#0a0a0a`, `#888888`, etc.) that bypass the `--admin-*` CSS variables. A refactor sweeping all files to replace these values risks introducing unintended visual changes in pages that were previously working correctly. The risk is compounded because many of these inline styles are in Server Components with no visual snapshot tests.

**Why it happens:** The `admin.css` CSS variables are defined correctly but were not consistently adopted during development. A "replace all hex" pass touches dozens of files simultaneously, increasing merge conflict surface and the chance of a visual regression going undetected. The analytics page alone (`analytics/page.tsx`) is ~640 lines of inline-styled Server Component JSX.

**Prevention:**
- Scope the refactor to one admin section per story/commit, not a single sweep. Prioritize pages that have corresponding Paper artboards.
- Before touching any file, take a browser screenshot as a baseline. After the change, compare visually.
- Add CSS variable definitions to `admin.css` for any missing tokens before refactoring code. Do not introduce new token definitions inside component files.
- The `analytics/page.tsx` file is the riskiest single target — it is a Server Component with dozens of inline hardcoded hex values and no visual tests. Treat it as a dedicated story, not part of a sweep.

**Phase to address:** Dedicated refactor phase — do not mix with feature additions.

---

### 3.2 Dark theme breaking if CSS variable scope changes

**Problem:** All `--admin-*` variables are defined on `:root` in `admin.css`. This means they are globally scoped and always apply (the admin is always dark). If the refactor changes the scope to `.admin-layout` or introduces a `data-theme` attribute approach, any component that references `var(--admin-bg)` outside `.admin-layout` will lose the variable and render with `transparent` or browser defaults. Radix UI `Dialog`, `DropdownMenu`, and `Popover` use React portals that render as direct children of `<body>`, outside the admin layout DOM tree.

**Why it happens:** The current `:root` scope works precisely because it avoids the portal problem. Narrowing the scope is a natural refactoring instinct ("make styles more specific") but breaks portals.

**Prevention:**
- Do not change the CSS variable scope from `:root`. The always-dark admin is intentional and the `:root` scope is load-bearing for Radix UI portals.
- If a light-theme admin mode is ever needed, use a `data-theme="dark"` attribute on `<html>` (not on `.admin-layout`) so portals still inherit the theme.
- When adding new CSS variables in v1.3, add them to the existing `:root` block in `admin.css`, not in component-scoped `<style>` tags.

**Phase to address:** Awareness before any refactor begins — this is a constraint, not a task.

---

### 3.3 Paper artboard mismatch causing wasted implementation

**Problem:** If a developer implements a refactored UI component based on memory or existing code alone, and the Paper artboard shows a different layout (different spacing, card structure, font size), the implementation must be rebuilt after the Paper review. This is a double-cost.

**Why it happens:** The CLAUDE.md mandates Paper MCP consultation before any UI work, but under time pressure this step is skipped. The existing analytics page has a custom bar chart and donut chart built in inline SVG that may not match Paper artboards.

**Prevention:**
- Before writing any JSX for the refactor, read the corresponding Paper artboard node via MCP: `mcp__plugin_paper-desktop_paper__get_jsx` and `get_computed_styles`. Compare against the existing implementation.
- If a Paper artboard does not exist for a specific admin section, pause and ask before implementing. Do not invent layout.
- Explicitly scope the refactor story: "only pages that have Paper artboards." Pages without artboards are deferred.

**Phase to address:** Before the refactor phase begins (scope definition).

---

## 4. Next.js 16.1.6 to 16.2.3 Upgrade

### 4.1 TypeScript type changes break build before code runs

**Problem:** The analytics page already uses the correct async `searchParams` pattern (`searchParams: Promise<{ period?: string; reseller?: string }>`). However, Next.js minor versions between 16.1 and 16.2 have historically changed the TypeScript types for `params`, `searchParams`, `cookies()`, and `headers()`. A type change that the code does not accommodate produces TypeScript errors that block the build — discovered only when `npm run typecheck` is run.

**Why it happens:** Next.js ships breaking TypeScript type changes in minor versions when they align with RSC or async API improvements. The jump from 16.1.6 to 16.2.3 spans multiple minor releases.

**Prevention:**
- After bumping `next` in `package.json`, run `npm run typecheck` as the very first step — before starting the dev server, before running any other test. Typecheck catches breaking type changes immediately and gives clear error messages.
- Run the full CI suite (`lint + typecheck + test + build`) in a single commit dedicated solely to the version bump. Do not bundle the Next.js upgrade with feature work.
- Read the Next.js 16.2 release notes and changelog before upgrading. Look specifically for `searchParams`, `params`, `cookies`, `headers`, and `generateMetadata` changes.

**Phase to address:** Dedicated upgrade phase, isolated from all other v1.3 changes.

---

### 4.2 Serwist PWA build breaks silently after Next.js upgrade

**Problem:** `@serwist/next@9.5.6` patches Next.js's build pipeline to inject the service worker manifest (`__SW_MANIFEST`). A Next.js minor upgrade may change internal build hooks that Serwist depends on, breaking SW compilation. The symptom is a build that succeeds but a PWA that does not work at runtime: the SW is not registered, or the precache is empty. This is hard to detect without a PWA-specific test — the existing CI checks lint, typecheck, and unit tests, not PWA registration.

**Why it happens:** The project already had one Serwist-related SSR crash (`isomorphic-dompurify` + Turbopack, fixed in `af54cc3`). `@serwist/next` is version-sensitive to Next.js internals. The `sw.ts` file uses `defaultCache` from `@serwist/next/worker` — this import path is a common breakage point between versions.

**Prevention:**
- Check the Serwist GitHub releases for Next.js 16.2 compatibility before upgrading. If no explicit mention, check open issues tagged `next.js`.
- After the upgrade, manually verify the PWA in Chrome DevTools: Application tab > Service Workers — confirm the SW is registered and the precache list contains expected routes.
- If Serwist breaks, pin Next.js at the last working version and open a Serwist issue. Do not attempt to patch Serwist internals. The v1.4 Capacitor migration is the planned exit from Serwist.

**Phase to address:** Upgrade phase — verify PWA immediately after the build passes, before merging.

---

### 4.3 Sentry `withSentryConfig` wrapper incompatibility

**Problem:** `next.config.ts` wraps the config in `withSentryConfig(nextConfig, ...)`. Sentry's Next.js SDK version-pegs to Next.js major and minor versions. An upgrade to 16.2.3 may require a Sentry SDK update. If the versions are mismatched, the build may fail on the `withSentryConfig` wrapper, or Sentry's source map upload step may error and leave the CI in an ambiguous state.

**Prevention:**
- Check `@sentry/nextjs` peer dependency requirements against the target Next.js version before upgrading.
- If the Sentry SDK needs an upgrade, include it in the same version-bump PR.
- If the build fails and the cause is unclear, temporarily remove `withSentryConfig` wrapping to isolate whether Next.js itself or Sentry is the problem.

**Phase to address:** Upgrade phase.

---

## 5. Snyk Dependency Management

### 5.1 `npm audit fix --force` breaks Prisma transitive dependencies

**Problem:** `npm audit` shows 23 vulnerabilities (8 moderate, 14 high, 1 critical). Several are in Prisma's internal dev toolchain: `@prisma/dev` depends on `@hono/node-server` (high) and `hono` (high); `@prisma/config` depends on `effect` (high) and `defu` (high). Running `npm audit fix --force` will attempt to forcibly upgrade these to the minimum safe version, which may break Prisma 7.4.2's peer dependency chain. Prisma 7 has strict requirements on `@prisma/adapter-pg` and `pg` — a forced transitive upgrade could make the database connection fail at runtime.

**Why it happens:** `--force` overrides semver ranges and ignores peer dependency warnings. The Prisma CLI toolchain (`@prisma/dev`) is separate from the runtime `@prisma/client`, but `npm` does not always cleanly distinguish these in its resolution tree.

**Prevention:**
- Never run `npm audit fix --force` on this project. Address vulnerabilities one package at a time with explicit version pins.
- For `brace-expansion` (moderate, fix available via safe semver): run `npm audit fix` without `--force`. This applies only semver-compatible upgrades. Verify Prisma still generates and connects after.
- For `defu`, `effect`, `@hono/node-server` in Prisma internals: these are Prisma CLI development dependencies, not the production `@prisma/client` that the app uses at runtime. The CVEs affect Prisma's own build/migration tooling, not the generated client. The blast radius is limited to local `prisma migrate` and `prisma generate` runs in the development environment. Not a production runtime risk for the Monarca app.
- Document the decision explicitly in CONCERNS.md: "Prisma internal dev dependency CVEs (effect, defu, @hono/node-server) are accepted as low-risk. The Prisma client runtime is not affected."

**Phase to address:** Phase 1 (Snyk audit) — triage and document; only auto-fix safe packages with `npm audit fix` (no force).

---

### 5.2 `xlsx` has no fix — CVE exposure with missing auth guard

**Problem:** `xlsx@0.18.5` has two high-severity CVEs with no fix available (the package is abandoned):
- `GHSA-4r6h-8v6p-xvw6`: Prototype Pollution
- `GHSA-5pgg-2g8v-p4x9`: ReDoS

More urgently: the export route `src/app/api/export/route.ts` has NO authentication check. It does not call `requireAuth()` or `getCurrentUser()`. The route returns full product catalog, reseller names, whatsapp numbers, and maleta data to anyone who calls it. The middleware validates the session cookie but does not block unauthenticated requests to `/api/*` routes — it only redirects the browser. A direct `fetch('/api/export?type=revendedoras')` from a browser without a session cookie would succeed because the route handler does not check auth.

**Blast radius of xlsx CVEs for current usage:** The Prototype Pollution and ReDoS CVEs are in the `xlsx.read()` parsing path. This route uses only `xlsx.utils.json_to_sheet()` and `xlsx.write()` (output path). The CVEs are not triggered by the current code path. The missing auth guard is a higher severity issue than the CVEs.

**Prevention:**
- Add `requireAuth(["ADMIN", "COLABORADORA"])` to both the xlsx export route and the PDF export route immediately. This is the highest priority fix in this area.
- For xlsx replacement: migrate to `exceljs` (maintained, no known CVEs, similar API). This is a separate story — do not block the auth guard fix on the replacement.
- Do not delete `xlsx` without the replacement ready. The relatorios export is a real feature used in production.
- Document: "xlsx CVEs are accepted risk for the current `json_to_sheet`-only usage pattern. Auth guard added. Replace with exceljs in v1.4."

**Phase to address:** Phase 1 — add auth guard to both export routes immediately. xlsx replacement is Phase 2 or v1.4.

---

### 5.3 `jspdf` critical CVE — fix available but peer dependency risk

**Problem:** `jspdf@4.2.0` has two CVEs rated critical:
- `GHSA-7x6v-j9x4-qf24`: PDF Object Injection via FreeText annotation color
- `GHSA-wfv2-pwc8-crg5`: HTML Injection in "New Window" paths

`npm audit` reports a fix is available. The PDF export route `src/app/api/export/pdf/route.ts` also has no `requireAuth()` call (same problem as xlsx route).

**Prevention:**
- Add `requireAuth(["ADMIN", "COLABORADORA"])` to the PDF export route immediately (same fix as xlsx route — both can be done in one PR).
- Run `npm install jspdf@latest` to apply the CVE fix. Do not use `--force`. Verify the `jspdf-autotable` plugin still works after the upgrade — it has its own peer dependency on a jspdf major version. Check `jspdf-autotable`'s peer deps before upgrading. If they conflict, pin both at the patched minimum jspdf version.
- After upgrading, run the existing relatorios PDF export manually and verify the output is still correct.

**Phase to address:** Phase 1 — auth guard first, then version upgrade in the same PR.

---

## Phase-Specific Warning Summary

| Phase Topic | Pitfall | Mitigation |
|-------------|---------|------------|
| Email template CRUD — server action | XSS via stored HTML body in preview pane | Sandbox preview in `<iframe srcDoc>`, use `sanitize-html` on read-out, not regex |
| Email template CRUD — test-send | Brevo quota exhaustion | Rate limit per user ID (5/hour), send only to admin's own email |
| Email template migration | DB row missing = email silent fail | Keep hardcoded TypeScript functions as fallback; seed on migration |
| Custom date range — server action | UTC boundary miscalculates Asuncion day | Fix `getSinceDate` at all 7 call sites to use America/Asuncion offset simultaneously |
| Custom date range — picker component | Client converts date to ISO string with UTC offset | Send `YYYY-MM-DD` string in URL params; server applies timezone |
| Custom date range — validation | Multi-year range = slow queries | Zod validate, enforce max 366 days server-side, cap loop iterations |
| Admin UI refactor | Radix UI portals lose CSS vars if scope narrows | Keep `--admin-*` on `:root`, never narrow to `.admin-layout` |
| Admin UI refactor | Hardcoded hex regression in 36+ files | One section per commit, screenshot baseline before/after |
| Admin UI refactor | No Paper artboard = invented layout | Block refactor of pages without artboards until Paper is updated |
| Next.js 16.2.3 upgrade | TypeScript type break on `searchParams`/`params` | Run `npm run typecheck` before `dev` server; dedicate one PR to the bump |
| Next.js 16.2.3 upgrade | Serwist SW compilation break | Verify PWA registration in Chrome DevTools after build, before merge |
| Next.js 16.2.3 upgrade | Sentry `withSentryConfig` incompatibility | Check `@sentry/nextjs` peer deps; upgrade in same PR if needed |
| Snyk — `npm audit fix` | `--force` breaks Prisma peer dep chain | Never use `--force`; fix packages individually |
| Snyk — xlsx + jspdf routes | Both export routes have no auth guard — data leak | Add `requireAuth(["ADMIN","COLABORADORA"])` to both routes in Phase 1 |
| Snyk — xlsx | No fix available; ongoing CVE | Accept risk for `json_to_sheet`-only usage; plan exceljs migration in v1.4 |
| Snyk — jspdf | Fix available | `npm install jspdf@latest`, verify `jspdf-autotable` peer dep compatibility |

---

*Research date: 2026-05-07. Codebase state: v1.2 shipped, v1.3 planning.*
