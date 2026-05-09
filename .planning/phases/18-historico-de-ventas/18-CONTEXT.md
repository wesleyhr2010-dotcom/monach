# Phase 18: Histórico de Ventas — Context

**Gathered:** 2026-05-09
**Status:** Ready for planning
**Source:** Discussion with user + ROADMAP.md + Phase 17 CONTEXT.md

<domain>
## Phase Boundary

Esta fase entrega a consulta de histórico de vendas de loja em `/admin/ventas` — tabela paginada de todas as `VentaLoja` criadas no PDV, com filtro por período (date range) e busca por cliente (nome/RUC), KPIs de resumo no topo, página dedicada de detalhe por venda (`/admin/ventas/[id]`) com possibilidade de cancelar/estornar, e export CSV dos dados filtrados.

Escopo: `src/app/admin/ventas/`, `src/app/admin/actions-ventas.ts` (novo), reutilização de `DatePickerWithRange`, `AdminPageHeader`, `AdminEmptyState`.

</domain>

<decisions>
## Implementation Decisions

### Layout da Listagem
- **D-18-01:** **Tabela densa com linhas clicáveis** — Mesmo padrão visual da lista de maletas e revendedoras. Colunas: fecha/hora, cliente (nome ou "Consumidor Final"), cantidad de itens, total (moeda original), total PYG.
- **D-18-02:** **Paginação server-side** — Botões "Anterior / Siguiente" com query param `?page=N`. Server Action retorna página de resultados + total count para calcular número de páginas.
- **D-18-03:** **Ordenação default `created_at DESC` com headers clicáveis** — Mais recente primeiro. Admin pode clicar nos headers de data, total e cliente para alternar ASC/DESC. Parâmetro de ordenação refletido na URL (`?sort=total&dir=asc`).

### Detalhes da Venda
- **D-18-04:** **Página dedicada `/admin/ventas/[id]`** — Mesmo padrão da maleta (`/admin/maleta/[id]`). Permite bookmark e compartilhar link.
- **D-18-05:** **Resumo completo** — Cabeçalho com data/hora, cliente (nome + RUC ou "Consumidor Final"), moeda, total na moeda original, total em PYG, cotação snapshot usada (BRL→PYG, USD→PYG, data da cotização), quem registrou (created_by → nome do Reseller). Tabela de itens com produto, variante, quantidade, preço unitário, subtotal.
- **D-18-06:** **Cancelar/Estornar venda** — Botão "Cancelar Venta" na página de detalhe. Abre modal de confirmação com resumo (cliente, total, qtd de itens). Ao confirmar: marca venda como cancelada, devolve estoque via incremento em `ProductVariant.stock_quantity`, registra `EstoqueMovimento` reverso. Requer `requireAuth(["ADMIN"])`.
- **D-18-07:** **Modal de confirmação simples** — Sem exigir motivo de cancelamento. Modal com resumo + botão "Confirmar Cancelación".

### Filtros e Busca
- **D-18-08:** **DateRangePicker + busca por cliente** — Barra de filtros com `DatePickerWithRange` (reutilizado do Phase 14) e campo de busca por nome/RUC do cliente.
- **D-18-09:** **Default últimos 7 dias** — Tela abre com `?period=7` quando sem parâmetros. URL state segue precedência `?from/to` > `?period` (herdado D-14-04).
- **D-18-10:** **Busca estrita** — Quando há texto na busca, apenas vendas com cliente que match aparecem. Vendas de "Consumidor Final" ficam ocultas durante busca ativa. Busca vazia = todas as vendas.

### KPIs e Resumo
- **D-18-11:** **4 cards de KPI no topo** — Total Vendido (PYG), Quantidade de Vendas, Ticket Médio (PYG), Total de Itens Vendidos. Padrão visual do `AnalyticsKpiCards`.
- **D-18-12:** **KPIs reagem a todos os filtros** — Os 4 KPIs recalculam com base no período E na busca ativa. Refletem exatamente o que o admin está vendo na tabela.
- **D-18-13:** **Export CSV** — Botão "Exportar CSV" gera planilha com as vendas filtradas (período + busca). Reutilizar padrão do `VitrinaCsvDownload`.

### Herdados de Fases Anteriores
- **D-17-PDV-01**: Cliente opcional — `clienteId: null` exibe "Consumidor Final"
- **D-17-04**: Precisão monetária — `Math.round()` por linha, soma inteiros, `total_pyg` como fonte de verdade
- **D-14-02**: `DatePickerWithRange` (Shadcn/ui) padronizado
- **D-14-03**: Timezone UTC-3 (PY) para limites de query
- **D-14-04**: URL State Precedence — `?from/to` > `?period`
- **D-15-01**: Paper MCP consultado antes de implementar cada tela nova
- **D-15-02**: Tokens `--admin-*` obrigatórios — zero hex/px hardcoded no JSX

### Agent's Discretion
- Layout exato da tabela (larguras de coluna, responsividade mobile)
- Componente de KPI card — reutilizar `AnalyticsKpiCards` ou criar dedicado
- Número de itens por página na paginação (sugestão: 20)
- Formato de exibição de moeda na tabela (símbolo ou código ISO)
- Schema de cancelamento: campo `status` ou `cancelled_at` timestamp na `VentaLoja`
- Tratamento de vendas canceladas na listagem (badge de status, linha riscada, ou filtro separado)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### PDV e Schema
- `src/app/admin/actions-pdv.ts` — `criarVentaLoja` (padrão de Server Action, validação de stock, cotização do DB)
- `src/app/admin/pdv/PdvClient.tsx` — Componente client do PDV (referência de fluxo)
- `prisma/schema.prisma` — Models `VentaLoja` (linha 706), `VentaLojaItem` (linha 729), `Cliente` (linha 689), `EstoqueMovimento` (linha 378)

### Componentes Admin Reutilizáveis
- `src/components/admin/AdminPageHeader.tsx` — Header padrão de páginas admin
- `src/components/admin/AdminEmptyState.tsx` — Empty state para lista sem resultados
- `src/components/admin/AdminStatusBadge.tsx` — Badge de status (usar para indicar vendas canceladas)

### Date Range e Filtros
- `src/components/ui/date-range-picker.tsx` — `DatePickerWithRange` component
- `src/app/admin/analytics/DateRangeSelect.tsx` — Integração de DatePicker com URL state (padrão a copiar)
- `src/app/admin/analytics/page.tsx` — Padrão de page com filtros + KPIs + tabela

### Export CSV
- `src/app/admin/analytics/VitrinaCsvDownload.tsx` — Padrão de export CSV (reutilizar)

### Design System
- `docs/design-system/tokens.md` — Tokens CSS do projeto
- `src/app/admin/admin.css` — Tokens `--admin-*`
- `CLAUDE.md` §3.1 — Paper-first, modular, design system primeiro

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`DatePickerWithRange`**: Componente de seleção de range de datas, já integrado com URL state no analytics.
- **`DateRangeSelect`**: Wrapper que conecta o picker com `router.push()` e `searchParams`. Copiar e adaptar para `/admin/ventas`.
- **`AdminPageHeader`**: Header com título e breadcrumb — usar em todas as páginas de ventas.
- **`AdminEmptyState`**: Estado vazio para quando não há vendas no período.
- **`VitrinaCsvDownload`**: Padrão de download CSV client-side — adaptar para dados de vendas.
- **`AnalyticsKpiCards`**: Cards de KPI do analytics — referenciar para visual, criar componente dedicado para ventas.

### Established Patterns
- **Server Actions com `safeAction()` + `ActionResult<T>`**: Todas as queries e mutations devem seguir este padrão.
- **`requireAuth(["ADMIN"])`**: Obrigatório em todas as Server Actions de ventas.
- **URL State**: Filtros refletidos em `searchParams` (`?from`, `?to`, `?period`, `?page`, `?sort`, `?dir`, `?search`).
- **Timezone UTC-3**: Limites de query usam timezone do Paraguai (D-14-03).
- **Pré-leitura + transaction array**: Estorno de venda deve seguir padrão de `criarVentaLoja` — validação fora da transaction, operações sequenciais, compensação em falha.

### Integration Points
- **`VentaLoja` model**: Precisa de campo de cancelamento (novo campo `cancelled_at` ou `status` enum).
- **`EstoqueMovimento`**: Estorno registra movimentos reversos com tipo indicando cancelamento.
- **`invalidateCache`**: Chamar após estorno para atualizar lista.

</code_context>

<specifics>
## Specific Behaviors

### Fluxo da Listagem
1. Admin abre `/admin/ventas` → carrega últimos 7 dias (default)
2. 4 KPIs no topo refletem o período
3. Tabela abaixo com vendas paginadas (20/página)
4. Barra de filtros: DateRangePicker + campo de busca por cliente
5. Headers clicáveis para ordenação
6. Clicar na linha → navega para `/admin/ventas/[id]`

### Fluxo de Estorno
1. Admin abre `/admin/ventas/[id]`
2. Vê resumo completo da venda (cotização, itens, quem registrou)
3. Clica "Cancelar Venta" → modal com resumo
4. Confirma → Server Action: marca cancelada, incrementa estoque, registra `EstoqueMovimento` reverso
5. Toast de sucesso, badge de "Cancelada" na venda

### Tratamento de "Consumidor Final"
- `clienteId: null` em `VentaLoja` → exibir "Consumidor Final" na tabela e detalhe
- Busca por cliente NÃO retorna vendas sem cliente (busca estrita)

</specifics>

<deferred>
## Deferred Ideas

- Impressão de recibo / envio por WhatsApp após confirmação — v1.5 (junto com factura)
- Filtro por moeda (PYG/USD/BRL) — fase futura se necessário
- Gráfico temporal de vendas (trend chart) — pode ser adicionado ao analytics geral
- Motivo obrigatório para cancelamento — v1.5 (auditoria avançada)

</deferred>

---

*Phase: 18-historico-de-ventas*
*Context gathered: 2026-05-09 via user discussion*
