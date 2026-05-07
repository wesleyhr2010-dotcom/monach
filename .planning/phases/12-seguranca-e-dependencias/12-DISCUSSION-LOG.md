# Phase 12: Segurança e Dependências - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-07
**Phase:** 12-seguranca-e-dependencias
**Areas discussed:** HTML allowlist (sanitize-html), Correção de timezone, Cobertura de testes de regressão

---

## HTML Allowlist (sanitize-html) — SEC-04

### Tags HTML

| Option | Description | Selected |
|--------|-------------|----------|
| Conservador | p, br, strong, em, ul, ol, li, a, h1-h3, span, div — sem tabelas ou imagens | ✓ |
| Email completo | Tudo acima + table/tr/td/th, img | |
| Mínimo | Apenas p, br, strong, em, a | |

**User's choice:** Conservador
**Notes:** Suficiente para emails transacionais ricos. Esta allowlist alimenta diretamente o editor da Fase 13.

### Atributo style

| Option | Description | Selected |
|--------|-------------|----------|
| Permitir style em todas as tags | Obrigatório para email clients renderizarem formatação | ✓ |
| Bloquear style | Mais seguro mas emails sem formatação visual | |

**User's choice:** Permitir style em todas as tags

### Protocolos de href

| Option | Description | Selected |
|--------|-------------|----------|
| Apenas http e https | Bloqueia javascript:, data:, file: | ✓ |
| http, https e mailto | Permite links de email | |

**User's choice:** Apenas http e https

---

## Correção de Timezone — SEC-05

### Abordagem do fix

| Option | Description | Selected |
|--------|-------------|----------|
| Offset manual (PY_OFFSET_HOURS = 3) | Sem nova dep, correto pois Paraguay não tem DST desde 2024 | ✓ |
| date-fns-tz | Mais idiomático, adiciona ~20KB | |

**User's choice:** Offset manual

### Estratégia de aplicação

| Option | Description | Selected |
|--------|-------------|----------|
| Corrigir função central getSinceDate | Um fix, 7 call sites resolvidos automaticamente | ✓ |
| Mover cálculo para SQL | Consistente com AT TIME ZONE mas refatora cada call site | |

**User's choice:** Corrigir a função central

---

## Cobertura de Testes de Regressão

### Testes de auth (SEC-01)

| Option | Description | Selected |
|--------|-------------|----------|
| Sim, adicionar testes de auth | Previne remoção acidental de requireAuth no futuro | ✓ |
| Não, somente o código | Fix simples, testes depois | |

**User's choice:** Sim, adicionar testes de auth

### Unit test de sanitização (SEC-04)

| Option | Description | Selected |
|--------|-------------|----------|
| Sim, unit test de sanitização | Documenta a allowlist como código executável | ✓ |
| Não, confiar na lib | sanitize-html já é testada upstream | |

**User's choice:** Sim, unit test de sanitização

---

## Claude's Discretion

- Local exato para documentar risco aceito de xlsx/jspdf (SEC-06)
- Nome e localização do helper sanitizeEmailHtml()
- Implementação interna do wrapper sobre sanitize-html
- Ordem dos planos de execução

## Deferred Ideas

- CVEs de vite/vitest — dev tooling apenas, deferred v1.4
- Gamificação security (GAM-SEC-01..05) — deferred v1.4
- mailto: no allowlist — pode ser adicionado na Fase 13 se necessário
