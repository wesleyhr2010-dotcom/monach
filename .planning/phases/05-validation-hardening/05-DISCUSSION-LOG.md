# Phase 5: Validation & Hardening - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-05
**Phase:** 05-Validation & Hardening
**Areas discussed:** BUSINESS throw cleanup scope, Security validation method, Performance validation approach, Test strategy for v1.0, RBAC scope leak verification, CI/CD quality gate

---

## BUSINESS Throw Cleanup Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Migrar todos os 10 arquivos restantes | Inclui user.ts, assert-in-group.ts e 7 arquivos de ações. Garante zero BUSINESS throws em todo o código de produção. | ✓ |
| Migrar apenas arquivos de ações (exclui lib/utils) | Deixa user.ts e assert-in-group.ts com BUSINESS throws. Menos trabalho, mas não atinge 100% do critério. | |
| Verificar apenas os 5 arquivos já migrados | Aceita que os 10 arquivos restantes continuem com BUSINESS throws. Rápido, mas deixa dívida técnica. | |

**User's choice:** Migrar todos os 10 arquivos restantes (recomendado)
**Notes:** Um único plano migra todos os 10 arquivos. Build + lint + typecheck + test como gate obrigatório antes de merge.

---

## Security Validation Method

| Option | Description | Selected |
|--------|-------------|----------|
| Checklist de revisão manual + DOMPurify já existente | Revisa manualmente todos os pontos onde variáveis de template entram em emails e push. Documenta o checklist em CONTEXT.md. | ✓ |
| Testes unitários de sanitização para cada tipo de variável | Escreve testes Vitest que injetam scripts em templates e verificam saída sanitizada. Mais robusto, mas mais trabalho. | |
| Scan automatizado com ferramenta externa (ex: Semgrep) | Adiciona regra Semgrep ou ESLint para detectar padrões de XSS. Poderoso, mas requer configuração extra. | |

**User's choice:** Checklist de revisão manual + DOMPurify já existente (recomendado)
**Notes:** Enforce centralizado no helper `notificarComTemplate` — rejeita HTML no push. Escopo de segurança: XSS + RBAC + RLS. Documentação em CONTEXT.md + checklist no plano de execução.

---

## Performance Validation Approach

| Option | Description | Selected |
|--------|-------------|----------|
| Testes automatizados que rodam EXPLAIN e falham em sequential scans | Testes Vitest que conectam no banco de staging e verificam que queries-chave não fazem seq scan. | ✓ |
| Manual no Supabase SQL Editor com queries copiadas | Copia as queries geradas e roda EXPLAIN ANALYZE no SQL Editor. Rápido, não requer infra extra. | |
| Ferramenta de observabilidade (Sentry/APM) em produção | Aguarda dados reais de produção. Mas Sentry ainda não está configurado (deferred v1.1). | |

**User's choice:** Testes automatizados que rodam EXPLAIN e falham em sequential scans
**Notes:** Foco apenas em analytics: `getMetricasDesempenho` + dashboard KPIs. Threshold: 500ms para queries de dashboard/desempenho. Índices adicionados via Prisma schema + migration.

---

## Test Strategy for v1.0

| Option | Description | Selected |
|--------|-------------|----------|
| Vitest unit/integration para Server Actions críticas + ajustar RBAC regression | Expande testes Vitest para aprovarLead, registrarVenda, criarMaleta. Adapta testes RBAC para ActionResult. | ✓ |
| Configurar Playwright E2E + golden paths | Adiciona infra de Playwright e escreve testes E2E de fluxo completo. Mais valor, mas requer tempo significativo. | |
| Ambos: Vitest expandido + Playwright configurado | Máxima cobertura. Ideal, mas pode estourar o escopo da Fase 5. | |

**User's choice:** Vitest unit/integration para Server Actions críticas + ajustar RBAC regression (recomendado)
**Notes:** 3 ações críticas: aprovarLead (idempotência + race condition com Promise.all de 5 chamadas), registrarVenda, criarMaleta. Teste unitário de timezone para Paraguay (`America/Asuncion`).

---

## RBAC Scope Leak Verification

| Option | Description | Selected |
|--------|-------------|----------|
| Expandir suite de regressão existente (11 → 15+ testes) | Adiciona testes específicos para COLABORADORA acessando revendedora de outro grupo, próprio grupo, ADMIN acessando qualquer grupo. | ✓ |
| Checklist manual de validação contra cada Server Action admin | Revisa manualmente cada action para confirmar uso de assertIsInGroup ou getResellerScope. Documenta em CONTEXT.md. | |
| Ambos: testes automatizados + checklist manual | Máxima cobertura. Testes para casos críticos, checklist manual para o restante. | |

**User's choice:** Expandir suite de regressão existente (11 → 15+ testes) (recomendado)
**Notes:** Todas as actions que acessam dados de revendedora entram no teste. Mock de `requireAuth` para retornar COLABORADORA com grupo fixo. Teste deve FALHAR (vermelho) se action não usar assertIsInGroup/getResellerScope.

---

## CI/CD Quality Gate

| Option | Description | Selected |
|--------|-------------|----------|
| Sim — workflow básico de CI (lint + typecheck + test) | Cria `.github/workflows/ci.yml` com npm run lint, typecheck, test. Roda em todo PR e push para main. | ✓ |
| Sim — CI completo com preview Vercel + E2E | Inclui deploy de preview na Vercel e testes E2E com Playwright. Completo, mas Playwright ainda não está configurado. | |
| Não — adiamos CI para pós-v1.0 | Foca apenas nos testes e validações locais. CI é importante, mas pode ser uma fase separada. | |

**User's choice:** Sim — workflow básico de CI (lint + typecheck + test) (recomendado)
**Notes:** Trigger: push para main + pull requests. Ambiente: Node 20 + Ubuntu latest + cache de npm. GitHub Secrets com credenciais de staging para testes de integração.

---

## the agent's Discretion

- Exact ESLint custom rule details for preventing new `BUSINESS:` throws
- Specific mock implementations for Supabase Auth in race condition tests
- Exact composite index definitions based on EXPLAIN ANALYZE findings
- CI workflow file naming and organization details
- Specific test cases for RBAC scope beyond the 4 new tests minimum

## Deferred Ideas

- Playwright E2E golden paths (login → maleta → venda → devolução) — v1.1
- Sentry observability integration — v1.1
- Rate limiting with Upstash Redis — v1.1
- Complete client call site migration from helpers to direct ActionResult handling — ongoing
- Email template branding standardization — future small phase if needed
