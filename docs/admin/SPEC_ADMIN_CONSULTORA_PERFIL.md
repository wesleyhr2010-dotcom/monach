# SPEC — Consultora: Perfil, Comissões e Visão do Grupo

## Objetivo
Definir a experiência da CONSULTORA dentro do portal `/admin/*`, com sidebar restrita, perfil pessoal, extrato de comissões, analytics do grupo e ações operacionais em maletas/revendedoras/brindes vinculadas ao seu grupo.

## Atores
- **CONSULTORA** — usa portal admin com escopo do próprio grupo.
- **SUPER_ADMIN** — define taxa de comissão e atribui revendedoras.
- **Sistema de comissão** — calcula comissões consolidadas do grupo.

## Fluxo
1. Consultora loga em `/admin/login` e é direcionada a `/admin/minha-conta`.
2. Sidebar mostra apenas: Dashboard, Analytics, Maletas (com badge), Revendedoras, Perfil, Comissões, Solicitações.
3. Pode editar dados pessoais; taxa de comissão é read-only (definida pelo SUPER_ADMIN).
4. "Comissões" mostra extrato mês a mês, detalhes por maleta concluída.
5. "Maletas" e "Revendedoras" funcionam como versões filtradas das telas SUPER_ADMIN.
6. "Solicitações" lista brindes pedidos por revendedoras do grupo para marcar como entregue.

## Regras de negócio
- Todas as queries da consultora são escopadas por `getResellerScope`.
- Itens da sidebar exclusivos SUPER_ADMIN não aparecem: Produtos, Categorias, Candidaturas, Consultoras, Gamificação, Notif. Push, Config.
- Comissão da consultora é `% sobre faturamento do grupo` (definida por SUPER_ADMIN).
- Consultora pode operar (criar/conferir) apenas em maletas do próprio grupo.
- Badges no sidebar refletem itens pendentes apenas do grupo.

## Edge cases
- Consultora sem revendedoras → todas as telas com empty state.
- Revendedora reatribuída a outra consultora → some do escopo imediatamente.
- Comissão calculada em mês já fechado → congelada; mudanças de taxa não retroagem.
- Consultora desativada → login bloqueado; histórico preservado.
- Consultora tenta URL fora do seu grupo → 403/redireciona.

## Dependências
- `SPEC_ADMIN_LAYOUT.md` — RBAC e shell.
- `SPEC_ADMIN_EQUIPE.md` — vínculo consultora↔revendedoras.
- `SPEC_ADMIN_MALETAS.md` / `SPEC_ADMIN_CONFERIR_MALETA.md` — telas reutilizadas.
- `SPEC_ADMIN_ANALYTICS_NOTIFICATIONS.md` — analytics escopado.
- `SPEC_ADMIN_BRINDES.md` — solicitações do grupo.
- `SPEC_ADMIN_CONFIG.md` — tiers de comissão.

---

## Detalhes técnicos / Referência

**Rotas (acessíveis pela CONSULTORA):**
- `/admin/minha-conta` — Perfil + resumo mensal
- `/admin/minha-conta/comissoes` — Histórico detalhado de comissões
- `/admin/analytics` — Análise de desempenho do grupo
- `/admin/maletas` — Lista de maletas do seu grupo (com badge de pendentes)
- `/admin/maletas/[id]` — Detalhe de uma maleta
- `/admin/maletas/[id]/conferir` — Conferência física + fechamento
- `/admin/revendedoras` — Lista das suas revendedoras
- `/admin/revendedoras/[id]` — Perfil individual de uma revendedora (desempenho, vendas, pontos)
- `/admin/solicitacoes` — Solicitações de brindes do seu grupo (marcar como entregue)

> **SUPER_ADMIN** também acessa `/admin/analytics` mas vê o negócio inteiro (sem filtro de colaboradora).

---

## Sidebar da Consultora

```
│  🏠 Dashboard
│  📊 Analytics
│  👜 Maletas          [2]  ← badge: maletas ag. conferência
│  👥 Revendedoras
│  ── MINHA CONTA ──
│  👤 Perfil           ← ativo por padrão
│  💰 Comissões
│  🎁 Solicitações     ← brindes pendentes para marcar entregue
```

**Itens que NÃO aparecem para consultora** (exclusivos SUPER_ADMIN):
- Produtos, Categorias, Candidaturas, Consultoras, Gamificação, Notif. Push, Config

**Notificações no header:** 🔔 com contagem de maletas em `aguardando_revisao` — igual ao SUPER_ADMIN, mas filtrado pelo grupo da consultora.

---

## Tela 1: Minha Conta `/admin/minha-conta`

```
┌─────────────────────────────────────────────────────────────┐
│  Minha Conta                                   [Editar]     │
│                                                              │
│  [Avatar]  Maria Flores                                      │
│            maria.flores@monarca.com.py                      │
│            WhatsApp: +595 981 234 567                       │
│            Taxa de Comissão: 10%  ← definida pelo admin     │
│                                                              │
│  ── Resumo deste mês ────────────────────────────────────   │
│  ┌──────────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ 💰 Minha Comissão│  │ 📦 Maletas   │  │ 👥 Revend.   │  │
│  │  G$ 1.850.000    │  │ 12 ativas    │  │ 15 ativas    │  │
│  │  (10% do grupo)  │  │  2 ag. conf. │  │  1 nova      │  │
│  └──────────────────┘  └──────────────┘  └──────────────┘  │
│                                                              │
│  [Ver Extrato de Comissões →]                               │
│  [Ver Analytics do Grupo →]                                  │
└─────────────────────────────────────────────────────────────┘
```

### Editar Perfil (modal)

```
┌─────────────────────────────────────┐
│  Editar Perfil                      │
│                                     │
│  Nome: [Maria Flores__________]     │
│  WhatsApp: [+595 981 234 567__]     │
│  Avatar: [📷 Trocar foto]           │
│                                     │
│  Taxa de comissão: 10%              │
│  (Definida pelo administrador)      │
│                                     │
│  [Cancelar]   [Salvar]              │
└─────────────────────────────────────┘
```

> A taxa de comissão é **somente leitura** para a consultora. Só o SUPER_ADMIN pode alterá-la.

---

## Tela 2: Extrato de Comissões `/admin/minha-conta/comissoes`

```
┌─────────────────────────────────────────────────────────────┐
│  ← Extrato de Comissões                      [Ano: 2024 ▼] │
│                                                              │
│  ── Resumo do Ano ───────────────────────────────────────── │
│  Total ganho em 2024:  G$ 18.450.000                        │
│  Total maletas fechadas: 87                                  │
│  Média mensal:  G$ 1.537.500                                │
│                                                              │
│  ── Por Mês ─────────────────────────────────────────────── │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Mês         │ Fat. Grupo  │ Minha Comissão │ Status  │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │ Dez 2024    │ G$18.5M     │ G$ 1.850.000   │⏳Pend. │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │ Nov 2024    │ G$16.2M     │ G$ 1.620.000   │✅Pago  │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │ Out 2024    │ G$14.8M     │ G$ 1.480.000   │✅Pago  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Detalhe de um mês (expandir linha)

```
▼ Dezembro 2024 — G$ 1.850.000

  ┌────────────────────────────────────────────────────────┐
  │ Revendedora    │ Maleta │ Vendas      │ Comissão (10%) │
  ├────────────────────────────────────────────────────────┤
  │ Ana Silva      │ #102   │ G$ 3.200.000│ G$ 320.000     │
  │ Joana Lima     │ #101   │ G$ 2.900.000│ G$ 290.000     │
  │ Sofia Rodrigues│ #099   │ G$ 2.100.000│ G$ 210.000     │
  │ ...            │        │             │                │
  │ ─────────────────────────────────────────────────────  │
  │ TOTAL                     G$18.500.000  G$ 1.850.000   │
  └────────────────────────────────────────────────────────┘
```

---

## Tela 3: Analytics do Grupo `/admin/analytics`

```
┌─────────────────────────────────────────────────────────────┐
│  Analytics do Grupo                    [Dezembro 2024 ▼]   │
│                                                              │
│  ── Métricas do Período ────────────────────────────────── │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐ │
│  │ 📊 Fat. Total │ │ 📦 Maletas   │ │ 👥 Ativas            │ │
│  │ G$ 18.500.000│ │ 15 fechadas  │ │ 15 de 18 revend.     │ │
│  │ ↑ +12% vs nov│ │ 2 em aberto  │ │ 3 sem maleta ativa   │ │
│  └──────────────┘ └──────────────┘ └──────────────────────┘ │
│                                                              │
│  ── 🏆 Ranking das Revendedoras ────────────────────────── │
│  [Faturamento ●] [Qtd Vendas] [Pontos] ← toggle            │
│                                                              │
│  Pos │ Revendedora      │ Faturamento │ Rank   │ Ver Detalhe │
│  ────┼──────────────────┼─────────────┼────────┼────────── │
│  🥇1 │ Ana Silva        │ G$3.200.000 │ Ouro   │ [Ver →]    │
│  🥈2 │ Joana Lima       │ G$2.900.000 │ Prata  │ [Ver →]    │
│  🥉3 │ Sofia Rodrigues  │ G$2.100.000 │ Prata  │ [Ver →]    │
│   4  │ Maria García     │ G$1.800.000 │ Bronze │ [Ver →]    │
│   5  │ Lucia Martínez   │ G$1.500.000 │ Bronze │ [Ver →]    │
│                                                              │
│  ── 📦 Produtos mais Vendidos (no grupo) ─────────────────  │
│  1. Gargantilha Dourada    32 un.  G$40.000.000            │
│  2. Brincos Argola         28 un.  G$22.400.000            │
│  3. Ring Ouro Rosé         21 un.  G$18.690.000            │
│                                                              │
│  ── 🚨 Revendedoras sem Maleta Ativa ─────────────────────  │
│  Carla Benitez   — último fechamento: 15 Nov  [Criar →]     │
│  Rosa Fernández  — nunca teve maleta          [Criar →]     │
│  Paula Giménez   — em acerto desde 01 Dez    [Ver →]        │
└─────────────────────────────────────────────────────────────┘
```

> **Diferença vs. SUPER_ADMIN:** A consultora NÃO vê o filtro "Consultora" no topo. O ranking tem coluna "Ver Detalhe" que leva ao perfil individual da revendedora.

---

## Tela 4: Perfil da Revendedora `/admin/revendedoras/[id]`

> A consultora acessa esta tela pelo ranking (botão "Ver →") ou pela lista de Revendedoras.
> Mostra o desempenho individual de uma revendedora do seu grupo.

```
┌─────────────────────────────────────────────────────────────┐
│  ← Revendedoras    Perfil da Revendedora       [💬 WhatsApp]│
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  [Avatar]  Ana Silva                                │    │
│  │  Rank: 🥇 Ouro · 2.100 pts                         │    │
│  │  Desde: Mar 2024 · ── · Maleta ativa: #102         │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ── KPIs do Mês ────────────────────────────────────────   │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │ 💰 Faturado   │ │ 📦 Maletas   │ │ 🎯 Comissão  │        │
│  │ G$3.200.000  │ │ 2 fechadas   │ │ G$ 800.000   │        │
│  │ ↑ +18%       │ │ 1 ativa      │ │ (25%)        │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
│                                                              │
│  ── Histórico de Maletas ────────────────────────────────   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ #   │ Status           │ Vendas       │ Comissão  │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │ 102 │ ⏳ Ag. Conferência│ G$3.200.000│ G$ 800.000│   │
│  │ 101 │ ✅ Concluída       │ G$2.900.000│ G$ 725.000│   │
│  │ 099 │ ✅ Concluída       │ G$2.100.000│ G$ 525.000│   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ── Pontuação e Gamificação ─────────────────────────────    │
│  Nível: Ouro · 2.100 pts · Próximo: Diamante (4.000)       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ ████████████████████░░░░░░░░░░░░░░░░░░░░░░░ Ouro    │   │
│  └──────────────────────────────────────────────────────┘   │
│  🏆 Vendas completadas: 45 · 📸 Fotos compartilhadas: 28  │
│  ⭐ Mês sem atraso: 6 · 🎁 Brindes resgatados: 3         │
│                                                              │
│  ── Último Acerto ──────────────────────────────────────    │
│  Maleta #099 · Fechada em 10/12/2024 · G$ 2.100.000       │
│  [Ver Detalhe do Acerto →]                                  │
└─────────────────────────────────────────────────────────────┘
```

### RBAC
- **CONSULTORA**: vê apenas revendedoras do seu grupo (`colaboradora_id = session.colaboradoraId`)
- **SUPER_ADMIN**: vê qualquer revendedora + filtro por consultora no header

---

## Tela 5: Lista de Maletas (Consultora) `/admin/maletas`

> Igual à tela de maletas do admin, mas filtrada automaticamente pelo grupo da consultora.
> O filtro "Consultora" não aparece (pois só vê as suas).
> Botão de "Conferir" direto na lista quando status = `aguardando_revisao`.

```
┌─────────────────────────────────────────────────────────────┐
│  Maletas                                [+ Nova Maleta]      │
│                                                              │
│  [🔍 Buscar revendedora...]  [Status ▼]                     │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ #  │ Revendedora │ Status              │ Prazo    │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │102 │ Ana Silva   │⏳ AG. CONFERÊNCIA    │ 15/12/24 │   │
│  │    │                       [Conferir →]            │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │101 │ Joana Lima  │✅ CONCLUÍDA          │ 20/12/24 │   │
│  │    │                       [Ver →]                │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │099 │ Maria Góm. │⛔ ATRASADA — 3 dias  │ 10/12/24 │   │
│  │    │                       [Ver →]                │   │
│  └──────────────────────────────────────────────────────┘   │
│  Mostrando 1-15 de 15                          [< 1 >]      │
└─────────────────────────────────────────────────────────────┘
```

### Notificações (🔔 no header)

O ícone de sino no header mostra o número de maletas com `status = "aguardando_revisao"` do grupo da consultora. Ao clicar, abre um drawer lateral com:

```
┌──────────────────────────────────────┐
│  🔔 Maletas Pendentes               │
│                                       │
│  Maleta #102 · Ana Silva             │
│  Recebida em 12/12/2024              │
│  [Conferir →]                        │
│                                       │
│  Maleta #098 · Sofia Rodrigues       │
│  Recebida em 08/12/2024              │
│  [Conferir →]                        │
└──────────────────────────────────────┘
```

- Usa Supabase Realtime para atualização em tempo real
- Contagem inicial via SSR no layout (sem flash)
- Clique em "Conferir →" navega para `/admin/maletas/[id]/conferir`

### RBAC Maletas
- **CONSULTORA**: vê e cria maletas apenas para suas revendedoras; pode conferir (aprovar) apenas do seu grupo
- **SUPER_ADMIN**: vê todas; filtro por consultora disponível

---

## Tela 6: Solicitações de Brindes `/admin/solicitacoes`

> A consultora vê as solicitações de brindes das revendedoras do seu grupo e marca como entregue quando o brinde é entregue em mãos.

```
┌─────────────────────────────────────────────────────────────┐
│  Solicitações de Brindes                                    │
│                                                              │
│  ┌─ [Pendentes ●] [Entregues] ──────────────────────────┐  │
│  │                                                        │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │  🎁 Gargantilha Dourada                         │  │  │
│  │  │  500 pts · Ana Silva · Solicitado em 12/12/24   │  │  │
│  │  │  [Marcar como Entregue]                         │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  │                                                        │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │  🎁 Brincos Argola                              │  │  │
│  │  │  300 pts · Joana Lima · Solicitado em 08/12/24  │  │  │
│  │  │  [Marcar como Entregue]                         │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Ações
| Ação | Descrição |
|------|-----------|
| **Marcar como Entregue** | Muda `status` de `separado` para `entregue`; registra `entregue_em` e `entregue_por` |

### RBAC Solicitações
- **CONSULTORA**: vê apenas solicitações de suas revendedoras; pode marcar como entregue
- **SUPER_ADMIN**: vê todas; pode marcar como entregue ou cancelar

---

## Diferença de Visão: CONSULTORA vs. SUPER_ADMIN

| Funcionalidade | Consultora | Super Admin |
|---------------|-----------|-------------|
| Dashboard | Só suas métricas | Métricas globais |
| Analytics | Só seu grupo | Todos os grupos |
| Ranking | Só suas revendedoras | Todas, agrupado por consultora |
| Maletas | Só do seu grupo | Todas (filtro por consultora) |
| Conferir maleta | Só do seu grupo | Todas |
| Perfil revendedora | Só suas revendedoras | Qualquer |
| Extrato de comissão | Sua comissão | N/A |
| Solicitações brindes | Só suas revendedoras | Todas |
| Produtos, Categorias | ❌ Não vê | ✅ |
| Consultoras, Candidaturas | ❌ Não vê | ✅ |
| Gamificação, Config | ❌ Não vê | ✅ |
| Notif. Push | ❌ Não vê | ✅ |

---

## Componentes

| Componente | Tipo | Responsabilidade |
|-----------|------|-----------------|
| `MinhaContaPage` | Server | Perfil + cards de resumo |
| `EditarPerfilModal` | **Client** | Formulário de edição |
| `ExtratoComissoesPage` | Server | Tabela por mês |
| `DetalhesMesExpansivel` | **Client** | Expandir linha do mês |
| `AnalyticsPage` | Server | Todas as seções de analytics |
| `RankingToggle` | **Client** | Alternar critério do ranking |
| `EvolucaoChart` | **Client** | Gráfico de linha (Recharts ou Chart.js) |
| `SemMaletaAlert` | Server | Lista de revendedoras paradas |
| `RevendedoraPerfilPage` | Server | KPIs, histórico, gamificação |
| `SolicitacoesPage` | Server | Lista de brindes pendentes |
| `AdminAlertBell` | **Client** | Sino com badge + drawer de pendentes |

---

## Queries de Performance (Cuidado)

As queries de analytics podem ser pesadas. Estratégias:

1. **Cache de 5 minutos** no servidor para os dados do mês corrente
2. **`AnalyticsDiario`** já existe no schema — usar para o gráfico de evolução (pré-agregado)
3. **Paginação** no ranking (20 revendedoras por vez)

```ts
// Para o gráfico, usar AnalyticsDiario em vez de agrupar VendaMaleta
const evolucao = await prisma.analyticsDiario.findMany({
  where: {
    tipo: 'catalogo_revendedora',
    reseller: { colaboradora_id: session.colaboradoraId },
    data: { gte: inicioAno, lte: hoje },
  },
  orderBy: { data: 'asc' },
});
```