# SPEC — Mi Desempeño (Analytics da Revendedora)

## Objetivo
Fornecer à revendedora indicadores de desempenho da sua vitrine pública e das vendas (acessos, visitantes únicos, cliques em WhatsApp, peças vendidas), com comparação ao período anterior e ranking de produtos populares.

## Atores
- **Revendedora** — consulta seus próprios analytics.
- **Sistema de tracking** — registra eventos em `AnalyticsAcesso` (acessos, cliques).
- **Cron diário** — consolida dados em `AnalyticsDiario` (ver `SPEC_CRON_JOBS.md`).

## Fluxo
1. Revendedora acessa `/app/desempenho` e vê 4 cards de métricas da semana atual.
2. Pode trocar o período via dropdown: Esta Semana / Este Mes / Últimos 30 días / Este Año.
3. Ao trocar, a tela re-busca dados e recalcula tendência (% vs período anterior equivalente).
4. Abaixo dos cards, gráfico de visitas diárias por dia da semana.
5. Lista de top produtos mais populares com imagem, visitas e vendidos.

## Regras de negócio
- Métricas baseadas em `AnalyticsAcesso` filtradas por `reseller_id` e janela de tempo.
- "Visitantes únicos" = `COUNT(DISTINCT visitor_id)` no período.
- Tendência: `((atual − anterior) / anterior) × 100`; verde se positiva, vermelho se negativa, "Nuevo" se período anterior = 0.
- Ranking de produtos populares: top 10 por acessos.
- Gráfico diário usa `AnalyticsDiario` já consolidado (não consulta eventos crus).

## Edge cases
- Período anterior com dados zerados → exibe "Nuevo" em vez de porcentagem.
- Sem acessos no período atual → cards zerados, gráfico vazio com mensagem.
- Revendedora recém-cadastrada (< 7 dias) → somente dados disponíveis no período real.
- `visitor_id` ausente em eventos antigos → ignorar do cálculo de únicos.

## Dependências
- `SPEC_VITRINE_PUBLICA.md` — origem dos eventos de acesso.
- `SPEC_CRON_JOBS.md` — consolidação diária.
- `SPEC_DATABASE.md` — modelos `AnalyticsAcesso`, `AnalyticsDiario`, `VendaMaleta`.
- `SPEC_ADMIN_ANALYTICS_NOTIFICATIONS.md` — visão agregada do admin.

---

## Detalhes técnicos / Referência

**Ruta:** `/app/desempenho`  
**Archivo:** `src/app/app/desempenho/page.tsx`  
**Tipo:** Client Component (Time Range interactivo)

---

## Layout

```
┌─────────────────────────────────────┐
│  ← Mi Desempeño                     │
│  Período:          [Esta Semana ▼]  │
│                                     │
│  ┌──────────────┐ ┌──────────────┐  │
│  │Accesos Cat.  │ │Visit. Únicos │  │
│  │  2.450       │ │    875       │  │
│  │  ↑ +12%      │ │  ↑ +12%      │  │
│  └──────────────┘ └──────────────┘  │
│  ┌──────────────┐ ┌──────────────┐  │
│  │Clics WhatsApp│ │Pzas Vendidas │  │
│  │  189         │ │    42        │  │
│  │  ↑ +12%      │ │  ↑ +12%      │  │
│  └──────────────┘ └──────────────┘  │
│                                     │
│  Visitas Diarias                    │
│  [Gráfico de barras L/M/X/J/V/S/D] │
│  Tooltip: "Miércoles: 150 visitas"  │
│                                     │
│  Productos Más Populares            │
│  [img] Collar    V:560  Vend:12     │
│  [img] Anillo    V:560  Vend:12     │
│  [img] Aretes    V:420  Vend:8      │
└─────────────────────────────────────┘
```

---

## Rango de Tiempo — Opciones

| Label | Ventana de tiempo |
|-------|------------------|
| Esta Semana | 7 días anteriores a hoy |
| Este Mes | Mes civil vigente (1º al último día) |
| Últimos 30 días | Rolling 30 días |
| Este Año | Año civil vigente |

Al cambiar el período → rehace llamada a `getMetricasDesempenho()`.

---

## Fuentes de Datos

| Métrica | Tabla | Query |
|---------|-------|-------|
| Accesos al Catálogo | `AnalyticsAcesso` | `COUNT WHERE tipo_evento = 'catalogo_revendedora' AND reseller_id AND created_at IN [rango]` |
| Visitantes Únicos | `AnalyticsAcesso` | `COUNT(DISTINCT visitor_id) WHERE reseller_id AND created_at IN [rango]` |
| Clics en WhatsApp | `AnalyticsAcesso` | `COUNT WHERE tipo_evento = 'clique_whatsapp' AND reseller_id AND created_at IN [rango]` |
| Piezas Vendidas | `VendaMaleta` | `COUNT(*) WHERE maleta.reseller_id AND created_at IN [rango]` |
| Visitas Diarias | `AnalyticsDiario` | `WHERE reseller_id AND data IN [rango] ORDER BY data` |
| Productos Populares | `AnalyticsAcesso` | `GROUP BY produto_id ORDER BY COUNT DESC LIMIT 10` |

> Schema de `AnalyticsAcesso` y `AnalyticsDiario` definido en `SPEC_DATABASE_FINAL.md`.

---

## Cálculo de Tendencia (↑+12%)

```ts
// Comparación con período anterior equivalente
const variacion_pct = ((actual - anterior) / anterior) * 100;

// Visualización:
// variacion > 0  → "↑ +12%" (verde)
// variacion < 0  → "↓ -5%"  (rojo)
// variacion = 0  → "-"       (neutro)
// anterior = 0   → "Nuevo"   (sin comparación posible)
```

---

## Server Action: `getMetricasDesempenho(resellerId, rango)`

```ts
type TimeRange = 'semana' | 'mes' | '30dias' | 'anio';

async function getMetricasDesempenho(resellerId: string, rango: TimeRange) {
  const { start, end, prevStart, prevEnd } = getDateRange(rango);

  const [actual, anterior, grafico, productos] = await Promise.all([
    getMetricasPeriodo(resellerId, start, end),
    getMetricasPeriodo(resellerId, prevStart, prevEnd), // para calcular tendencia
    getVisitasDiarias(resellerId, start, end),
    getProductosPopulares(resellerId, start, end),
  ]);

  return { actual, anterior, grafico, productos };
}
```

---

## Gráfico de Barras (Visitas Diarias)

- **Librería:** `recharts` (`BarChart`) — Client Component
- **Eje X:** días abreviados (L, M, X, J, V, S, D) o fechas según rango
- **Tooltip** al toque: `"Miércoles: 150 visitas"`
- **Color:** gradiente verde (`#35605a` → `#a8d5c2`)

```tsx
<BarChart data={grafico}>
  <Bar dataKey="visitas" fill="url(#greenGradient)" radius={[4,4,0,0]} />
  <Tooltip content={<CustomTooltip />} />
  <XAxis dataKey="dia_abrev" />
</BarChart>
```

---

## Componentes

| Componente | Tipo | Responsabilidad |
|-----------|------|----------------|
| `DesempenhoPage` | **Client** | Orquesta Time Range + búsqueda + renderizado |
| `TimeRangeSelector` | **Client** | Dropdown de selección de período |
| `MetricCardTrend` | **Client** | Card con valor + indicador de tendencia coloreado |
| `VisitasDiariasChart` | **Client** | recharts BarChart con tooltip personalizado |
| `ProductosPopularesList` | Server | Lista de productos calculada en render |
