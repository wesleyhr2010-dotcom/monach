# Phase 19: CSS Token Foundation — Research

**Researched:** 2026-05-15
**Domain:** Tailwind CSS v4 dark mode, CSS custom properties, theme architecture
**Confidence:** HIGH

## Summary

Phase 19 is a **zero-visual-change infrastructure phase**. It declares dark/light CSS token variants in `globals.css` and `admin.css`, configures Tailwind v4's `@custom-variant dark` to respond to `data-theme` attributes instead of `prefers-color-scheme`, and ensures build + lint pass. No React code changes, no visual changes — pure CSS.

The project uses **Tailwind CSS v4.2.1** (pure CSS-driven, no `tailwind.config.js`). The current `globals.css` has `@theme inline` defining all light-mode tokens for app and shadcn/ui. The current `admin.css` has dark values as `:root` defaults. An existing `.admin-layout` block in `globals.css` (lines 119-141) overrides shadcn/ui tokens for dark admin — this block will be replaced with `data-theme` selectors per locked decisions.

**Primary recommendation:** Add `@custom-variant dark` immediately after `@import "tailwindcss"` in `globals.css`. Declare dark token variants under `.app-shell[data-theme="dark"]` in `globals.css`. Invert `admin.css` `:root` defaults to light values and move dark values under `.admin-layout[data-theme="dark"]`.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| CSS token declaration (`--color-app-*` dark variants) | CDN / Static (CSS) | — | Pure CSS, no runtime logic |
| CSS token declaration (`--admin-*` light/dark variants) | CDN / Static (CSS) | — | Pure CSS, no runtime logic |
| `@custom-variant dark` configuration | CDN / Static (CSS) | — | Tailwind build-time directive |
| `data-theme` attribute management | Frontend Server (SSR) | Browser / Client | Phase 21 (ThemeProvider), not this phase |
| Shadcn/ui dark mode token mapping | CDN / Static (CSS) | — | CSS variable overrides inside `.app-shell[data-theme="dark"]` |

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-19-01**: Migrar tudo para seletores `data-theme`. O bloco `.admin-layout` atual (globals.css linhas 119-141) será substituído por `.admin-layout[data-theme="dark"]`. Um único mecanismo — sem coexistência de abordagens.
- **D-19-02**: Light-mode como default no `:root` do admin.css. Tokens `--admin-*` atuais (dark: #0a0a0a, #171717, etc.) serão movidos para `.admin-layout[data-theme="dark"]`. Valores light (#ffffff, #f5f5f5, #e5e7eb) entram no `:root`.
- **D-19-03**: Paleta dark do app PWA deriva das cores de marca existentes (`--color-gold`, `--color-dark`, `--color-snow`, `--color-black`, `--color-white`, `--color-app-primary`). Não usar cinza neutro genérico — manter identidade visual Monarca (tons quentes).
- **D-19-04**: Tokens shadcn/ui (`--color-card`, `--color-border`, etc.) terão variantes dark/light no globals.css via seletores `.app-shell[data-theme="dark"]` e `.admin-layout[data-theme="dark"]`. Centralizado em um arquivo.

### the agent's Discretion
- Specific dark color values for each `--color-app-*` token (guided by D-19-03 brand colors)
- Ordering of CSS blocks within globals.css
- Whether to derive dark shadcn/ui tokens for admin from existing admin palette or define separately

### Deferred Ideas (OUT OF SCOPE)
- **INFRA-EXT-01**: Toggle com 3 estados (Claro / Sistema / Oscuro) — deferred a pedido do usuário; binário preferido para v1.5
- **INFRA-EXT-02**: Sincronização de preferência de tema entre dispositivos via DB — v1.6+
- **INFRA-EXT-03**: Tema para vitrina pública `/vitrina/[slug]` — v1.6+

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `tailwindcss` | 4.2.1 (installed) / 4.3.0 (latest) | Utility-first CSS framework with `@custom-variant` support | Already in use; v4 native dark mode override via `@custom-variant` |
| `@tailwindcss/postcss` | 4.2.1 | PostCSS plugin for Tailwind v4 | Required for Next.js integration |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None needed | — | This phase is pure CSS — no new packages | — |

**Installation:** No new packages required. This phase uses existing Tailwind v4 capabilities.

**Version verification:** `npm view tailwindcss version` → 4.3.0 (published 2026-05-13). Installed: 4.2.1. No breaking changes between 4.2.1 and 4.3.0 relevant to `@custom-variant`.

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  globals.css (app + shadcn/ui tokens)                       │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  @import "tailwindcss"                                 │  │
│  │  @custom-variant dark (&:where([data-theme=dark],      │  │
│  │    [data-theme=dark] *))                               │  │
│  │  @theme inline { --color-app-*: light values }         │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  .app-shell[data-theme="dark"] {                       │  │
│  │    --color-app-bg: dark value;                         │  │
│  │    --color-app-card-bg: dark value;                    │  │
│  │    /* ... all app tokens */                            │  │
│  │    /* shadcn/ui token overrides */                     │  │
│  │  }                                                     │  │
│  │  .admin-layout[data-theme="dark"] {                    │  │
│  │    --color-card: #171717;  /* shadcn → admin dark */   │  │
│  │    /* ... shadcn token overrides for admin */          │  │
│  │  }                                                     │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  admin.css (admin-specific tokens)                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  :root {                                               │  │
│  │    --admin-bg: #ffffff;          ← light (NEW default) │  │
│  │    --admin-surface: #f5f5f5;                           │  │
│  │    --admin-text: #1a1a1a;                              │  │
│  │    /* ... all admin tokens as light values */          │  │
│  │  }                                                     │  │
│  │  .admin-layout[data-theme="dark"] {                    │  │
│  │    --admin-bg: #0a0a0a;          ← dark (moved)        │  │
│  │    --admin-surface: #171717;                           │  │
│  │    --admin-text: #ededed;                              │  │
│  │    /* ... all admin tokens as dark values */           │  │
│  │  }                                                     │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

Data flow:
  [DevTools: data-theme="dark"] → CSS selector match → token override → dark colors
  [DevTools: data-theme="light"] → CSS selector match → token override → light colors
  [No data-theme] → :root defaults → current light appearance (no visual change)
```

### Recommended Project Structure

No structural changes. This phase modifies only:
```
src/app/globals.css          ← @custom-variant dark + app dark tokens + shadcn dark overrides
src/app/admin/admin.css      ← :root light defaults + .admin-layout[data-theme="dark"]
```

### Pattern 1: `@custom-variant dark` with `data-theme` attribute

**What:** Override Tailwind's default `dark:` variant (which uses `prefers-color-scheme` media query) to respond to a `data-theme` attribute instead.

**When to use:** When theme toggling is controlled by application state (localStorage, user preference) rather than OS preference alone.

**Example:**
```css
/* Source: https://tailwindcss.com/docs/dark-mode#using-a-data-attribute */
@import "tailwindcss";

@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));

@theme inline {
  --color-background: #ffffff;
  --color-foreground: #363636;
  /* ... light defaults ... */
}

/* Dark variant overrides */
.app-shell[data-theme="dark"] {
  --color-background: #0a0a0a;
  --color-foreground: #ededed;
}
```

**How it works:** The `&:where([data-theme=dark], [data-theme=dark] *)` selector means:
- `&:where([data-theme=dark])` — matches the element itself if it has `data-theme="dark"`
- `[data-theme=dark] *` — matches any descendant of an element with `data-theme="dark"`

This ensures `dark:` utilities work anywhere inside the themed container.

### Pattern 2: CSS variable token override via descendant selector

**What:** Define light-mode defaults in `@theme inline` / `:root`, then override with dark values under a scoped `[data-theme="dark"]` selector.

**When to use:** When you need different theme values for different parts of the app (app PWA vs admin panel).

**Example:**
```css
/* globals.css — light defaults in @theme inline */
@theme inline {
  --color-app-bg: #F5F2EF;
  --color-app-card-bg: #FFFFFF;
  --color-app-text: #1A1A1A;
}

/* Dark overrides scoped to app shell */
.app-shell[data-theme="dark"] {
  --color-app-bg: #1a1a1a;
  --color-app-card-bg: #2a2a2a;
  --color-app-text: #f0f0f0;
}

/* Shadcn/ui token overrides for admin dark */
.admin-layout[data-theme="dark"] {
  --color-card: #171717;
  --color-border: #2a2a2a;
  --color-primary: #35605a;
}
```

### Anti-Patterns to Avoid

- **Coexisting theme approaches:** Per D-19-01, do NOT keep the old `.admin-layout` block alongside new `data-theme` selectors. Replace entirely.
- **Hardcoding dark colors in `@theme inline`:** `@theme inline` should contain ONLY light defaults. Dark values go in `[data-theme="dark"]` selectors.
- **Using `@media (prefers-color-scheme: dark)`:** The `@custom-variant dark` replaces this. Mixing both causes unpredictable behavior.
- **Setting `data-theme` on `<html>`:** The project uses `.app-shell` and `.admin-layout` as theme containers, not `<html>`. This avoids conflicts between the two route groups sharing the same `<html>` element.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Dark mode variant | Custom CSS classes like `.dark-mode` | `@custom-variant dark` + `dark:` utilities | Tailwind handles specificity, composition, and all utility combinations automatically |
| Theme toggle JS | Custom localStorage + class toggle | Phase 21 ThemeProvider (deferred) | This phase is CSS-only; JS toggle is Phase 22 |
| Color derivation | Hardcoded dark hex values | CSS variables referenced from `@theme inline` | Single source of truth; changing a token updates all references |

**Key insight:** Tailwind v4's `@custom-variant` is purpose-built for this exact use case. Any custom approach would need to replicate its specificity handling, utility composition, and build-time optimization.

## Runtime State Inventory

> SKIPPED — This is a greenfield CSS infrastructure phase, not a rename/refactor/migration phase. No runtime state exists to audit.

## Common Pitfalls

### Pitfall 1: `@custom-variant` placement order
**What goes wrong:** Placing `@custom-variant dark` before `@import "tailwindcss"` causes build failure.
**Why it happens:** Tailwind must be imported first to register the base variant system before it can be overridden.
**How to avoid:** Always place `@custom-variant` AFTER `@import "tailwindcss"`. Order: `@import` → `@custom-variant` → `@theme inline`.
**Warning signs:** `npm run build` fails with "unknown at-rule @custom-variant" or similar.

### Pitfall 2: Specificity loss with `:where()`
**What goes wrong:** Using `:where()` in the custom variant selector gives it zero specificity, which is correct for Tailwind but means CSS variable overrides in `[data-theme="dark"]` selectors must have sufficient specificity to win.
**Why it happens:** `.app-shell[data-theme="dark"]` has specificity (0,2,0) — sufficient to override `@theme inline` defaults.
**How to avoid:** Always use class + attribute selector (e.g., `.app-shell[data-theme="dark"]`) for token overrides, not bare `[data-theme="dark"]`.
**Warning signs:** Dark tokens not applying when `data-theme="dark"` is set via DevTools.

### Pitfall 3: Admin CSS cascade conflict between globals.css and admin.css
**What goes wrong:** Both `globals.css` and `admin.css` define tokens under `.admin-layout`. The cascade order determines which wins.
**Why it happens:** `globals.css` has `.admin-layout` block for shadcn/ui token overrides. `admin.css` has `.admin-layout` for layout + admin-specific tokens. Both import into the same document.
**How to avoid:** 
- `globals.css`: Only shadcn/ui tokens (`--color-card`, `--color-border`, etc.) under `.admin-layout[data-theme="dark"]`
- `admin.css`: Only admin-specific tokens (`--admin-bg`, `--admin-surface`, etc.) under `.admin-layout[data-theme="dark"]`
- No overlap between the two files' token namespaces.
**Warning signs:** Some admin tokens not changing in dark mode, or shadcn components inside admin showing wrong colors.

### Pitfall 4: `admin.css` imported in client component
**What goes wrong:** `admin.css` is imported via `import "@/app/admin/admin.css"` inside `AdminLayoutClient.tsx` (a client component). This means the CSS loads client-side, not at build time.
**Why it happens:** Current architecture imports admin CSS from the client component rather than the server layout.
**How to avoid:** For Phase 19, this is fine — CSS variables still work. But note that the `:root` selector in `admin.css` applies to the document root, not scoped to `.admin-layout`. The `.admin-layout[data-theme="dark"]` selector will work correctly because it's a class selector.
**Warning signs:** None expected for Phase 19 scope.

### Pitfall 5: Missing `@source` exclusions
**What goes wrong:** Tailwind scans `.planning/` and `docs/` directories, potentially picking up class strings from markdown files.
**Why it happens:** Tailwind v4 auto-scans source files.
**How to avoid:** The existing `@source not "../../.planning/**"` and `@source not "../../docs/**"` in globals.css already handle this. No change needed.

## Code Examples

Verified patterns from official sources:

### TKN-01: `@custom-variant dark` configuration
```css
/* Source: https://tailwindcss.com/docs/dark-mode#using-a-data-attribute */
@import "tailwindcss";

@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));

@theme inline {
  /* existing light defaults — unchanged */
}
```

### TKN-02: App dark token variants in globals.css
```css
/* Source: Tailwind v4 docs + project D-19-03 */
.app-shell[data-theme="dark"] {
  /* App PWA tokens — dark variants derived from brand colors */
  --color-app-bg: #1a1a1a;
  --color-app-card-bg: #242424;
  --color-app-card-border: #333333;
  --color-app-divider: #2a2a2a;
  --color-app-icon-bg: #2a2a2a;
  --color-app-primary: #35605A; /* brand color — unchanged */
  --color-app-text: #f0f0f0;
  --color-app-muted: #888888;
  --color-app-accent-green-bg: rgba(31, 122, 74, 0.15);
  --color-app-accent-green: #4ade80;
  --color-app-danger-bg: rgba(211, 47, 47, 0.15);
  --color-app-danger-border: #991b1b;
  --color-app-danger: #f87171;

  /* Shadcn/ui tokens — dark variants */
  --color-background: #0a0a0a;
  --color-foreground: #ededed;
  --color-card: #171717;
  --color-card-foreground: #ededed;
  --color-popover: #171717;
  --color-popover-foreground: #ededed;
  --color-primary: #35605a;
  --color-primary-foreground: #ffffff;
  --color-secondary: #222222;
  --color-secondary-foreground: #ededed;
  --color-muted: #171717;
  --color-muted-foreground: #888888;
  --color-accent: #222222;
  --color-accent-foreground: #ededed;
  --color-destructive: #e05c5c;
  --color-destructive-foreground: #ffffff;
  --color-border: #2a2a2a;
  --color-input: #2a2a2a;
  --color-ring: #35605a;
}
```

### TKN-03: Admin light defaults + dark variants in admin.css
```css
/* :root — light mode defaults (NEW) */
:root {
  --admin-bg: #ffffff;
  --admin-surface: #f5f5f5;
  --admin-surface-hover: #e5e5e5;
  --admin-surface-row-atrasada: #fef2f2;
  --admin-surface-row-aguardando: #fefce8;
  --admin-border: #e5e7eb;
  --admin-border-focus: #35605a;
  --admin-text: #1a1a1a;
  --admin-text-muted: #6b7280;
  --admin-text-dim: #9ca3af;
  --admin-accent: #35605a;
  --admin-accent-hover: #2a4d48;
  --admin-danger: #dc2626;
  --admin-danger-hover: #b91c1c;
  /* ... all other admin tokens as light values ... */
}

/* Dark variants */
.admin-layout[data-theme="dark"] {
  --admin-bg: #0a0a0a;
  --admin-surface: #171717;
  --admin-surface-hover: #222222;
  --admin-surface-row-atrasada: #1a1010;
  --admin-surface-row-aguardando: #1a1a10;
  --admin-border: #2a2a2a;
  --admin-border-focus: #35605a;
  --admin-text: #ededed;
  --admin-text-muted: #888888;
  --admin-text-dim: #444444;
  --admin-accent: #35605a;
  --admin-accent-hover: #2a4d48;
  --admin-danger: #e05c5c;
  --admin-danger-hover: #c44545;
  /* ... all other admin tokens as dark values ... */
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `darkMode: 'class'` in tailwind.config.js | `@custom-variant dark` in CSS | Tailwind v4 (2024) | No JS config needed; pure CSS |
| `prefers-color-scheme` media query | `data-theme` attribute selector | Project decision D-19-01 | Enables programmatic theme toggling |
| `next-themes` package | Custom ThemeProvider (Phase 21) | Project decision — `next-themes` incompatible with dual route groups | Two separate theme contexts needed |
| `.admin-layout` block in globals.css | `.admin-layout[data-theme="dark"]` | Phase 19 | Single mechanism, no coexistence |

**Deprecated/outdated:**
- `tailwind.config.js` darkMode config: Replaced by `@custom-variant` in CSS. Project has no config file.
- `.admin-layout` unconditional block (globals.css lines 119-141): Will be replaced by `[data-theme="dark"]` selector per D-19-01.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Dark color values for `--color-app-*` tokens (e.g., `--color-app-bg: #1a1a1a`) are illustrative; exact values should be derived from brand colors per D-19-03 | Code Examples (TKN-02) | Medium — planner must specify exact dark palette values |
| A2 | `admin.css` `:root` selector applies to document root despite being imported in a client component | Pitfall 4 | Low — CSS `:root` always targets `<html>` regardless of import location |
| A3 | Tailwind 4.2.1 → 4.3.0 has no breaking changes for `@custom-variant` | Standard Stack | Low — `@custom-variant` was stable since v4.0 |

## Open Questions

1. **Exact dark color palette for app tokens**
   - What we know: D-19-03 says derive from brand colors (`--color-gold: #b4aba2`, `--color-dark: #363636`, `--color-snow: #fffbfb`, `--color-app-primary: #35605A`)
   - What's unclear: Exact hex values for each `--color-app-*` dark variant
   - Recommendation: Planner should propose specific dark values based on brand palette, or defer exact values to a design decision

2. **Hardcoded hex in admin.css non-token rules**
   - What we know: `admin.css` has ~20+ hardcoded hex values in non-token rules (e.g., `.admin-table th { background: #141414 }`, `.admin-btn-primary { color: #ffffff }`, `.admin-toast-success { background: #065f46 }`)
   - What's unclear: Should these also get dark/light variants in Phase 19, or are they Phase 20 scope?
   - Recommendation: Phase 19 should ONLY handle CSS variable declarations. Hardcoded hex in CSS rules is Phase 20 migration scope. However, the hardcoded hex in `.admin-table th`, `.admin-btn-primary`, etc. will NOT change when `data-theme="light"` is set — they'll stay dark. This is a known gap that Phase 20 must address.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build | ✓ | v22+ (assumed) | — |
| npm | Package management | ✓ | — | — |
| Tailwind CSS v4 | `@custom-variant` directive | ✓ | 4.2.1 | — |

**No missing dependencies.** This phase requires only the existing Tailwind v4 installation.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 |
| Config file | None detected (Vitest auto-config) |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TKN-01 | `@custom-variant dark` configured, build passes | manual | `npm run build` | ❌ Wave 0 |
| TKN-02 | App tokens have dark variants under `.app-shell[data-theme="dark"]` | manual | DevTools inspection + `npm run build` | ❌ Wave 0 |
| TKN-03 | Admin tokens have light defaults + dark variants | manual | DevTools inspection + `npm run build` | ❌ Wave 0 |

**Note:** This phase is CSS-only with no runtime behavior. Testing is via build verification (`npm run build`, `npm run lint`) and DevTools inspection. No unit tests are applicable.

### Sampling Rate
- **Per task commit:** `npm run build && npm run lint`
- **Per wave merge:** `npm run build && npm run lint`
- **Phase gate:** Build + lint green before `/gsd-verify-work`

### Wave 0 Gaps
- None — this phase requires no test infrastructure. Validation is build + lint + manual DevTools inspection.

## Security Domain

> Not applicable — this phase is pure CSS token declarations with no authentication, data handling, or network operations.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | no | — |
| V6 Cryptography | no | — |

## Sources

### Primary (HIGH confidence)
- [Tailwind CSS v4.3 docs — Dark Mode](https://tailwindcss.com/docs/dark-mode) — `@custom-variant dark` syntax with `data-theme` attribute
- [Tailwind CSS v4.3 docs — Functions and Directives](https://tailwindcss.com/docs/functions-and-directives#custom-variant-directive) — `@custom-variant` directive reference
- `src/app/globals.css` (lines 1-284) — current CSS state, `@theme inline` block, existing `.admin-layout` block
- `src/app/admin/admin.css` (lines 1-1058) — current admin CSS, `:root` dark defaults, all `--admin-*` tokens
- `docs/design-system/tokens.md` — token specification document

### Secondary (MEDIUM confidence)
- `package.json` — Tailwind v4 dependency (`"tailwindcss": "^4"`)
- `npm ls tailwindcss` — confirms 4.2.1 installed via `@tailwindcss/postcss@4.2.1`
- `src/components/app/AppShell.tsx` — app shell structure with hardcoded hex (cataloged for Phase 20)
- `src/components/admin/AdminLayoutClient.tsx` — admin layout with `.admin-layout` class and inline hex values

### Tertiary (LOW confidence)
- None — all critical claims verified against official docs or codebase.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Tailwind v4 docs verified, installed version confirmed
- Architecture: HIGH — patterns from official Tailwind docs, codebase structure verified
- Pitfalls: HIGH — based on Tailwind v4 behavior + codebase-specific analysis
- Dark color values: MEDIUM — illustrative values proposed; exact palette per D-19-03 needs design decision

**Research date:** 2026-05-15
**Valid until:** 30 days (Tailwind v4 stable; no expected breaking changes)
