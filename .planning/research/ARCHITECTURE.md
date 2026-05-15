# Architecture Research — Dark Mode & Temas

**Domain:** Theming in Next.js 15 App Router with two independent route groups and an existing CSS custom properties design system
**Researched:** 2026-05-15
**Confidence:** HIGH — based on direct codebase inspection, official Next.js docs, and Tailwind v4 docs

---

## Existing Baseline (Critical Context)

Before designing anything, understand what already exists:

- **Admin is already dark-only.** `admin.css` defines `--admin-*` tokens as fixed dark values in `:root`. The panel has no light variant today. Adding dark mode for admin means adding a **light variant**, not a dark one.
- **PWA (`/app`) is already light-only.** `globals.css` defines `--color-app-*` tokens as fixed light values in `@theme inline`. Adding dark mode for PWA means adding a **dark variant**.
- **`globals.css` uses Tailwind v4 `@theme inline`.** These tokens compile into Tailwind utility classes (e.g., `bg-app-bg`). Dark variants of these tokens require a separate CSS selector strategy, not just new `@theme` values.
- **No `next-themes` or any theming library is installed.** Zero existing infrastructure.
- **Root `layout.tsx`** owns `<html>` and `<body>`. It does not belong to either route group — it wraps both.
- **`AppShell` (PWA shell) is a Client Component.** It already reads `usePathname` and has state logic.
- **`AdminLayoutClient` is a Client Component.** It already handles navigation state.
- The PWA has **View Transitions** tied to `html` class mutations (`html.vt-push`, etc.). Any theme mechanism that also touches `html` class must not conflict.

---

## Component Architecture

### New Components to Create

**`src/components/app/AppThemeProvider.tsx`** — Client Component
- Wraps the PWA tree (inside `AppShell`, wrapping its content div)
- Reads `localStorage.getItem('monarca-app-theme')` on mount
- Falls back to `window.matchMedia('(prefers-color-scheme: dark)').matches`
- Applies `data-theme="dark"` (or removes it) to its own root `div` wrapper
- Exports `useAppTheme(): { theme, preference, setPreference }` hook via React Context
- storageKey: `'monarca-app-theme'`

**`src/components/admin/AdminThemeProvider.tsx`** — Client Component
- Wraps the admin tree (inside `AdminLayoutClient`, wrapping the outer `div.admin-layout`)
- Reads `localStorage.getItem('monarca-admin-theme')` on mount
- Falls back to `window.matchMedia('(prefers-color-scheme: dark)').matches`
- Applies `data-theme="light"` to its own root `div` wrapper when resolved theme is light
- Exports `useAdminTheme(): { theme, preference, setPreference }` hook via React Context
- storageKey: `'monarca-admin-theme'`

**`src/components/app/AppThemeToggle.tsx`** — Client Component
- Calls `useAppTheme()` hook
- Renders a toggle (sun/moon icon swap, or three-state light/dark/system)
- Placed inside `/app/perfil` page, in the Preferencias section
- Must be a Client Component because it uses context and event handlers

**`src/components/admin/AdminThemeToggle.tsx`** — Client Component
- Calls `useAdminTheme()` hook
- Renders a toggle
- Placed inside `/admin/minha-conta` page

### NOT Using `next-themes`

`next-themes` targets the `<html>` element. This project has two independent theme scopes, each needing a different localStorage key, living inside the same `<html>`. Using `next-themes` for both would require two instances fighting over `<html>` class. The correct architecture is **custom scoped providers** targeting `data-theme` attributes on the route group shell divs, not the `<html>` element.

---

## Integration Points

### Files to Modify

**`src/app/app/layout.tsx`** (PWA route group layout — Server Component)
- Add inline `<script>` tag for anti-flash — see Anti-Flash Strategy section
- The script must be rendered inside `<body>` before `AppShell` renders

**`src/components/app/AppShell.tsx`** (Client Component — existing)
- Add `AppThemeProvider` wrapper around the outermost `div`
- Add `suppressHydrationWarning` to the outer shell div
- The `data-theme` attribute lives on this div, not on `<html>`
- Migrate hardcoded hex colors in `className` to token utilities (e.g., `bg-[#F5F2EF]` → `bg-app-bg`)

**`src/components/admin/AdminLayoutClient.tsx`** (Client Component — existing)
- Add `AdminThemeProvider` wrapper around the outer `div.admin-layout`
- Add `suppressHydrationWarning` to that div
- The `data-theme` attribute lives on this div

**`src/app/globals.css`**
- Add `@custom-variant dark` declaration for Tailwind v4
- Add `--color-app-*` dark variant overrides under `[data-theme="dark"]` selector, scoped narrowly to avoid affecting admin
- Add `.admin-layout[data-theme="light"]` block to re-override Shadcn tokens for light admin

**`src/app/admin/admin.css`**
- Change `.admin-layout` background and color from hardcoded values to `var(--admin-bg)` and `var(--admin-text)`
- Add `--admin-*` light variant overrides under `.admin-layout[data-theme="light"]` selector

### Files NOT to Modify

**`src/app/layout.tsx`** (root layout) — Do NOT add any theme class, provider, or script here. Theme state belongs to sub-trees. Root layout owns `<html suppressHydrationWarning>` but does not participate in theme logic.

---

## Anti-Flash Strategy

### The Problem

On initial page load, the browser renders HTML before JavaScript executes. Without intervention, the page briefly shows the wrong theme before JS applies the correct `data-theme` attribute. This flash is visible and jarring.

### The Solution: Synchronous Inline Script

An inline `<script>` tag with `dangerouslySetInnerHTML` runs synchronously during HTML parsing — before any CSS paint. It reads localStorage and applies the correct `data-theme` attribute to the shell div immediately.

### Placement: In the Route Group Layout (`src/app/app/layout.tsx`)

The PWA layout is a Server Component that renders before `AppShell`. An inline script placed here, inside `<body>` but before `AppShell`, can target the shell div by reaching into `document.body`'s first element or by using a `__MONARCA_APP_THEME__` marker. However, the cleanest approach is:

**Option A — Script in `AppShell` before the outer div (recommended):**

Inside `AppShell.tsx` return, before (or as first child of) the outer `div`:

```tsx
<>
  <script
    dangerouslySetInnerHTML={{
      __html: `(function(){try{var t=localStorage.getItem('monarca-app-theme');var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme:dark)').matches);if(d)document.currentScript.parentElement.setAttribute('data-theme','dark')}catch(e){}})();`
    }}
  />
  <div suppressHydrationWarning className="..." data-theme={undefined}>
    {/* shell content */}
  </div>
</>
```

Wait — `document.currentScript.parentElement` is the React fragment root, not the div. This does not work cleanly with a fragment. Use a wrapper:

**Option B — Script as first child inside the shell div (recommended):**

```tsx
<div suppressHydrationWarning className="flex bg-app-bg text-app-text ..." style={...}>
  <script
    dangerouslySetInnerHTML={{
      __html: `(function(){try{var t=localStorage.getItem('monarca-app-theme');var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme:dark)').matches);if(d)document.currentScript.parentElement.setAttribute('data-theme','dark')}catch(e){}})();`
    }}
  />
  {/* rest of shell */}
</div>
```

`document.currentScript.parentElement` correctly targets the `div` shell. This runs synchronously when the parser encounters the script tag, which is precisely when its parent element exists in the DOM. The CSS variables defined on `[data-theme="dark"]` then apply to everything inside.

**For admin (`AdminLayoutClient.tsx`) — same pattern:**

```tsx
<div className="admin-layout" suppressHydrationWarning>
  <script
    dangerouslySetInnerHTML={{
      __html: `(function(){try{var t=localStorage.getItem('monarca-admin-theme');var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme:dark)').matches);if(!d)document.currentScript.parentElement.setAttribute('data-theme','light')}catch(e){}})();`
    }}
  />
  {/* sidebar, main, etc. */}
</div>
```

Note the logic inversion: admin defaults to dark, so the script applies `data-theme="light"` only when the resolved theme is NOT dark.

### `suppressHydrationWarning` Requirement

The server renders both shell divs without any `data-theme` attribute (server cannot read localStorage). The inline script adds the attribute synchronously. React hydrates after and sees a mismatch between server-rendered HTML (no attribute) and the DOM (has attribute). `suppressHydrationWarning` on the shell div tells React to ignore this single-element mismatch.

Without this prop, React logs a hydration warning to the console on every page load for users whose theme differs from the default.

### View Transitions Compatibility

The existing View Transitions system mutates `html.vt-push`, `html.vt-pop`, etc. on the `<html>` element. Theme uses `data-theme` on inner divs (`AppShell`'s div and `.admin-layout`). These operate on entirely different elements and different attributes. There is no conflict.

---

## CSS Token Strategy

### The Core Problem with Tailwind v4 `@theme inline`

`@theme inline` compiles tokens into static CSS at build time. The custom property `--color-app-bg: #F5F2EF` becomes a fixed value baked into the CSS output. You cannot override it at runtime by toggling a class on `<html>`, because Tailwind utilities like `bg-app-bg` compile to `background-color: #F5F2EF` — the variable reference is resolved at build time.

The correct runtime strategy: define the base values normally (in `@theme inline` OR in `:root`), then override the same CSS custom property names in a scoped selector. The browser's CSS cascade handles runtime switching.

### PWA Dark Token Strategy (`globals.css`)

Add after the existing `@theme inline` block. These are regular CSS rules, not `@theme inline`:

```css
/* Dark variant — applied when AppShell div has data-theme="dark" */
/* Narrow selector prevents leaking into admin */
.app-shell[data-theme="dark"],
div[data-theme="dark"].app-shell {
  --color-app-bg: #1C1C1C;
  --color-app-card-bg: #252525;
  --color-app-card-border: #333333;
  --color-app-divider: #2A2A2A;
  --color-app-icon-bg: #2A2A2A;
  --color-app-primary: #4FA897;        /* lightened teal for legibility on dark */
  --color-app-text: #F0EDEA;
  --color-app-muted: #8A827B;
  --color-app-accent-green-bg: #1B3322;
  --color-app-accent-green: #4ADE80;
  --color-app-danger-bg: #2D1515;
  --color-app-danger-border: #5C2020;
  --color-app-danger: #F87171;
}
```

Add a class `app-shell` to AppShell's outer div to make the selector unambiguous.

### Tailwind `@custom-variant` for `dark:` Utilities

To enable `dark:bg-slate-900`-style utilities scoped to the PWA, add to `globals.css`:

```css
@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));
```

This overrides Tailwind v4's default `dark:` behavior (which uses `prefers-color-scheme`) with a selector-based approach. Any element with `data-theme="dark"` or a descendant of such an element will have `dark:` utilities activate.

Because only the PWA shell gets `data-theme="dark"`, admin is unaffected. Admin dark styles are handled entirely via `--admin-*` variable overrides, not Tailwind `dark:` utilities.

### Admin Light Token Strategy (`admin.css`)

Step 1 — Make existing admin layout use variables:

```css
/* Change from hardcoded to variable-based */
.admin-layout {
  background: var(--admin-bg);   /* was hardcoded — now uses token */
  color: var(--admin-text);
}
```

Step 2 — Add light variant block:

```css
/* Light variant — applied when admin-layout has data-theme="light" */
.admin-layout[data-theme="light"] {
  --admin-bg: #F0F0F0;
  --admin-surface: #FFFFFF;
  --admin-surface-hover: #F5F5F5;
  --admin-surface-row-atrasada: #FFF0F0;
  --admin-surface-row-aguardando: #FFFFF0;
  --admin-border: #DDDDDD;
  --admin-border-focus: #35605a;
  --admin-text: #1A1A1A;
  --admin-text-muted: #6B6B6B;
  --admin-text-dim: #9A9A9A;
  --admin-accent: #35605a;
  --admin-accent-hover: #2a4d48;
  --admin-danger: #D32F2F;
  --admin-danger-hover: #B71C1C;
  --admin-success: #1F7A4A;
  --admin-bg-success: #E8F5E9;
  --admin-border-success: #A5D6A7;
  --admin-bg-info: #E3F2FD;
  background: var(--admin-bg);
  color: var(--admin-text);
}
```

### Shadcn Override Block Update (`globals.css`)

`globals.css` already has a `.admin-layout` block that maps Shadcn tokens to the dark admin palette. Add a companion block for light:

```css
.admin-layout[data-theme="light"] {
  --color-background: #F0F0F0;
  --color-foreground: #1A1A1A;
  --color-card: #FFFFFF;
  --color-card-foreground: #1A1A1A;
  --color-popover: #FFFFFF;
  --color-popover-foreground: #1A1A1A;
  --color-primary: #35605a;
  --color-primary-foreground: #ffffff;
  --color-secondary: #EEEEEE;
  --color-secondary-foreground: #1A1A1A;
  --color-muted: #E8E8E8;
  --color-muted-foreground: #6B6B6B;
  --color-accent: #E8E8E8;
  --color-accent-foreground: #1A1A1A;
  --color-destructive: #D32F2F;
  --color-destructive-foreground: #ffffff;
  --color-border: #DDDDDD;
  --color-input: #DDDDDD;
  --color-ring: #35605a;
  background: #F0F0F0;
  color: #1A1A1A;
}
```

---

## Build Order

Implement in this sequence to avoid regressions at each step:

### Step 1 — CSS Token Foundation (no JS changes)
1. In `globals.css`: Add `@custom-variant dark` declaration
2. In `globals.css`: Add `[data-theme="dark"]` block with dark `--color-app-*` values (no visual change yet — no element has `data-theme="dark"` yet)
3. In `admin.css`: Change `.admin-layout` background/color from hardcoded to `var(--admin-bg)` / `var(--admin-text)` (no visual change since values are already defined in `:root`)
4. In `admin.css`: Add `.admin-layout[data-theme="light"]` block (no visual change yet)
5. In `globals.css`: Add `.admin-layout[data-theme="light"]` Shadcn override block
6. Verify: build passes, existing visual appearance is pixel-identical

### Step 2 — Migrate Hardcoded Colors in AppShell
1. Add `app-shell` class to AppShell's outer div
2. Migrate hardcoded hex values in `AppShell.tsx` `className` props to token utilities (`bg-[#F5F2EF]` → `bg-[var(--color-app-bg)]` or a new Tailwind utility name)
3. Verify: visual appearance unchanged, tokens drive the colors

### Step 3 — ThemeProvider Infrastructure
1. Create `src/lib/theme/app-theme-context.tsx` — React Context + `useAppTheme` hook
2. Create `src/lib/theme/admin-theme-context.tsx` — React Context + `useAdminTheme` hook
3. Create `src/components/app/AppThemeProvider.tsx`
4. Create `src/components/admin/AdminThemeProvider.tsx`
5. Integrate `AppThemeProvider` into `AppShell.tsx` (wrap outermost div)
6. Integrate `AdminThemeProvider` into `AdminLayoutClient.tsx` (wrap `.admin-layout` div)
7. Add `suppressHydrationWarning` to both shell divs
8. Add anti-flash inline scripts to both shell components (as first child inside the div)
9. Verify: no hydration warnings, no visual regressions, toggling `data-theme` manually in DevTools applies correct styles

### Step 4 — Toggle UI
1. Create `src/components/app/AppThemeToggle.tsx`
2. Insert into `/app/perfil/page.tsx` under "Apariencia" section in the menu list
3. Create `src/components/admin/AdminThemeToggle.tsx`
4. Insert into `/admin/minha-conta/page.tsx`

### Step 5 — QA
1. Test PWA in light (default) — unchanged
2. Test PWA in dark — all token-driven styles render correctly
3. Test admin in dark (default) — unchanged
4. Test admin in light — correct light palette
5. Test OS `prefers-color-scheme: dark` behavior when no explicit localStorage value
6. Test persistence across page refreshes and navigation
7. Test that `/app` and `/admin` themes are fully independent
8. Test View Transitions still work correctly in dark mode (no conflict)

---

## Two Independent Theme Contexts

### The Core Principle

The two route groups share one `<html>` document. A single shared theme context applied to `<html class="dark">` cannot give them independent state. The solution is to scope each theme to its shell div using `data-theme` attributes and separate localStorage keys.

### localStorage Keys

| Surface | Key | Default (no stored value) |
|---------|-----|--------------------------|
| PWA `/app` | `monarca-app-theme` | Follow `prefers-color-scheme` |
| Admin `/admin` | `monarca-admin-theme` | Follow `prefers-color-scheme` |

The two keys are fully independent. A user can have the PWA in dark while the admin is in light. There is no cross-sync.

### Data Flow

```
1. Server renders shell div without data-theme attribute
2. Inline <script> runs synchronously during HTML parsing:
     - reads localStorage.getItem('monarca-app-theme')
     - if null, reads window.matchMedia('(prefers-color-scheme: dark)')
     - if dark: sets parentElement.setAttribute('data-theme', 'dark')
3. CSS cascade: [data-theme="dark"] overrides apply immediately
4. React hydrates — suppressHydrationWarning prevents console error
5. useEffect in ThemeProvider runs, syncs React state with DOM attribute
6. User toggles → setPreference() → localStorage write + DOM attribute update
```

### Context API Shape

```tsx
type ThemePreference = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextValue {
  theme: ResolvedTheme;                    // what is currently applied
  preference: ThemePreference;             // what the user explicitly chose
  setPreference: (t: ThemePreference) => void;
}
```

Storing `'system'` as a preference means "follow OS" without storing a concrete value. The resolved `theme` is always `'light'` or `'dark'`. This allows a three-state toggle UI without architecture changes.

### Handling System Preference Changes at Runtime

```tsx
useEffect(() => {
  if (preference !== 'system') return;
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = (e: MediaQueryListEvent) => applyTheme(e.matches ? 'dark' : 'light');
  mq.addEventListener('change', handler);
  return () => mq.removeEventListener('change', handler);
}, [preference]);
```

### SSR Behavior

On the server, neither `localStorage` nor `window.matchMedia` is available. The server always renders without `data-theme`. This is correct and expected:

1. Server renders default theme (light for PWA, dark for admin)
2. HTML streams to browser
3. Inline script runs before first paint, sets `data-theme` correctly
4. React hydrates — `suppressHydrationWarning` silences the expected mismatch
5. `useEffect` in ThemeProvider confirms correct React state

No server-side theme detection via cookies is needed or in scope. This is the standard pattern for this class of problem.

---

## Key Constraints from Existing Code

**`AppShell.tsx` has many hardcoded hex values in `className`.**
Examples: `bg-[#F5F2EF]`, `text-[#1A1A1A]`, `bg-white`, `border-[#E8E2D6]`. These will NOT respond to CSS variable overrides because they are baked as literal CSS values. Step 2 of the build order must address this before dark mode is testable visually in the PWA. This is the largest surface of work in the entire milestone.

**`admin.css` has hardcoded values in selector rules.**
`.admin-layout { background: #0a0a0a; color: #ededed; }` must become `background: var(--admin-bg); color: var(--admin-text);` for light override to work. This is a two-line change.

**`@theme inline` in Tailwind v4 produces static values.**
Dark overrides must be in regular CSS rules, not `@theme inline`. The variable names must be identical so the cascade works.

**`themeColor` in PWA metadata is static.**
`viewport.themeColor = '#F5F2EF'` in root `layout.tsx` cannot be made dynamic from client state. The meta `theme-color` tag will always show the light value in the OS chrome. This is a known PWA limitation — not worth adding cookie-based server detection for v1.5.

**`Toaster` in both layouts uses `richColors`.**
`sonner`'s `richColors` respects the system color scheme automatically. No action needed for toasts.

---

## Sources

- Next.js 15 App Router — Server/Client Component composition, context provider patterns (nextjs.org, version 16.2.6, accessed 2026-05-15)
- Tailwind CSS v4 — `@custom-variant` for custom dark mode selectors (tailwindcss.com, accessed 2026-05-15)
- Direct codebase inspection (HIGH confidence):
  - `src/app/layout.tsx`
  - `src/app/app/layout.tsx`
  - `src/app/admin/layout.tsx`
  - `src/components/app/AppShell.tsx`
  - `src/components/admin/AdminLayoutClient.tsx`
  - `src/app/globals.css`
  - `src/app/admin/admin.css`
  - `docs/design-system/tokens.md`
  - `package.json` (confirmed no theming libraries installed)
