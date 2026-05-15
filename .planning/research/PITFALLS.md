# Pitfalls Research — Dark Mode & Temas (v1.5)

**Project:** next-monarca
**Researched:** 2026-05-15
**Scope:** Retrofitting dark/light theming onto an existing production Next.js 15 + Tailwind v4 + PWA (Serwist) codebase with CSS custom properties design system
**Confidence:** HIGH — based on direct codebase inspection of all relevant files

---

## Flash of Correct Theme (FOCT) / Hydration Mismatch

### Root Cause

The browser paints HTML before JavaScript executes. Without intervention, the page renders with whatever the CSS default state is (light theme tokens), then React hydrates and reads `localStorage`, applies `data-theme="dark"` to `<html>`, and repaints — causing a visible flash or a React hydration mismatch error.

The hydration mismatch risk is distinct: if any Server Component branches on a theme value that the server cannot know (because `localStorage` is inaccessible server-side), the HTML the server sends will differ from what the client renders. React throws in development and silently corrupts in production.

### Prevention

**Inline blocking script in `<head>` — the only reliable solution.** A tiny script that runs synchronously before any CSS paint reads `localStorage` and `matchMedia`, then sets the theme attribute on `<html>` before layout:

```html
<script>
  (function() {
    try {
      var stored = localStorage.getItem('monarca-theme');
      var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      var theme = stored === 'dark' || stored === 'light'
        ? stored
        : (prefersDark ? 'dark' : 'light');
      document.documentElement.setAttribute('data-theme', theme);
    } catch (e) {}
  })();
</script>
```

The script MUST be:
- In `<head>` before any stylesheet
- Synchronous — no `async`, no `defer`
- Wrapped in a try/catch (localStorage throws in private-browsing modes in some browsers)

**Placement in Next.js App Router:** The root `src/app/layout.tsx` must render this via `<Script strategy="beforeInteractive">` from `next/script`, or via a raw `<script dangerouslySetInnerHTML>` tag inside a `<head>` element. Do NOT use `strategy="afterInteractive"` or `strategy="lazyOnload"` — both execute after paint.

### This Codebase's Current State

`src/app/layout.tsx` already has `suppressHydrationWarning` on `<html>`. This is intentional and correct — it suppresses React warnings about the `data-theme` attribute differing between server render (no attribute) and client first paint (attribute set by the inline script). This suppression is scoped to the `<html>` element only; it does not suppress child-level hydration mismatches.

Do not remove `suppressHydrationWarning` from `<html>`. It is the correct companion to the anti-flash inline script pattern.

### CSP Compatibility

`next.config.ts` includes `'unsafe-inline'` in `script-src` for both dev and prod (the dev version also adds `'unsafe-eval'`). The anti-flash inline script will execute without modification. If the CSP is ever hardened to use nonces (removing `'unsafe-inline'`), the theme script must receive the same nonce as the page — this is the standard next-themes / hand-rolled approach.

### What Must NOT Be Done

Do not attempt to read theme from cookies in Server Components to enable server-side initial render with correct theme. This forces `force-dynamic` on every layout that reads the cookie (because `cookies()` is a dynamic API), undoing the ISR work from Phase 4. The inline script approach has zero server-side impact.

---

## Hardcoded Colors Breaking in Dark Mode

### Severity: Critical — Most Labor-Intensive Issue in This Codebase

This is the dominant risk for v1.5. The PWA (`/app`) has pervasive hardcoded hex values in Tailwind arbitrary classes and inline `style` props. Every hardcoded value is a color that will not adapt to dark mode.

### Confirmed Hardcoded Values (from codebase audit)

**In `src/components/app/AppShell.tsx`:**
- `className="flex bg-[#F5F2EF] text-[#1A1A1A]"` — app shell wrapper
- `className="bg-white border-r border-[#E8E2D6]"` — desktop sidebar
- `className="px-6 py-4 border-b border-[#E8E2D6]"` — sidebar header
- `className="bg-[#2E5A4C]/10 text-[#2E5A4C]"` — active nav state
- `className="text-[#6b7280] hover:bg-[#F5F0E8] hover:text-[#1f2937]"` — inactive nav
- `className="border-t border-[#E8E2D6]"` — sidebar footer

**In `src/app/layout.tsx`:**
- `<body style={{ backgroundColor: "#F5F2EF" }}>` — inline style, overrides all CSS variables

**In `src/app/manifest.ts`:**
- `background_color: "#F5F2EF"` and `theme_color: "#F5F2EF"` — both hardcoded light values

**In `src/app/app/perfil/page.tsx` (representative of all `/app/*` pages):**
- `className="flex flex-col min-h-full bg-[#F5F2EF]"` — page background
- `className="bg-white px-5 pt-8 pb-6 text-center border-b border-[#E8E2D6]"` — header card
- `className="text-lg font-bold text-[#1A1A1A]"` — headings
- `className="text-[#917961]"` — muted secondary text
- `className="bg-[#F5F0E8] rounded-xl"` — info cards

**In `src/app/admin/admin.css` (hardcoded despite having a token system):**
- Line 258: `background: #141414;` — table `th` header (not a token)
- Lines 630–644: `.admin-toast-success` and `.admin-toast-error` — all hardcoded 8-digit hex
- Lines 1033–1047: `.admin-alert-error`, `.admin-alert-success`, `.admin-alert-warning` — all hardcoded hex

### Detection Strategy for Implementation Phase

Run these searches before writing any dark-mode CSS:

1. Tailwind arbitrary color values in PWA components:
   Pattern: `bg-\[#`, `text-\[#`, `border-\[#`, `fill-\[#`, `stroke-\[#`
   Scope: `src/app/app/`, `src/components/app/`

2. Inline style color values:
   Pattern: `style={{` in all `.tsx` files under `src/app/app/` and `src/components/app/`
   Every hit must be reviewed — not every inline style is a color, but all color inline styles must be tokenized

3. Hardcoded hex in CSS files:
   Pattern: `#[0-9a-fA-F]{3,6}` in `admin.css`, `globals.css`, and any `*.css` under `src/app/`

4. The `<body>` inline style in `layout.tsx`:
   This is a single specific fix — remove `style={{ backgroundColor: "#F5F2EF" }}` and replace with a CSS variable

### Correct Fix Strategy

**Do this in order:**

1. Define all dark-variant token values in `globals.css` under `[data-theme="dark"]` first — establish the complete token set before touching any component
2. Replace every hardcoded color in components with the corresponding CSS variable or Tailwind token class
3. Run a visual pass on every route in both light and dark — check for missed values

Do not fix components before defining tokens. Do not mix `dark:` Tailwind classes with remaining hardcoded values — mixed approaches compound the debt.

### Admin Panel Scope Question

The admin is currently permanently dark — all `--admin-*` tokens are defined at `:root` as dark values. If v1.5 keeps admin permanently dark (only the PWA gets the toggle), the admin token system requires no changes. The only admin work needed would be replacing the few hardcoded non-token values (`#141414`, the alert colors) with proper tokens.

If admin gets a light/dark toggle too, the `--admin-*` tokens must be split into light and dark variants — a significant restructure of `admin.css`. Confirm the product requirement scope before starting admin token work.

---

## Tailwind v4 Dark Mode Gotchas

### v4 Has No `tailwind.config.js` — Configuration Is in CSS

In Tailwind v3, dark mode was configured in `tailwind.config.js`:
```js
module.exports = { darkMode: 'class' }
```

In Tailwind v4, there is no config file. All configuration is in CSS. **This project already uses v4** (confirmed: `@import "tailwindcss"` in `globals.css`, `tailwindcss: ^4` in `package.json`).

### Default v4 Dark Behavior Without Configuration

By default in v4, `dark:` utility classes respond to the `prefers-color-scheme: dark` OS media query. This means:

- `dark:bg-neutral-900` will activate automatically based on the OS setting
- It will NOT respond to `class="dark"` on `<html>` or `data-theme="dark"` on `<html>`
- localStorage overrides have no effect

This is the v3 equivalent of `darkMode: 'media'`. For a manual toggle (localStorage), this default is wrong.

### Required Configuration for Class/Attribute-Based Dark Mode

Add this to `globals.css` after `@import "tailwindcss"`:

```css
/* Makes dark: classes respond to [data-theme="dark"] on any ancestor */
@variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));
```

Or for class-based (`.dark` on `<html>`):

```css
@variant dark (&:where(.dark, .dark *));
```

**Prefer `data-theme` over `.dark` class** because:
- Avoids collisions with existing `.dark` class usage in admin or third-party components
- Semantically clean — attributes = data state, classes = styling hooks
- Easier to debug in browser DevTools

This single `@variant dark` declaration must be added before any rule that uses `dark:` utilities. Placement after `@import "tailwindcss"` and before `@layer base` is correct.

### `@theme inline` Tokens Are Static — They Do Not Switch Automatically

The `@theme inline` block in `globals.css` defines CSS custom properties used as Tailwind color utilities. These are fixed values — they do not switch based on any variant. For example:

```css
@theme inline {
  --color-app-bg: #F5F2EF;  /* always light — no dark variant here */
}
```

To make these values switch, define overrides at the `:root` level (not inside `@theme`):

```css
/* globals.css — outside @theme block */
:root {
  --color-app-bg: #F5F2EF;
  --color-app-card-bg: #FFFFFF;
  --color-app-text: #1A1A1A;
  /* ... all app tokens ... */
}

[data-theme="dark"] {
  --color-app-bg: #1A1A1A;
  --color-app-card-bg: #242424;
  --color-app-text: #EDEDED;
  /* ... dark overrides ... */
}
```

Then use `bg-app-bg` as a Tailwind class — Tailwind resolves `--color-app-bg` at runtime, and it picks up the contextual CSS variable value.

### Specificity Conflict With Existing `.admin-layout` Overrides

`globals.css` currently overrides `--color-*` tokens inside `.admin-layout` (lines 119–141). When dark mode tokens are also defined under `[data-theme="dark"]`, both selectors have the same specificity (one class = one attribute = specificity `[0,1,0]`).

The conflict resolution: whichever appears **later** in the stylesheet wins for equal-specificity selectors. Since `.admin-layout` overrides are defined after the `[data-theme]` rules would be defined, `.admin-layout` wins — which is the correct behavior if admin stays permanently dark.

If both are needed, increase admin specificity: `.admin-layout[data-theme="dark"]` or `.admin-layout` with `:is()` wrappers.

### `dark:` Classes in Server Components Are Safe

`dark:` utility classes compile to static CSS with `:where([data-theme="dark"] *)` in the selector. A Server Component can include `className="dark:bg-neutral-900"` in its JSX — the HTML it sends contains the class string, and the CSS handles activation based on the `<html>` attribute. No JavaScript or hooks are involved. No hydration mismatch occurs.

The unsafe pattern is branching JSX in a Server Component based on theme: `if (theme === 'dark') return <DarkVersion />`. That requires knowing theme server-side, which is impossible without cookies (which breaks ISR).

---

## PWA / Service Worker Complications

### Serwist Version and Active Status

`package.json` has `@serwist/next: ^9.5.11` and `serwist: ^9.5.11`. However, `next.config.ts` wraps only with `withSentryConfig` — no `withSerwist()` wrapper is present. This means the PWA service worker may not currently be active in the build output.

**Action required before implementing:** Verify whether `/public/sw.js` or `/_next/static/sw.js` exists in the build output. If absent, Serwist is not active and the SW-related pitfalls below are moot for now. If present (configured separately or via a plugin not visible in `next.config.ts`), the caching pitfalls below apply immediately.

### HTML Caching Can Break the Theme Script

Service workers intercept navigation requests. If Serwist caches HTML documents with a `CacheFirst` or aggressive `StaleWhileRevalidate` strategy, a user who has the PWA installed and returns to it may receive a cached HTML that lacks the theme anti-flash script (because the script was added after their last network fetch of the page).

**Prevention:** Configure the Serwist default handler to use `NetworkFirst` for HTML document requests. This ensures the `<head>` with the theme script is always fetched fresh:

```ts
// sw.ts
import { NetworkFirst, StaleWhileRevalidate } from 'serwist';

// HTML pages: always network first
defaultHandler: new NetworkFirst({
  cacheName: 'pages',
  plugins: [new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 86400 })]
})

// JS/CSS/images: stale while revalidate is fine
// (they don't contain the theme script)
```

### `theme_color` in Manifest Is Static

`src/app/manifest.ts` has `theme_color: "#F5F2EF"` (hardcoded light). This controls the browser chrome color when the PWA is installed as a home screen app. It cannot be changed at runtime.

**Partial workaround:** The `viewport.themeColor` in Next.js `layout.tsx` accepts an array for media-query-based switching:

```ts
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F5F2EF' },
    { media: '(prefers-color-scheme: dark)', color: '#1A1A1A' },
  ],
};
```

This makes the browser chrome adapt to the OS setting. However, it cannot follow the user's localStorage manual override — if the user's OS is in light mode but they set the app to dark manually, the browser chrome stays light. This is an unavoidable platform limitation. Document it as a known gap.

The manifest `background_color` (splash screen) also cannot be dynamic. Change it from `#F5F2EF` to the brand's primary color (`#35605A`) which works acceptably on both light and dark. Alternatively, leave it as-is — the splash screen is visible for < 1 second and is cosmetic only.

### PWA Update Propagation Delay

When the anti-flash theme script is first added to the HTML, users with the PWA already installed will not receive it immediately. The service worker update cycle requires:

1. User visits while online → SW update check triggers
2. New SW downloads in background
3. User closes all PWA tabs → new SW activates

This means some users may see the flash for 1–2 sessions after deployment. No mitigation is needed — this is standard SW behavior. Ensure `skipWaiting: true` is set in the Serwist config to minimize the activation gap.

### OneSignal Service Worker Coexistence

This project uses OneSignal for push notifications. OneSignal registers its own service worker (`OneSignalSDKWorker.js`). In Serwist-managed PWAs, there can be conflicts if both try to handle the same navigation events.

Serwist and OneSignal typically coexist safely when the OneSignal SW scope is scoped to `/` and the Serwist SW does not intercept push event handlers. The current configuration (`react-onesignal` v3) handles this via a separate scope. No changes needed for dark mode — this is a pre-existing concern, not a v1.5 issue.

---

## CSS Custom Property Scoping

### Current Dual-Root Architecture

The project has two CSS token systems:

1. **`globals.css` `@theme inline` block** — defines `--color-app-*` tokens used by Tailwind classes in the PWA
2. **`admin.css` `:root` block** — defines `--admin-*` tokens used directly in admin CSS

Both are at `:root` level. When `[data-theme="dark"]` is added, it must target `<html>` (which `:root` also targets — they are the same element). The override cascade:

```
:root { --color-app-bg: light-value; }         /* baseline */
[data-theme="dark"] { --color-app-bg: dark-value; }  /* overrides when data-theme is set */
.admin-layout { --color-*: admin-overrides; }  /* admin keeps its own values */
```

Specificity: `:root` and `[data-theme="dark"]` both have specificity `[0,1,0]`. Position in stylesheet determines which wins for equal specificity. The `[data-theme="dark"]` block must come AFTER `:root` definitions to override correctly.

### The Admin Token Isolation Problem

`admin.css` defines all `--admin-*` tokens in `:root` — globally available everywhere. The admin CSS classes (`admin-layout`, `admin-card`, etc.) use those tokens. This is fine as long as admin tokens do not collide with app tokens. Currently they don't (different prefixes).

The risk: when `[data-theme="dark"]` is added to toggle `--color-app-*` tokens, it will only affect app tokens — admin tokens remain unchanged. This is the correct behavior. Confirm no admin component accidentally uses `--color-app-*` tokens (it would be a pre-existing bug, not a v1.5 issue).

### Variable Inheritance Through Portals

React portals (used by sonner, dialogs, sheets) render outside the normal component tree but inherit CSS custom properties from their closest ancestor that defines them. Since theme tokens are on `<html>` (`:root`), all portals inherit the correct theme automatically.

**Exception:** The sonner `<Toaster>` component has its own `theme` prop that determines its color scheme independently of the page theme. Both `AppLayout` and `AdminLayout` pass `richColors` to `<Toaster>`. Without the `theme` prop, sonner defaults to the OS `prefers-color-scheme` setting — which may conflict with the user's manual localStorage override.

**Fix:** The `ThemeProvider` client component that manages theme state must pass the resolved theme to `<Toaster>`:

```tsx
// In the client wrapper that holds theme state
<Toaster theme={resolvedTheme as 'light' | 'dark' | 'system'} richColors />
```

This means the `<Toaster>` must be rendered by a Client Component that has access to the current theme. The current structure (Server Component layouts rendering `<Toaster>`) needs a client wrapper for this. This is a necessary architectural change.

### Motion Tokens and Dark Mode

`globals.css` defines `--motion-sheet-handle-bg: var(--color-app-divider, #F5F2EF)`. The fallback value `#F5F2EF` is hardcoded light. When `--color-app-divider` is properly tokenized and switches to a dark value under `[data-theme="dark"]`, this variable will automatically adapt. No special action needed — the token reference is correct; only the token's value needs a dark variant.

---

## SSR / Server Component Constraints

### The Two-Phase Rendering Reality

Next.js App Router renders pages in two phases:

1. **Server phase:** Server Components run, produce HTML. No access to `localStorage`, `window`, `matchMedia`, or any browser API. The server does not know the user's preferred theme.

2. **Client phase:** Browser parses HTML, runs the anti-flash inline script (sets `data-theme` before paint), React hydrates. Client Components run, read `localStorage`, establish theme state.

**All theme logic belongs in the client phase.** Server Components must not attempt to read, infer, or branch on theme. They render theme-agnostic HTML with `dark:` utility classes that the CSS activates contextually.

### The Cookie-as-Theme Trap

A common approach is to set a cookie when the user changes theme, then read that cookie in Server Components to produce the correct initial HTML (avoiding the flash entirely). This approach is appealing but has a severe cost in this codebase:

- `cookies()` in Next.js is a dynamic function
- Any Server Component or layout that calls `cookies()` opts out of caching
- This means `force-dynamic` or equivalent must be applied to every page that needs correct initial theme rendering
- Phase 4 of v1.0 specifically removed `force-dynamic` from public pages — this would reintroduce it

**Do not use cookies for theme storage.** The inline script approach is correct for this codebase. The tradeoff is a theoretical flash on the very first render of new users (OS preference + no stored override). In practice this flash is invisible because the inline script runs before paint.

### Server Components With `dark:` Classes — Safe Pattern

```tsx
// Server Component — this is safe
export default async function ProductCard({ product }: Props) {
  return (
    <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700">
      <p className="text-gray-900 dark:text-gray-100">{product.name}</p>
    </div>
  );
}
```

The `dark:` classes compile to CSS rules that activate based on `data-theme="dark"` on `<html>`. The Server Component just emits the class string. No hydration mismatch.

### Server Components Branching on Theme — Unsafe Pattern

```tsx
// Server Component — DO NOT DO THIS
export default async function PageHeader() {
  // Cannot know theme server-side without cookies() which breaks ISR
  const cookieStore = await cookies();
  const theme = cookieStore.get('theme')?.value ?? 'light';
  
  return (
    <header style={{ background: theme === 'dark' ? '#1A1A1A' : '#FFFFFF' }}>
      ...
    </header>
  );
}
```

Use `dark:` classes instead. They achieve the same visual result without any server-side branching.

### `ThemeProvider` as Client Component Boundary

The theme toggle, theme persistence, and `resolvedTheme` state must live in a Client Component. The recommended pattern for this project:

```
src/app/layout.tsx (Server Component)
  └─ <ThemeProvider> (Client Component — "use client")
       └─ {children} (Server Components as children prop — this is allowed)
```

This pattern is already used in the project: `AppShell.tsx` is a Client Component (it has `"use client"`) that wraps `{children}` which are Server Components. `ThemeProvider` follows the same pattern.

The `ThemeProvider` should:
- Read `localStorage` on mount
- Listen to `matchMedia('(prefers-color-scheme: dark)')` changes
- Set `data-theme` on `document.documentElement`
- Expose `theme` and `setTheme` via context
- Render the anti-flash script as an inline `<script>` (in addition to the one in `layout.tsx` root `<head>`)

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Anti-flash script placement | Script placed after CSS or with `defer`/`async` — still flashes | Must be synchronous first child of `<head>`, wrapped in try/catch |
| `layout.tsx` `<body>` inline style | `style={{ backgroundColor: "#F5F2EF" }}` overrides all CSS variables | Remove inline style; set body background via CSS token `var(--color-app-bg)` |
| Tailwind v4 `@variant dark` | Not declared → `dark:` classes only respond to OS media, not localStorage | Declare `@variant dark (&:where([data-theme="dark"], [data-theme="dark"] *))` in `globals.css` after `@import "tailwindcss"` |
| Admin token `:root` scope | `--admin-*` defined globally at `:root`; `[data-theme="dark"]` must not accidentally remap admin tokens | Use different variable names; or define admin overrides last so they win specificity battle |
| Sonner `<Toaster>` | Without `theme` prop, toast colors follow OS not localStorage toggle | Pass `theme={resolvedTheme}` to both `<Toaster>` instances; requires making them children of the `ThemeProvider` |
| `manifest.ts` `theme_color` | Cannot be dynamic; hardcoded `#F5F2EF` looks wrong on dark devices | Use `viewport.themeColor` array in `layout.tsx`; accept manifest remains static |
| `@theme inline` values | Tokens in `@theme inline` do not switch automatically | Define switching values in `:root` / `[data-theme="dark"]` blocks OUTSIDE `@theme inline` |
| View Transitions + theme toggle | `startViewTransition` captures a DOM snapshot; applying theme mid-transition can produce a mixed light/dark artifact | Apply `data-theme` change inside a `startViewTransition` callback, or debounce until active transition completes |
| Serwist HTML caching | `CacheFirst` on HTML documents breaks theme script delivery to existing users | Use `NetworkFirst` for navigation/document requests |
| `admin.css` `#141414` hardcode | Table `th` background not using a token | Add `--admin-surface-dim: #141414` token; replace the hardcoded value |
| `admin.css` alert/toast colors | `.admin-alert-*` and `.admin-toast-*` use hardcoded 8-digit hex | Either replace with tokens or remove in favor of the sonner system already in use |
| Cookie-based SSR theming | Tempting for eliminating flash entirely, but forces `force-dynamic` on all pages | Do NOT use. Inline script + `suppressHydrationWarning` is the correct approach for this codebase |
| PWA splash screen color | `background_color` in manifest is always light `#F5F2EF` | Known limitation — change to brand green `#35605A` which reads well on both light/dark; document as cosmetic |

---

## Sources

- Direct codebase inspection:
  - `src/app/layout.tsx` — `suppressHydrationWarning` present; `<body>` inline style hardcoded; `viewport.themeColor` single value
  - `src/app/globals.css` — `@theme inline` structure, `@import "tailwindcss"`, `.admin-layout` overrides
  - `src/app/admin/admin.css` — `--admin-*` tokens in `:root`, hardcoded `#141414` in table header, hardcoded alert/toast colors
  - `src/components/app/AppShell.tsx` — pervasive `bg-[#F5F2EF]`, `text-[#1A1A1A]`, `border-[#E8E2D6]` hardcoded classes
  - `src/app/app/perfil/page.tsx` — representative of `/app/*` page pattern with hardcoded hex throughout
  - `src/app/app/layout.tsx` — `<Toaster position="top-center" richColors />` without `theme` prop
  - `src/app/admin/layout.tsx` — `<Toaster position="top-right" richColors />` without `theme` prop
  - `src/app/manifest.ts` — `background_color: "#F5F2EF"`, `theme_color: "#F5F2EF"` both hardcoded
  - `next.config.ts` — CSP has `'unsafe-inline'` in `script-src`; no `withSerwist()` wrapper
  - `package.json` — Tailwind v4 confirmed, `@serwist/next: ^9.5.11` present, `sonner: ^2.0.7`

- Technical foundations (HIGH confidence):
  - Tailwind v4 `@variant` syntax for dark mode — replaces `darkMode: 'class'` from v3 config
  - Next.js 15 `viewport.themeColor` array syntax for media-conditional theme colors
  - `suppressHydrationWarning` scope is limited to the element it is placed on, not its children
  - CSS specificity: `:root` and `[data-attr]` both have specificity `[0,1,0]`; position in source order resolves ties
  - `cookies()` in Next.js App Router is a dynamic function that prevents ISR on any page that uses it
  - Service worker `NetworkFirst` vs `CacheFirst` for HTML documents — standard Workbox/Serwist pattern

- MEDIUM confidence:
  - Sonner v2 `theme` prop behavior — based on package version + known API; couldn't verify with live docs fetch
  - Serwist `NetworkFirst` config syntax — based on Workbox ancestry; project's `sw.ts` not found so exact config unverifiable
