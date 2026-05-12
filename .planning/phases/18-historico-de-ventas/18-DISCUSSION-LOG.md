# Phase 18: Histórico de Ventas — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-09
**Phase:** 18-historico-de-ventas
**Areas discussed:** Layout da Listagem, Detalhes da Venda, Filtros e Busca, KPIs e Resumo

---

## Layout da Listagem

### Q1: Formato de exibição das vendas

| Option | Description | Selected |
|--------|-------------|----------|
| Tabela densa | Colunas: fecha, cliente, itens, total, moeda. Linhas clicáveis. Padrão admin. | |
| Cards por venda | Card com resumo visual por venda. Padrão novo. | |
| Tú decidís | Agente escolhe | ✓ |

**User's choice:** Tú decidís → Agente decide tabela densa (padrão consistente com admin)

### Q2: Paginação

| Option | Description | Selected |
|--------|-------------|----------|
| Paginação server-side | Botões Anterior/Siguiente com `?page=N` | ✓ |
| Scroll infinito | Carrega mais ao rolar | |
| Tú decidís | | |

**User's choice:** Paginação server-side

### Q3: Ordenação

| Option | Description | Selected |
|--------|-------------|----------|
| Mais recente primeiro | `created_at DESC` | |
| Mais antiga primeiro | `created_at ASC` | |
| Ordenação clicável nas colunas | Headers com setas ASC/DESC | |

**User's choice:** Mais recente primeiro COM ordenação clicável nas colunas (ambos)

---

## Detalhes da Venda

### Q4: Navegação para detalhes

| Option | Description | Selected |
|--------|-------------|----------|
| Página dedicada `/admin/ventas/[id]` | Mesma abordagem da maleta. Bookmark-friendly. | ✓ |
| Drawer lateral | Painel desliza da direita sem sair da lista | |
| Expandir inline na tabela | Seção abaixo da linha expandida | |

**User's choice:** Página dedicada

### Q5: Nível de detalhe na página

| Option | Description | Selected |
|--------|-------------|----------|
| Resumo completo | Data, cliente, moeda, totais, cotação snapshot, itens, quem registrou | ✓ |
| Resumo básico | Só data, cliente, total, lista de itens | |
| Tú decidís | | |

**User's choice:** Resumo completo

### Q6: Ações na página de detalhe

| Option | Description | Selected |
|--------|-------------|----------|
| Somente leitura | Venda imutável, sem ações | |
| Cancelar/Estornar venda | Botão para estornar, devolve estoque | ✓ |
| Tú decidís | | |

**User's choice:** Cancelar/Estornar venda

### Q7: Confirmação para estorno

| Option | Description | Selected |
|--------|-------------|----------|
| Modal de confirmação | Modal com resumo + botão confirmar | ✓ |
| Duplo clique com motivo | Modal exige motivo de cancelamento | |
| Tú decidís | | |

**User's choice:** Modal de confirmação (simples, sem motivo obrigatório)

---

## Filtros e Busca

### Q8: Filtros disponíveis

| Option | Description | Selected |
|--------|-------------|----------|
| Só período | DateRangePicker suficiente | |
| Período + busca por cliente | Campo de busca por nome/RUC | ✓ |
| Período + busca + filtro por moeda | Máximo de filtragem | |

**User's choice:** Período + busca por cliente

### Q9: Período padrão

| Option | Description | Selected |
|--------|-------------|----------|
| Últimos 30 dias | `?period=30` | |
| Últimos 7 dias | `?period=7` | ✓ |
| Mês atual | Dia 1 até hoje | |

**User's choice:** Últimos 7 dias

### Q10: Busca e Consumidor Final

| Option | Description | Selected |
|--------|-------------|----------|
| Busca filtra, sem cliente sempre visível | Consumidor Final aparece sempre | |
| Busca estrita | Só vendas com cliente match | |
| Tú decidís | | ✓ |

**User's choice:** Tú decidís → Agente decide busca estrita

---

## KPIs e Resumo

### Q11: KPIs no topo

| Option | Description | Selected |
|--------|-------------|----------|
| Sim, 3-4 cards | Total vendido, qtd vendas, ticket médio, itens vendidos | ✓ |
| Não, só tabela | Lista limpa sem métricas | |
| Sim, mínimo | 2 cards: total + quantidade | |

**User's choice:** Sim, 3-4 cards

### Q12: KPIs específicos

| Option | Description | Selected |
|--------|-------------|----------|
| Opção A | Total PYG, Qtd Vendas, Ticket Médio, Vendas Canceladas | |
| Opção B | Total PYG, Qtd Vendas, Ticket Médio, Total Itens Vendidos | ✓ |
| Opção C | Total PYG, Qtd Vendas, Ticket Médio, Clientes Únicos | |

**User's choice:** Opção B

### Q13: Reatividade dos KPIs aos filtros

| Option | Description | Selected |
|--------|-------------|----------|
| Reagem ao período, não à busca | Panorama do período completo | |
| Reagem a tudo | Recalculam com período E busca | |
| Tú decidís | | ✓ |

**User's choice:** Tú decidís → Agente decide reagem a tudo

### Q14: Exportação

| Option | Description | Selected |
|--------|-------------|----------|
| CSV do período | Botão "Exportar CSV" com dados filtrados | ✓ |
| Sem export nesta fase | Export fica para futuro | |
| Tú decidís | | |

**User's choice:** CSV do período

---

## Agent's Discretion

- Layout exato da tabela (formato de exibição = tabela densa, decisão agente)
- Busca estrita vs sempre exibir Consumidor Final (decisão agente: busca estrita)
- KPIs reagem a todos os filtros (decisão agente: sim)
- Número de itens por página (sugestão agente: 20)
- Schema de cancelamento (campo `cancelled_at` ou enum `status`)
- Tratamento visual de vendas canceladas na tabela

## Deferred Ideas

- Impressão de recibo / envio por WhatsApp — v1.5
- Filtro por moeda — fase futura
- Gráfico temporal de vendas — analytics geral
- Motivo obrigatório para cancelamento — v1.5 auditoria avançada
