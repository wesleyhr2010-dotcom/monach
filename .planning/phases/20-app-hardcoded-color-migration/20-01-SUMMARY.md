# Plan 20-01 Summary

## Objective
Establish the complete token foundation for PWA dark mode by adding all missing semantic color tokens to globals.css, then migrate the root layout and all shell components to use tokens exclusively.

## Tasks Completed

### Task 1: Add 9 Missing PWA Color Tokens to globals.css
- Added to `@theme inline` block:
  - `--color-app-text-secondary: #777777`
  - `--color-app-text-dim: #4b5563`
  - `--color-app-accent-brown: #917961`
  - `--color-app-surface-warm: #F5F0E8`
  - `--color-app-surface: #EBEBEB`
  - `--color-app-border: #E8E2D6`
  - `--color-app-border-strong: #D9D6D2`
  - `--color-app-warning-bg: #FFF4E5`
  - `--color-app-primary-light: #6A9A8A`
- Added corresponding dark variants to `.app-shell[data-theme="dark"]` block

### Task 2: Update tokens.md Documentation
- Appended "Extended Tokens (Phase 20)" section to `docs/design-system/tokens.md` with all 9 new tokens and their semantic purposes

### Task 3: Migrate Root Layout and Shell Components
- **src/app/layout.tsx**: Removed inline `style={{ backgroundColor: "#F5F2EF" }}`, added `bg-app-bg` to body className, changed `themeColor` to `var(--color-app-bg)`
- **src/components/app/AppShell.tsx**: Replaced 7 hex values with tokens (bg, text, card-bg, border, accent-brown, primary, text-secondary, surface-warm)
- **src/components/app/AppBottomNav.tsx**: Converted inline style colors on Icon and span to conditional className (`text-app-primary` / `text-app-muted`)
- **src/components/app/AppHeader.tsx**: Replaced 6 hex values with tokens (bg, surface, border, text, text-secondary, primary)
- **src/components/app/AppPageShell.tsx**: Migrated all 7 sub-components:
  - AppPageHeader, SectionTitle, SummaryCard, CommissionCard, AlertBanner, SummaryRow, BottomAction
  - AlertBanner: mapped warning/info/success to semantic tokens

## Verification
- `npm run build`: PASS
- `npm run lint`: PASS (no new errors)
- `grep -c '\[#[0-9a-fA-F]\{3,6\}\]'` on all 5 shell files: 0

## Files Modified
- `src/app/globals.css`
- `docs/design-system/tokens.md`
- `src/app/layout.tsx`
- `src/components/app/AppShell.tsx`
- `src/components/app/AppBottomNav.tsx`
- `src/components/app/AppHeader.tsx`
- `src/components/app/AppPageShell.tsx`

## Commit
20-01: feat: add 9 PWA tokens and migrate shell components to CSS tokens [Phase 20]
