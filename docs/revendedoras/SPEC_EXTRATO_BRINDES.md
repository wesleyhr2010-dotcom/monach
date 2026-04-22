# SPEC — Extrato de Pontos e Canje de Brindes

## Objetivo
Mostrar à revendedora o histórico de pontos (ganhos e resgates) e permitir que troque pontos por brindes do catálogo configurado pelo admin.

## Atores
- **Revendedora** — consulta extrato e solicita resgates.
- **Admin** — configura brindes disponíveis e gerencia solicitações (ver `SPEC_ADMIN_BRINDES.md`).
- **Sistema de gamificação** — grava movimentações em `PontosExtrato`.

## Fluxo
1. Revendedora acessa `/app/progreso/extracto` e vê saldo atual + histórico paginado (20/página).
2. Toca em "Canjear Regalos" → `/app/progreso/regalos` lista brindes com pontos necessários.
3. Seleciona brinde → confirma resgate.
4. Sistema valida saldo, cria `SolicitacaoBrinde` (status `pendente`) e grava `PontosExtrato` negativo.
5. Admin processa solicitação; ao entregar, revendedora recebe notificação `brinde_entregue`.

## Regras de negócio
- Saldo = `SUM(PontosExtrato.pontos)` do `reseller_id` (inclui valores negativos).
- Resgate só é permitido se saldo ≥ custo do brinde.
- `PontosExtrato.pontos` pode ser negativo (resgate).
- Pontos de resgate aparecem em vermelho com `-XXX ⬇`; ganhos em verde com `+XXX ⬆`.
- Listagem ordenada por `created_at DESC`.
- Brindes inativos no admin não aparecem no catálogo.

## Edge cases
- Saldo insuficiente → botão de resgate desabilitado com mensagem.
- Brinde sem estoque (se admin controla) → bloqueia resgate.
- Resgate concorrente que zeraria o saldo → valida transacionalmente.
- Histórico vazio → empty state.
- Pontos ainda "pendentes" por aprovação (ex.: meta do mês) → não entram no saldo até aprovação.

## Dependências
- `SPEC_ADMIN_BRINDES.md` — CRUD de brindes e processamento.
- `SPEC_PROGRESSO.md` — origem dos pontos.
- `SPEC_NOTIFICACOES.md` — evento `brinde_entregue`.
- `SPEC_DATABASE.md` — `PontosExtrato`, `Brinde`, `SolicitacaoBrinde`.

---

## Detalhes técnicos / Referência

**Rutas:**
- `/app/progreso/extracto` — Historial de puntos ganados
- `/app/progreso/regalos` — Catálogo de regalos para canjear

---

## Pantalla 1: Extracto de Puntos `/app/progreso/extracto`

### Layout

```
┌─────────────────────────────────────┐
│  ← Extracto de Puntos               │
│                                     │
│  ┌─────────────────────────────┐    │
│  │     ⭐ Saldo Actual          │    │
│  │     15.400 pts              │    │
│  │  [Canjear Regalos →]        │    │
│  └─────────────────────────────┘    │
│                                     │
│  Historial                          │
│  ─────────────────────────────────  │
│  ┌────────────────────────────────┐ │
│  │ 🛍️  Venta en Consig.   +50 ⬆ │ │
│  │     15 Dic 2024 · 14:32      │ │
│  └────────────────────────────────┘ │
│  ┌────────────────────────────────┐ │
│  │ 📤  Compartir Catál.   +50 ⬆ │ │
│  │     15 Dic 2024 · 10:15      │ │
│  └────────────────────────────────┘ │
│  ┌────────────────────────────────┐ │
│  │ 🎁  Canje Regalo      -500 ⬇  │ │  ← rojo
│  │     14 Dic 2024 · 09:00      │ │
│  └────────────────────────────────┘ │
│  ┌────────────────────────────────┐ │
│  │ 🏆  Meta Mensual       +100 ⬆  │ │
│  │     01 Dic 2024 · 00:00      │ │
│  └────────────────────────────────┘ │
│                                     │
│  [Cargar más...]                    │
└─────────────────────────────────────┘
```

### Datos Necesarios

```ts
// Paginado, 20 por página
const extracto = await prisma.pontosExtrato.findMany({
  where: { reseller_id: resellerId },
  orderBy: { created_at: 'desc' },
  take: 20,
  skip: page * 20,
});

const saldo = await prisma.pontosExtrato.aggregate({
  where: { reseller_id: resellerId },
  _sum: { pontos: true },
});
```

> `PontosExtrato.pontos` puede ser negativo (canje de regalo). Saldo = SUM de todos los registros.

### Visual de cada Línea del Extracto

| Campo | Visualización |
|-------|--------------|
| `descricao` / `acao` | Nombre legible de la acción (ej: "Venta en Consignación") |
| `pontos > 0` | Verde + `+50 ⬆` |
| `pontos < 0` | Rojo + `-500 ⬇` |
| `created_at` | Fecha y hora formateada (ej: "15 Dic · 14:32") |
| `icone` | Buscar ícono de `GamificacaoRegra WHERE acao = extracto.descricao` |

### Componentes
- `ExtractoPage` — Server Component (paginación server-side)
- `ExtractoItem` — Server Component (línea del extracto)
- `CargarMasButton` — **Client Component** (scroll infinito o botón)

---

## Pantalla 2: Catálogo de Regalos `/app/progreso/regalos`

### Layout

```
┌─────────────────────────────────────┐
│  ← Canjear Regalos                  │
│  Tus puntos: ⭐ 15.400             │
│                                     │
│  ┌────────────────────────────────┐ │
│  │ [img]                          │ │
│  │  Neceser Monarca Gold          │ │
│  │  ⭐ 500 pts                    │ │
│  │  [   Canjear   ]  ← verde      │ │
│  └────────────────────────────────┘ │
│  ┌────────────────────────────────┐ │
│  │ [img]                          │ │
│  │  Kit Cuidados Premium          │ │
│  │  ⭐ 1.000 pts                  │ │
│  │  [   Canjear   ]               │ │
│  └────────────────────────────────┘ │
│  ┌────────────────────────────────┐ │
│  │ [img]                          │ │
│  │  Pulsera Exclusiva             │ │
│  │  ⭐ 2.000 pts                  │ │
│  │  [Puntos insuficientes] ← gris │ │
│  └────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Reglas de Negocio
1. Regalo con `custo_pontos > saldo_actual` → botón deshabilitado "Puntos insuficientes"
2. Al hacer clic "Canjear" → modal de confirmación
3. Confirmación → debita puntos via `canjearRegalo()` + crea `SolicitacaoBrinde`
4. Admin recibe notificación para separar el regalo físico

### Modal de Confirmación del Canje

```
┌──────────────────────────────────┐
│  Confirmar Canje                 │
│                                  │
│  [img] Neceser Monarca Gold      │
│                                  │
│  ⭐ -500 pts                     │
│  Saldo tras el canje: 14.900 pts │
│                                  │
│  El regalo será entregado por    │
│  tu consultora en la próxima     │
│  visita.                         │
│                                  │
│  [Cancelar]   [Confirmar Canje]  │
└──────────────────────────────────┘
```

### Server Action: `canjearRegalo(resellerId, brindeId)`

```ts
async function canjearRegalo(resellerId: string, brindeId: string) {
  return await prisma.$transaction(async (tx) => {
    // 1. Buscar saldo actual
    const { _sum } = await tx.pontosExtrato.aggregate({
      where: { reseller_id: resellerId },
      _sum: { pontos: true },
    });
    const saldo = _sum.pontos ?? 0;

    // 2. Buscar regalo
    const brinde = await tx.brinde.findUniqueOrThrow({ where: { id: brindeId } });

    // 3. Validaciones
    if (!brinde.ativo) throw new Error('Este regalo no está disponible.');
    if (saldo < brinde.custo_pontos) throw new Error('Puntos insuficientes');
    if (brinde.estoque === 0) throw new Error('Regalo sin stock disponible');

    // 4. Debitar puntos (valor negativo)
    await tx.pontosExtrato.create({
      data: {
        reseller_id: resellerId,
        pontos: -brinde.custo_pontos,
        descricao: `Canje: ${brinde.nome}`,
      },
    });

    // 5. Decrementar stock (si no es ilimitado)
    if (brinde.estoque > 0) {
      await tx.brinde.update({
        where: { id: brindeId },
        data: { estoque: { decrement: 1 } },
      });
    }

    // 6. Crear solicitud para el admin
    await tx.solicitacaoBrinde.create({
      data: {
        reseller_id: resellerId,
        brinde_id: brindeId,
        pontos_debitados: brinde.custo_pontos,
      },
    });
  });
}
```

### Admin: Gestionar Regalos `/admin/brindes`
Ver `SPEC_ADMIN_BRINDES.md` para el flujo completo del admin.

---

## Navegación entre Pantallas de Progreso

```
/app/progreso          ← "Cómo Ganar Puntos" (SPEC_PROGRESSO.md)
    ├── /extracto      ← Historial de puntos (esta spec)
    └── /regalos       ← Catálogo de regalos (esta spec)
```

En el header de la pantalla `/app/progreso`, mostrar atajos:
```
[⭐ 15.400 pts]  [Extracto →]  [Regalos →]
```
