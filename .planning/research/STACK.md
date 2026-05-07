# Technology Stack — v1.3 Additions

**Project:** next-monarca  
**Milestone:** v1.3 Polimento, Segurança e UX Admin  
**Researched:** 2026-05-07  
**Overall confidence:** HIGH (all findings verified via npm registry, Context7, direct audit output)

---

## Summary

v1.3 requires zero new runtime library categories. The four features map to:
1. **Date range picker** — add `react-day-picker@9.14.0` (brings `date-fns` as a direct dep; no other dep needed)
2. **Email template editor** — no new library; use a native `<textarea>` approach described below
3. **Next.js update** — bump to `16.2.5` (not 16.2.3; npm audit identifies 16.2.5 as the clean fix version)
4. **Vulnerability fixes** — upgrade serwist to `9.5.11` (fixes brace-expansion transitively); overrides are a fallback only

The `next.config.ts` already uses `turbopack: {}` at the top level, which is the correct structure for Next.js 16. No config migration needed.

---

## Date Range Picker

### Recommendation: `react-day-picker@9.14.0`

**Why this library:**
- Already the underlying engine for shadcn/ui Calendar components — consistent with the project's Radix UI ecosystem
- The shadcn/ui "Calendar" and "Date Range Picker" recipes are thin wrappers over react-day-picker; adding the library directly allows the same component pattern without adding another abstraction
- First-class `mode="range"` support with `DateRange` type, `min`/`max` day constraints, and `excludeDisabled`
- Full Tailwind CSS v4 integration via the `classNames` prop using `getDefaultClassNames()` as a base — no separate stylesheet import required
- React 19 compatible (peerDep: `>=16.8.0`, actively used with React 19 in the current shadcn ecosystem)

**Bundle impact:** ~1.3MB unpacked, ~40KB gzip. Brings `date-fns@^4.1.0` and `@date-fns/tz@^1.4.1` as direct deps. `date-fns` is not currently in the project, so this is a real addition. For an admin-only feature this is acceptable; the bundle is tree-shaken per route.

**Confidence: HIGH** — verified via npm info, Context7 docs

**Why NOT native `<input type="date">` pair:**
The analytics page validates the `period` param as an integer day count. Switching to `from`/`to` ISO date strings is a more significant refactor of `getAnalyticsKPIs` and all downstream action signatures (currently 8 functions take `periodDays: number`). A date picker component provides visual range feedback essential for multi-week selections. Native date inputs on admin desktop are fine but give no range highlighting or min/max day enforcement.

**Integration pattern:**

```tsx
// src/components/admin/DateRangePicker.tsx
"use client";
import { useState } from "react";
import { DayPicker, getDefaultClassNames, type DateRange } from "react-day-picker";

interface Props {
  onRangeSelect: (range: DateRange | undefined) => void;
  initialRange?: DateRange;
  maxDays?: number; // default: 365
}

export function DateRangePicker({ onRangeSelect, initialRange, maxDays = 365 }: Props) {
  const [range, setRange] = useState<DateRange | undefined>(initialRange);
  const defaultClassNames = getDefaultClassNames();

  const handleSelect = (r: DateRange | undefined) => {
    setRange(r);
    onRangeSelect(r);
  };

  return (
    <DayPicker
      mode="range"
      selected={range}
      onSelect={handleSelect}
      max={maxDays}
      disabled={{ after: new Date() }}
      classNames={{
        root: `${defaultClassNames.root} bg-[var(--admin-surface)] rounded-lg border border-[var(--admin-border)] p-4`,
        today: "border border-[var(--admin-primary)]",
        selected: "bg-[var(--admin-primary)] text-white rounded",
        range_start: "rounded-l bg-[var(--admin-primary)] text-white",
        range_end: "rounded-r bg-[var(--admin-primary)] text-white",
        range_middle: "bg-[var(--admin-primary-light)] text-[var(--admin-text)]",
      }}
    />
  );
}
```

**URL param strategy for analytics page:**
Extend `searchParams` with `from` and `to` ISO date strings (YYYY-MM-DD). When both are present, bypass the `periodDays` integer and pass explicit dates to actions. Add a `"custom"` option to `PERIOD_OPTIONS` that renders the picker popover. The existing presets continue to work unchanged.

**Installation:**
```bash
npm install react-day-picker@9.14.0
```

---

## Email Template Editor Approach

### Recommendation: Native `<textarea>` — NO new library

**Verdict: Raw textarea is correct for this use case.**

**Context from codebase:** The project already stores and renders push notification templates via `NotificacaoTemplate` (Prisma model) with a `substituirVariaveis` helper and a DOMPurify-based sanitizer. Email templates are currently hardcoded HTML strings in `src/lib/emails.ts` called via `sendEmail({ htmlContent, textContent })`. The goal is to move the HTML body and subject into DB records editable via the admin panel.

**Why not WYSIWYG (e.g., TipTap, Quill, React Quill):**
- Brevo sends raw HTML; what the admin edits must match exactly what Brevo sends. A WYSIWYG editor produces its own HTML dialect (often with inline styles or span wrappers) that diverges from the branded `renderEmailBase()` wrapper the project already uses.
- The admin users for Monarca are 1-3 internal operators, not marketing teams needing a drag-and-drop canvas.
- WYSIWYG editors add 200-500KB to bundle and are notoriously hard to style within Tailwind v4 constraint environments.
- The existing push notification template editor (v1.0) already established the pattern: textarea + variable chip insertion. Email templates should follow the same pattern for consistency.

**Recommended approach:**
1. Create an `EmailTemplate` Prisma model with fields: `id`, `slug` (e.g., `"convite_revendedora"`), `subject`, `htmlBody`, `textBody`, `updatedAt`
2. Admin editor at `/admin/config/emails/[slug]` shows:
   - Subject: `<input>` field
   - HTML body: `<textarea>` with monospace font, auto-resize, minimum 20 rows
   - Text body: second `<textarea>` for plain-text fallback
   - Available variables: chip list (same pattern as push template editor) — click chips to insert `{{VARIABLE_NAME}}` at cursor
   - Preview button: opens a modal rendering the HTML via `dangerouslySetInnerHTML` (sandboxed in an `<iframe srcdoc>` for XSS containment)
3. On save: Server Action applies `substituirVariaveis` dry-run against a test payload, then updates DB. `sendEmail` reads from DB at call time with a module-level cache to avoid N+1 per send.

**Sanitization:** Apply the existing server-side sanitizer before storing. Email HTML needs a wider whitelist than push templates — allow `table`, `td`, `tr`, `img`, `a`, `p`, `strong`, `em`, `br`, `div`, `span` — the standard email-safe tag set.

**Confidence: HIGH** — based on direct analysis of existing codebase patterns

**No new npm dependency needed.** Zero bundle impact.

---

## Next.js 16.2.3 Migration

### Recommendation: Bump to `16.2.5`, not `16.2.3`

**Why 16.2.5 instead of 16.2.3:**
npm audit output (verified 2026-05-07) shows:
- `next | high | fixAvailable: {"name":"next","version":"16.2.5","isSemVerMajor":false}`
- `postcss | moderate | fixAvailable: {"name":"next","version":"16.2.5"}`
- The CVE `GHSA-q4gf-8mx6-v5v3` (range `<16.2.3`) is fixed in 16.2.3, but the bundled `postcss <8.5.10` is only fixed in 16.2.5. Jumping directly to 16.2.5 closes both in one update.

**Confidence: HIGH** — verified via npm audit run against current lockfile

### Breaking Changes: 16.1.6 to 16.2.5

**The 16.1.x to 16.2.x increment is a MINOR patch series with NO breaking changes.** All major breaking changes that Next.js 16.0 introduced are already handled in this codebase. Confirmed via Context7 docs and peer dep comparison.

**Changes already handled in this codebase:**

| Change | Status | Evidence |
|--------|--------|---------|
| Async `params` / `searchParams` | Already async | `analytics/page.tsx` line 137: `const params = await searchParams` |
| `turbopack` at top level (not `experimental.turbopack`) | Already correct | `next.config.ts` line 5: `turbopack: {}` |
| Turbopack is default for `next dev` + `next build` | No webpack config | No custom `webpack()` in `next.config.ts` |
| AMP removed | Never used | Not present in codebase |

**Remaining item to verify during upgrade:**
`experimental.serverActions.bodySizeLimit: "10mb"` in `next.config.ts` — Context7 docs confirm this is still under `experimental` in 16.x (not promoted to stable). No change needed.

**Peer dep check — 16.1.6 vs 16.2.5:**
Both versions have identical peer deps. No peer dep updates required.
```
react: "^18.2.0 || 19.0.0-rc-de68d2f4-20241204 || ^19.0.0"
node: ">=20.9.0"
```

**Migration steps:**

```bash
# Update next and eslint-config-next together (must stay in sync)
npm install next@16.2.5 eslint-config-next@16.2.5

# Verify
npm run lint && npm run typecheck && npm run build && npm test
```

`eslint-config-next@16.2.5` peerDeps: `eslint >=9.0.0, typescript >=3.3.1` — compatible with current `eslint@^9` and `typescript@^5`.

**CVEs fixed by this update:**

| GHSA | Severity | Fixed In |
|------|----------|----------|
| GHSA-ggv3-7p47-pfv8 | High | 16.1.7 |
| GHSA-3x4c-7xq6-9pq8 | High | 16.1.7 |
| GHSA-h27x-g6w4-24gq | High | 16.1.7 |
| GHSA-mq59-m269-xvcx | High | 16.1.7 |
| GHSA-jcc7-9wpm-mj36 | High | 16.1.7 |
| GHSA-q4gf-8mx6-v5v3 | High | 16.2.3 |
| postcss GHSA-qx2v-qp2m-jg93 | Moderate | 16.2.5 |

---

## Dependency Vulnerability Fixes

### brace-expansion (GHSA-f886-m6hf-6m8v, Moderate)

**Vulnerable range:** `<1.1.13`, `>=2.0.0 <2.0.3`, `>=4.0.0 <5.0.5`

**Confirmed dependency tree (from `npm ls brace-expansion` in project):**

| Chain | Version | Status |
|-------|---------|--------|
| `@serwist/next@9.5.6` → `glob@10.5.0` → `minimatch@9.0.9` → `brace-expansion` | 2.0.2 | VULNERABLE |
| `@sentry/nextjs@10.51.0` → `glob@13.0.6` → `minimatch@10.x` → `brace-expansion` | 5.0.5 | SAFE |
| `eslint-config-next@16.1.6` → `typescript-eslint@8.56.1` → `minimatch@10.2.2` → `brace-expansion` | 5.0.3 | VULNERABLE (< 5.0.5) |
| `eslint@9.39.3` → `minimatch@3.1.3` → `brace-expansion` | 1.1.12 | VULNERABLE (< 1.1.13) |

**Fix strategy:**

**Option A (Preferred): Upgrade serwist to 9.5.11**

`@serwist/next@9.5.11` changed its dep chain to `glob@13.0.6` → `minimatch@^10.2.2` → `brace-expansion@^5.0.5` (resolves to 5.0.5, safe). Verified: `@serwist/next@9.5.11` peerDeps `next >=14.0.0, react >=18.0.0` — all satisfied by current stack.

```bash
npm install @serwist/next@9.5.11 serwist@9.5.11
```

**Option B (Fallback): npm `overrides` if not upgrading serwist**

```json
{
  "overrides": {
    "brace-expansion": "2.0.3"
  }
}
```

Caveat: A global override forces ALL brace-expansion installs to 2.0.3. This breaks the 1.x chain used by `eslint@9` (which expects brace-expansion@1.x API). Test ESLint after applying with `npm run lint`.

**Recommendation: Option A** — upgrade serwist. Option B is a temporary workaround that creates a different breakage risk.

**brace-expansion via eslint-config-next and eslint — separate issue:**

The 5.0.3 (from eslint-config-next) and 1.1.12 (from eslint) chains are addressed by:
- `eslint-config-next@16.2.5` upgrade will pull newer `typescript-eslint` which uses brace-expansion 5.0.5
- The `eslint@9` chain (brace-expansion 1.1.12) requires either upgrading eslint or adding a scoped override for the 1.x range:
```json
{
  "overrides": {
    "minimatch@^3": "3.1.4"
  }
}
```
This forces the 3.1.x minimatch (used by eslint) to 3.1.4 which depends on brace-expansion `^1.1.13`. Verify with `npm ls minimatch` after applying.

**Remaining non-fixable vulnerabilities:**

| Package | CVE | Fix Available | Recommendation |
|---------|-----|---------------|----------------|
| `xlsx@0.18.5` | GHSA-4r6h-8v6p-xvw6, GHSA-5pgg-2g8v-p4x9 | `fixAvailable: false` | Keep as-is; used only for admin CSV export, no public input vector. Document as accepted risk in PR. |
| `jspdf@4.2.0` | GHSA-7x6v-j9x4-qf24, GHSA-wfv2-pwc8-crg5 | CVE range `<=4.2.0` | Check if jspdf 4.2.1+ exists on npm and upgrade if so. If still `<=4.2.0`, document accepted risk. |

**Additional vulnerabilities found by npm audit (outside v1.3 scope, triage separately):**

| Package | Severity | Suggested Fix |
|---------|----------|---------------|
| `vite` (via vitest@4) | High (3 CVEs, `<=7.3.1`) | `npm install -D vitest@latest` |
| `prisma@7.4.2` | High | `npm install prisma@latest @prisma/client@latest` |

---

## What NOT to Add

- **WYSIWYG editors** (TipTap, Quill, React Quill, Lexical, Slate): Overkill for 1-3 internal admin operators. The textarea + variable chips pattern is already established for push templates.
- **date-fns as a standalone dep**: It arrives as a transitive dep of `react-day-picker`. Do not add it separately.
- **react-datepicker** (alternative): Smaller ecosystem, no Tailwind classNames API, would require CSS overrides.
- **flatpickr or Pikaday**: Not React-native; require DOM ref management that conflicts with React 19 Server Component patterns.
- **shadcn Calendar codemod**: Adds a file to `src/components/ui/` that just wraps react-day-picker — skip the wrapper, use react-day-picker directly for the admin analytics use case.

---

## Installation Summary

```bash
# Feature: date range picker (adds date-fns as transitive dep)
npm install react-day-picker@9.14.0

# Security: Next.js + eslint-config-next (always update together)
npm install next@16.2.5 eslint-config-next@16.2.5

# Security: serwist (fixes brace-expansion transitive vuln)
npm install @serwist/next@9.5.11 serwist@9.5.11
```

Net new direct deps: 1 (`react-day-picker`)
Net new transitive deps: 2 (`date-fns@^4`, `@date-fns/tz@^1`)

---

## Sources

- npm registry direct queries: `npm info next@16.2.5`, `npm info @serwist/next@9.5.11`, `npm info react-day-picker@9.14.0`, `npm info brace-expansion`, `npm info minimatch@10.2.5`, `npm info glob@13.0.6`
- `npm audit --json` run against project lockfile (2026-05-07) — full advisory list with CVE ranges and fix versions
- `npm ls brace-expansion` — confirmed dependency tree with exact versions
- Context7 `/vercel/next.js` (v16.2.2): breaking changes guide, turbopack config, serverActions, upgrade codemods
- Context7 `/gpbl/react-day-picker` (v9.14.0): range mode, Tailwind CSS integration, PropsRange interface
- Direct codebase analysis: `next.config.ts`, `package.json`, `src/app/admin/analytics/page.tsx`, `src/lib/emails.ts`, `src/components/ui/`
