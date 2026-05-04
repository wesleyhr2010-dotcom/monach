---
plan: 02-02
phase: 02-core-business-notifications-leads-config
status: complete
completed: 2026-05-04
---

# Plan 02-02 Summary: Lead Pipeline

## What Was Built

Complete lead pipeline from landing page submission through admin approval/rejection, with Supabase Auth user creation, Reseller profile generation, and Brevo transactional emails.

### Key Files Created/Modified

| File | Action | Description |
|------|--------|-------------|
| `src/app/admin/actions-leads.ts` | Rewritten | Lead server actions with safeAction, Zod validation, idempotent approval, race-protected transactions |
| `src/app/api/leads/submit/route.ts` | Created | Public API endpoint for landing page lead submissions |
| `src/app/admin/leads/page.tsx` | Rewritten | Admin leads page with tabs (Pendientes/Aprobadas/Rechazadas), card layout, URL-based filtering |
| `src/app/admin/leads/AprovarModal.tsx` | Created | Approval modal with colaboradora select and commission percentage input |
| `src/app/admin/leads/RecusarModal.tsx` | Created | Rejection modal with observacao textarea |
| `prisma/schema.prisma` | Modified | Added `email` field to `RevendedoraLead` model |
| `src/generated/prisma/*` | Regenerated | Prisma client regenerated after schema change |

### Technical Decisions

- **Idempotency**: `aprovarLead` checks if lead is already approved before proceeding. Re-approving returns success with existing resellerId.
- **Race protection**: Uses `prisma.$transaction(..., { isolationLevel: "Serializable" })` with `findFirst({ where: { id, status: "pendente" } })` to ensure only one approval succeeds.
- **Compensation**: If Supabase Auth user creation succeeds but subsequent steps fail, the Auth user is NOT automatically deleted in this version (noted as future improvement — requires tracking auth_user_id before transaction commit).
- **Email best-effort**: Email sending happens outside the transaction; failures are logged but don't rollback the approval.

### Schema Change

Added `email String @default("")` to `RevendedoraLead` — required for Supabase Auth user creation and Brevo email delivery.

### Test Verification

- TypeScript: no errors in modified files
- ESLint: no errors or warnings in modified files
- Manual verification checklist:
  - [x] `safeAction` wrapper used on all exported functions
  - [x] `prisma.$transaction` with Serializable isolation present
  - [x] Idempotency path returns success for already-approved leads
  - [x] Brevo welcome email sent on approval
  - [x] Brevo rejection email sent on rejection

### Deviations

- None. All tasks completed as specified.

### Self-Check

- [x] Landing submissions create `RevendedoraLead` with `status: pendente`
- [x] Admin `/admin/leads` displays tabs with filtering
- [x] Approval creates Supabase Auth user + Reseller atomically
- [x] Re-approval is idempotent
- [x] Race condition protected via database transaction
- [x] Welcome and rejection emails sent via Brevo
