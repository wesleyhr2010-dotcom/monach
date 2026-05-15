# Plan 20-05 Summary

## Objective
Migrate all remaining hardcoded hex color values in shared PWA components, perform a final verification sweep across the entire PWA codebase, and confirm the build passes with dark mode testable via DevTools.

## Tasks Completed

### Task 1: Migrate Data-Display Components
- **src/components/app/MaletaCard.tsx**: Replaced `bg-white` with `bg-app-card-bg`, merged conditional className
- **src/components/app/MaletaItemRow.tsx**: Replaced placeholder bg and text colors with tokens
- **src/components/app/MaletaList.tsx**: Replaced empty state bg, text colors with tokens
- **src/components/app/StatCard.tsx**: Replaced card bg, trend colors with tokens
- **src/components/app/SectionHeader.tsx**: Replaced title and subtitle text colors with tokens
- **src/components/app/MetricCardTrend.tsx**: Replaced card bg, trend colors, metric values with tokens
- **src/components/app/ProductosPopularesList.tsx**: Replaced rank badge colors, text colors with tokens
- **src/components/app/VisitasDiariasChart.tsx**: Replaced recharts `stroke` with `var(--color-app-border)`

### Task 2: Migrate Notification, Form, and Action Components
- **src/components/app/NotificacionItem.tsx**: Replaced unread dot, timestamp, card bg with tokens
- **src/components/app/NotificacionesList.tsx**: Replaced section header, empty state colors with tokens
- **src/components/app/PreferenciasNotificacionesForm.tsx**:
  - Toggle switch: conditional `bg-app-primary` / `bg-app-border`
  - Track: conditional `bg-app-primary` / `bg-app-border`
  - Text labels: `text-app-text`, `text-app-text-secondary`
  - Danger section: `bg-app-danger-bg text-app-danger`
  - Push state color: conditional `text-app-primary` / `text-app-text-secondary`
- **src/components/app/CommissionTiers.tsx**: Replaced tier card backgrounds and text with tokens
- **src/components/app/TimeRangeSelector.tsx**: Replaced active/inactive tabs, borders with tokens
- **src/components/app/ActionButton.tsx**: Replaced primary and secondary button backgrounds with tokens
- **src/components/app/MenuHeader.tsx**: Replaced header text and subtitle with tokens

### Task 3: Final Verification Sweep and Build Check
- **Comprehensive hex scan**: Zero Tailwind arbitrary values `[#...]` in `src/app/app` and `src/components/app`
- **Inline style scan**: Zero inline `style={{ backgroundColor: ... }}` or `style={{ color: ... }}` with hex values
- **SVG stroke scan**: All SVG strokes use `currentColor` with appropriate `text-app-*` classes
- **Build verification**: `npm run build` passes without new errors
- **DevTools dark mode spot check**: Verified that applying `data-theme="dark"` to `.app-shell` renders dark colors correctly

## Verification
- `grep -rnc '\[#[0-9a-fA-F]\{3,6\}\]' src/app/app src/components/app | grep -v ':0$'`: empty
- `npm run build`: PASS
- `npm run lint`: PASS (no new errors)
- `docs/CHANGELOG.md`: Updated with Phase 20 entry
- `docs/next_steps.md`: Phase 20 marked as completed
- `docs/project_overview.md`: Dark Mode & Temas status updated to "Concluído"

## Files Modified
- `src/components/app/MaletaCard.tsx`
- `src/components/app/MaletaItemRow.tsx`
- `src/components/app/MaletaList.tsx`
- `src/components/app/StatCard.tsx`
- `src/components/app/SectionHeader.tsx`
- `src/components/app/MetricCardTrend.tsx`
- `src/components/app/ProductosPopularesList.tsx`
- `src/components/app/VisitasDiariasChart.tsx`
- `src/components/app/NotificacionItem.tsx`
- `src/components/app/NotificacionesList.tsx`
- `src/components/app/PreferenciasNotificacionesForm.tsx`
- `src/components/app/CommissionTiers.tsx`
- `src/components/app/TimeRangeSelector.tsx`
- `src/components/app/ActionButton.tsx`
- `src/components/app/MenuHeader.tsx`
- `docs/CHANGELOG.md`
- `docs/next_steps.md`
- `docs/project_overview.md`
- `.planning/ROADMAP.md`
- `.planning/STATE.md`

## Commit
20-05: refactor: migrate shared components and verify zero hex values in PWA [Phase 20]
