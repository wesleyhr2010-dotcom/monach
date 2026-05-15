# Stack Research — Dark Mode & Temas

**Project:** next-monarca v1.5
**Researched:** 2026-05-15
**Scope:** Class-based dark/light mode on top of existing Tailwind v4 + Next.js 15 App Router stack

---

## Tailwind v4 Dark Mode Config

### The v3 → v4 Breaking Change

In Tailwind v3, class-based dark mode was configured in `tailwind.config.js`:

```js
// v3 — DO NOT USE, there is no tailwind.config.js in this project
module.exports = {
  darkMode: 'class',
}
```

In Tailwind v4, **there is no `tailwind.config.js`**. All configuration is CSS-first. Dark mode variant is declared with `@custom-variant` inside the main CSS file.

**Confidence: HIGH** — Verified directly from tailwindcss.com/docs/dark-mode (official docs, current).

### Exact Syntax for Class-Based Dark Mode in v4

Add one line to `globals.css`, immediately after `@import "tailwindcss"`:

```css
@import "tailwindcss";
@custom-variant dark (&:where(.dark, .dark *));
```

That is the complete configuration. No JS config needed, no plugin, no additional package.

This registers `dark:` as a variant that activates when an ancestor has class `dark`. Applying `class="dark"` to `<html>` activates dark mode globally.

### How `dark:` Utilities Work After This

```html
<!-- Activates dark mode for the whole page -->
<html class="dark">
  <div class="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
    ...
  </div>
</html>
```

Any Tailwind utility prefixed with `dark:` applies when `.dark` is present on `<html>` or any ancestor.

### What This Project Already Has in globals.css

The file already contains:

```css
@import "tailwindcss";
@theme inline {
  /* --color-app-* tokens already defined */
}
```

The single addition needed is the `@custom-variant` line after the import. The existing `@theme inline` block is unaffected.

### CSS Custom Properties + `dark:` Utilities — Two Approaches

This project uses two token systems that will each need their own dark mode strategy:

**Approach A — Redefine CSS variables inside `.dark`** (recommended for `--app-*` tokens):

```css
/* globals.css */
@import "tailwindcss";
@custom-variant dark (&:where(.dark, .dark *));

@theme inline {
  /* light mode defaults */
  --color-app-bg: #F5F2EF;
  --color-app-text: #1A1A1A;
}

/* Dark overrides — activated when html.dark */
.dark {
  --color-app-bg: #1A1A1A;
  --color-app-text: #F5F2EF;
}
```

Components using `var(--color-app-bg)` or `bg-[var(--color-app-bg)]` then automatically shift with theme.

**Approach B — Tailwind dark: utilities inline** (useful for one-off overrides):

```html
<div class="bg-[#F5F2EF] dark:bg-[#1A1A1A]">
```

For this project, Approach A is correct: the existing components already consume `--app-*` CSS variables extensively. Redefining those variables under `.dark` means zero changes to component markup.

### Admin Panel Special Case

The admin panel is currently always dark. The `--admin-*` variables are defined in `admin.css` under `:root` with dark values. For v1.5, admin dark mode means flipping the assumption — dark becomes explicit (`.dark` class), light becomes the `:root` default:

```css
/* admin.css — flip to light-default pattern */
:root {
  /* Light values as default */
  --admin-bg: #f5f5f5;
  --admin-surface: #ffffff;
  --admin-text: #1a1a1a;
  /* ...all light variants... */
}

.dark {
  /* Existing dark values become explicit */
  --admin-bg: #0a0a0a;
  --admin-surface: #171717;
  --admin-text: #ededed;
  /* ...all existing dark values... */
}
```

This avoids `:not(.dark)` selector specificity issues and aligns with the same `.dark` toggle used by the app PWA.

---

## Next.js 15 App Router — Anti-Flash Pattern

### The Flash Problem

When using localStorage for theme persistence, the page HTML is served without the `dark` class. React hydrates, reads localStorage, and adds the class — but by then the user has already seen light mode briefly. This is the Flash of Unstyled Theme (FOUT).

### Solution: Inline Blocking Script in Root Layout

Place a `<script>` tag with `dangerouslySetInnerHTML` directly inside the `<body>` tag in `app/layout.tsx`, **before any other content**. This script runs synchronously before the browser paints.

```tsx
// app/layout.tsx (root) — manual approach
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (theme === 'dark' || (!theme && prefersDark)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        {children}
      </body>
    </html>
  );
}
```

**Note:** When using `next-themes` (recommended), this script is injected automatically by ThemeProvider. No manual script needed.

### Why `suppressHydrationWarning` on `<html>`

React expects the server-rendered HTML to match what the client renders on hydration. The `dark` class is added by the inline script (client-only), so the server renders `<html>` without it. React would normally warn about this mismatch. `suppressHydrationWarning` silences this expected, intentional difference.

The root `layout.tsx` in this project **already has** `suppressHydrationWarning` on `<html>`. No change needed there.

### Placement: `_document.tsx` Does Not Exist in App Router

In Next.js Pages Router, theme scripts went in `_document.tsx`. **In App Router, there is no `_document.tsx`**. The root `app/layout.tsx` is the equivalent — the inline script goes there, before `{children}`.

### React 19 Consideration

React 19 does not change any of this. The `dangerouslySetInnerHTML` pattern on a `<script>` tag in a Server Component layout works identically. The script runs during initial HTML parse, before React hydration begins.

### Scoped Layouts (App vs Admin)

This project has separate layouts for `/app` (PWA) and `/admin`. Both are nested under the root `layout.tsx` which owns `<html>` and `<body>`. The anti-flash script belongs in `app/layout.tsx` (root), not in the sub-layouts — because the `dark` class must be on `<html>`, which only root layout controls.

For independent theme preferences (app vs admin), use scoped localStorage keys:

```js
// PWA: storageKey="monarca-app-theme"
// Admin: storageKey="monarca-admin-theme"
```

The anti-flash script must check both keys and the current path prefix to decide which key to apply at load time.

---

## Package Options

### Option 1: `next-themes` (recommended)

**Package:** `next-themes`
**Current version:** 0.4.6 (verified from npm registry package.json)
**React peer deps:** `^16.8 || ^17 || ^18 || ^19` — React 19 explicitly supported
**Next.js peer deps:** none declared — works with any Next.js version including 15/16

**Tailwind v4 compatibility:** Yes. `next-themes` works by toggling a class or data attribute on `<html>`. It does not depend on Tailwind version. With `attribute="class"` it adds/removes `.dark`, exactly what `@custom-variant dark` needs.

**What it provides:**
- `ThemeProvider` wrapper (Client Component, wraps `children` from Server layout)
- `useTheme()` hook — `{ theme, setTheme, resolvedTheme, themes }`
- Automatic `prefers-color-scheme` detection with system theme option
- Built-in anti-flash script (injected automatically, no manual `dangerouslySetInnerHTML` needed)
- localStorage persistence out of the box
- SSR-safe (defers class application to avoid hydration mismatch)

**Setup:**

```tsx
// src/components/providers/ThemeProvider.tsx
'use client'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import type { ThemeProviderProps } from 'next-themes'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
```

```tsx
// app/layout.tsx (root)
import { ThemeProvider } from '@/components/providers/ThemeProvider'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

**Key props:**
- `attribute="class"` — adds `.dark` class to `<html>` (matches `@custom-variant dark`)
- `defaultTheme="system"` — respects OS preference when no user choice is stored
- `enableSystem` — required for `system` to work
- `disableTransitionOnChange` — prevents color transitions during theme switch (avoids jarring flash)
- `storageKey` — defaults to `"theme"`, override per sub-layout for app/admin scoping

**Scoping app vs admin themes** — `next-themes` ThemeProvider can be instantiated multiple times in the React tree. Place one in `/app/app/layout.tsx` (PWA) and one in `/app/admin/layout.tsx` (admin), each with a different `storageKey`. The root layout ThemeProvider can serve as a fallback or be omitted if both sub-layouts always handle their own.

### Option 2: Custom Hook + Inline Script (no package)

No extra package. Manual implementation using a `useTheme` hook + the inline blocking script shown above.

**When to choose this:** Zero dependencies. Appropriate if `next-themes` creates issues with the View Transitions system already implemented (unlikely, but worth knowing as a fallback).

### Recommendation: Use `next-themes`

Use `next-themes@0.4.6`. Reasons:

1. Anti-flash script is handled automatically and correctly — covers localStorage unavailable, incognito, SSR edge cases
2. `useTheme()` provides `resolvedTheme` (resolves `"system"` to actual `"dark"` or `"light"`) which simplifies toggle UI
3. `disableTransitionOnChange` cleanly handles the View Transitions concern — briefly disables CSS transitions while the theme class switches
4. No known compatibility issues with Tailwind v4 (it only touches the DOM class, not Tailwind internals)
5. React 19 explicitly in peer deps; confirmed working with Next.js 15/16

**Install:**
```bash
npm install next-themes
```

No other packages needed.

---

## Integration with Existing CSS Tokens

### Current Token Architecture

| Scope | Where tokens live | Current mode |
|-------|------------------|-------------|
| App PWA (`/app/*`) | `globals.css` → `@theme inline { --color-app-* }` | Light only |
| Admin (`/admin/*`) | `admin.css` → `:root { --admin-* }` | Dark only (fixed) |
| Shared/Shadcn | `globals.css` → `@theme inline { --color-* }` | Light only |
| Admin shadcn override | `globals.css` → `.admin-layout { --color-* }` | Dark only (fixed) |

### How `.dark` Class + CSS Variables Work Together

When `html.dark` is set by `next-themes`, all CSS rules under `.dark { }` activate. Custom properties redefined there override the `:root` values for all descendants.

```css
/* globals.css additions for v1.5 */
@import "tailwindcss";
@custom-variant dark (&:where(.dark, .dark *));   /* ADD THIS LINE */

@theme inline {
  /* All existing tokens stay exactly as-is */
  --color-app-bg: #F5F2EF;
  --color-app-card-bg: #FFFFFF;
  --color-app-text: #1A1A1A;
  /* ... */
}

/* NEW block — dark overrides for app PWA */
.dark {
  --color-app-bg: #1C1A18;
  --color-app-card-bg: #262420;
  --color-app-card-border: #363330;
  --color-app-divider: #262420;
  --color-app-icon-bg: #262420;
  --color-app-text: #F0EDE8;
  --color-app-muted: #8A847E;
  /* shared/shadcn tokens for dark mode */
  --color-background: #1C1A18;
  --color-foreground: #F0EDE8;
  --color-card: #262420;
  --color-border: #363330;
}
```

Components that currently use `var(--color-app-bg)` or CSS classes bound to those tokens will automatically switch. Zero markup changes needed.

### Important: `@theme inline` and Runtime Overrides

Tokens declared inside `@theme inline { }` are registered as Tailwind design tokens. The **values** can still be overridden at runtime by `.dark { }` because CSS custom property inheritance works independently of how Tailwind compiled them. `.dark { --color-app-bg: #1C1A18; }` wins over the `@theme inline` definition at runtime due to cascade specificity.

This has been confirmed by the official Tailwind v4 dark mode documentation: the `@custom-variant dark` + `.dark { }` pattern is the canonical v4 approach.

**Validation step at implementation:** After adding `@custom-variant dark` and the `.dark { }` overrides, visually confirm that `bg-[--color-app-bg]` and `var(--color-app-bg)` both switch when `html.dark` is toggled. If `@theme inline` creates a static compiled value (not a runtime var reference), move the app token declarations to a `:root { }` block outside `@theme inline`. Only brand colors (non-themeable) should remain in `@theme inline`.

### Admin CSS Token Migration

The admin panel needs its token definition refactored from "always dark" to "dark is explicit":

```css
/* admin.css — v1.5 migration */
:root {
  /* Light defaults (new) */
  --admin-bg: #fafafa;
  --admin-surface: #ffffff;
  --admin-surface-hover: #f5f5f5;
  --admin-border: #e5e5e5;
  --admin-text: #171717;
  --admin-text-muted: #525252;
  --admin-text-dim: #a3a3a3;
  /* accent/danger/success/warning stay same hex values — they work on both themes */
  --admin-accent: #35605a;
  --admin-accent-hover: #2a4d48;
  /* ...etc */
}

.dark {
  /* Existing dark values moved here */
  --admin-bg: #0a0a0a;
  --admin-surface: #171717;
  --admin-surface-hover: #222222;
  --admin-border: #2a2a2a;
  --admin-text: #ededed;
  --admin-text-muted: #888888;
  --admin-text-dim: #444444;
}
```

The `.admin-layout` shadcn override in `globals.css` also needs updating: remove the hardcoded dark overrides there and let the `.dark` block handle them instead.

---

## Summary Table

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Tailwind dark mode config | `@custom-variant dark (&:where(.dark, .dark *))` in globals.css | v4 CSS-first API, single line addition |
| Theme package | `next-themes@0.4.6` | Anti-flash built-in, `useTheme()` hook, React 19 + Next.js 15/16 compatible |
| `ThemeProvider` placement | Root `app/layout.tsx` wrapping `{children}` | Root owns `<html>`, sub-layouts get scoped instances |
| Scoped themes | Two ThemeProvider instances, different `storageKey` | `/app` and `/admin` preferences stored independently |
| CSS token strategy | Existing tokens unchanged; add `.dark { }` overrides | Zero markup changes to ~50 existing components |
| Admin token direction | Flip to light-default, dark-explicit under `.dark` | Unifies dark mode control via single `html.dark` class |
| `suppressHydrationWarning` | Already on `<html>` in root layout | No change needed |
| `disableTransitionOnChange` | Pass to ThemeProvider | Compatible with existing View Transitions, prevents flash |

**Install command:**
```bash
npm install next-themes
```

---

## Sources

- Tailwind CSS v4 Dark Mode docs: https://tailwindcss.com/docs/dark-mode (HIGH confidence — official, current)
- Tailwind CSS v4 Upgrade Guide: https://tailwindcss.com/docs/upgrade-guide (HIGH confidence — official)
- next-themes package.json: https://raw.githubusercontent.com/pacocoursey/next-themes/main/packages/next-themes/package.json — version 0.4.6, React 19 peer dep confirmed (HIGH confidence)
- Next.js 15 layout.tsx API reference: https://nextjs.org/docs/app/api-reference/file-conventions/layout (HIGH confidence — official, docs version 16.2.6)
- Project globals.css: `/src/app/globals.css` — inspected directly, confirms Tailwind v4 `@import "tailwindcss"` + `@theme inline` in use (HIGH confidence)
- Project admin.css: `/src/app/admin/admin.css` — inspected directly, confirms current fixed-dark token pattern (HIGH confidence)
- Project package.json: confirms `tailwindcss@^4`, `next@^16.2.6`, `react@19.2.3`, `next-themes` not yet installed (HIGH confidence)
