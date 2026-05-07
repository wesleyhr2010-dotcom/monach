# Feature Landscape — v1.3 New Capabilities

**Domain:** Internal admin panel for consignment jewelry business (Monarca, Paraguay)
**Researched:** 2026-05-07
**Scope:** Three features — email template editor, custom date range picker, admin UI consistency audit

---

## Email Templates Admin (`/admin/config/emails`)

### Context

Currently, 7 transactional email templates live as TypeScript functions in
`src/lib/email-templates/`. They call `renderEmailBase()` which wraps an HTML
body in the Monarca branding envelope (banner, footer, dark mode). The
`sendEmail()` central client sends via Brevo SDK using raw `htmlContent`.
No Brevo template IDs are used — everything is rendered server-side.

The push notification system at `/admin/config/notif-push` is the direct
model: templates stored in the `notificacao_templates` DB table, edited via a
Dialog, with variable chips that insert `{var}` placeholders into a textarea.

Email is structurally different because the body is HTML (not plain text) and
the template has three parts: subject, preheader (preview text), and HTML body.

---

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| List all 7 templates with name + last-updated | Admin needs to know what exists; push panel does this | Low | Map human names to template keys (same pattern as `TIPO_LABELS` in notif-push) |
| Edit subject line | Subject is the most frequently changed field | Low | Plain text, max ~80 chars; no variable substitution needed for current templates |
| Edit preheader / preview text | Already supported in `renderEmailBase` via `previewText` option; missing it would break the system | Low | Free text, max 90 chars per `email-base.ts` comment |
| Edit body with variable chips | Body contains interpolated values (resellerName, maletaNumero, etc.); chips prevent typos on variable syntax | Medium | Reuse `substituirVariaveis` pattern from push; variables are different per template |
| Live preview rendered in the Monarca wrapper | Admin needs to see what the recipient will receive, not raw HTML | Medium | Render via `renderEmailBase()` server-side on save/preview — show in `<iframe>` or HTML panel |
| Save to DB with `updated_at` | Persistence; push panel has this | Low | New `email_templates` table needed — see Architecture notes below |
| Toggle active/inactive | Allows disabling a template without deleting, e.g., if a flow is paused | Low | Boolean flag; inactive templates should fall back to code-defined defaults |
| Send test email to admin address | Verify real delivery before going live | Low | Server Action that calls `sendEmail()` with a sample context; push panel has "Test Push" equivalent |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Split view: source tab + preview tab | Faster iteration — admin can see HTML and preview without round-trip | Medium | Two tabs in Dialog; preview auto-renders on tab switch |
| Variable documentation inline | Admin doesn't know what `{maletaNumero}` means without context | Low | Tooltip or expanded chip showing the variable description |
| Syntax highlighting for HTML | Makes editing HTML body safer for non-developers | High | Requires CodeMirror or Monaco — overkill for this admin; DEFER |
| Version history / undo | Recover from bad edits | Very High | Out of scope for v1.3 |
| WYSIWYG email editor | Drag-and-drop email building | Very High | Out of scope — templates follow fixed `renderEmailBase` structure |

---

### Data Model Decision

The push system uses `notificacao_templates` in Prisma. Email templates need
a parallel table. The 7 templates map to distinct keys: `documento-pendente`,
`documento-aprovado`, `documento-rejeitado`, `acerto-confirmado`,
`candidatura-aprovada`, `candidatura-rechazada`, `convite-usuario`.

Recommended shape:
```
model EmailTemplate {
  id           String   @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  chave        String   @unique           // e.g. "documento-aprovado"
  subject      String                     // assunto do email
  preheader    String?                    // texto preview (max 90 chars)
  body_html    String                     // corpo HTML; variaveis {nome} etc.
  ativo        Boolean  @default(true)
  updated_at   DateTime @updatedAt @db.Timestamptz()
  @@map("email_templates")
}
```

The `body_html` field stores the inner HTML fragment passed as `bodyHtml` to
`renderEmailBase()`. The outer branding wrapper (banner, footer, dark mode
styles) is NOT stored in DB — it is always rendered at send time via
`renderEmailBase()`. This means the admin only edits the content, not the
chrome.

Variable whitelists per template key must be defined in code (not DB) — same
pattern as `VARIAVEIS_POR_TIPO` in `notifications-shared.ts`. A new
`VARIAVEIS_POR_EMAIL` constant should be co-located in the emails shared module.

---

### Variable Patterns Per Template

| Template Key | Available Variables |
|---|---|
| `documento-pendente` | `{resellerName}`, `{tipoDocumento}`, `{adminLink}` |
| `documento-aprovado` | `{resellerName}`, `{tipoDocumento}` |
| `documento-rejeitado` | `{resellerName}`, `{tipoDocumento}`, `{motivo}` |
| `acerto-confirmado` | `{resellerName}`, `{maletaNumero}`, `{valorVendido}`, `{comissao}`, `{pctComissao}` |
| `candidatura-aprovada` | `{nome}`, `{email}`, `{loginUrl}` |
| `candidatura-rechazada` | `{nome}` |
| `convite-usuario` | `{nome}`, `{consultoraNome}`, `{loginUrl}` |

Note: `{senhaTemp}` is intentionally excluded — temporary passwords must never
be stored in a DB-editable template for auditability. It must remain hardcoded
in the TypeScript function.

---

### Integration with `sendEmail()` / `renderEmailBase()`

Send-time flow after adding DB templates:

1. Server Action fetches `EmailTemplate` row by `chave` (cached via `React.cache`).
2. If row missing or `ativo = false`, falls back to the hardcoded TypeScript template function.
3. `substituirVariaveis(row.body_html, context, whitelist)` interpolates variables.
4. `renderEmailBase({ title: row.subject, preheader: row.preheader, bodyHtml: sanitized })` wraps it.
5. `sendEmail()` sends via Brevo.

Sanitization: the stored `body_html` must be sanitized at save time via the
existing regex-based sanitizer (the replacement for `isomorphic-dompurify` added
to fix the SSR crash). The sanitizer allows `b`, `i`, `a`, `strong`, `em` — for
email bodies the allowed-tag set should be expanded to include `p`, `br`,
`table`, `tr`, `td`, `th`, `ul`, `li` to support the existing table-heavy
email format (see acerto-confirmado which uses an HTML table for commission data).

---

### Complexity Summary

| Task | Complexity |
|---|---|
| DB migration — `email_templates` table + seed from TS defaults | Low |
| `/admin/config/emails` list page | Low (pattern: copy niveis/comissoes CRUD page) |
| `EmailTemplateEditor` Dialog component | Medium (textarea + variable chips — push TemplateEditor.tsx is the direct model) |
| Preview rendering Server Action + iframe display | Medium |
| Wiring `sendEmail()` to fetch from DB with fallback | Low |
| Tests (variable substitution, sanitization, fallback) | Low (extend existing email-base.test.ts) |

---

## Analytics Custom Date Range

### Context

The existing analytics page at `/admin/analytics` uses URL search params
(`?period=7`, `?period=30`, `?period=90`, `?period=365`) rendered as Link
buttons. The Server Component reads `searchParams`, validates against
`PERIOD_OPTIONS`, and redirects on invalid values. All data fetching uses
`periodDays` as an integer offset from `NOW()`.

A custom date range requires `startDate` + `endDate` instead of `periodDays`.
This means the analytics Server Actions need to accept a date range, not just
a day count.

No calendar or date picker component exists in the codebase currently.
`react-day-picker` is not installed. `date-fns` is not installed.
The project uses `radix-ui` (v1.4.3) which includes `@radix-ui/react-popover`
but no calendar primitive. Recharts is installed for charts.

---

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Preset period buttons (7d / 30d / 3m / 12m) retained | Existing UX must not regress; presets cover 95% of use cases | Low | Keep existing Link buttons unchanged |
| "Custom" option that reveals date inputs | Admin needs to analyze a specific month or campaign period | Medium | One extra button that shows start/end date inputs without a modal |
| Start date + End date inputs | Minimum viable date selection | Low | Native `<input type="date">` is sufficient — no library needed |
| URL-serialized date range | Shareable, bookmarkable analytics state | Low | `?from=2026-03-01&to=2026-04-30` in search params |
| Validation: start <= end, both required, not in future | Prevent nonsensical queries | Low | Server-side redirect on invalid; client-side inline error |
| Server Actions accept `DateRangeInput` union type | The data layer must support arbitrary ranges | Medium | Refactor `periodDays: number` to a union type in actions-analytics.ts |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Preset quick-picks inside custom picker ("Este mes", "Mes pasado") | Bridges gap between fixed presets and full freedom | Low | 2-3 calculated presets shown as small buttons above the date inputs |
| Max range guard (366 days) with friendly error | Prevents slow queries and communicates the constraint clearly | Low | Server-side validation with a redirect or error state |

### Considered and Rejected

| Option | Why Rejected |
|---|---|
| Full calendar UI library (`react-day-picker`, `flatpickr`) | Adds a dependency, visual complexity, and accessibility burden for minimal gain over native `<input type="date">`. Presets plus native date inputs cover all real use cases. |
| Replacing presets with only the custom picker | Regression — presets are faster for the 95% case |
| Client-only state (not URL-serialized) | Breaks page refresh, deep-linking to a shared view, and the Server Component data-fetching pattern |

---

### URL Schema Design

Current: `?period=30`
With custom range: `?from=2026-03-01&to=2026-04-30`

The Server Component detects: if `from` + `to` are both present, use date
range mode. If `period` is present, use period mode. If neither, default to
`period=30`. This preserves backward compatibility — existing bookmarks and
internal links continue to work without change.

---

### Actions Refactor Shape

```typescript
// Before
getAnalyticsKPIs(periodDays: number): Promise<KPIs>

// After
type DateRangeInput =
  | { mode: "period"; days: number }
  | { mode: "range"; from: Date; to: Date };

getAnalyticsKPIs(range: DateRangeInput): Promise<KPIs>
```

All 6 analytics actions need this change: `getAnalyticsKPIs`,
`getAnalyticsFluxoMaletas`, `getAnalyticsDistribuicaoStatus`,
`getAnalyticsTopRevendedoras`, `getAnalyticsAlertasPrazo`,
`getAnalyticsProdutosMaisVendidos`. Vitrina actions follow the same pattern.

The Prisma queries currently use `gte: subDays(new Date(), periodDays)`.
In range mode they use `gte: from, lte: to` directly.

---

### Complexity Summary

| Task | Complexity |
|---|---|
| Native `<input type="date">` picker UI with "Custom" toggle | Low |
| URL serialization + Server Component detection logic | Low |
| Refactor 6+ analytics actions to accept `DateRangeInput` | Medium (mechanical but touches many functions) |
| Validation (range order, max 366 days, not in future) | Low |
| Existing tests updated for new action signature | Low |

---

## Admin UI Consistency Audit

### Context

The admin panel has grown across v1.0, v1.1, v1.2, and earlier milestones.
Different phases added pages at different times, and the visual implementation
has drifted from the design token system. The `admin.css` file defines the full
token set (`--admin-bg`, `--admin-surface`, `--admin-border`, `--admin-text`,
`--admin-accent`, etc.) but the analytics page and the push template editor
reveal mixed patterns: some inline `style=` with raw hex values (`#35605A`,
`#1a1a1a`, `#888`), some using CSS variables, some using Tailwind color classes
that bypass the token system entirely.

Paper is the visual source of truth. The audit compares implemented screens
against Paper artboards and produces a categorized list of deviations for
implementation.

---

### Audit Categories (Table Stakes)

These six categories cover everything a systematic admin UI audit must examine.

#### 1. Color Token Usage

Every color in admin UI should resolve to a `var(--admin-*)` token, not a
hardcoded hex. The token set in `admin.css` is complete — there is no missing
token that would justify a hardcode.

Red flags confirmed in current code:
- Analytics page uses `#35605A`, `#1a1a1a`, `#888`, `#2a2a2a`, `#E05C5C`,
  `#4ADE80`, `#60A5FA`, `#FACC15`, `#a855f7` as inline styles
- Tailwind classes `bg-[#35605A]`, `text-[#888]`, `border-[#333]` in period
  filter buttons
- Chart segment colors (atrasada/devolvida/enviadas) are intentional functional
  colors — acceptable exception, document as such

#### 2. Typography Scale

Admin uses Inter (not Raleway — that is PWA only). Sizes should follow the
implied scale: 11 / 12 / 13 / 14 / 16 / 18px. Arbitrary values like
`fontSize: "10px"` or `fontSize: "15px"` are drift indicators that make the
panel feel inconsistent.

#### 3. Component Variants

Shared admin components exist and must be used consistently:

- Status badges: `AdminStatusBadge` must be used everywhere, not ad-hoc inline
  `<span>` with hardcoded background colors. The analytics "Top Revendedoras"
  table currently uses an ad-hoc span.
- Empty states: `AdminEmptyState` must replace ad-hoc centered divs with muted
  text. Multiple ad-hoc implementations exist across analytics cards.
- Page headers: `AdminPageHeader` is already used consistently — no issue.
- Stat cards: `AdminStatCard` should be used for KPI numbers — analytics uses
  it via `AnalyticsKpiCards`, which is correct.

#### 4. Spacing and Layout Rhythm

Gap, padding, and margin values should use the 4/8/12/16/24/32px scale.
Values like `gap: "3px"` (bar chart bar gap — visual density exception) or
`padding: "10px 12px"` (not on scale) are drift. The audit flags every
off-scale spacing value for a one-line fix.

#### 5. Interactive State Consistency

Hover and focus states on buttons, inputs, and table rows should use
`--admin-surface-hover` and `--admin-border-focus`. Standalone `<button>`
elements not using `.admin-btn` classes lack these states.

#### 6. Dark Theme Completeness

The admin is dark-mode-only. No element should render with a white or light
background. shadcn Card components must be verified to use `--admin-surface`
not the shadcn default light surface. Any Card that does not explicitly set
its background via admin tokens is a potential visual break.

---

### Audit Deliverable Format

The audit produces a checklist per route, not a design document. For each
admin route:

1. Compare against Paper artboard via MCP
2. Mark deviations per category
3. Classify each: Token (hex to var) / Component (use AdminX) / Layout (fix spacing)
4. Estimate fix: Low (1 line) / Medium (refactor a section) / High (new component)

This becomes the exact implementation scope for the UI consistency phase.

---

### Complexity Summary

| Task | Complexity |
|---|---|
| Automated grep scan for hex values in admin routes | Low |
| Paper MCP artboard comparison for 5-8 key pages | Medium (requires design session) |
| Token replacement (hex to var) in analytics page | Low (mechanical) |
| Replace ad-hoc status spans with `AdminStatusBadge` | Low |
| Replace ad-hoc empty states with `AdminEmptyState` | Low |
| Card background token verification and fixes | Low |
| Typography scale cleanup | Low |

---

## Anti-Features to Avoid

### Email Template Editor

| Anti-Feature | Why Avoid | What to Do Instead |
|---|---|---|
| Full WYSIWYG editor (Quill, TipTap, etc.) | Email body goes through `renderEmailBase()` which imposes its own wrapper. WYSIWYG HTML conflicts with inline-styled email chrome. Heavy dependency for minimal gain. | Textarea with variable chips. Admins edit semantic content, not the chrome. |
| Storing the full rendered HTML (banner, footer included) | Makes it impossible to update branding without re-editing every DB row. The branding wrapper is frozen into the data. | Store only the inner body fragment. Render the wrapper at send time via `renderEmailBase()`. |
| Free-form HTML editing without sanitization | Stored XSS if an admin account is compromised. Admin-only features should not blindly trust stored HTML. | Sanitize on save using the existing regex sanitizer. Expand allowed-tag whitelist to cover table elements needed by acerto-confirmado template. |
| Exposing `{senhaTemp}` as an editable variable | Temporary passwords in DB-stored templates creates an audit trail exposure and potentially leaks credentials via template export. | Keep password insertion hardcoded in the TypeScript function, outside the editable body. |
| Deleting template rows | A missing template key causes `sendEmail()` to fail silently. | Use `ativo = false` toggle. Never expose a delete action. |
| Switching to Brevo template IDs | Current architecture uses `htmlContent` directly via SDK, not Brevo's template system. Switching would move email content outside the codebase, breaking single-source-of-truth. | Keep rendering in-app. |

### Analytics Date Range Picker

| Anti-Feature | Why Avoid | What to Do Instead |
|---|---|---|
| Calendar library (`react-day-picker`, `flatpickr`) | Adds bundle weight, accessibility burden, and theme integration work for minimal benefit over native `<input type="date">`. | Native `<input type="date">` with a preset row above it. |
| Replacing presets with only the custom picker | Regression — presets are faster for the 95% case. | Keep preset buttons; add "Custom" as a fifth option. |
| Client-only state (not URL-serialized) | Breaks page refresh, deep-linking, and the Server Component data-fetch pattern. | URL search params `?from=...&to=...`; page re-fetches on navigation. |
| Allowing future dates | Queries returning no data still cost a DB scan. | Server-side validation: `to` cannot exceed today. |
| Unbounded max range | A 10-year range query could timeout or return too much data. | Max 366 days. Return a clear validation error. |
| Removing the `?period=` URL schema | Existing bookmarks and internal links break. | Keep both schemas; detect by presence of `from` + `to` params. |

### Admin UI Consistency Audit

| Anti-Feature | Why Avoid | What to Do Instead |
|---|---|---|
| Touching non-admin code during the audit | Scope creep. The audit's value is precision. | Scope strictly to `src/app/admin/**` and `src/components/admin/**`. |
| Creating new admin-specific components when generic ones exist | Component proliferation makes the codebase harder to navigate. | Extend existing `AdminStatCard`, `AdminStatusBadge`, `AdminEmptyState` before creating new ones. |
| Hardcoding dark mode values that duplicate tokens | `background: "#171717"` instead of `var(--admin-surface)` — if the token value changes, the hardcode stays wrong. | Always use `var(--admin-*)`. |
| Auditing the PWA (`/app/**`) in this phase | Different design system, different token prefix (`--app-*`), different font (Raleway vs Inter). | Scope to admin only. PWA consistency is a separate effort. |
| Visual changes without Paper artboard verification | Risk of introducing new drift while fixing existing drift. | Consult Paper MCP before any layout change. |

---

## Feature Dependencies

```
EmailTemplate DB table
  -> must exist before EmailTemplateEditor UI
  -> must be seeded with defaults extracted from current TS templates
     (if row missing, sendEmail() falls back to TS function — acceptable,
      but confusing for the admin who expects their edits to apply)

EmailTemplateEditor
  -> depends on existing substituirVariaveis() from notifications-shared.ts
  -> depends on existing renderEmailBase() from email-base.ts
  -> depends on existing regex sanitizer (expanded tag whitelist)
  -> model: push TemplateEditor.tsx is the direct structural reference

Analytics Date Range
  -> DateRangeInput union type must be added to actions-analytics.ts first
  -> All 6+ getAnalytics* functions must be refactored before the UI can use them
  -> URL detection logic in the Server Component must handle both schemas

Admin UI Audit
  -> No code dependencies — pure inspection phase
  -> Paper MCP access required before implementation
  -> Should run before the email template editor UI is built so the new page
     inherits consistent patterns from day one
```

---

## MVP Recommendation for v1.3

**Priority order:**

1. Admin UI audit (inspection only) — establishes patterns for new pages
2. Email templates: DB migration + seed + list page + editor Dialog
3. Analytics: refactor actions to `DateRangeInput`, then add custom date inputs UI
4. Admin UI fixes: apply audit findings (token replacements, component consistency)

**Why this order:** Audit first means the email template editor is built with
correct patterns, not built and then fixed. The analytics action refactor is
mechanical but broad — doing it third means the migration is settled and the
team is familiar with the codebase again. UI fixes last because they are
low-risk polish that do not block other features.

**Defer:** Syntax highlighting in the email editor, WYSIWYG editing, version
history — all high complexity for low operational value at current scale
(under 500 resellers, 1-2 admins editing templates).
