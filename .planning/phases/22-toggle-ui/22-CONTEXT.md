# Phase 22: Toggle UI - Context

**Gathered:** 2026-05-16
**Status:** Ready for planning
**Source:** REQUIREMENTS.md + ROADMAP.md

<domain>
## Phase Boundary

This phase delivers the user-facing theme toggle on both /app (PWA revendedora) and /admin (admin/colaboradora) surfaces. It is the **capstone** of Milestone v1.5 (Dark Mode & Temas). All infrastructure (CSS tokens, hardcoded color migration, ThemeProviders, Sonner integration) was delivered in Phases 19–21.

Phase 22 ONLY adds UI controls — no new infrastructure, no schema changes, no new dependencies.

**Depends on:** Phase 21 (ThemeProvider Infrastructure) — MUST have useThemeContext, setTheme, and SonnerThemer already wired.

</domain>

<decisions>
## Implementation Decisions

### Locked Decisions

- **D-22-01**: Toggle must be **binary sun/moon** — not a 3-state (light/dark/system) selector. The UX is "clica no sol = light, clica na lua = dark". System preference is the fallback when no localStorage value exists, but the toggle itself only switches between the two concrete themes.
- **D-22-02**: Section label must be **"Apariencia"** (espanhol paraguaio) on both surfaces, per project language convention.
- **D-22-03**: Toggle component must consume `useThemeContext()` from the scoped provider already rendered in the surface's shell. Do NOT create a new hook or context.
- **D-22-04**: Preference persistence is handled by `setTheme()` in `useTheme.ts` — Phase 22 components must NOT touch localStorage directly.
- **D-22-05**: The toggle must cause **immediate** visual switch (no page reload). The existing ThemeProvider already syncs `data-theme` on the DOM and triggers React re-render via context.

### the agent's Discretion

- Exact visual styling of the sun/moon toggle (size, animation, colors) — must use design system tokens, not hardcoded values.
- Whether the toggle is a custom button or uses a third-party switch component — project already has shadcn/ui; a custom styled button with Sun/Moon icons from lucide-react is acceptable.
- Placement within the "Apariencia" section on each page.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Theme Infrastructure
- `src/components/theme/types.ts` — Theme type, context interface, localStorage key constants
- `src/components/theme/useTheme.ts` — useTheme hook, useThemeContext, setTheme callback
- `src/components/theme/ThemeProvider.tsx` — Base provider
- `src/components/theme/AppThemeProvider.tsx` — Scoped provider for /app
- `src/components/theme/AdminThemeProvider.tsx` — Scoped provider for /admin
- `src/components/theme/SonnerThemer.tsx` — Toaster theming (already wired)

### Target Pages
- `src/app/app/perfil/page.tsx` — PWA profile page (Server Component)
- `src/app/admin/minha-conta/page.tsx` — Admin account page (Server Component)

### Design System
- `docs/design-system/tokens.md` — Token reference
- `src/app/globals.css` — App surface tokens
- `src/app/admin/admin.css` — Admin surface tokens

</canonical_refs>

<specifics>
## Specific Ideas

- Use `Sun` and `Moon` icons from `lucide-react` (already a project dependency).
- The toggle should visually indicate the CURRENT active theme: show Sun when in dark mode (clicking switches to light), show Moon when in light mode (clicking switches to dark). Or the inverse — whichever is more intuitive. The agent should decide and document the choice.
- On `/app/perfil`, the "Apariencia" section should be placed in the menu list area, consistent with other menu items (chevron right, icon, label).
- On `/admin/minha-conta`, the "Apariencia" section should be added as a new card below the "Acessos Rápidos" section or integrated into the profile card.

</specifics>

<deferred>
## Deferred Ideas

- No deferred items — this phase completes Milestone v1.5.

</deferred>

---

*Phase: 22-toggle-ui*
*Context gathered: 2026-05-16*
