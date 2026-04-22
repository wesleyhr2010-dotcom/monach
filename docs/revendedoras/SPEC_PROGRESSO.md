# SPEC — Como Ganhar Pontos (Progresso)

## Objetivo
Mostrar à revendedora todas as ações gamificadas que rendem pontos, seu progresso diário/mensal em cada uma e como completá-las.

## Atores
- **Revendedora** — visualiza suas tarefas e progresso.
- **Sistema de gamificação** — executa regras ao detectar eventos (venda, compartilhamento, login etc.).
- **Admin** — configura regras em `GamificacaoRegra` (ver `SPEC_ADMIN_GAMIFICACAO.md`).

## Fluxo
1. Revendedora acessa `/app/progreso` e vê o saldo de pontos atual no header.
2. Sistema lista todas as `GamificacaoRegra.ativo = true` ordenadas por `ordem`.
3. Para cada regra, calcula o estado (disponível, em progresso, completado hoje, completado sempre) com base em `PontosExtrato`.
4. Ações com botão "Ir →" levam às telas correspondentes (maleta, perfil etc.).
5. Ações diárias mostram barra `X/Y hoy`.

## Regras de negócio
- Tipos de regra: `diario` (reset diário), `mensal`, `por_evento` (ilimitado ou limitado por evento), `unico` (1 vez na vida).
- Exemplos: Compartir Catálogo (+50, 5×/dia), Meta Mensual (+100, 1×/mês), Venta Consig. (+50, por evento), Devolução a tempo (+30, 1× por maleta), Perfil completo (+20, único), Primer acceso (+20, único), Maleta Completa (+200, por maleta).
- Pontos acumulados são **históricos** — nunca resetados — usados para calcular rank.
- Estados visuais: disponível (verde), em progresso (barra), completado hoje (cinza com check), completado sempre (✓).
- Nomes exibidos vêm de `GamificacaoRegra.nome`, não são hardcoded.

## Edge cases
- Regra desativada no admin → não aparece na tela.
- Limite diário atingido → barra cheia + "Límite alcanzado", sem botão.
- Regra `unico` já cumprida → card em cinza com "✓ Completado" permanente.
- Revendedora sem nenhum ponto → saldo 0, todas as tarefas disponíveis.
- Mudança de regra pelo admin → afeta cálculos a partir da data; histórico preservado.

## Dependências
- `SPEC_ADMIN_GAMIFICACAO.md` — CRUD de regras.
- `SPEC_HOME.md` — saldo de pontos e rank derivados.
- `SPEC_DATABASE.md` — modelos `GamificacaoRegra`, `PontosExtrato`, `NivelRegra`.
- `prisma/seed-gamificacao.ts` — valores padrão.

---

## Detalhes técnicos / Referência

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
