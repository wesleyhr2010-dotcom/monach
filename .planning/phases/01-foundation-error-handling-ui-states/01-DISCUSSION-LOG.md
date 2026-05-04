# Phase 1: Foundation — Error Handling & UI States - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-04
**Phase:** 1-Foundation — Error Handling & UI States
**Areas discussed:** Completude da Migração, Estratégia de Ícones do EmptyState, Adaptação Client-Side, Toast Severity Enforcement

---

## Completude da Migração

| Option | Description | Selected |
|--------|-------------|----------|
| Migrar TUDO agora | Todos os 10 arquivos com BUSINESS throws devem ser migrados na Fase 1. Garante consistência total, mas aumenta escopo e risco de regressão. | |
| Apenas os 5 de alto tráfego | Ficar com os planos atuais. Os outros arquivos mantêm padrão antigo e serão migrados em fases futuras quando modificados. | ✓ |
| Migrar os 5 principais + user.ts | Adicionar `src/lib/user.ts` à migração (core auth). | ✓ (adopted as follow-up) |

**User's choice:** Apenas os 5 de alto tráfego (posteriormente incluiu user.ts)
**Notes:** User inicialmente escolheu 5 arquivos, mas após discussão sobre `user.ts` ser core para auth de toda a aplicação, concordou em incluí-lo. Restantes (~5 arquivos, ~10 throws) ficam para backlog com FIXME + documentação.

---

## Estratégia de Ícones do EmptyState

| Option | Description | Selected |
|--------|-------------|----------|
| Apenas Lucide icons | Cada tela passa componente Lucide. Consistente mas requer imports em cada rota. | |
| Apenas emojis (string) | Alinha com SPEC tables. Simples mas inconsistente com codebase. | |
| Ambos (React.ReactNode) | Máxima flexibilidade, mas permite inconsistência visual. | |
| Lucide por padrão, com mapeamento interno | Aceitar string chave (ex: `icon='package'`) e mapear internamente para Lucide. Remove imports nas rotas. | ✓ |

**User's choice:** Lucide por padrão, com mapeamento interno
**Notes:** Tamanho fixo em 48px com detecção automática de contexto PWA/Admin via tokens. Fallback para `PackageOpen` + `console.warn` em desenvolvimento quando chave inválida.

---

## Adaptação Client-Side

| Option | Description | Selected |
|--------|-------------|----------|
| Atualizar todos os call sites na Fase 1 | Garante consistência, mas aumenta muito o escopo. | |
| Criar uma camada de compatibilidade | Helper que padroniza tratamento. Menos mudança no client. | ✓ |
| Deixar para fases futuras | Client continua funcionando (result.error ainda existe). Menor escopo, mas inconsistência temporária. | |

**User's choice:** Criar uma camada de compatibilidade
**Notes:** Fornecer dois helpers: `useAction` (hook com loading state) e `handleAction` (função utilitária simples). Integração com toast via callback `onError` opcional — se omitido, chama `toast.error()` automaticamente.

---

## Toast Severity Enforcement

| Option | Description | Selected |
|--------|-------------|----------|
| Wrapper `showToast()` com severidade | Wrapper mapeia severidade → duração. Todos os devs usam `showToast`. | ✓ (parte da solução) |
| Helper `useAction`/`handleAction` impõe duração | Helpers aplicam duração correta automaticamente. Parcialmente consistente. | |
| Documentar convenção apenas | Sem código adicional, sem enforce automático. | |
| Wrapper + lint rule | Wrapper E regra ESLint que detecta uso direto de `toast.*()` e sugere `showToast()`. | ✓ |

**User's choice:** Wrapper + lint rule
**Notes:** `showToast({ severity, message })` em `src/lib/toast.ts`. Regra ESLint detecta `toast.success()`/`toast.error()` sem duração. `useAction`/`handleAction` usam `showToast()` internamente.

---

## the agent's Discretion

- Exact ESLint rule implementation details (severity level, auto-fix capability)
- Exact icon key-to-Lucide mapping table
- `useAction` hook internal state shape

## Deferred Ideas

- **Complete BUSINESS throw migration** — Remaining ~5 files with ~10 throws (perfil, progreso, brindes, notif-push, assert-in-group). Tracked in backlog + FIXME comments.
- **Client call site manual migration** — After helpers are proven, gradually replace helper usage with direct `result.success` checks.
- **Custom toast animations** — Custom enter/exit animations beyond sonner's richColors. Not required by SPEC.
