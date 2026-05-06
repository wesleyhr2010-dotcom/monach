---
phase: 07-email-branding
plan: 01
subsystem: Email Infrastructure
milestone: v1.1
key-decisions:
  - Template engine híbrida: todos os utilitários retornam { html, text }
  - Dark mode via @media (prefers-color-scheme: dark) inline no <head>
  - Botões CTA são links <a> estilizados nativos (sem bulletproof tables)
  - Escape HTML centralizado no wrapper; consumidores devem sanitizar bodyHtml/bodyText antes de passar
tech-stack:
  added: []
  patterns:
    - Hybrid HTML/text email utilities
    - Inline CSS-only email templates
    - Dark mode media queries for email clients
key-files:
  created:
    - src/lib/email-base.ts
    - src/lib/email-base.test.ts
    - src/lib/email-templates/index.ts
  modified:
    - src/lib/emails.ts
metrics:
  duration: 12 min
  completed: "2026-05-06T14:37:00Z"
  tests: 23
---

# Phase 07 Plan 01: Email Base Branding Summary

**One-liner:** Arquitetura base de email branding com wrapper visual unificado, utilitários híbridos (HTML+text), dark mode inline e types compartilhados.

## What Was Built

1. **`src/lib/email-base.ts`** — novo módulo central de email branding:
   - `EmailContent` type (`{ html: string; text: string }`)
   - `renderEmailBase()` — wrapper visual completo com DOCTYPE, dark mode CSS, banner de logo Monarca, preview text oculto, greeting opcional, body injetado, CTA opcional e footer padronizado
   - `emailButton()` — CTA estilizado nativo (`<a>` com padding/background/border-radius), suporta variantes `primary` e `outline`
   - `emailTable()` — tabela de dados inline com headers opcionais, highlight row e formatação text plain
   - `emailAlert()` — blocos de destaque com borda lateral colorida (`info` | `success` | `warning`)
   - `emailDivider()` — divisor horizontal híbrido
   - `escapeHtml()` helper para sanitizar conteúdo do wrapper

2. **`src/lib/emails.ts`** — modificação para suportar dual-format:
   - Overload `sendEmail({ to, subject, htmlContent, textContent })` preservando compatibilidade com `htmlContent` apenas
   - Inclui `textContent` no payload Brevo quando fornecido

3. **`src/lib/email-templates/index.ts`** — ponto único de importação re-exportando os 7 templates existentes + utilitários do `email-base`

4. **`src/lib/email-base.test.ts`** — 23 testes unitários Vitest cobrindo:
   - Estrutura HTML (DOCTYPE, logo, dark mode, preview text, footer)
   - Ausência de tags HTML na versão text
   - Utilitários individuais (button, table, alert, divider)
   - Variantes de estilo (outline, highlight row, info/success/warning)

## Verification Results

| Check | Result |
|-------|--------|
| `src/lib/email-base.ts` compila sem erros TypeScript | ✅ |
| `src/lib/email-base.test.ts` passa (23/23) | ✅ |
| `src/lib/emails.ts` backward compat preservada (252/252 testes passam) | ✅ |
| `npm test` passa | ✅ |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] Unused `GOLD` constant causava warning de lint**
- **Found during:** Task 1
- **Issue:** Constante `GOLD = "#C9A84C"` definida mas não utilizada no `email-base.ts`
- **Fix:** Removida constante não utilizada
- **Files modified:** `src/lib/email-base.ts`
- **Commit:** `cc73e0c` (amendado no mesmo commit)

**2. [Rule 1 — Bug] Re-export de type com `isolatedModules` habilitado**
- **Found during:** Task 3 (typecheck)
- **Issue:** `export { EmailContent }` em `index.ts` falha com TS1205 quando `isolatedModules` está ativo
- **Fix:** Separado em `export type { EmailContent }`
- **Files modified:** `src/lib/email-templates/index.ts`
- **Commit:** `afe9fb5`

**3. [Rule 3 — Blocking] Script `npm run typecheck` não existe no projeto**
- **Found during:** Task 3 (verificação)
- **Issue:** O plan especifica `npm run typecheck` mas o projeto não possui esse script no `package.json`
- **Fix:** Substituído por `npx tsc --noEmit` nos arquivos modificados; todos passaram
- **Files modified:** nenhum (processo de verificação apenas)

## Auth Gates

Nenhum.

## Known Stubs

Nenhum. Todos os utilitários estão completamente implementados e testados.

## Threat Flags

Nenhum novo surface introduzido além do previsto no threat model do plano. O wrapper `renderEmailBase` inclui `escapeHtml` para conteúdo gerado pelo próprio wrapper, mas documenta explicitamente (JSDoc + comentário de cabeçalho) que consumidores DEVEM sanitizar `bodyHtml`/`bodyText` com DOMPurify antes de chamar — conforme mitigação T-07-01 registrada.

## Self-Check: PASSED

- [x] `src/lib/email-base.ts` existe
- [x] `src/lib/email-base.test.ts` existe
- [x] `src/lib/email-templates/index.ts` existe
- [x] Commits existem: `cc73e0c`, `de0f2e5`, `afe9fb5`
- [x] 252 testes passam (23 novos)
