# Phase 8: Admin Analytics Extension - Context

**Gathered:** 2026-05-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Esta fase estende o dashboard `/admin/analytics` existente com métricas de engajamento da vitrina pública (visitas, cliques WhatsApp, CTR), gráfico de visitas ao longo do tempo, ranking de revendedoras por engajamento, e export CSV sem PII.

**In scope:**
- Novos KPI cards no dashboard: total de visitas às vitrinas, cliques WhatsApp, CTR de checkout, CTR de contato
- Gráfico de série temporal de visitas (série temporal) na página `/admin/analytics`
- Ranking de revendedoras por engajamento da vitrina (visitas + cliques)
- Filtro de período (7d/30d/3m/12m) aplicado às métricas de vitrina
- Seletor de revendedora para drill-down individual
- Escopo RBAC respeitado (consultora vê apenas suas revendedoras)
- Export CSV com métricas de vitrina agregadas sem PII

**Out of scope:**
- Página separada ou sub-rota para analytics de vitrina — tudo na mesma `/admin/analytics`
- Real-time analytics com WebSocket — usa agregação diária + raw de "hoje"
- Drill-down por produto dentro da vitrina de uma revendedora
- Comparação entre revendedoras (benchmarking)
- Notificações push baseadas em métricas de vitrina

**Dependencies:**
- Phase 6 completa (fonte de dados da vitrina: `AnalyticsAcesso`, `AnalyticsDiario`)
- `actions-analytics.ts` já funcional com KPIs operacionais
- `recharts` já instalado
- `getResellerScope()` para RBAC
- Cron `agrega-analytics-diario` já popula `AnalyticsDiario`

</domain>

<decisions>
## Implementation Decisions

### Layout do Dashboard
- **D-01:** Mesma página `/admin/analytics` — métricas de vitrina aparecem como nova seção abaixo da operacional (ou via tabs "Operacional" / "Vitrina"). Não criar sub-rota.
- **D-02:** Filtro de período (7d/30d/3m/12m) existente controla TODAS as métricas (operacionais + vitrina). Não duplicar o seletor.

### Granularidade e Seletor de Revendedora
- **D-03:** Seletor de revendedora no topo do dashboard, abaixo ou ao lado do filtro de período. Opções: "Todas as revendedoras" (default) ou uma revendedora específica.
- **D-04:** Quando "Todas" está selecionada: métricas agregadas (total de visitas, CTR médio, ranking).
- **D-05:** Quando uma revendedora está selecionada: métricas filtradas por `reseller_id` (visitas dela, cliques dela, CTR dela).
- **D-06:** Para CONSULTORA, o dropdown vem pré-filtrado com as revendedoras do seu grupo (`getResellerScope`). ADMIN vê todas.
- **D-07:** O ranking de revendedoras por engajamento sempre mostra todas as revendedoras do escopo (não é afetado pelo seletor de revendedora — o seletor filtra os cards e o gráfico, não o ranking).

### Definição de CTR
- **D-08:** Dois CTRs separados, ambos com denominador = visitantes únicos:
  - **CTR de Checkout:** cliques no botão "Finalizar pedido" do carrinho / visitantes únicos
  - **CTR de Contato:** qualquer clique WhatsApp (`tipo_evento = 'clique_whatsapp'`) / visitantes únicos
- **D-09:** Visitantes únicos = `visitantes_unicos` em `AnalyticsDiario` (contagem distinta de `visitor_id` por dia). Não usar visitas totais como denominador.

### Freshness dos Dados
- **D-10:** Base de dados: `AnalyticsDiario` (agregações diárias) para todo o período selecionado.
- **D-11:** Para o dia atual ("hoje"), fazer query adicional em `AnalyticsAcesso` filtrando `data_acesso >= hoje 00:00` e somar manualmente aos dados de `AnalyticsDiario`.
- **D-12:** Isso garante que o dashboard mostre dados até o momento atual, não só até ontem.

### Export CSV
- **D-13:** Botão "Exportar CSV" na seção de vitrina do dashboard (não integrado com `/admin/relatorios`).
- **D-14:** Colunas do CSV: slug da revendedora, período, total_visitas, visitantes_unicos, cliques_whatsapp, ctr_checkout, ctr_contato. Sem nomes, emails, whatsapp ou qualquer PII.
- **D-15:** CSV gerado server-side via Server Action, não client-side.

### Claude's Discretion
- Layout exato dos novos KPI cards (ordem, ícones, cores)
- Implementação das tabs "Operacional" / "Vitrina" (se tabs forem usadas em vez de scroll)
- Tipo de gráfico para visitas ao longo do tempo (line chart, area chart)
- Estrutura exata da query híbrida (AnalyticsDiario + AnalyticsAcesso)
- Formato exato do CSV (delimiter, encoding)
- Estados vazios quando não há dados de vitrina no período
- Skeleton loading para a nova seção

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Roadmap
- `.planning/ROADMAP.md` — Phase 8 goal, success criteria, pitfalls (ANLT-01..ANLT-06)
- `.planning/PROJECT.md` — Stack, constraints, established patterns, key decisions
- `.planning/STATE.md` — Current project state, accumulated decisions

### Prior Phase Context
- `.planning/phases/07-email-branding/07-CONTEXT.md` — Latest phase decisions
- `.planning/phases/06-vitrina-publica/06-CONTEXT.md` — Vitrina decisions, AnalyticsAcesso/AnalyticsDiario schema, tracking events

### Database & Analytics
- `prisma/schema.prisma` — Models `AnalyticsAcesso` e `AnalyticsDiario` com índices
- `docs/sistema/SPEC_DATABASE.md` — Schema definitions
- `docs/sistema/SPEC_CRON_JOBS.md` — Cron `agrega-analytics-diario`

### Existing Analytics Code
- `src/app/admin/actions-analytics.ts` — Server Actions existentes (KPIs operacionais, scope RBAC, raw SQL patterns)
- `src/app/admin/analytics/page.tsx` — Dashboard existente com filtro de período, gráficos e tabelas
- `src/app/admin/analytics/AnalyticsKpiCards.tsx` — Componente de cards reutilizável

### Security & RBAC
- `docs/sistema/SPEC_SECURITY_RBAC.md` — RBAC rules, role definitions
- `docs/sistema/SPEC_SECURITY_DATA_PROTECTION.md` — PII handling, zero PII in exports

### Design System
- `docs/design-system/tokens.md` — Tokens de design system (`--admin-*`)

### Codebase Maps
- `.planning/codebase/CONVENTIONS.md` — Server Action patterns, naming conventions
- `.planning/codebase/STRUCTURE.md` — Directory layout

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`src/app/admin/actions-analytics.ts`** — `getAnalyticsKPIs`, `getAnalyticsFluxoMaletas`, `getAnalyticsTopRevendedoras` etc. Reusar padrão de scope RBAC (`getMaletaResellerScope`, `getResellerScope`) e raw SQL com `$queryRawUnsafe`.
- **`src/app/admin/analytics/AnalyticsKpiCards.tsx`** — Componente client-side que renderiza cards de KPI. Pode ser estendido ou duplicado para os novos KPIs de vitrina.
- **`src/app/admin/analytics/page.tsx`** — Server Component com filtro de período via `searchParams`, layout com grid de cards e tabelas. A nova seção de vitrina segue o mesmo padrão visual.
- **`src/components/admin/AdminStatCard.tsx`** — Card reutilizável com ícone, valor e label.

### Established Patterns
- **Filtro de período:** 7d/30d/3m/12m via `searchParams` + redirect para default (30d). Botões de toggle no `AdminPageHeader`.
- **Scope RBAC:** `requireAuth(["ADMIN", "COLABORADORA"])` + `getResellerScope()` para filtrar por colaboradora.
- **Raw SQL com timezone:** `DATE(created_at AT TIME ZONE 'America/Asuncion')` usado em várias queries.
- **No nested transactions:** Prisma 7 constraint. Queries sequenciais ou array-form `$transaction([...])`.
- **force-dynamic:** Páginas autenticadas usam `export const dynamic = "force-dynamic"`.

### Integration Points
- **`AnalyticsDiario`** — Agregações diárias populadas pelo cron. Campos: `data`, `reseller_id`, `tipo`, `total_visitas`, `visitantes_unicos`, `cliques_whatsapp`.
- **`AnalyticsAcesso`** — Eventos raw. Campos: `reseller_id`, `visitor_id`, `tipo_evento`, `data_acesso`. Usar para calcular "hoje" em tempo real.
- **Filtro de período existente** — O seletor de período na página afeta tanto operacional quanto vitrina.

### Known Pitfalls
- **Índices em `AnalyticsAcesso`:** Verificar se `(data_acesso, tipo_evento, reseller_id)` tem índice composto para a query de "hoje".
- **Timezone `America/Asuncion`:** O cron já usa esse timezone. O dashboard deve usar o mesmo para consistência.
- **N+1 após groupBy:** Ao pré-carregar nomes das revendedoras para o ranking, evitar N+1 (usar `findMany` + `in` ou join).
- **RBAC scope leak:** Validar que `Prisma.empty` vs `Prisma.sql` é usado corretamente nas queries raw (ver padrão em `actions-analytics.ts`).
- **Export CSV consumindo RAM:** Limitar a ~1000 registros ou paginar.

</code_context>

<specifics>
## Specific Ideas

- **KPI Cards de vitrina (topo da seção):**
  - "Visitas a Vitrinas" — total de visitas no período
  - "Visitantes Únicos" — contagem distinta de `visitor_id`
  - "Cliques WhatsApp" — total de `clique_whatsapp`
  - "CTR Checkout" — finalizar pedido / únicos (percentual)
  - "CTR Contato" — qualquer clique WhatsApp / únicos (percentual)
- **Gráfico de visitas:** Line chart ou area chart mostrando `total_visitas` por dia no período. Mesmo padrão visual do gráfico de "Fluxo de Maletas" (cores do design system).
- **Ranking de revendedoras:** Tabela com colunas: Revendedora (avatar + nome), Visitas, Visitantes Únicos, Cliques WhatsApp, CTR Checkout. Ordenação default por visitas desc.
- **Seletor de revendedora:** Dropdown simples (similar a filtros existentes) posicionado ao lado do filtro de período.
- **Estado vazio:** "Sin datos de vitrina en el período" quando `AnalyticsDiario` não tem registros para o período + scope.
- **Ícones sugeridos:** `Eye` (visitas), `MousePointerClick` (cliques), `TrendingUp` (CTR), `Users` (únicos) — do lucide-react já instalado.

</specifics>

<deferred>
## Deferred Ideas

### Funcionalidades Futuras (fora do escopo da Fase 8)
- **Drill-down por produto dentro da vitrina** — Mostrar quais produtos de uma revendedora receberam mais cliques. Requer tracking por `produto_id` em `AnalyticsAcesso`.
- **Comparação entre revendedoras** — Benchmarking com média do grupo. Requer cálculos adicionais.
- **Notificações push para admin quando CTR de uma revendedora cair** — Requer thresholds configuráveis + integração OneSignal.
- **Heatmap de horários de visita** — Requer agregação por hora, não só por dia.
- **Integração do export CSV com `/admin/relatorios`** — Unificar todos os exports em uma página só (v2).

### Reviewed Todos (not folded)
None — no todos were cross-referenced into this phase's scope.

</deferred>

---

*Phase: 08-Admin Analytics Extension*
*Context gathered: 2026-05-06*
