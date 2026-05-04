---
plan: 02-05
phase: 02-core-business-notifications-leads-config
status: complete
completed: 2026-05-04
---

# Plan 02-05 Summary: Notification Integration

## What Was Built

Wired the notification template system into existing cron jobs and Server Actions. Replaced hardcoded Spanish strings with dynamic template content from `NotificacaoTemplate`, applying variable substitution.

### Key Files Created/Modified

| File | Action | Description |
|------|--------|-------------|
| `src/lib/notifications.ts` | Modified | Added `buscarTemplateAtivo()` and `notificarComTemplate()` helpers |
| `src/lib/notifications-shared.ts` | Modified | Added `devolucao_recebida` to `TipoNotificacao` type |
| `src/app/app/actions-revendedora.ts` | Modified | `registrarVenda` and `submitDevolucao` now use templated notifications |
| `src/app/admin/actions-maletas.ts` | Modified | `conferirEFecharMaleta` now uses templated notifications |
| `supabase/functions/_shared/notifications.ts` | Already existed | Already had template integration — verified working |
| `supabase/functions/check-maleta-prazo/index.ts` | Already existed | Already used `notificarRevendedora` with template fallback |
| `supabase/functions/marcar-maletas-atrasadas/index.ts` | Already existed | Already used `notificarRevendedora` with template fallback |

### Technical Decisions

- **`notificarComTemplate`**: New helper that queries `NotificacaoTemplate` for active templates, substitutes variables using `substituirVariaveis` with whitelist, and falls back to skipping the notification if template is inactive/missing.
- **Server actions updated**: All three actions (`registrarVenda`, `conferirEFecharMaleta`, `submitDevolucao`) now call `notificarComTemplate` instead of `notificarRevendedora` with hardcoded text.
- **Cron jobs**: No changes needed — the Edge Function shared helper (`_shared/notifications.ts`) already implemented template lookup and substitution.

### Test Verification

- TypeScript: no errors in modified files
- ESLint: no errors in modified files
- Build: passes successfully
- Manual verification:
  - [x] `notificarComTemplate` queries `notificacao_templates` before sending
  - [x] Variable substitution uses `substituirVariaveis` with context data
  - [x] All 3 server actions call notification helper with substituted content

### Deviations

- None.

### Self-Check

- [x] Cron jobs read `NotificacaoTemplate` by type
- [x] Variable substitution applied before sending push notifications
- [x] `registrarVenda`, `conferirEFecharMaleta`, `submitDevolucao` send templated notifications
- [x] Notification failures do not break the main business action
