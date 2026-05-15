# Plan 20-03 Summary

## Objective
Migrate all hardcoded hex color values in the PWA maleta (consignment) flow — list, detail, sale registration, return, and catalog pages — to use CSS tokens.

## Tasks Completed

### Task 1: Migrate Maleta List and Detail Pages
- **src/app/app/maleta/page.tsx**: Replaced SVG stroke hex with `currentColor`
- **src/app/app/maleta/loading.tsx**: Replaced inline `style={{ borderColor: ... }}` with conditional className (`border-app-primary` / `border-transparent`)
- **src/app/app/maleta/[id]/page.tsx**: Replaced hex values with tokens
- **src/app/app/maleta/[id]/loading.tsx**: No changes needed
- **src/app/app/maleta/[id]/MaletaDetailClient.tsx**: Replaced SVG stroke hex with `currentColor`, text colors with tokens

### Task 2: Migrate Sale Registration and Return Flows
- **src/app/app/maleta/[id]/registrar-venta/RegistrarVentaClient.tsx**:
  - Form inputs: `border-app-border-strong`, `placeholder:text-app-muted`
  - Selected item: `bg-app-accent-green-bg border-app-primary`
  - Unselected item: `bg-app-surface`
  - Error banner: `bg-app-danger-bg text-app-danger`
  - SVG strokes: `currentColor`
- **src/app/app/maleta/[id]/devolver/DevolverClient.tsx**:
  - Conditional background: converted `style={{ backgroundColor: isReadOnly ? "#FFF4E5" : "#E2F2E9" }}` to `className={isReadOnly ? "bg-app-warning-bg" : "bg-app-accent-green-bg"}`
  - SVG strokes: `currentColor`
  - Summary rows: `text-app-text`, `text-app-text-secondary`, `text-app-primary`
- **layout.tsx files**: Kept motion sheet handle inline style (uses CSS variable referencing token)

### Task 3: Migrate Catalogo and Compartir Pages
- **src/app/app/catalogo/page.tsx**: Replaced placeholder backgrounds and text colors with tokens
- **src/app/app/catalogo/compartir/page.tsx**: Replaced spinner border and placeholder background with tokens
- **src/app/app/catalogo/compartir/layout.tsx**: Kept motion sheet handle inline style

## Verification
- `npm run build`: PASS
- `grep -c '\[#[0-9a-fA-F]\{3,6\}\]'` on all files: 0

## Files Modified
- `src/app/app/maleta/page.tsx`
- `src/app/app/maleta/loading.tsx`
- `src/app/app/maleta/[id]/page.tsx`
- `src/app/app/maleta/[id]/loading.tsx`
- `src/app/app/maleta/[id]/MaletaDetailClient.tsx`
- `src/app/app/maleta/[id]/registrar-venta/RegistrarVentaClient.tsx`
- `src/app/app/maleta/[id]/registrar-venta/page.tsx`
- `src/app/app/maleta/[id]/registrar-venta/layout.tsx`
- `src/app/app/maleta/[id]/devolver/DevolverClient.tsx`
- `src/app/app/maleta/[id]/devolver/page.tsx`
- `src/app/app/maleta/[id]/devolver/layout.tsx`
- `src/app/app/catalogo/page.tsx`
- `src/app/app/catalogo/compartir/page.tsx`
- `src/app/app/catalogo/compartir/layout.tsx`

## Commit
20-03: refactor: migrate maleta and catalogo pages to CSS tokens [Phase 20]
