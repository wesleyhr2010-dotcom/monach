# SPEC — Admin: Gestão de Brindes (Regalos)

## Objetivo
Permitir ao admin/consultora cadastrar brindes resgatáveis por pontos, gerenciar estoque e processar solicitações (`SolicitacaoBrinde`) feitas pelas revendedoras.

## Atores
- **SUPER_ADMIN / CONSULTORA** — CRUD e processamento.
- **Revendedora** — solicita resgate via `/app/progreso/regalos` (ver `SPEC_EXTRATO_BRINDES.md`).
- **Cloudflare R2** — imagem do brinde.

## Fluxo
1. Admin acessa `/admin/brindes` e vê lista + alerta de solicitações pendentes.
2. "Nuevo Brinde" → nome, descrição, imagem, custo em pontos, estoque (ou -1 ilimitado), ativo.
3. Revendedora resgata → cria `SolicitacaoBrinde` (status `pendente`) + `PontosExtrato` negativo.
4. Admin processa a solicitação: muda status (`em_preparacao` → `entregue`), opcionalmente anota tracking.
5. Ao marcar `entregue`, dispara notificação `brinde_entregue`.

## Regras de negócio
- Brinde inativo não aparece no catálogo da revendedora.
- Estoque -1 = ilimitado.
- Estoque decrementa ao criar solicitação; retorna ao cancelar.
- Custo em pontos é congelado na solicitação (mudança posterior não afeta pedidos pendentes).
- Imagem obrigatória, max 5 MB, formatos image/*.
- Lista ordenada por ativo desc, depois custo asc.

## Edge cases
- Solicitação cancelada após pontos debitados → reembolsar via `PontosExtrato` positivo.
- Estoque zero com solicitação aberta → bloqueia novas solicitações.
- Brinde excluído com solicitações ativas → bloqueia; exige resolução.
- Revendedora resgata mesmo brinde várias vezes → permitido se houver estoque.

## Dependências
- `SPEC_EXTRATO_BRINDES.md` — view da revendedora.
- `SPEC_API_UPLOAD_R2.md` — imagens.
- `SPEC_NOTIFICACOES.md` — evento `brinde_entregue`.
- `SPEC_DATABASE.md` — `Brinde`, `SolicitacaoBrinde`.

---

## Detalhes técnicos / Referência

**Rutas:**
- `/admin/brindes` — Lista de brindes + solicitudes pendientes
- `/admin/brindes/nuevo` — Crear brinde
- `/admin/brindes/[id]/editar` — Editar brinde

**Tipo:** Server Components + Server Actions  
**Acceso:** Solo `ADMIN` y `COLABORADORA`

---

## Tela 1: Lista de Brindes `/admin/brindes`

### Layout

```
┌──────────────────────────────────────────────────┐
│  Brindes y Regalos              [+ Nuevo Brinde]  │
├──────────────────────────────────────────────────┤
│  ⚠️ 3 solicitudes pendientes de entrega   [Ver →] │
├──────────────────────────────────────────────────┤
│                                                  │
│  [img]  Neceser Monarca Gold                     │
│         500 pts · Stock: 12 · ✅ Activo          │
│         [Editar]  [Desactivar]                   │
│                                                  │
│  [img]  Kit Cuidados Premium                     │
│         1.000 pts · Stock: 5 · ✅ Activo         │
│         [Editar]  [Desactivar]                   │
│                                                  │
│  [img]  Pulsera Exclusiva                        │
│         2.000 pts · Ilimitado · ⏸ Inactivo       │
│         [Editar]  [Activar]                      │
│                                                  │
└──────────────────────────────────────────────────┘
```

### Datos

```ts
const brindes = await prisma.brinde.findMany({
  orderBy: [{ ativo: 'desc' }, { custo_pontos: 'asc' }],
});
```

---

## Tela 2: Crear/Editar Brinde

### Campos del Formulario

| Campo | Tipo | Validación |
|-------|------|-----------|
| Nombre | text | min 2, max 100 |
| Descripción | textarea | max 500 |
| Imagen | upload → R2 | image/*, max 5 MB |
| Costo en puntos | number | entero positivo |
| Stock | number | entero ≥ 0 ó -1 para ilimitado |
| Activo | checkbox | — |

### Schema de Validación Zod

```ts
const brindeSchema = z.object({
  nome: z.string().min(2).max(100),
  descricao: z.string().max(500).default(''),
  imagem_url: z.string().url(),
  custo_pontos: z.number().int().positive(),
  estoque: z.number().int().min(-1), // -1 = ilimitado
  ativo: z.boolean().default(true),
});
```

### Server Actions

```ts
// src/app/admin/brindes/actions.ts
'use server';

export async function criarBrinde(data: BrindeInput) {
  await checkAdminRole();
  const validated = brindeSchema.parse(data);
  await prisma.brinde.create({ data: validated });
  revalidatePath('/admin/brindes');
}

export async function atualizarBrinde(id: string, data: BrindeInput) {
  await checkAdminRole();
  const validated = brindeSchema.partial().parse(data);
  await prisma.brinde.update({ where: { id }, data: validated });
  revalidatePath('/admin/brindes');
}

export async function toggleBrindeAtivo(id: string, ativo: boolean) {
  await checkAdminRole();
  await prisma.brinde.update({ where: { id }, data: { ativo } });
  revalidatePath('/admin/brindes');
}
```

---

## Tela 3: Solicitudes de Canje `/admin/brindes/solicitudes`

### Layout

```
┌──────────────────────────────────────────────────────┐
│  ← Solicitudes de Brindes                            │
│  Filtro: [Todas ▼] [Pendentes ▼] [Separadas ▼]      │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Ana Silva — Consultor: Maria Santos                 │
│  🎁 Neceser Monarca Gold · -500 pts                  │
│  📅 14 Dic · 09:32     [⏳ Pendente]                 │
│  [Marcar Separado]                                   │
│                                                      │
│  ─────────────────────────────────────────────────── │
│                                                      │
│  Carla López — Sin consultor                         │
│  🎁 Kit Cuidados Premium · -1.000 pts                │
│  📅 13 Dic · 15:00     [📦 Separado]                 │
│  [Marcar Entregado]                                  │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Datos

```ts
const solicitudes = await prisma.solicitacaoBrinde.findMany({
  where: getResellerScope(session), // RBAC: consultora ve solo su red
  include: {
    reseller: { include: { colaboradora: true } },
    brinde: true,
  },
  orderBy: { created_at: 'desc' },
});
```

### Estados visuales

| Status | Badge | Color |
|--------|-------|-------|
| `pendente` | ⏳ Pendiente | Amarillo |
| `separado` | 📦 Separado | Azul |
| `entregado` | ✅ Entregado | Verde |

---

## Flujo de Aprobación de Solicitud

### Paso 1: Pendente → Separado
Admin confirma que el brinde fue separado en el stock físico.

```ts
export async function marcarSeparado(solicitudId: string) {
  await checkAdminRole();
  await prisma.solicitacaoBrinde.update({
    where: { id: solicitudId },
    data: { status: 'separado' },
  });
  revalidatePath('/admin/brindes/solicitudes');
}
```

### Paso 2: Separado → Entregado
Admin confirma entrega física. Dispara push notification a la revendedora.

```ts
export async function marcarEntregado(solicitudId: string) {
  await checkAdminRole();

  const solicitud = await prisma.solicitacaoBrinde.update({
    where: { id: solicitudId },
    data: { status: 'entregado' },
    include: { reseller: true, brinde: true },
  });

  // Verificar preferencia antes de enviar push
  const prefs = await prisma.notificacaoPreferencia.findUnique({
    where: { reseller_id: solicitud.reseller_id },
  });

  if (prefs?.brinde_entregue !== false) {
    await enviarPushParaRevendedora(
      solicitud.reseller_id,
      `🎁 ¡Tu regalo llegó! ${solicitud.brinde.nome} fue entregado. ¡Disfrútalo!`
    );
  }

  revalidatePath('/admin/brindes/solicitudes');
}
```

---

## Navegación en el Admin

Agregar al sidebar del admin:

```
Configuración
  ├── Comisiones       → /admin/config/comisiones
  ├── Gamificación     → /admin/gamificacion
  └── Brindes  🎁      → /admin/brindes   ← NUEVO
```

El badge del sidebar muestra count de solicitudes pendientes:
```ts
const pendentes = await prisma.solicitacaoBrinde.count({
  where: { ...getAdminScope(session), status: 'pendente' },
});
```

---

## Componentes

| Componente | Tipo | Responsabilidad |
|-----------|------|----------------|
| `BrindesAdminPage` | Server | Lista brindes + alerta de pendentes |
| `BrindeCard` | Server | Imagen + datos + acciones |
| `BrindeForm` | **Client** | Formulario crear/editar con upload de imagen |
| `SolicitudesPage` | Server | Lista filtrada de solicitudes |
| `SolicitudCard` | Server | Datos solicitud + botones de estado |
| `MarcarEntregadoButton` | **Client** | Confirma y llama Server Action |
