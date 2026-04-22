# SPEC — Dashboard (Inicio) da Revendedora

## Objetivo
Apresentar à revendedora logada um painel com métricas do mês (faturamento, ganhos, peças vendidas, pontos), status da maleta ativa e progresso do tier de comissão mensal.

## Atores
- **Revendedora** — visualiza suas próprias métricas.
- **Sistema de gamificação** — calcula rank (Bronce/Plata/Oro/Diamante) por pontos históricos.
- **Sistema de comissão** — calcula tier atual com base no faturamento do mês.

## Fluxo
1. Revendedora autenticada acessa `/app`.
2. Server Component carrega em paralelo: métricas mensais, maleta ativa, lista de `CommissionTier` e rank atual.
3. Renderiza header (avatar, nome, badge de rank, pontos), 4 cards de métrica e seção de consignação com pills do tier.
4. Cards "Ver más" levam a telas de detalhe (análise e consignações).

## Regras de negócio
- Métricas (facturado, ganancia, peças) são do **mês civil vigente**; pontos são saldo histórico total.
- Rank é calculado sobre pontos **históricos** — pontos não são resetados.
- Tier atual destaca-se nas pills; tiers alcançados ficam em cor sólida, próximos ficam cinza.
- Texto auxiliar mostra quanto falta para o próximo tier; se já está no máximo, exibe mensagem de parabéns.
- Apenas uma maleta ativa por revendedora é considerada; mostra dias restantes até `data_limite`.

## Edge cases
- Revendedora sem maleta ativa → seção de consignação mostra CTA para solicitar maleta.
- Faturamento zero no mês → pill no tier base; mostra meta do primeiro tier.
- Revendedora em tier máximo → oculta texto "faltan X para próximo tier".
- Pontos abaixo do primeiro umbral → rank exibido como Bronce.
- Maleta vencida (dias restantes ≤ 0) → destacar urgência visual.

## Dependências
- `SPEC_MALETA.md` — dados de `maleta` e `maleta_item`.
- `SPEC_ADMIN_GAMIFICACAO.md` — tabelas `NivelRegra` e `CommissionTier`.
- `SPEC_DESEMPENHO.md` — detalhamento das métricas mensais.
- `src/lib/gamificacao.ts` — `getRankAtual`, `computeCommissionPct`.

---

## Detalhes técnicos / Referência

**Ruta:** `/app`  
**Archivo:** `src/app/app/page.tsx`  
**Tipo:** Server Component + Client Islands

---

## Layout

```
┌─────────────────────────────────────┐
│  [Avatar]  Hola {nombre}  [RankBadge] [pts]  │
├─────────────────────────────────────┤
│  Análisis                  Ver más  │
│  ┌──────────────┐ ┌──────────────┐  │
│  │ 💰 Facturado │ │ 💎 Mi Ganancia│  │
│  │ G$ 200.000   │ │ G$ 100.000  │  │
│  └──────────────┘ └──────────────┘  │
│  ┌──────────────┐ ┌──────────────┐  │
│  │ 👁 Pzas vend.│ │ ⭐ Puntos    │  │
│  │     3        │ │    850       │  │
│  └──────────────┘ └──────────────┘  │
├─────────────────────────────────────┤
│  Mis Consignaciones         Ver más │
│  ┌─── Consignación Actual ────────┐  │
│  │ [En proceso]  Faltan 3 días    │  │
│  │ Nivel de Comisión Mensual       │  │
│  │ [20%][25%][30%][35%][40%]      │  │
│  │ Faltan G$ 800.000 para 30%     │  │
│  └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ [Inicio] [Catálogo] [Consig.] [Más] │
└─────────────────────────────────────┘
```

---

## Datos Necesarios

| Dato | Fuente | Cálculo |
|------|--------|---------|
| `faturamento_mes` | `SUM(maleta.valor_total_vendido)` | Mes civil vigente |
| `ganhos_mes` | `SUM(maleta.valor_comissao_revendedora)` | Mes civil vigente |
| `pecas_vendidas_mes` | `SUM(maleta_item.quantidade_vendida)` | Mes civil vigente |
| `pontos_saldo` | `SUM(pontos_extrato.pontos) WHERE reseller_id` | Histórico total |
| `maleta_ativa` | `maleta WHERE status = 'ativa' AND reseller_id` | — |
| `dias_restantes` | `maleta.data_limite - TODAY()` | Calculado en server |
| `tier_atual` | `computeCommissionPct(faturamento_mes)` | Basado en CommissionTier |
| `falta_para_proximo_tier` | `proximo_tier.min_sales_value - faturamento_mes` | Calculado en server |
| `rank_atual` | `getRankAtual(resellerId)` | Puntos históricos vs NivelRegra |

---

## Badge de Rango

El badge (Bronce/Plata/Oro/Diamante) se calcula basado en los puntos acumulados históricamente — nunca se resetean.

| Rango | Puntos mínimos | Color |
|-------|---------------|-------|
| Bronce | 0 | `#CD7F32` |
| Plata | 1.000 | `#C0C0C0` |
| Oro | 5.000 | `#FFD700` |
| Diamante | 15.000 | `#B9F2FF` |

> Umbrales configurables por admin vía tabla `NivelRegra`. Ver `SPEC_ADMIN_GAMIFICACAO.md`.

---

## Pills de Comisión Mensual

- Renderiza todos los `CommissionTier` ordenados por `min_sales_value ASC`
- Pills **antes del tier actual**: color primario (`#35605a`) sólido
- Pill **del tier actual**: color primario + borde destacado
- Pills **después del tier actual**: gris/deshabilitado
- Texto debajo: `"Faltan G$ {valor} para la comisión del {siguiente}%"`
- Si ya está en el tier máximo: `"¡Estás en el nivel máximo! 🎉"`

---

## Flujo de Datos

```ts
// src/app/app/page.tsx
export default async function AppDashboard() {
  const session = await getServerSession();
  const resellerId = session.resellerId;

  const [metricas, maletaAtiva, tiers, rank] = await Promise.all([
    getMetricasMensais(resellerId),
    getMaletaAtiva(resellerId),
    getAllCommissionTiers(),
    getRankAtual(resellerId), // src/lib/gamificacao.ts
  ]);

  return (
    <>
      <RevendedoraHeader nombre={session.nombre} rank={rank} puntos={metricas.pontos} />
      <SeccionAnalisis metricas={metricas} />
      <SeccionConsignacion maleta={maletaAtiva} tiers={tiers} facturado={metricas.faturamento_mes} />
    </>
  );
}
```

---

## Componentes

| Componente | Tipo | Responsabilidad |
|-----------|------|----------------|
| `DashboardPage` | Server | Orquestador — busca datos en paralelo |
| `RevendedoraHeader` | Server | Avatar + nombre + RankBadge + puntos |
| `RankBadge` | Server | Badge de color con ícono y nombre del nivel |
| `MetricCard` | Server | Ícono + label + valor formateado en Gs |
| `CommissionPills` | **Client** | Pills interactivas con animación de progreso |
| `ConsignacionActualCard` | Server | Resumen de la consignación activa + días restantes |
