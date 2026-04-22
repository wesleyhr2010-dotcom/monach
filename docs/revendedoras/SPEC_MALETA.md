# SPEC — Maleta (Consignação): Lista, Detalhes e Registro de Venda

## Objetivo
Permitir que a revendedora visualize suas consignações (atuais e históricas), veja o detalhe de uma maleta com seus itens e registre vendas individuais que descontam do estoque da maleta.

## Atores
- **Revendedora** — proprietária da maleta; registra vendas.
- **Admin** — envia maletas (ver `SPEC_ADMIN_MALETAS.md`).
- **Cliente final** — aparece como dado opcional na venda (nome + WhatsApp).

## Fluxo
1. Revendedora acessa `/app/maleta` e vê cards de todas as suas maletas ordenados por `created_at DESC`.
2. Toca em uma maleta → `/app/maleta/[id]` mostra itens, total, status e dias restantes.
3. Toca em "Registrar Venta" → formulário com dados do cliente, itens vendidos e valor.
4. Ao confirmar, sistema cria registro em `VendaMaleta`, atualiza `maleta_item.quantidade_vendida` e recalcula total.
5. Se desejar, vai para "Devolver Consignación" (`SPEC_DEVOLUCAO.md`) quando terminar.

## Regras de negócio
- Cada maleta tem `numero` autoincrement exibido como `#102`.
- Queries sempre filtram por `reseller_id` do usuário logado (ownership).
- Status visuais: `ativa` (verde), `atrasada` (vermelho), `aguardando_revisao` (amarelo), `concluida` (cinza).
- Badges de item: `Disponible` (vendida=0), `Parcial` (0<vendida<enviada), `Vendido` (vendida=enviada).
- Botão "Devolver" só aparece se status `ativa` ou `atrasada`.
- Preço é `preco_fixado` no momento da criação da maleta — não muda se produto sofrer alteração depois.

## Edge cases
- Maleta com data_limite ultrapassada → status muda para `atrasada` automaticamente.
- Tentativa de registrar venda acima do estoque disponível → bloqueia.
- Item totalmente vendido → não aparece no catálogo mas continua visível nos detalhes.
- Acesso a maleta de outra revendedora via URL manipulada → 404 (filtro por `reseller_id`).
- Maleta concluída → botões de ação ocultos.
- **Maleta editada pelo admin** → revendedora recebe push notification "Se añadieron artículos a tu consignación" e o detalhe da maleta reflete as novas quantidades/envios imediatamente.

## Dependências
- `SPEC_ADMIN_MALETAS.md` — criação/envio de maletas.
- `SPEC_DEVOLUCAO.md` — fluxo de devolução.
- `SPEC_CATALOGO.md` — reusa itens da maleta ativa.
- `SPEC_DATABASE.md` — modelos `Maleta`, `MaletaItem`, `VendaMaleta`.

---

## Detalhes técnicos / Referência

**Rutas:** `/app/maleta` · `/app/maleta/[id]` · `/app/maleta/[id]/registrar-venta`

---

## Pantalla 1: Listado de Consignaciones `/app/maleta`

Layout simple — lista de cards con consignaciones activas e históricas.

| Campo | Fuente |
|-------|--------|
| `maletas[]` | `maleta WHERE reseller_id ORDER BY created_at DESC` |
| Status | `maleta.status` → badge visual |
| Número | `maleta.numero` (campo `Int @default(autoincrement())`) |

**Estados posibles y colores:**
| Status | Badge | Color |
|--------|-------|-------|
| `ativa` | En proceso | Verde |
| `atrasada` | Atrasada | Rojo |
| `aguardando_revisao` | Esperando confirmación | Amarillo |
| `concluida` | Finalizada | Gris |

---

## Pantalla 2: Detalles de Consignación `/app/maleta/[id]`

### Layout
```
┌─────────────────────────────────────┐
│  ← Detalles de Consig. #102         │
│  📅 Vence: 15 Dic 2024  [Atrasada]  │
│  ┌─────────────────────────────┐    │
│  │ 💰 Total: G$ 12.500         │    │
│  └─────────────────────────────┘    │
│  [+ Registrar Venta]                │
│                                     │
│  Artículos (12)                     │
│  ┌─────────────────────────────┐    │
│  │[img] Nombre SKU G$X [badge] │    │
│  └─────────────────────────────┘    │
│  ... (lista completa)               │
│  [Devolver Consignación]            │
└─────────────────────────────────────┘
```

### Datos Necesarios

| Dato | Fuente |
|------|--------|
| `maleta` | `maleta WHERE id AND reseller_id` ← garantiza ownership |
| `maleta.itens[]` | `maleta_item JOIN product_variant JOIN product` |
| `total_valor` | `SUM(maleta_item.preco_fixado * quantidade_enviada)` |
| `status_badge` | Derivado de `maleta.status` + `maleta.data_limite` |

### Número de Consignación
Mostrar como `#102`. Requiere campo en el schema:
```prisma
model Maleta {
  numero Int @default(autoincrement())
  // ... demás campos
}
```
Ver `SPEC_DATABASE_FINAL.md` — modelo `Maleta`.

### Estado de los Artículos

| Condición | Badge | Color |
|-----------|-------|-------|
| `quantidade_vendida = 0` | Disponible | Verde suave |
| `quantidade_vendida = quantidade_enviada` | Vendido | Gris |
| `0 < vendida < enviada` | Parcial | Amarillo |

### Botón "Devolver Consignación"
- Visible solo si `status = 'ativa'` o `status = 'atrasada'`
- Navega a `/app/maleta/[id]/devolver`

### Componentes

| Componente | Tipo | Responsabilidad |
|-----------|------|----------------|
| `MaletaDetalhePage` | Server | Busca consignación + artículos |
| `MaletaItemRow` | Server | Imagen + nombre + SKU + precio + badge estado |
| `MaletaStatusBadge` | Server | Badge de color por estado |
| `BotaoRegistrarVenda` | **Client** | Navega a registrar-venta |

---

## Pantalla 3: Registrar Venta `/app/maleta/[id]/registrar-venta`

### Layout
```
┌─────────────────────────────────────┐
│  ← Registrar Venta                  │
│                                     │
│  [👤] Nombre del Cliente            │
│       ________________________      │
│  [📞] WhatsApp / Teléfono           │
│       ________________________      │
│                                     │
│  Seleccionar Artículo               │
│  [🔍 Nombre o SKU...]               │
│                                     │
│  ┌── SELECCIONADO ─────────────┐     │
│  │ [img] Collar G$1.250 ✓      │     │
│  └────────────────────────────┘     │
│  ┌────────────────────────────┐     │
│  │ [img] Anillo G$1.250       │     │
│  └────────────────────────────┘     │
│  (solo artículos Disponibles)       │
│                                     │
│  [Confirmar Venta]                  │
└─────────────────────────────────────┘
```

### Reglas de Negocio
1. Lista muestra **solo artículos con estado Disponible** (`quantidade_vendida < quantidade_enviada`)
2. Selección **single-select** — un artículo por vez
3. Campos obligatorios: `cliente_nome` + `cliente_telefone` + `maleta_item_id`
4. Al confirmar → llama `registrarVenda()` → redirige a `/app/maleta/[id]`

### Server Action: `registrarVenda(input)`

```ts
// src/app/app/actions-revendedora.ts
async function registrarVenda(input: {
  maleta_item_id: string;
  cliente_nome: string;
  cliente_telefone: string;
  preco_unitario: Decimal;
}) {
  return await prisma.$transaction(async (tx) => {
    // 1. Valida ownership (maleta_item pertenece a la revendedora autenticada)
    const item = await tx.maletaItem.findFirstOrThrow({
      where: {
        id: input.maleta_item_id,
        maleta: { reseller_id: session.resellerId },
      },
    });

    // 2. LOCK para evitar race condition
    await tx.$executeRaw`SELECT id FROM maleta_items WHERE id = ${item.id} FOR UPDATE`;

    // 3. Verificar que aún hay stock disponible
    if (item.quantidade_vendida >= item.quantidade_enviada) {
      throw new Error('Este artículo ya no está disponible.');
    }

    // 4. Crea registro en VendaMaleta
    await tx.vendaMaleta.create({
      data: {
        maleta_id: item.maleta_id,
        maleta_item_id: item.id,
        reseller_id: session.resellerId,
        cliente_nome: input.cliente_nome,
        cliente_telefone: input.cliente_telefone,
        preco_unitario: input.preco_unitario,
      },
    });

    // 5. Incrementa quantidade_vendida
    const updatedItem = await tx.maletaItem.update({
      where: { id: item.id },
      data: { quantidade_vendida: { increment: 1 } },
    });

    // 6. Dispara puntos de gamificación
    await awardPoints(session.resellerId, 'venda_maleta', tx);

    // 7. Si la consignación quedó 100% vendida → bonus
    const allItems = await tx.maletaItem.findMany({
      where: { maleta_id: item.maleta_id },
    });
    const todosVendidos = allItems.every(i => i.quantidade_vendida >= i.quantidade_enviada);
    if (todosVendidos) {
      await awardPoints(session.resellerId, 'maleta_completa', tx);
    }
  });
}
```

> **Lock pessimista:** El `SELECT FOR UPDATE` garantiza que dos ventas simultáneas
> no puedan registrarse para el mismo artículo. Ver `SPEC_BACKEND.md`.

### Validación Zod

```ts
const registrarVendaSchema = z.object({
  maleta_item_id: z.string().uuid(),
  cliente_nome: z.string().min(2).max(100),
  cliente_telefone: z.string().min(8).max(20),
  preco_unitario: z.number().positive(),
});
```

### Gamificación
- Dispara `awardPoints(resellerId, 'venda_maleta')` → +50 pts (configurable en admin)
- Si consignación 100% vendida → dispara `awardPoints(resellerId, 'maleta_completa')` → +200 pts

### Componentes

| Componente | Tipo | Responsabilidad |
|-----------|------|----------------|
| `RegistrarVentaPage` | **Client** | Formulario con filtro/búsqueda de artículos |
| `ItemSeleccionable` | **Client** | Card con estado seleccionado (verde) |

**Estado del Client Component:**
```ts
const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
const [clienteNombre, setClienteNombre] = useState('');
const [clienteTelefono, setClienteTelefono] = useState('');
const [searchQuery, setSearchQuery] = useState('');
const [isPending, startTransition] = useTransition();
```
