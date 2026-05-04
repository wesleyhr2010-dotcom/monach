---
plan: 02-03
phase: 02-core-business-notifications-leads-config
status: complete
completed: 2026-05-04
---

# Plan 02-03 Summary: Admin Config — Tiers & Levels

## What Was Built

Admin CRUD pages for commission tiers (`CommissionTier`) and gamification levels (`NivelRegra`) with Zod validation, base-tier protection, and admin design system styling.

### Key Files Created/Modified

| File | Action | Description |
|------|--------|-------------|
| `src/app/admin/actions-config.ts` | Created | Config server actions: get/upsert/delete for CommissionTier and NivelRegra with Zod validation |
| `src/app/admin/config/comissoes/page.tsx` | Created | Server Component for commission tiers page |
| `src/app/admin/config/comissoes/ComissoesClient.tsx` | Created | Client component with table, add/edit/delete actions |
| `src/app/admin/config/comissoes/TierForm.tsx` | Created | Modal form for commission tier (min_sales_value, pct, ativo) |
| `src/app/admin/config/niveis/page.tsx` | Created | Server Component for gamification levels page |
| `src/app/admin/config/niveis/NiveisClient.tsx` | Created | Client component with table, add/edit/delete actions |
| `src/app/admin/config/niveis/NivelForm.tsx` | Created | Modal form for gamification level (nome, pontos_minimos, cor, ordem, ativo) |

### Technical Decisions

- **Schema adaptation**: CommissionTier schema has `pct` (not `commission_pct`) and no `label` field. Implemented using actual schema fields.
- **Base tier protection**: Server-side check prevents deletion of any tier with `min_sales_value === 0`.
- **Duplicate prevention**: Both upsert actions check for duplicate key values (`min_sales_value` for tiers, `pontos_minimos` for levels).
- **Color picker**: NivelForm uses native `<input type="color">` alongside a text input for hex validation.

### Test Verification

- TypeScript: no errors in modified files
- ESLint: no errors in modified files
- Manual verification:
  - [x] `safeAction` used on all exported functions
  - [x] Zod validation present on all mutation actions
  - [x] Base tier deletion blocked server-side

### Deviations

- CommissionTier form uses `pct` instead of `commission_pct` (schema field name)
- No `label` field exists in CommissionTier schema; form only captures `min_sales_value` and `pct`

### Self-Check

- [x] Admin can view, add, edit, and delete commission tiers at `/admin/config/comissoes`
- [x] Base tier deletion is blocked server-side
- [x] Admin can view, add, edit, and delete gamification levels at `/admin/config/niveis`
- [x] All forms use Zod validation with Spanish error messages
