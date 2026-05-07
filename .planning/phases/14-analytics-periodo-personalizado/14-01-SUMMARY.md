---
phase: 14
plan: 01
subsystem: admin-analytics
status: complete
type: execute
---

## Plan 14-01: Refatoração do Backend para suporte a range customizado

**Objetivo:** Refatorar as Server Actions de analytics para suportar intervalos de datas arbitrários (from/to).

### Tarefas Executadas

1. **Task 1 — Helpers de conversão de data e fuso**
   - Definido `PY_OFFSET_MS` constante (UTC-3).
   - Criado `getRangeFromParams(period?, fromStr?, toStr?)` que retorna `{ from: Date, to: Date }`.
   - Suporta conversão de strings `YYYY-MM-DD` para midnight/23:59:59 no fuso -03:00.
   - Mantém compatibilidade com presets (`period` em dias) usando `getSinceDate`.

2. **Task 2 — Refatoração de assinaturas das funções de Analytics**
   - Alteradas assinaturas de 8 funções principais:
     - `getAnalyticsKPIs(from, to)`
     - `getAnalyticsFluxoMaletas(from, to)`
     - `getAnalyticsDistribuicaoStatus(from, to)`
     - `getAnalyticsTopRevendedoras(from, to, limit)`
     - `getAnalyticsProdutosMaisVendidos(from, to, limit)`
     - `getVitrinaKPIs(from, to, resellerId?)`
     - `getVitrinaVisitasSeries(from, to, resellerId?)`
     - `getVitrinaRankingRevendedoras(from, to, limit)`
     - `exportVitrinaAnalyticsCSV(from, to)`
   - Todas as queries Prisma e SQL `$queryRawUnsafe` atualizadas para usar `gte/lte` ou `BETWEEN`.
   - O limite superior `to` inclui todo o dia selecionado.
   - `getVitrinaKPIs` mantém a separação histórico/today com gate condicional (`includeToday`).

### Deviations

Nenhuma.

### Self-Check: PASSED

- [x] `actions-analytics.ts` compila sem erros (validado via `npx tsc --noEmit`)
- [x] Todas as funções aceitam `(from: Date, to: Date)`
- [x] Queries utilizam `gte/lte` com objetos Date corretos
- [x] `page.tsx` intencionalmente quebrado — será corrigido no Plano 14-02
