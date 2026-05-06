---
phase: 07-email-branding
plan: 02
subsystem: Email Templates
completed_at: "2026-05-06"
dependency_graph:
  requires:
    - 07-01
  provides:
    - src/lib/email-templates/*.ts (7 templates refatorados)
    - src/app/api/test-email/route.ts (endpoint estendido)
    - src/lib/email-templates/template-refactor.test.ts (regressão)
  affects:
    - src/lib/email-base.ts (consumidor)
    - src/lib/emails.ts (sendEmail)
tech_stack:
  added: []
  patterns:
    - Hybrid HTML+text email generation via email-base utilities
    - DOMPurify sanitization at template boundary
    - JSDoc tone annotations per D-15
key_files:
  created:
    - src/lib/email-templates/template-refactor.test.ts
  modified:
    - src/lib/email-templates/convite-usuario.ts
    - src/lib/email-templates/candidatura-aprovada.ts
    - src/lib/email-templates/candidatura-rechazada.ts
    - src/lib/email-templates/acerto-confirmado.ts
    - src/lib/email-templates/documento-aprovado.ts
    - src/lib/email-templates/documento-pendente.ts
    - src/lib/email-templates/documento-rejeitado.ts
    - src/app/api/test-email/route.ts
decisions:
  - "Templates retornam EmailContent (não apenas void) para possibilitar preview no endpoint de teste e assertions nos testes de regressão — backward-compatible porque nenhum caller usa o valor de retorno"
metrics:
  duration_minutes: 35
  tasks_completed: 3
  test_assertions: 20
  files_created: 1
  files_modified: 8
---

# Phase 07 Plan 02: Refatorar Templates Transacionais — Summary

**One-liner:** 7 templates transacionais refatorados para usar `renderEmailBase` + utilitários, com fallback plaintext, tom premium e tabela visual no acerto.

## What Was Built

### Task 1 — 6 Templates Core Refatorados

Refatorados `convite-usuario`, `candidatura-aprovada`, `candidatura-rechazada`, `documento-aprovado`, `documento-pendente`, `documento-rejeitado`:

- Todos usam `renderEmailBase` para wrapper visual unificado
- Importam utilitários (`emailButton`, `emailAlert`, `emailTable`, `emailDivider`)
- Sanitizam inputs dinâmicos com `sanitizeTemplateVars` (DOMPurify)
- Retornam `EmailContent` (`{ html, text }`)
- Chamam `sendEmail({ to, subject, htmlContent, textContent })`
- JSDoc descrevendo tom de voz por tipo (D-15)

### Task 2 — Acerto-Confirmado com Tabela Visual

`emailAcertoConfirmado` refatorado com:

- `emailTable({ headers: ['Concepto', 'Monto'], rows, highlightRow: 1 })`
- Linha de comissão destacada (`background:#fff8e7`)
- `emailDivider()` + CTA "Ver mis consignaciones"

### Task 3 — Endpoint de Teste + Regressão

**Endpoint `/api/test-email`:**
- Modo `preview-all`: renderiza os 7 templates com mock data, retorna `{ template, subject, html, text }`
- Modo `preview`: renderiza template específico com dados customizados
- Protegido por check de ambiente (dev-only)
- Modos existentes (`brevo`, `supabase`, `all`) preservados

**Testes `template-refactor.test.ts`:**
- 20 assertions cobrindo todos os 7 templates
- Verifica `htmlContent` e `textContent` não vazios
- Verifica ausência de tags HTML no texto
- Verifica `DOCTYPE`, logo e footer no HTML
- `emailAcertoConfirmado`: contém `<table`, highlightRow
- `emailConviteUsuario`: texto contém "Contraseña temporal:"
- `emailDocumentoPendente`: subject contém 📄
- `emailCandidaturaRechazada`: zero emojis (regex `/[\u{1F300}-\u{1F9FF}]/u`)

## Verification Results

| Check | Status |
|-------|--------|
| `npm test` (272 assertions) | ✅ PASS |
| `npx tsc --noEmit` (arquivos modificados) | ✅ Sem erros |
| `grep renderEmailBase` em 7 templates | ✅ 7/7 |
| `emailTable` + `highlightRow` no acerto | ✅ 2 + 1 ocorrências |
| Zero emojis em `candidatura-rechazada` | ✅ 0 emojis |
| `textContent` sem tags `<` | ✅ Testado |
| `htmlContent` com `DOCTYPE` e logo | ✅ Testado |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical Functionality] Templates retornam `EmailContent` em vez de `void`**
- **Found during:** Task 3 (endpoint + testes)
- **Issue:** O plano previa que o endpoint `preview-all` chamasse os templates e capturasse `{ html, text }`, mas os templates originais retornavam `Promise<void>`. Isso impossibilitava o preview local e assertions nos testes.
- **Fix:** Alterado o tipo de retorno de todos os 7 templates de `Promise<void>` para `Promise<EmailContent>`, adicionando `return content` ao final. Backward-compatible porque nenhum caller existente usa o valor de retorno.
- **Files modified:** todos os 7 templates `.ts`
- **Commit:** aa62308 (acerto) + 8974a66 (demais)

**2. [Rule 1 - Bug] Função de sanitização era `sanitizeTemplateVars`, não `sanitizeHtml`**
- **Found during:** Task 1
- **Issue:** O plano instruía `import { sanitizeHtml } from "@/lib/notifications-server"`, mas o módulo real exporta `sanitizeTemplateVars`.
- **Fix:** Usado `sanitizeTemplateVars` diretamente. Nenhuma alteração no módulo de origem necessária.
- **Files modified:** todos os 7 templates

**3. [Rule 1 - Bug] Teste de acerto usava string errada para comissão**
- **Found durante:** execução dos testes
- **Issue:** Teste esperava `Tu comisión:` mas `emailTable` formata texto como `Tu comisión (20%): Gs. 300.000`.
- **Fix:** Atualizado assertion para `Tu comisión (20%):`.
- **Files modified:** `src/lib/email-templates/template-refactor.test.ts`

**4. [Rule 3 - Blocking Issue] TypeScript errors em testes por tipo de mock**
- **Found durante:** `npx tsc --noEmit`
- **Issue:** `sendEmailMock.mock.calls[0][0]` retorna `SendEmailLegacy | SendEmailBranded`; TypeScript não sabe que `textContent` existe.
- **Fix:** Adicionado helper `getLastCall()` com cast de tipo explícito; importado `beforeEach` do vitest.
- **Files modified:** `src/lib/email-templates/template-refactor.test.ts`

## Known Stubs

Nenhum. Todos os templates geram conteúdo real, sanitizado e com fallback plaintext.

## Threat Flags

Nenhum novo surface introduzido. Todas as ameaças do threat model foram mitigadas:
- T-07-04 (Injection): `sanitizeTemplateVars` aplicado a todos os inputs dinâmicos antes de passar para `renderEmailBase`.
- T-07-05 (Information Disclosure): Aceito — PII no corpo do email é requisito funcional; não há logging do conteúdo.
- T-07-06 (Tampering): Aceito — endpoint `/api/test-email` é dev-only, protegido por check de ambiente.

## Self-Check: PASSED

- [x] `src/lib/email-templates/convite-usuario.ts` existe e usa `renderEmailBase`
- [x] `src/lib/email-templates/candidatura-aprovada.ts` existe e usa `renderEmailBase`
- [x] `src/lib/email-templates/candidatura-rechazada.ts` existe e usa `renderEmailBase`
- [x] `src/lib/email-templates/acerto-confirmado.ts` existe e usa `renderEmailBase` + `emailTable`
- [x] `src/lib/email-templates/documento-aprovado.ts` existe e usa `renderEmailBase`
- [x] `src/lib/email-templates/documento-pendente.ts` existe e usa `renderEmailBase`
- [x] `src/lib/email-templates/documento-rejeitado.ts` existe e usa `renderEmailBase`
- [x] `src/app/api/test-email/route.ts` possui modos `preview-all` e `preview`
- [x] `src/lib/email-templates/template-refactor.test.ts` existe e passa (20/20)
- [x] Commits existem: 8974a66, aa62308, 3a13c4c
