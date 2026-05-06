# Phase 8: Admin Analytics Extension - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-06
**Phase:** 8-Admin Analytics Extension
**Areas discussed:** Layout do dashboard, Definição de CTR, Freshness dos dados, Granularidade das métricas

---

## Layout do Dashboard

| Option | Description | Selected |
|--------|-------------|----------|
| Mesma página, seção abaixo | Scroll down revela métricas de vitrina abaixo da operacional. Filtro de período único. | |
| Tabs na mesma página | "Operacional" / "Vitrina" no topo. Interface limpa, não sobrecarrega. | |
| Sub-rota /admin/analytics/vitrina | Página separada com URL própria. Carregamento independente. | |

**User's choice:** A (mesma página, seção abaixo) — mas com tabs para organizar visualmente.
**Notes:** Usuário perguntou se seria mostrado de todas as revendedoras ou se teria que escolher qual vitrine. Isso levou à discussão de granularidade (seletor de revendedora).

---

## Granularidade das Métricas

| Option | Description | Selected |
|--------|-------------|----------|
| Visão agregada + ranking | Cards e gráficos mostram totais do sistema/grupo. Ranking mostra revendedoras. Sem drill-down. | |
| Visão agregada + drill-down | Ao clicar em revendedora no ranking, abre sub-view com gráfico dela. | |
| Seletor de revendedora no topo | Dropdown "Todas" / "Revendedora X" filtra todos os cards e gráficos. | ✓ |

**User's choice:** C (seletor de revendedora no topo)
**Notes:** Usuário escolheu explicitamente a opção C. Para CONSULTORA, dropdown pré-filtrado com as revendedoras do seu grupo. Ranking continua mostrando todas do escopo.

---

## Definição de CTR

| Option | Description | Selected |
|--------|-------------|----------|
| Somente "Finalizar pedido" | Numerador = clique no botão "Finalizar pedido" do carrinho. | |
| Todos os cliques WhatsApp | Numerador = qualquer `clique_whatsapp`. Inclui CTA genérico do perfil. | |
| Dois CTRs separados | CTR Checkout (finalizar pedido) + CTR Contato (qualquer clique WhatsApp). | ✓ |

**User's choice:** C (dois CTRs separados)
**Notes:** Usuário também escolheu denominador = visitantes únicos (não visitas totais).

---

## Freshness dos Dados

| Option | Description | Selected |
|--------|-------------|----------|
| Somente AnalyticsDiario | Query simples, rápida. "Hoje" mostra zero até o cron rodar amanhã. | |
| AnalyticsDiario + "hoje" via AnalyticsAcesso | Base diária + query raw para o dia atual. Dados quase tempo real. | ✓ |
| Sempre AnalyticsAcesso | Tempo real, mas lento para períodos grandes. | |
| AnalyticsDiario + cache Redis | Overkill para esta fase. | |

**User's choice:** B (AnalyticsDiario + query raw de "hoje")
**Notes:** Usuário quer dados atualizados até o momento atual, não só até ontem.

---

## Claude's Discretion

- Layout exato dos novos KPI cards (ordem, ícones, cores)
- Tipo de gráfico para visitas ao longo do tempo
- Estrutura exata da query híbrida (AnalyticsDiario + AnalyticsAcesso)
- Formato exato do CSV
- Estados vazios e skeleton loading

## Deferred Ideas

- Drill-down por produto dentro da vitrina de uma revendedora
- Comparação entre revendedoras (benchmarking)
- Notificações push quando CTR cair
- Heatmap de horários de visita
- Integração do export com `/admin/relatorios`
