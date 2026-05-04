---
plan: 02-04
phase: 02-core-business-notifications-leads-config
status: complete
completed: 2026-05-04
---

# Plan 02-04 Summary: Admin Config — Contracts

## What Was Built

Contract management system for admin (PDF upload to R2, CRUD) with active contract display integrated into the reseller onboarding flow.

### Key Files Created/Modified

| File | Action | Description |
|------|--------|-------------|
| `src/app/admin/actions-config.ts` | Modified | Added contract CRUD actions + getContratoAtivo |
| `src/app/admin/config/contratos/page.tsx` | Created | Server Component for contract management |
| `src/app/admin/config/contratos/ContratosClient.tsx` | Created | Client component with table, toggle ativo/obrigatorio, delete |
| `src/app/admin/config/contratos/ContratoUploadModal.tsx` | Created | Upload modal with drag-and-drop, PDF validation, 10MB limit |
| `src/app/app/bienvenida/page.tsx` | Modified | Added contract step to onboarding flow |
| `src/app/app/bienvenida/actions.ts` | Modified | Added aceitarContrato server action |
| `prisma/schema.prisma` | Modified | Added `contrato_aceite_em DateTime?` to Reseller |

### Technical Decisions

- **R2 upload**: Uses existing `createR2Client()` and `PutObjectCommand` pattern. PDFs stored under `contratos/{uuid}.pdf`.
- **File validation**: Server validates MIME type (`application/pdf`) and size (≤10MB) before R2 upload.
- **Onboarding integration**: Contract step appears after "How it works" and before "Profile". If no active contract exists, step is skipped.
- **Required acceptance**: When `obrigatorio=true`, the "Aceptar y continuar" button is disabled until checkbox is checked.
- **Timestamp proof**: `contrato_aceite_em` stored in Reseller record for non-repudiation.

### Schema Changes

- Added `contrato_aceite_em DateTime? @db.Timestamptz()` to `Reseller` model.

### Test Verification

- TypeScript: no errors in modified files
- ESLint: no errors in modified files
- Manual verification:
  - [x] PDF upload validates type and size
  - [x] Admin can toggle ativo/obrigatorio
  - [x] Delete removes from R2 and database
  - [x] Onboarding shows contract when active
  - [x] Required contract blocks progression until accepted

### Deviations

- None.

### Self-Check

- [x] Admin can upload, view, edit, and delete contracts at `/admin/config/contratos`
- [x] Only PDF files ≤ 10MB are accepted
- [x] Active contract is shown during reseller onboarding
- [x] Onboarding requires acceptance if contract is marked obrigatorio
- [x] Acceptance is recorded with timestamp
