# Plan 20-02 Summary

## Objective
Migrate all hardcoded hex color values in the PWA home page, onboarding flow, authentication pages, and secondary navigation pages to use CSS tokens.

## Tasks Completed

### Task 1: Migrate Home Page and Dashboard Client
- **src/app/app/page.tsx**: Replaced 4 SVG stroke hex values with `currentColor` + `text-app-text`
- **src/app/app/AppDashboardClient.tsx**: Added `text-app-text` className to 4 icon components (ReceiptIcon, TrendingUpIcon, PackageIcon, AwardIcon)
- **src/app/app/loading.tsx**: Already tokenized (no changes needed)

### Task 2: Migrate Onboarding (Bienvenida)
- **src/app/app/bienvenida/page.tsx**: Replaced 30+ hex values with tokens:
  - Slide icons: `text-app-primary`
  - Progress dots: `bg-app-primary` / `bg-app-border`
  - Cards: `bg-app-surface-warm`
  - Text: `text-app-text`, `text-app-text-secondary`, `text-app-text-dim`
  - Buttons: `bg-app-primary`
  - Form inputs: `border-app-border`, `focus:ring-app-primary/20`
  - Spinners: `border-app-surface border-t-app-primary`
  - Camera icon: `text-app-accent-brown`
  - Contract section: `text-app-primary` for links

### Task 3: Migrate Auth Pages and Secondary Pages
- **src/app/app/login/page.tsx**: Replaced hex values with tokens
- **src/app/app/login/recuperar-contrasena/page.tsx**: Replaced border and text colors with tokens
- **src/app/app/nueva-contrasena/page.tsx**: Replaced border and text colors with tokens
- **src/app/app/mas/page.tsx**: Replaced card backgrounds and text colors with tokens
- **src/app/app/notificacoes/page.tsx**: Replaced text and background colors with tokens

## Verification
- `npm run build`: PASS
- `grep -c '\[#[0-9a-fA-F]\{3,6\}\]'` on all files: 0

## Files Modified
- `src/app/app/page.tsx`
- `src/app/app/AppDashboardClient.tsx`
- `src/app/app/bienvenida/page.tsx`
- `src/app/app/login/page.tsx`
- `src/app/app/login/recuperar-contrasena/page.tsx`
- `src/app/app/nueva-contrasena/page.tsx`
- `src/app/app/mas/page.tsx`
- `src/app/app/notificacoes/page.tsx`

## Commit
20-02: refactor: migrate home, onboarding, auth and secondary pages to CSS tokens [Phase 20]
