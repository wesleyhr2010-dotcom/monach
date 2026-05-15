# Features Research — Dark Mode & Temas

**Domain:** Theme switching (dark/light) for mobile PWA + desktop admin panel  
**Researched:** 2026-05-15  
**Surfaces:** `/app` (PWA, Raleway, warm beige palette, `--color-app-*`) + `/admin` (dark-first panel, `--admin-*`)

---

## Table Stakes

Features users expect. Missing = product feels incomplete or broken.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| System preference auto-detection | Every modern OS exposes `prefers-color-scheme`. Users expect the app to match their OS theme without any manual action on first launch. | Low | Use `matchMedia('(prefers-color-scheme: dark)')` on first visit when no localStorage key is set. |
| Persistent manual override per device | If a user sets "dark mode" in the app, it must survive page reload and navigation. Theme is device-level, not account-level. | Low | `localStorage.setItem('monarca-theme', 'dark\|light\|system')` — one key, read on every page. |
| No flash on reload (anti-flash script) | Page loads with wrong theme for even 100ms causes a visible white/black flash. This is the #1 complaint in dark mode implementations. | Medium | Inline `<script>` in `<head>` reads localStorage and sets `data-theme` on `<html>` before the first CSS paint. Must be synchronous — not deferred, not async. |
| Toggle accessible via keyboard and screen reader | WCAG 2.1 AA. A button without accessible label fails audit. | Low | `<button aria-label="Cambiar tema">` with `aria-pressed` or `role="switch"` depending on binary vs three-way control. |
| All `--app-*` tokens have dark variants | If even one token is missing a dark counterpart, there will be a harsh light island in a dark screen. | High | Every `--color-app-*` defined in `globals.css` `@theme` block needs a dark counterpart. Many current components also have hardcoded hex values (e.g., the perfil page uses `bg-[#F5F2EF]`, `text-[#1A1A1A]`, etc.) — these must be migrated to tokens before dark mode is applied. |
| All `--admin-*` tokens have light variants | The admin panel is currently dark-only (`:root` in `admin.css` defines dark values). Light mode for admin requires a new token set. | Medium | Admin already uses `var(--admin-*)` consistently — no hardcoded hex to fix. Only need to define the light counterpart values. |
| `color-scheme` CSS property set | Tells the browser to render system UI elements (scrollbars, form controls, select menus) in the correct mode. Without it, custom dark UI has light native controls. | Low | One CSS rule: `color-scheme: dark` under `.dark` selector, `color-scheme: light` under `.light`. |
| Correct PWA toolbar color | When installed as PWA in Standalone mode, the OS chrome (status bar color) must match the active theme. | Low | Two `<meta name="theme-color">` tags in the HTML head, one per media condition. Update dynamically when user toggles manually. |

---

## Differentiators

Features not expected but clearly valued when present.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Three-way toggle: Claro / Sistema / Oscuro | "Sistema" is the most user-friendly default — the user delegates the decision to the OS. Surfacing all three states is the industry standard (iOS Settings, VS Code, Vercel, GitHub all do this). | Low | Adds one extra state (`'system'`) to the ThemeContext. When `'system'` is active, re-read `prefers-color-scheme` at runtime and on change events. |
| Smooth CSS transition on toggle | Instead of an instant color swap, a brief `transition: background-color 200ms, color 200ms` makes the switch feel intentional rather than glitchy. | Low | Apply on `:root` or theme selectors only, NOT on every element individually. Exclude from images and media elements to avoid jarring effect on photos. |
| `prefers-reduced-motion` awareness for transition | Skip the transition animation when the user has indicated motion sensitivity. | Low | One CSS media query wrapping the transition rule: `@media (prefers-reduced-motion: reduce) { * { transition: none !important; } }`. |
| Live OS preference change handling | If the OS switches from light to dark automatically (e.g., scheduled auto dark mode at sunset), the app updates in real time — but only when the stored preference is `'system'`. | Low | `window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', handler)`. Clean up on unmount. |
| Theme toggle visible in admin topbar | For power users who switch themes often, having the toggle accessible from the topbar reduces friction vs. going to "Minha Conta". | Medium | Optional — placement in profile/settings is the standard. Topbar toggle is a differentiator for the admin panel where users sit for extended sessions. Adds an icon button to `AdminTopHeader`. |

---

## Anti-Features (avoid)

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Storing theme preference in the database | Adds a server round-trip on every session start. Theme is a device-level preference. A user on their phone likely wants dark; on a shared office PC, light. Cross-device sync would override this. | Store in `localStorage` only. Per-device divergence is correct and expected behavior. |
| CSS class on `<body>` instead of `<html>` | The anti-flash inline script runs before `<body>` is parsed. Targeting `<body>` creates a timing gap where the wrong theme flashes briefly. | Always set `data-theme` attribute (or class) on `document.documentElement` (`<html>`). |
| Two separate ThemeProviders (one per surface) | Doubles code, introduces sync issues if the user visits both `/app` and `/admin` in the same browser session, and creates two separate localStorage keys to manage. | One shared ThemeProvider, one localStorage key (`monarca-theme`). The visual difference between surfaces comes from CSS — the logic is shared. |
| JavaScript-animated icon transitions | Complex sun-to-moon morphing animations with JS timers add fragility and can delay perceived response to the toggle click. | Simple CSS opacity or scale transition for icon swap. Or instantaneous icon replacement — either is fine. |
| Binary toggle (sun only or moon only) without "System" option | Omitting "System" forces users to manually match their OS preference every time they change it. Power users find this annoying. | Always surface three states: Claro / Sistema / Oscuro. |
| Skipping dark mode for admin because it is already dark | The admin panel has a dark-only design. Adding light mode is in scope. Admin users (COLABORADORA, ADMIN) work at desks and may legitimately prefer light mode during the day. Dark-only admin without a toggle means the milestone is only half-complete. | Build light token set for admin. Implement the same toggle in `/admin/minha-conta`. |
| Hardcoding `transition-colors` on every Tailwind class | Using `transition-colors` on every component produces hundreds of micro-transitions during theme switch and bloats the CSS. | One global transition rule on `:root` or the theme selector, covering `background-color`, `color`, `border-color`. Scope to 150–200ms. |

---

## Toggle UI Patterns

### PWA `/app/perfil` — Profile Page

**Placement:** Add an inline row "Apariencia" to the existing menu list, positioned between "Notificaciones" and "Soporte y Ayuda". This row does NOT navigate to a sub-page — it renders an inline three-way control. This is the iOS Settings / Android Quick Settings pattern: familiar to the target user base.

**Why not a dedicated sub-page?** Theme preference is a single setting. A dedicated page for one control is over-engineering and adds unnecessary navigation taps on mobile.

**Component structure:**
```
MenuRow (non-link variant, existing pattern)
  [Palette icon from Lucide]   "Apariencia"   [Claro | Sistema | Oscuro]
```

The three-way control is a `<div role="radiogroup">` containing three `<button role="radio" aria-checked>` elements. Active button: `background: var(--color-app-primary)` (#35605A), white text. Inactive: transparent background, `var(--color-app-text)` color. Overall width: ~150px, height: 32px, pill-shaped (`border-radius: 16px`).

**Icon for the row:** `Palette` from Lucide. Communicates "visual appearance" better than `Sun` or `Moon`, which imply directionality rather than a settings category.

**Labels:** "Claro" / "Sistema" / "Oscuro" (Spanish, consistent with UI language policy).

**Do NOT use:** A binary on/off toggle switch (fails to expose the "Sistema" state). Do NOT use a `<select>` dropdown on mobile (poor touch target, native look breaks the custom UI).

---

### Admin `/admin/minha-conta` — My Account Page

**Placement:** Add a new card section between the profile card and the quick-links section. Section label: "APARIENCIA" (uppercase, matching admin card section style).

**Component structure:**
```
admin-card
  Section label: "APARIENCIA"
  Row: [Monitor icon from Lucide]   "Tema del Panel"   [Claro | Sistema | Oscuro]
```

The three-way control uses `--admin-*` tokens: active segment uses `--admin-accent` (#35605A) background, white text. Inactive: transparent, `--admin-text` color. Border: `1px solid var(--admin-border)`.

**Acceptable alternative for admin:** A `<select>` dropdown (Claro / Sistema / Oscuro) is acceptable for the admin surface since it is desktop-first and accessible without touch optimization. However, the segment control is more visually polished and consistent with how Vercel, Linear, and Notion handle this in their admin panels. Prefer the segment control.

**Icon:** `Monitor` from Lucide — communicates "display settings" in a desktop context rather than general "appearance".

---

### Icon Vocabulary (if a compact icon-only button is ever needed)

| Active Theme | Icon | Tooltip / aria-label |
|---|---|---|
| Light mode active | `Sun` | "Modo claro activo — cambiar tema" |
| Dark mode active | `Moon` | "Modo oscuro activo — cambiar tema" |
| System preference active | `Monitor` | "Siguiendo preferencia del sistema — cambiar tema" |

Convention (used by GitHub, VS Code, Vercel): show the **current mode's icon**, not the target mode. This matches `aria-pressed` semantics and is more readable. Clicking cycles: System → Light → Dark → System.

---

## System Preference Handling

### First visit (no localStorage key)

1. Anti-flash inline `<script>` in `<head>` runs synchronously before first CSS paint.
2. It checks `window.matchMedia('(prefers-color-scheme: dark)').matches`.
3. Sets `document.documentElement.setAttribute('data-theme', 'dark' | 'light')`.
4. No localStorage key is written — the "Sistema" state is implied by absence of an explicit key.

### Manual override

1. User selects "Claro" or "Oscuro" → write `localStorage.setItem('monarca-theme', 'light' | 'dark')`.
2. User selects "Sistema" → `localStorage.removeItem('monarca-theme')` (or write `'system'` — either works; removal is cleaner).
3. On next page load, the anti-flash script reads the key: if present and `'light'`/`'dark'`, apply directly; if absent or `'system'`, fall back to `matchMedia`.

### Live OS preference change

When stored preference is `'system'` (or key absent), register:
```javascript
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  if (currentThemePref === 'system') {
    applyTheme(e.matches ? 'dark' : 'light');
  }
});
```
Remove listener on component unmount to avoid memory leaks.

### Anti-flash script constraints (Next.js App Router)

The script must be placed in `src/app/layout.tsx` as:
```tsx
<html suppressHydrationWarning>
  <head>
    <script dangerouslySetInnerHTML={{ __html: ANTI_FLASH_SCRIPT_STRING }} />
  </head>
```

`suppressHydrationWarning` on `<html>` prevents React hydration mismatch warnings caused by the script modifying `data-theme` before React hydrates. The script string must be a constant — not an import — so it can be inlined without a network request.

### PWA installed context — `theme-color` meta tags

Add two `<meta name="theme-color">` tags to the PWA layout:
```html
<meta name="theme-color" media="(prefers-color-scheme: light)" content="#F5F2EF" />
<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#1A1A1A" />
```

When the user manually overrides the theme, update the appropriate meta tag:
```javascript
document.querySelector('meta[name="theme-color"]')?.setAttribute('content', newColor);
```

---

## Complexity Summary

| Area | Effort | Reason |
|------|--------|--------|
| Token audit + dark variants for `/app` | **High** | Hardcoded hex values throughout current PWA components (perfil page alone has ~8 hardcoded hex literals). These must be migrated to CSS tokens before dark variants can work. This is the majority of implementation effort in this milestone. |
| Token audit + light variants for `/admin` | **Medium** | Admin already uses `var(--admin-*)` consistently. Only need to define light-mode values for each token and apply them under a `.light` selector or `[data-theme="light"]` override. No hex migration needed. |
| ThemeProvider + anti-flash script | **Low** | ~60 lines of React context + ~15 lines of inline script. Well-understood pattern. `next-themes` library implements this for Next.js App Router but adds a dependency; implementing manually is equally viable and avoids the dependency. |
| Three-way toggle component | **Low** | ~40 lines of React + ~20 lines of CSS. Reusable across both surfaces with different token sets. |
| `prefers-reduced-motion` + CSS transitions | **Low** | Two media query additions to the theme CSS. |
| Live OS preference change listener | **Low** | One `addEventListener` + cleanup in the ThemeProvider. |
| PWA `theme-color` dynamic update | **Low** | Two meta tags + one JS call per toggle. |
| Admin topbar icon toggle (differentiator) | **Medium** | Requires modifying `AdminTopHeader` component; adds a new clickable element to a shared layout component. Risk: layout shift if not sized carefully. |
