# Plan 20-04 Summary

## Objective
Migrate all hardcoded hex color values in the PWA profile (perfil), progress/gamification (progreso), and performance (desempeno) pages to use CSS tokens.

## Tasks Completed

### Task 1: Migrate Perfil Pages
- **src/app/app/perfil/page.tsx**: Replaced card backgrounds, avatar placeholders, menu row colors with tokens
- **src/app/app/perfil/datos/page.tsx**:
  - Header: `bg-app-card-bg border-b border-app-border`
  - Avatar placeholder: `bg-app-surface-warm border-dashed border-app-border`
  - Camera icon: `text-app-accent-brown`
  - Photo buttons: `bg-app-surface-warm text-app-primary`
  - Labels: `text-app-text-secondary`
  - Inputs: `border-app-border bg-app-card-bg focus:ring-app-primary/20`
  - Disabled inputs: `disabled:bg-app-surface-warm disabled:text-app-text-secondary`
  - Save button: `bg-app-primary`
  - Spinner: `border-app-surface border-t-app-primary`
- **src/app/app/perfil/bancario/page.tsx**: Same patterns as datos page
- **src/app/app/perfil/documentos/page.tsx**: Replaced bg and text colors with tokens
- **src/app/app/perfil/soporte/page.tsx**: Minimal changes
- **src/app/app/perfil/notificacoes/page.tsx**: Replaced text and background colors with tokens

### Task 2: Migrate Progreso and Desempeno Pages
- **src/app/app/progreso/page.tsx**: Replaced card backgrounds, progress bar colors, text colors with tokens
- **src/app/app/progreso/extracto/page.tsx**: Replaced transaction colors (positive/negative) with `text-app-accent-green` / `text-app-danger`
- **src/app/app/progreso/regalos/page.tsx**:
  - Gift cards: `bg-app-bg`, `bg-app-card-bg`, `bg-app-surface`, `bg-app-border-strong`
  - Text: `text-app-text`, `text-app-text-secondary`, `text-app-primary`
  - Buttons: `bg-app-primary`
  - Modal: `bg-app-surface-warm`
  - Insufficient points: `text-app-danger`
  - Spinner: `border-app-surface border-t-app-primary`
- **src/app/app/desempeno/page.tsx** and **DesempenoView.tsx**:
  - Background: `bg-app-bg`
  - Cards: `bg-app-card-bg`
  - Text: `text-app-text`, `text-app-text-secondary`
  - Borders: `border-app-border`
  - Tabs: `bg-app-primary` / `bg-app-surface`

## Verification
- `npm run build`: PASS
- `grep -c '\[#[0-9a-fA-F]\{3,6\}\]'` on all files: 0

## Files Modified
- `src/app/app/perfil/page.tsx`
- `src/app/app/perfil/datos/page.tsx`
- `src/app/app/perfil/bancario/page.tsx`
- `src/app/app/perfil/documentos/page.tsx`
- `src/app/app/perfil/soporte/page.tsx`
- `src/app/app/perfil/notificacoes/page.tsx`
- `src/app/app/progreso/page.tsx`
- `src/app/app/progreso/extracto/page.tsx`
- `src/app/app/progreso/regalos/page.tsx`
- `src/app/app/desempeno/page.tsx`
- `src/app/app/desempeno/DesempenoView.tsx`

## Commit
20-04: refactor: migrate perfil, progreso and desempeno pages to CSS tokens [Phase 20]
