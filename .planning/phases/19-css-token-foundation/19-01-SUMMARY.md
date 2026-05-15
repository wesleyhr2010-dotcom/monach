# Plan 19-01 Summary

## Objective
Configure Tailwind v4 `@custom-variant dark` in globals.css and declare dark token variants for app PWA tokens (`--color-app-*`) and shadcn/ui tokens under `.app-shell[data-theme="dark"]`. Replace the old unconditional `.admin-layout` block with `.admin-layout[data-theme="dark"]`.

## Tasks Completed

### Task 1: Add @custom-variant dark directive to globals.css
- Inserted `@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));` on line 5, immediately after `@import "tailwindcss"` and before `@source not`.
- Build verified: passes without "unknown at-rule" errors.

### Task 2: Declare app dark token variants under .app-shell[data-theme="dark"]
- Added `.app-shell[data-theme="dark"]` block after the `@theme inline` closing brace and before `@layer base`.
- Contains all 13 `--color-app-*` dark variants with warm Monarca brand-derived palette:
  - `--color-app-bg: #1a1816` (warm near-black)
  - `--color-app-card-bg: #242220`
  - `--color-app-card-border: #363230`
  - `--color-app-divider: #2a2624`
  - `--color-app-icon-bg: #2a2624`
  - `--color-app-primary: #35605A` (unchanged)
  - `--color-app-text: #f0ece8`
  - `--color-app-muted: #8a8078`
  - `--color-app-accent-green-bg: rgba(31, 122, 74, 0.2)`
  - `--color-app-accent-green: #4ade80`
  - `--color-app-danger-bg: rgba(211, 47, 47, 0.2)`
  - `--color-app-danger-border: #991b1b`
  - `--color-app-danger: #f87171`
- Also includes 18 shadcn/ui dark token overrides:
  - background, foreground, card, card-foreground, popover, popover-foreground
  - primary, primary-foreground, secondary, secondary-foreground
  - muted, muted-foreground, accent, accent-foreground
  - destructive, destructive-foreground, border, input, ring
- Build verified: passes.

### Task 3: Replace old .admin-layout block with .admin-layout[data-theme="dark"]
- Changed selector from `.admin-layout` to `.admin-layout[data-theme="dark"]` for the shadcn/ui dark override block.
- Changed `.admin-layout *` selector to `.admin-layout[data-theme="dark"] *` for border-color inheritance.
- Preserved all existing CSS variable declarations and values inside the block.
- Added `data-theme="dark"` to the admin-layout div in `AdminLayoutClient.tsx` to prevent visual regression until Phase 21 ThemeProvider is implemented.
- Build verified: passes.

## Verification
- `npm run build`: PASS (no new errors)
- `npm run lint`: PASS (no new errors in modified files; pre-existing errors unchanged)
- `grep -n '@custom-variant dark' src/app/globals.css`: exactly 1 match on line 5
- `grep -c '^\.admin-layout {' src/app/globals.css`: 0 (no unconditional block remains)
- `grep -c '.app-shell\[data-theme="dark"\]' src/app/globals.css`: 1
- `grep -c '.admin-layout\[data-theme="dark"\]' src/app/globals.css`: 2

## Files Modified
- `src/app/globals.css`
- `src/components/admin/AdminLayoutClient.tsx`

## Commit
- 19-01-task-1: feat: add @custom-variant dark directive to globals.css [Phase 19]
- 19-01-task-2: feat: declare app dark token variants under .app-shell[data-theme="dark"] [Phase 19]
- 19-01-task-3: refactor: replace unconditional .admin-layout with .admin-layout[data-theme="dark"] [Phase 19]

## Decisions
- D-19-01: Old unconditional `.admin-layout` block replaced by `.admin-layout[data-theme="dark"]` — single mechanism only, no dual block.
- D-19-03: Warm dark palette derived from Monarca brand colors (`--color-gold: #b4aba2`, `--color-app-primary: #35605A`) — no neutral gray.
- D-19-04: Shadcn/ui dark overrides centralized in globals.css under both `.app-shell[data-theme="dark"]` and `.admin-layout[data-theme="dark"]`.
- D-19-01a: Added `data-theme="dark"` hardcoded to `AdminLayoutClient.tsx` div to prevent admin visual regression between Phase 19 and Phase 21.

## Notes
- No visual change in production.
- App remains light by default (light values still in `@theme inline`).
- Admin remains dark by default because `data-theme="dark"` is hardcoded on `.admin-layout` in `AdminLayoutClient.tsx` (temporary until Phase 21 ThemeProvider).
- Phase 20 will migrate all hardcoded colors in `/app` to tokens.
- Phase 21 will implement ThemeProvider with anti-flash and localStorage persistence, replacing the hardcoded `data-theme="dark"`.
