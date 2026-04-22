# SPEC — Admin: Dashboard

## Objetivo
Entregar ao admin (SUPER_ADMIN ou CONSULTORA) uma visão executiva do negócio com indicadores-chave (faturamento, maletas, revendedoras, alertas) e listas de itens que precisam de atenção imediata.

## Atores
- **SUPER_ADMIN** — visão consolidada do negócio inteiro.
- **CONSULTORA** — visão do seu grupo de revendedoras.
- **Sistema** — carrega métricas agregadas em paralelo.

## Fluxo
1. Usuário admin loga e acessa `/admin`.
2. Sistema detecta role e carrega dataset apropriado (consolidado vs. escopo de grupo).
3. Renderiza cards KPI (faturamento, maletas, revendedoras, alertas), lista de "Maletas com Atenção", desempenho por consultora (SUPER_ADMIN) e documentos pendentes.
4. Usuário pode trocar a janela temporal (esta semana, este mês, personalizado).
5. CTAs levam diretamente às telas de ação (maleta, revendedora, documento).

## Regras de negócio
- Métricas reagem ao filtro de período.
- Consultora nunca vê dados fora do seu grupo.
- Maletas com atenção: `atrasada`, `aguardando_revisao` ou `vence em ≤ 2 dias`.
- Comparativo "↑ +X%" sempre relativo ao período anterior equivalente.
- Exportação é restrita a SUPER_ADMIN.

## Edge cases
- Consultora sem revendedoras ativas → cards zerados + empty states.
- Primeiro dia do mês → período "mês anterior" pode ficar com divisão por zero; exibir "Nuevo" ou "—".
- Documentos pendentes vazios → oculta seção.
- Falha em uma query paralela → card mostra erro local, demais continuam.

## Dependências
- `SPEC_ADMIN_LAYOUT.md` — shell e RBAC.
- `SPEC_ADMIN_MALETAS.md` — fonte dos alertas de maleta.
- `SPEC_ADMIN_DOCUMENTOS_ACERTOS.md` — documentos pendentes.
- `SPEC_ADMIN_ANALYTICS_NOTIFICATIONS.md` — AlertBell complementar.

---

## Detalhes técnicos / Referência

**Rota:** `/admin`  
**Tipo:** Server Component (dados em paralelo)

---

## Visão Geral

O dashboard muda conforme o papel do usuário:
- **SUPER_ADMIN** → visão consolidada do negócio inteiro
- **CONSULTORA** → visão do seu grupo de revendedoras

---

## Layout — SUPER_ADMIN

```
┌─────────────────────────────────────────────────────────────┐
│  Dashboard                    [Esta semana ▼] [Exportar ↓]  │
│                                                             │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────┐ │
│  │ 💰 Faturamento│ │ 📦 Maletas   │ │ 👥 Revend.   │ │⚠️  │ │
│  │ G$ 45.200.000│ │  12 ativas   │ │  48 ativas   │ │ 3  │ │
│  │ ↑ +18% mês   │ │  3 atrasadas │ │  2 novas     │ │ at.│ │
│  └──────────────┘ └──────────────┘ └──────────────┘ └────┘ │
│                                                             │
│  Maletas com Atenção                                        │
│  ──────────────────────────────────────────────────────     │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ #102  Ana Silva    [ATRASADA — 3 dias]  [Ver →]       │  │
│  │ #089  Maria Góm.  [ACERTO PENDENTE]     [Ver →]       │  │
│  │ #075  Joana Lima  [Vence amanhã]        [Ver →]       │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  Desempenho por Consultora                                  │
│  ──────────────────────────────────────────────────────     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Maria Flores  12 revend.  G$18.5M  ████████░░ 85%     │ │
│  │ Sofia Gómez    8 revend.  G$12.1M  ██████░░░░ 65%     │ │
│  │ Lucia Martínez 5 revend.  G$ 8.2M  █████░░░░░ 55%     │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  Documentos para Análise (3)                                │
│  Ana Silva — CI enviado · Maria G. — CI enviado            │
└─────────────────────────────────────────────────────────────┘
```

---

## Layout — CONSULTORA

```
┌─────────────────────────────────────────────────────────────┐
│  Olá, Maria Santos 👋              [Este mês ▼]             │
│                                                             │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐ │
│  │ 💰 Faturamento│ │ 💎 Minha Com.│ │ 👥 Minhas Revend.    │ │
│  │ G$ 18.500.000│ │ G$ 1.850.000 │ │   12 ativas          │ │
│  │ (seu grupo)  │ │   (10%)      │ │   2 novas este mês   │ │
│  └──────────────┘ └──────────────┘ └──────────────────────┘ │
│                                                             │
│  Maletas do Meu Grupo com Atenção                           │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ #102  Ana Silva    [ATRASADA — 3 dias]  [Ver →]     │    │
│  │ #089  Maria G.    [ACERTO PENDENTE]     [Ver →]     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  Ranking das Minhas Revendedoras (este mês)                 │
│  #1 Ana Silva    G$ 3.200.000  [Ouro 🥇]                    │
│  #2 Joana Lima   G$ 2.800.000  [Prata 🥈]                   │
│  #3 Sofia Rodrig G$ 1.500.000  [Bronze 🥉]                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Dados Necessários

### SUPER_ADMIN

| Métrica | Query |
|---------|-------|
| Faturamento total | `SUM(maleta.valor_total_vendido) WHERE created_at IN [range]` |
| Maletas ativas | `COUNT WHERE status = 'ativa'` |
| Maletas atrasadas | `COUNT WHERE status = 'atrasada'` |
| Revendedoras ativas | `COUNT WHERE status = 'ativa'` (Reseller) |
| Alertas | Maletas atrasadas + acertos pendentes + docs em análise |
| Desempenho por consultora | `GROUP BY colaboradora_id` com SUM e COUNT |

### CONSULTORA (tudo filtrado por `colaboradora_id`)

| Métrica | Query |
|---------|-------|
| Faturamento do grupo | `SUM(maleta.valor_total_vendido) WHERE maleta.reseller.colaboradora_id = meuId` |
| Minha comissão | `SUM(maleta.valor_comissao_colaboradora) WHERE reseller.colaboradora_id = meuId` |
| Ranking revendedoras | `ORDER BY SUM(maleta.valor_total_vendido) DESC WHERE colaboradora_id = meuId` |

---

## Card "Alertas" — Lógica de Destaque

Itens que precisam de atenção imediata:

```ts
const alertas = await Promise.all([
  // Maletas atrasadas
  prisma.maleta.findMany({ where: { ...scope, status: 'atrasada' } }),

  // Acertos aguardando confirmação
  prisma.acertoRevendedora.findMany({
    where: { status: 'pendente', maleta: { reseller: { ...scope } } }
  }),

  // Documentos em análise
  prisma.resellerDocumento.findMany({
    where: { status: 'em_analise', reseller: { ...scope } }
  }),
]);
```

---

## Server Action: `getDashboardData(session)`

```ts
async function getDashboardData(session: AdminSession) {
  const scope = getResellerScope(session);
  const { start, end } = getMesAtual();

  const [metricas, alertas, ranking] = await Promise.all([
    getMetricasGerais(scope, start, end),
    getAlertasPendentes(scope),
    session.role === 'CONSULTORA'
      ? getRankingRevendedoras(scope, start, end)
      : getDesempenhoConsultoras(start, end),
  ]);

  return { metricas, alertas, ranking };
}
```

---

## Componentes

| Componente | Tipo | Responsabilidade |
|-----------|------|-----------------|
| `AdminDashboardPage` | Server | Busca dados + renderiza visão por papel |
| `MetricCard` | Server | Número + label + tendência |
| `AlertasCard` | Server | Lista de itens urgentes com links |
| `RankingTable` | Server | Tabela ordenada (revendedoras ou consultoras) |
| `DateRangeSelector` | **Client** | Filtro de período (dropdown) |
