# SPEC — Pantalla: Cómo Ganar Puntos (Progreso)

**Ruta:** `/app/progreso`  
**Archivo:** `src/app/app/progreso/page.tsx`  
**Tipo:** Server Component + Client Island (barra de progreso)

---

## Layout

```
┌─────────────────────────────────────┐
│  Cómo Ganar Puntos   [15.400 pts]  │
│                                     │
│  ┌── Compartir Catálogo ──────────┐  │
│  │ [📤]                +50 pts   │  │
│  │ ████████░░  2/5 hoy           │  │
│  └────────────────────────────────┘ │
│  ┌── Meta Mensual Alcanzada ──────┐  │
│  │ [🏆]                +100 pts  │  │
│  │ [Ir →]                        │  │
│  └────────────────────────────────┘ │
│  ┌── Venta en Consignación ───────┐  │
│  │ [🛍️]               +50 pts    │  │
│  │ [Ir →]                        │  │
│  └────────────────────────────────┘ │
│  ┌── Devolución a Tiempo ─────────┐  │
│  │ [⏱️]                +30 pts   │  │
│  │ [Ir →]                        │  │
│  └────────────────────────────────┘ │
│  ┌── Actualizar Perfil ───────────┐  │
│  │ [👤]                +20 pts   │  │
│  │ ✓ Completado                  │  │
│  └────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## Mapeo: UI → Base de Datos → Código

El seed en `prisma/seed-gamificacao.ts` define las reglas reales. La pantalla muestra los nombres de `GamificacaoRegra.nome`.

| Nombre UX | `acao` en BD | Puntos | Tipo | Límite | Botón |
|-----------|-------------|--------|------|--------|-------|
| Compartir Catálogo | `compartilhou_catalogo` | +50 | `diario` | 5x/día | Barra de progreso |
| Meta Mensual Alcanzada | `meta_mensal` | +100 | `mensal` | 1x/mes | [Ir →] `/app/maleta` |
| Venta en Consignación | `venda_maleta` | +50 | `por_evento` | Ilimitado | [Ir →] `/app/maleta` |
| Devolución a Tiempo | `devolucao_prazo` | +30 | `por_evento` | 1x/consig. | [Ir →] automático |
| Actualizar Perfil | `perfil_completo` | +20 | `unico` | 1 vez total | ✓ Completado |
| Primer Acceso | `primeiro_acesso` | +20 | `unico` | 1 vez total | ✓ Completado |
| Consignación Completa | `maleta_completa` | +200 | `por_evento` | 1x/consig. | automático |

---

## Estados Visuales de cada Tarea

| Estado | Visual | Condición |
|--------|--------|-----------|
| `disponible` | Botón "[Ir →]" verde | No completada, disponible hoy |
| `en_progreso` | Barra de progreso `X/Y hoy` | `tipo='diario'` con progreso parcial |
| `completado_hoy` | Barra llena + "Límite alcanzado" | `progreso_hoy >= limite_diario` |
| `completado_siempre` | "✓ Completado" + gris | `tipo='unico'` ya realizada |

---

## Datos Necesarios

```ts
// src/app/app/progreso/page.tsx
export default async function ProgresoPage() {
  const resellerId = session.resellerId;
  const hoy = startOfDay(new Date());

  const regras = await prisma.gamificacaoRegra.findMany({
    where: { ativo: true },
    orderBy: { ordem: 'asc' },
  });

  const progressoPorRegra = await Promise.all(
    regras.map(async (regra) => {
      // Conteo del día para reglas diarias
      const progreso_hoy = await prisma.pontosExtrato.count({
        where: {
          reseller_id: resellerId,
          descricao: regra.acao,
          created_at: { gte: hoy },
        },
      });

      // Conteo total para reglas únicas
      const progreso_total = await prisma.pontosExtrato.count({
        where: { reseller_id: resellerId, descricao: regra.acao },
      });

      return {
        ...regra,
        progreso_hoy,
        progreso_total,
        completado: regra.tipo === 'unico'
          ? progreso_total >= 1
          : progreso_hoy >= (regra.limite_diario ?? Infinity),
      };
    })
  );

  const totalPuntos = await prisma.pontosExtrato.aggregate({
    where: { reseller_id: resellerId },
    _sum: { pontos: true },
  });

  return <ProgresoView reglas={progressoPorRegra} totalPuntos={totalPuntos._sum.pontos ?? 0} />;
}
```

---

## Schema del `GamificacaoRegra`

Ver `SPEC_DATABASE_FINAL.md` — modelo `GamificacaoRegra` (campos completos incluidos).

---

## Componentes

| Componente | Tipo | Responsabilidad |
|-----------|------|----------------|
| `ProgresoPage` | Server | Busca reglas + progreso de cada una |
| `TareaCard` | Server | Ícono + label + puntos + CTA contextual |
| `ProgressBar` | **Client** | Barra animada para tareas diarias |
