# SPEC — Admin: Analytics, Notificações Push (OneSignal) e Alertas de Devolução

**Rotas:**
- `/admin/analytics` — Dashboard de performance operacional (SUPER_ADMIN + CONSULTORA)
- `/admin/configuracoes/notificacoes` — Configuração OneSignal e templates de push (SUPER_ADMIN only)
- Widget de Alertas de Devolução — componente persistente no layout admin (todas as telas)

> **Dependências:** `SPEC_ADMIN_LAYOUT.md`, `PRD_OneSignal_PWA.md`, `SPEC_CRON_JOBS.md`, `SPEC_LOGGING_MONITORING.md`

---

## 1. Módulo: Analytics `/admin/analytics`

### 1.1 Visão Geral

Analytics operacional focado em **gestão de maletas e desempenho de revendedoras**. Não é um BI
completo — é um painel de decisão para consultoras e super admins acompanharem a saúde do negócio.

**Diferença de escopo por papel (RBAC):**
- **SUPER_ADMIN**: Vê métricas globais + breakdown por consultora
- **CONSULTORA**: Vê apenas suas revendedoras (`getResellerScope`)

---

### 1.2 Seções do Dashboard

#### KPIs de Topo (Cards)

| Métrica | Descrição | Cálculo |
|---------|-----------|---------|
| **Maletas Ativas** | Total com status `ativa` | `COUNT maletas WHERE status = 'ativa'` |
| **Total Devolvidas (mês)** | Fecho com conferência no mês corrente | `COUNT WHERE status = 'concluida' AND updated_at >= inicio_mes` |
| **Taxa de Atraso** | % de maletas que ficaram `atrasada` | `COUNT atrasadas / COUNT total × 100` |
| **Ticket Médio** | Valor médio das maletas ativas | `AVG maletas.valor_total WHERE status = 'ativa'` |
| **Revendedoras com Maleta** | Quantas têm maleta ativa agora | `COUNT DISTINCT maletas.reseller_id WHERE status = 'ativa'` |
| **Tempo Médio de Devolução** | Dias médios entre envio e conferência | `AVG (concluida.updated_at - ativa.created_at)` |

#### Gráfico 1: Fluxo de Maletas (últimos 30 dias)

```
Tipo: Line Chart — 3 séries
- Série 1: Maletas enviadas (criada → ativa) — cor: #35605a (verde)
- Série 2: Maletas devolvidas (concluída) — cor: #6677dd (azul)
- Série 3: Maletas atrasadas — cor: #e05c5c (vermelho)
Eixo X: Dias do mês (formato: "16/Abr")
Eixo Y: Quantidade
Periodicidade: pode ser alternado para 7d / 30d / 3m / 12m
```

#### Gráfico 2: Distribuição por Status Atual (Donut)

```
- Ativa (verde)
- Atrasada (vermelho)
- Ag. Conferência (amarelo)
- Concluída mês (azul/cinza)
```

#### Tabela: Top 10 Revendedoras por Volume

Colunas: Revendedora · Maletas Ativas · Valor em Maleta · Atrasos Históricos · Status Atual

#### Tabela: Alertas de Prazo (próximos 7 dias)

> Reutiliza a lógica do cron `check-maleta-prazo` — maletas com `data_limite < now + 7d`

Colunas: #Maleta · Revendedora · Consultora · Data Limite · Dias Restantes · Ação

#### Ranking: Produtos Mais Vendidos

> Análise do top 5 (expansível para top 10) de produtos por unidades vendidas dentro do período filtrado.

Colunas: Posição · Produto · Unidades Vendidas (barra progresso) · Valor Total

**Alertas embutidos:** badge `⚠ est. baixo` quando `produtos.estoque_atual <= produtos.estoque_minimo`.

---

### 1.3 Filtros

```
[Período: 30d ▾]  [Consultora: Todas ▾]  [Status: Todos ▾]  [Exportar CSV]
```

- **Período:** 7d / 30d / 3m / 12m / Personalizado
- **Consultora:** Apenas SUPER_ADMIN tem este filtro
- **Exportar CSV:** gera relatório com todas as maletas no período filtrado

---

### 1.4 Data Layer

```ts
// src/app/admin/analytics/page.tsx (Server Component)
async function getAnalyticsData(session: AdminSession, filters: AnalyticsFilters) {
  const scope = getResellerScope(session);
  const since = getDateSince(filters.period); // D-7, D-30, D-90, D-365

  const [maletas, kpis, topRevendedoras, alertasPrazo, produtosMaisVendidos] = await Promise.all([
    // Serie temporal (agrupado por dia)
    prisma.$queryRaw`
      SELECT
        DATE(created_at AT TIME ZONE 'America/Asuncion') AS dia,
        COUNT(*) FILTER (WHERE status = 'ativa')      AS enviadas,
        COUNT(*) FILTER (WHERE status = 'concluida')  AS devolvidas,
        COUNT(*) FILTER (WHERE status = 'atrasada')   AS atrasadas
      FROM maletas
      WHERE created_at >= ${since}
        ${scope.colaboradora_id ? Prisma.sql`AND colaboradora_id = ${scope.colaboradora_id}` : Prisma.empty}
      GROUP BY dia ORDER BY dia
    `,
    // KPIs
    prisma.maleta.aggregate({
      where: { ...scope, status: 'ativa' },
      _count: { id: true },
      _avg: { valor_total: true },
    }),
    // Top revendedoras
    prisma.maleta.groupBy({
      by: ['reseller_id'],
      where: { ...scope, created_at: { gte: since } },
      _count: { id: true },
      _sum: { valor_total: true },
      orderBy: { _sum: { valor_total: 'desc' } },
      take: 10,
    }),
    // Alertas de prazo
    prisma.maleta.findMany({
      where: {
        ...scope,
        status: 'ativa',
        data_limite: { lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      },
      include: { reseller: true, colaboradora: true },
      orderBy: { data_limite: 'asc' },
    }),
    // Top produtos mais vendidos no período
    prisma.$queryRaw`
      SELECT
        p.id,
        p.nome,
        p.categoria_id,
        p.estoque_atual,
        p.estoque_minimo,
        SUM(mi.quantidade)          AS unidades_vendidas,
        SUM(mi.quantidade * mi.preco_unitario) AS valor_total
      FROM maleta_itens mi
      JOIN produtos p ON p.id = mi.produto_id
      JOIN maletas m  ON m.id = mi.maleta_id
      WHERE m.created_at >= ${since}
        ${scope.colaboradora_id ? Prisma.sql`AND m.colaboradora_id = ${scope.colaboradora_id}` : Prisma.empty}
      GROUP BY p.id, p.nome, p.categoria_id, p.estoque_atual, p.estoque_minimo
      ORDER BY unidades_vendidas DESC
      LIMIT 10
    `,
  ]);

  return { maletas, kpis, topRevendedoras, alertasPrazo, produtosMaisVendidos };
}
```

---

### 1.5 Sidebar — Posição no Menu

Adicionar entre Dashboard e Catálogo:

```
🏠 Dashboard
📊 Analytics       ← NEW
── CATÁLOGO ──
📦 Produtos
🏷️  Categorias
── OPERACIONAL ──
👜 Maletas
...
```

---

### 1.6 Seção: Produtos Mais Vendidos

#### Layout

A seção inferior do Analytics é dividida em **duas colunas side-by-side**:

```
┌─── Top Revendedoras ──────────┬─── Produtos Mais Vendidos ────┐
│ #1 María Flores  8  G$29.6M  │ 📊 30d            ver catálogo│
│    ████████████████ Ativa     │                                │
│ #2 Sofía Gómez   5  G$18.5M  │ 1  Brincos Argola Rosé        │
│    █████████████  Ativa       │    ████████████████ 47 un.    │
│ #3 Lucía Martínez 4  G$14.1M │    G$ 41.8K                   │
│    ███████████   Atrasada     │ 2  Gargantilha Dourada Slim   │
│                               │    ████████████ 38 un.        │
│                               │    G$ 47.5K                   │
│                               │ 3  Pulseira Charm Collection  │
│                               │    ████████  31 un.           │
│                               │    G$ 34.1K                   │
│                               │ 4  Ring Ouro Rosé [⚠ est.baixo]│
│                               │    ██████   24 un. G$ 42.7K  │
│                               │ 5  Colar Borboleta Vintage    │
│                               │    █████  19 un. G$ 41.8K    │
└───────────────────────────────┴───────────────────────────────┘
```

#### Regras de Negócio

- **Período:** herda do filtro global de período (7d / 30d / 3m / 12m)
- **Escopo RBAC:** consultoras veem apenas os produtos de suas maletas
- **Badge `⚠ est. baixo`:** exibido quando `produto.estoque_atual <= produto.estoque_minimo`
- **Link "ver catálogo →":** navega para `/admin/produtos` com o mesmo filtro de período
- **Barra de progresso:** comprimento relativo ao produto #1 (100% = mais vendido)
- **Coluna Valor Total:** soma de `maleta_itens.quantidade × maleta_itens.preco_unitario`

#### Campos exibidos por produto

| Campo | Origem |
|-------|--------|
| Posição (#N) | Calculado no SELECT |
| Nome do produto | `produtos.nome` |
| Unidades vendidas | `SUM(maleta_itens.quantidade)` |
| Valor total gerado | `SUM(qtd × preco_unitario)` |
| Alerta estoque | `estoque_atual <= estoque_minimo` |

---

## 2. Módulo: Configurações de Notificações `/admin/configuracoes/notificacoes`

### 2.1 Visão Geral

Painel para **SUPER_ADMIN** configurar:
1. Conexão com OneSignal (testar e verificar integração)
2. Templates de push notifications enviados automaticamente
3. Controle de quais tipos de notificação estão ativos
4. Histórico de notificações enviadas

> **Importante:** Não substitui o painel OneSignal — complementa com controle operacional.
> A integração técnica está em `PRD_OneSignal_PWA.md`.

---

### 2.2 Sub-seções

#### Seção A: Status da Integração

```
┌─── OneSignal Integration ──────────────────────────────────┐
│  ● Conectado        App ID: xxxxxxxx-xxxx-xxxx-xxxx        │
│  Último envio: 16/04/2026 às 08:02 — 83 devices           │
│                                                             │
│  Dispositivos opt-in: 147                                  │
│  Push entregues (30d): 1.284     Taxa entrega: 97.3%       │
│                                                [Testar →]  │
└─────────────────────────────────────────────────────────────┘
```

**Botão "Testar":** Envia uma notificação push de teste para o device do admin logado.

```ts
// Server Action
async function enviarPushTeste(adminId: string) {
  return fetch('https://onesignal.com/api/v1/notifications', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${process.env.ONESIGNAL_REST_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      app_id: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
      include_aliases: { external_id: [adminId] },
      target_channel: 'push',
      contents: { es: '✅ Notificação de teste funcionando corretamente.' },
      data: { tipo: 'teste' },
    }),
  });
}
```

#### Seção B: Templates de Notificação Automática

Tabela de todos os tipos de push gerados pelo sistema:

| # | Tipo | Trigger | Template | Ativo |
|---|------|---------|----------|-------|
| 1 | `prazo_proximo_d3` | Cron D-3 | "⚠️ Tu consignación vence en 3 días..." | [toggle] |
| 2 | `prazo_proximo_d1` | Cron D-1 | "‼️ ¡Tu consignación vence mañana!..." | [toggle] |
| 3 | `maleta_atrasada` | Cron marcar-atrasadas | "🔴 Tu consignación está atrasada..." | [toggle] |
| 4 | `maleta_devolvida_admin` | Ação da revendedora | "📦 Nueva devolución recibida de..." | [toggle] |
| 5 | `nova_maleta_revendedora` | Admin cria maleta | "🎁 Tu nueva consignación está lista..." | [toggle] |
| 6 | `brinde_disponivel` | Admin aprova brinde | "🎁 ¡Tu canje de premio fue aprobado!..." | [toggle] |
| 7 | `pontos_concedidos` | Ação gamificação | "⭐ ¡Ganaste {N} puntos!..." | [toggle] |

**Cada template pode ser editado:**

```
Modal: Editar Template
──────────────────────────────────────
Tipo: prazo_proximo_d3      [Ativo ✓]
──────────────────────────────────────
Título (ES):
[⚠️ Aviso de Vencimiento___________]

Mensagem (ES):
[Tu consignación #{maleta_id} vence en]
[{dias_restantes} días. ¡No olvides  ]
[devolver a tiempo!                   ]

Variáveis disponíveis:
{maleta_id}  {dias_restantes}  {nome_revendedora}

[Cancelar]  [Salvar Template]
──────────────────────────────────────
```

**Modelo dos templates (tabela no banco):**

```prisma
model NotificacaoTemplate {
  id        String   @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  tipo      String   @unique // 'prazo_proximo_d3', 'maleta_atrasada', etc.
  titulo_es String
  body_es   String   // Suporta {variáveis}
  ativo     Boolean  @default(true)
  updated_at DateTime @updatedAt

  @@map("notificacao_templates")
}
```

#### Seção C: Histórico de Notificações

```
Filtros: [Tipo ▾]  [Período ▾]  [Status: Todos ▾]

┌─────────────────────────────────────────────────────────────┐
│ Horário          │ Tipo              │ Destinatários │ Status │
├─────────────────────────────────────────────────────────────┤
│ 16/04 08:02      │ prazo_proximo_d3  │ 14 rev.       │ ✅ Env. │
│ 16/04 01:01      │ maleta_atrasada   │ 3 rev.        │ ✅ Env. │
│ 15/04 08:01      │ prazo_proximo_d3  │ 12 rev.       │ ✅ Env. │
│ 14/04 14:23      │ nova_maleta       │ 1 rev.        │ ✅ Env. │
│ 13/04 08:00      │ prazo_proximo_d1  │ 2 rev.        │ ⚠️ Falha│
└─────────────────────────────────────────────────────────────┘
```

**Modelo de log:**

```prisma
model NotificacaoLog {
  id            String   @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  tipo          String
  reseller_ids  String[] // Array de UUIDs destinatários
  total_enviado Int
  total_falha   Int      @default(0)
  onesignal_id  String?  // ID retornado pela API OneSignal
  payload       Json     // Snapshot do payload enviado
  created_at    DateTime @default(now()) @db.Timestamptz()

  @@map("notificacao_logs")
  @@index([tipo, created_at])
}
```

---

### 2.3 Rota e RBAC

```
/admin/configuracoes/notificacoes   ← SUPER_ADMIN only
```

Middleware: incluir em `SUPER_ADMIN_ONLY` array no `src/middleware.ts`:

```ts
const SUPER_ADMIN_ONLY = [
  '/admin/consultoras',
  '/admin/produtos',
  '/admin/categorias',
  '/admin/configuracoes/notificacoes', // ← novo
];
```

---

### 2.4 Atualização da Sidebar

```
── CONFIG ──
⭐ Gamificação
💰 Comissões
📄 Contratos
🔔 Notificações Push   ← NEW (SUPER_ADMIN only)
🎁 Brindes
```

---

## 3. Sistema de Alertas de Devolução — Acesso Rápido

### 3.1 Problema

Quando uma revendedora clica "Devolver" no app, a maleta passa para `aguardando_revisao`.
O admin precisa saber **imediatamente** para que possa agendar ou fazer a conferência física.

### 3.2 Solução: Notification Bell Persistente no Header Admin

**Componente**: `<AdminAlertBell />` — inserido no `AdminHeader` em todas as telas.

```
Header admin:
┌──────────────────────────────────────────────────────────────┐
│  [Breadcrumb]                    [🔔 3]   [👤 Maria Santos ▾]│
└──────────────────────────────────────────────────────────────┘

Ícone 🔔 com badge numérico (número de maletas em aguardando_revisao)
```

**Ao clicar no sino** → Drawer lateral desliza da direita:

```
┌──── Devoções Pendentes ──── [X] ┐
│                                  │
│  3 maletas aguardando conferência│
│  ──────────────────────────────  │
│                                  │
│  📦 Maleta #102                  │
│  Lucía Ramírez • 14/04           │
│  [Conferir →]                    │
│  ──────────────────────────────  │
│                                  │
│  📦 Maleta #098                  │
│  Ana González • 15/04            │
│  [Conferir →]                    │
│  ──────────────────────────────  │
│                                  │
│  📦 Maleta #091                  │
│  Carmen Díaz • 16/04             │
│  [Conferir →]                    │
│                                  │
│  [Ver todas as maletas]          │
└──────────────────────────────────┘
```

**[Conferir →]** → navega direto para `/admin/maletas/[id]/conferir`

---

### 3.3 Implementação Técnica

#### Polling/Realtime da contagem

Duas opções — **opção recomendada: Supabase Realtime**

```ts
// src/components/admin/alert-bell.tsx — Client Component
'use client';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';

export function AdminAlertBell({ initialCount, scope }: Props) {
  const [count, setCount] = useState(initialCount);
  const [maletas, setMaletas] = useState<MaletaAlerta[]>([]);
  const [open, setOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    // Supabase Realtime: escutar mudanças na tabela maletas
    const channel = supabase
      .channel('admin-alert-bell')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'maletas',
          filter: 'status=eq.aguardando_revisao',
        },
        (payload) => {
          // Refetch da contagem ao detectar mudança
          fetchCount();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchCount() {
    const res = await fetch('/api/admin/alertas/count');
    const data = await res.json();
    setCount(data.count);
  }

  async function fetchMaletas() {
    const res = await fetch('/api/admin/alertas/maletas');
    const data = await res.json();
    setMaletas(data.maletas);
  }

  return (
    <>
      <button onClick={() => { setOpen(true); fetchMaletas(); }}>
        🔔 {count > 0 && <span className="badge">{count}</span>}
      </button>
      {open && <AlertDrawer maletas={maletas} onClose={() => setOpen(false)} />}
    </>
  );
}
```

#### API Route de contagem (SSR-safe)

```ts
// src/app/api/admin/alertas/count/route.ts
export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const scope = getResellerScope(session);
  const count = await prisma.maleta.count({
    where: { ...scope, status: 'aguardando_revisao' },
  });

  return Response.json({ count });
}
```

#### Integração no Layout Admin

```tsx
// src/app/admin/layout.tsx
export default async function AdminLayout({ children }) {
  const session = await getAdminSession();
  const scope = getResellerScope(session);

  // Contagem inicial SSR (sem waterfall)
  const alertCount = await prisma.maleta.count({
    where: { ...scope, status: 'aguardando_revisao' },
  });

  return (
    <div className="flex h-screen">
      <Sidebar role={session.role} />
      <main className="flex-1 overflow-auto bg-[#0a0a0a]">
        <AdminHeader session={session} alertCount={alertCount} />
        {children}
      </main>
    </div>
  );
}
```

---

### 3.4 Notificação Push para o Admin ao Receber Devolução

Além do sino visual, o admin (SUPER_ADMIN e CONSULTORA) deve receber **push notification**
quando uma maleta do seu escopo muda para `aguardando_revisao`.

**Trigger:** Server Action `sinalizarDevolucao` chamada pela revendedora no app.

```ts
// src/actions/maleta.ts
export async function sinalizarDevolucao(maletaId: string) {
  // 1. Atualizar status
  const maleta = await prisma.maleta.update({
    where: { id: maletaId },
    data: { status: 'aguardando_revisao', sinalizada_em: new Date() },
    include: {
      reseller: { select: { name: true } },
      colaboradora: { select: { id: true } },
    },
  });

  // 2. Log OneSignal para a consultora responsável
  await fetch('https://onesignal.com/api/v1/notifications', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${process.env.ONESIGNAL_REST_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      app_id: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
      include_aliases: { external_id: [maleta.colaboradora.id] },
      target_channel: 'push',
      headings: { es: '📦 Nueva Devolución Recibida' },
      contents: {
        es: `${maleta.reseller.name} devolvió la maleta #${maleta.id}. ¡Programa la conferencia!`,
      },
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/admin/maletas/${maleta.id}/conferir`,
      data: { maleta_id: maleta.id, tipo: 'maleta_devolvida_admin' },
    }),
  });

  // 3. Registrar no log
  await prisma.notificacaoLog.create({
    data: {
      tipo: 'maleta_devolvida_admin',
      reseller_ids: [maleta.reseller_id],
      total_enviado: 1,
      payload: { maleta_id: maletaId },
    },
  });

  revalidatePath('/admin/maletas');
  revalidatePath('/admin');
}
```

---

## 4. Atualização da Estrutura de Rotas

```
src/app/admin/
├── analytics/
│   └── page.tsx                     ← [NEW] Dashboard analytics
│
├── configuracoes/
│   ├── notificacoes/
│   │   └── page.tsx                 ← [NEW] Config OneSignal + templates
│   ├── commission-tiers/page.tsx    ← Existente (mover de /admin/commission-tiers)
│   └── contratos/page.tsx           ← Existente (mover de /admin/contratos)
│
├── ... (rotas existentes)
```

> ⚠️ **Atenção:** `/admin/commission-tiers` e `/admin/contratos` devem ser movidos para
> dentro de `/admin/configuracoes/` para melhor organização, com redirecionamentos 308.

---

## 5. Sidebar Final (estado atualizado completo)

```
🏠 Dashboard
📊 Analytics              ← NEW

── CATÁLOGO ──            ← SUPER_ADMIN only
📦 Produtos
🏷️  Categorias

── OPERACIONAL ──
👜 Maletas   [badge alertas]
👥 Revendedoras
👤 Consultoras            ← SUPER_ADMIN only

── CONFIG ──
⭐ Gamificação
💰 Comissões
🔔 Notificações Push      ← NEW (SUPER_ADMIN only)
📄 Contratos
🎁 Brindes
```

---

## 6. Resumo de Dependências e Specs Afetadas

| Spec | Alteração necessária |
|------|---------------------|
| `SPEC_ADMIN_LAYOUT.md` | Adicionar `/admin/analytics`, `/admin/configuracoes/notificacoes`, alert bell no header, sidebar atualizada |
| `SPEC_CRON_JOBS.md` | Adicionar cron D-1, D-3 de prazo; adicionar push para admin em devolução |
| `SPEC_DATABASE.md` | Adicionar `NotificacaoTemplate`, `NotificacaoLog` |
| `SPEC_ENVIRONMENT_VARIABLES.md` | Já OK — OneSignal vars mapeadas |
| `PRD_OneSignal_PWA.md` | Complementar com caso de uso admin (notificações para consultoras) |
