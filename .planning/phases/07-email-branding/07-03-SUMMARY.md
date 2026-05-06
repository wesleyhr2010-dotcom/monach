---
phase: 07-email-branding
plan: 03
subsystem: Emails / Infra
completed_at: "2026-05-06"
tasks_completed: 3
tasks_total: 3
---

# Phase 07 Plan 03: Supabase Auth Templates Sync — Summary

## What Was Built

Script de sincronização de templates Supabase Auth (reset password + invite user) com branding Monarca completo, via Management API, com CI/CD automático.

## Commits

| Hash | Message |
|------|---------|
| `1b9b30b` | feat(07-03): add Supabase Auth HTML templates with Monarca branding |
| `711deba` | feat(07-03): add Supabase Auth template sync script |
| `01f0990` | feat(07-03): add CI/CD workflow, env vars, and email documentation |

## Files Created / Modified

### Created
- `scripts/supabase-auth-templates/reset-password.html` — Template HTML de reset password com branding completo
- `scripts/supabase-auth-templates/invite-user.html` — Template HTML de invite com branding completo
- `scripts/sync-supabase-auth-templates.ts` — Script CLI para sync via Management API
- `.github/workflows/sync-supabase-templates.yml` — Workflow GitHub Actions para auto-sync

### Modified
- `.env.local.example` — Adicionados `SUPABASE_MANAGEMENT_API_KEY`, `SUPABASE_PROJECT_REF`, `EMAIL_BANNER_URL`
- `docs/sistema/SPEC_EMAILS.md` — Nova seção de templates branded, documentação do sync script, tabela comparativa de fluxos de convite, checklist atualizado

## Verification Results

- [x] `npx tsx scripts/sync-supabase-auth-templates.ts --dry-run` executa sem erro e mostra preview informativo
- [x] `--check` modo funciona (tenta fetch e compara)
- [x] Templates contêm sintaxe Go template (`{{ .ConfirmationURL }}`, `{{ .SiteURL }}`) — zero JS template literals
- [x] Templates têm logo banner, cores Monarca, footer completo, dark mode CSS
- [x] Workflow YAML válido e dispara em push para `main` + `workflow_dispatch`
- [x] `npx eslint scripts/sync-supabase-auth-templates.ts` passa sem erros
- [x] Documentação explica claramente distinção Brevo convite vs Supabase invite

## Deviations from Plan

### None — plan executed exactly as written.

Pequena adaptação: o projeto usa `.env.local.example` em vez de `.env.example`; variáveis foram adicionadas no arquivo correto.

## Threat Model Compliance

| Threat ID | Status | Notes |
|-----------|--------|-------|
| T-07-07 | ✅ Mitigated | Script nunca imprime a API key; GitHub Actions redacta secrets automaticamente |
| T-07-08 | ✅ Accepted | HTTPS para api.supabase.com |
| T-07-09 | ✅ Mitigated | Exponential backoff com 3 retries implementado no `fetchWithRetry` |
| T-07-10 | ✅ Mitigated | Workflow só sincroniza templates — sem acesso a banco; scope limitado pela Management API |

## Decisions

- **D-09**: Script de sync via Supabase Management API — implementado com `--dry-run` e `--check`
- **D-10**: Templates Supabase Auth usam MESMO branding completo — logo banner, cores, footer, dark mode
- **D-11**: Ambos fluxos de convite mantidos com propósitos distintos — documentado em SPEC_EMAILS.md com tabela comparativa
- **D-12**: CI/CD auto-sync no push para main — workflow GitHub Actions criado

## Next Steps

1. Gerar `SUPABASE_MANAGEMENT_API_KEY` no Supabase Dashboard (Organization Settings → API Keys)
2. Adicionar secrets no GitHub (Settings → Secrets)
3. Rodar sync manualmente uma vez: `npx tsx scripts/sync-supabase-auth-templates.ts`
4. Verificar templates no Supabase Dashboard (Auth → Email Templates)
