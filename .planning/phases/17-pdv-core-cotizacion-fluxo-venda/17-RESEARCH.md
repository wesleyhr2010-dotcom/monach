# Phase 17: PDV Core — Cotización + Fluxo de Venda — Research

**Researched:** 2026-05-08
**Domain:** Next.js Server Actions + Prisma (PostgreSQL) — PDV multi-step com cotização cambial e venda de loja
**Confidence:** HIGH (todo o código verificado diretamente no repositório)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-17-PDV-01**: Cliente no PDV é opcional. Admin pode confirmar venda sem identificar cliente (RUC nulo). Quando sem cliente, histórico exibe "Consumidor Final". Se admin digitar RUC e não encontrar, aparece mini-form inline (nome, cidade, telefone) para criar o cliente sem sair do PDV.
- **D-17-PDV-02**: Adicionar produtos: busca por nome + navegação por categoria. Duas formas de adicionar itens ao carrinho: (a) campo de busca por nome/código com sugestões; (b) navegação por categoria. PDV exibe estoque disponível de cada produto (quantity - reservas em maletas ativas).
- **D-17-PDV-03**: Bloquear estoque ao adicionar ao carrinho. Se quantidade solicitada > estoque disponível, o item NÃO é adicionado — erro imediato na tela. A Server Action `criarVentaLoja` valida novamente no servidor como segunda linha de defesa (fail fast fora da transaction), mas o bloqueio principal é no client.
- **D-17-PDV-04**: Pós-confirmação: splash de sucesso + PDV limpo. Após venda confirmada, exibe tela de sucesso com resumo (cliente/consumidor, total em moeda e PYG, quantidade de itens). Botão "Nueva Venta" limpa o PDV para próxima venda. Mesmo padrão da devolução no PWA.
- **D-17-02** (STATE.md): `criarVentaLoja` espelha `criarMaleta` — pré-leitura de estoque fora da transaction, `$transaction([...ops])` array form, snapshot imutável de cotização nas colunas na criação.
- **D-17-03** (STATE.md): Cotização SEMPRE relida do DB dentro da Server Action — nunca aceitar do payload do cliente.
- **D-17-04** (STATE.md): Precisão monetária — `Math.round(Number(price) * Number(rate))` por linha; somar inteiros.
- **D-17-01** (STATE.md): `CotizacionDia` insert-por-update (não singleton upsert) — `findFirst({ orderBy: { createdAt: "desc" } })` para taxa corrente.
- **D-15-01** (v1.3): Paper MCP consultado antes de implementar cada tela nova.
- **D-15-02** (v1.3): Tokens `--admin-*` obrigatórios — zero hex/px hardcoded no JSX.

### Claude's Discretion

- Componente de busca de produto: reutilizar padrão existente de `maleta/nova` (select com combobox) ou criar componente dedicado ao PDV.
- Layout do carrinho no PDV: tabela simples de itens ou cards de produto.
- Formato de exibição do estoque: número puro ("12 unidades") ou com badge de alerta quando baixo (ex.: < 5).
- Formato da linha de cotização no PDV: "1 USD = 7.800 PYG · Atualizado 08/05 14:30" ou similar.
- Tratamento de cotização não configurada (primeira vez): mensagem de aviso ou bloquear PDV até configurar?

### Deferred Ideas (OUT OF SCOPE)

- Impressão de recibo / envio por WhatsApp após confirmação — v1.5 (junto com factura)
- Desconto percentual por venda — v1.5 CRM
- Venda a crédito/cuotas — v1.5 CRM
- Busca por código de barras — v1.5
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PDV-01 | Configuração de cotização diária BRL→PYG / USD→PYG em `/admin/config/cotizacion` | Schema `CotizacionDia` verificado; padrão insert-por-update confirmado; config pages existentes analisadas |
| PDV-02 | Leitura de cotização atual em Server Actions | `findFirst({ orderBy: { createdAt: "desc" } })` — confirmado como padrão (D-17-01) |
| PDV-03 | Fluxo PDV multi-step em `/admin/pdv` com identificação de cliente por RUC | `buscarClientePorRuc` já existe em `actions-clientes.ts`; mini-form inline especificado em UI-SPEC |
| PDV-04 | Carrinho de produtos com busca por nome e filtro por categoria | `getAvailableVariants` como base; `getCategories` para filtro; padrão debounce de `maleta/nova` |
| PDV-05 | Seleção de moeda e cálculo de total em PYG com snapshot de cotização | Enum `Moneda {PYG, USD, BRL}` confirmado no schema; precisão `Math.round` definida em D-17-04 |
| PDV-06 | `criarVentaLoja` — pré-leitura, decremento de estoque, registro de `EstoqueMovimento venda_loja` | Padrão completo verificado em `criarMaleta`; `venta_loja` enum value confirmado no schema |
</phase_requirements>

---

## Summary

Esta fase entrega duas telas admin: `/admin/config/cotizacion` (configuração de câmbio BRL→PYG / USD→PYG) e `/admin/pdv` (fluxo multi-step de venda física). Toda a infraestrutura de banco (schema, enums, models) foi criada na Fase 16 e está verificada no `prisma/schema.prisma`. O padrão de Server Action para decremento atômico de estoque está completamente documentado em `actions-maletas.ts` e deve ser copiado sem reinvenção.

**Descoberta crítica — schema gap:** O campo `cliente_id` em `VentaLoja` é **não nullable** (`String @db.Uuid`) no schema atual da Fase 16, mas a decisão D-17-PDV-01 requer suporte a vendas sem cliente (consumidor final). Isso exige uma **migration adicional na Wave 0** para tornar `cliente_id` opcional (`String? @db.Uuid`). Sem isso, `criarVentaLoja` com consumidor final falhará com constraint violation do Postgres.

**Descoberta técnica — stock_quantity é o campo de estoque real:** `ProductVariant.stock_quantity` já reflete o estoque líquido após descontar reservas de maletas (decrementado em `criarMaleta`, incrementado em `conferirEFecharMaleta`). O PDV usa esse campo diretamente — não precisa recalcular subtraindo reservas de maleta. A fórmula "quantity − reservas ativas" do CONTEXT.md descreve como o estoque foi chegado ao valor atual, não uma query em tempo real.

**Primary recommendation:** Wave 0 = migration nullable + `actions-cotizacion.ts` + `actions-pdv.ts` (sem UI). Wave 1 = `/admin/config/cotizacion` (tela simples). Wave 2 = `/admin/pdv` completo (Client Component multi-step, reutilizando padrões de `maleta/nova`).

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Configuração de cotização | API / Backend (Server Action) | — | Dado persistido, relido na venda; nunca aceito do payload do client |
| Fluxo PDV multi-step | Frontend Server (SSR) + Client | — | Page.tsx como RSC (carrega cotização inicial); Client Component gerencia o state de steps, carrinho e formulários |
| Busca de cliente por RUC | API / Backend (Server Action) | Client (debounce) | `buscarClientePorRuc` já existe; client dispara com debounce 400ms |
| Criação de cliente inline | API / Backend (Server Action) | — | `criarCliente` já existe em `actions-clientes.ts` |
| Busca de produtos para PDV | API / Backend (Server Action) | Client (debounce) | Nova action `getVariantsParaPdv` baseada em `getAvailableVariants` |
| Filtro por categoria | API / Backend (Server Action) | — | `getCategories` já existe |
| Cálculo de total em PYG | Client | — | Calculado client-side usando snapshot de cotização carregado do server; re-validado no server em `criarVentaLoja` |
| Confirmação de venda | API / Backend (Server Action) | — | `criarVentaLoja` — decremento de estoque + registro de movimentos; cotização relida do DB |
| Snapshot de cotização | Database / Storage | — | `cotizacion_snapshot` JSON salvo imutavelmente em `VentaLoja` na criação |

---

## Standard Stack

### Core (verificado no repositório)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Prisma Client | (gerado) | ORM — queries `CotizacionDia`, `VentaLoja`, `VentaLojaItem`, `Cliente` | Já em uso em todo o projeto |
| Next.js Server Actions | 16.x | `actions-cotizacion.ts`, `actions-pdv.ts` | Padrão do projeto — `"use server"` em todos os arquivos de action |
| `safeAction` / `ActionResult` | interno | Wrapping padronizado de try/catch | Definido em `src/lib/action-utils.ts`; usado em `actions-clientes.ts` |
| `requireAuth` | interno | Guard obrigatório em toda action | `src/lib/user.ts` — React.cache para deduplicação |
| `invalidateCache` | interno | Revalidar paths admin após mutação | `src/lib/cache/invalidate.ts` |
| lucide-react | (em uso) | Ícones: CheckCircle, Package, Minus, Plus, Trash2, Search | Já instalado |
| shadcn/ui | (em uso) | Input, Button, Badge, Select, Separator | Já inicializado; Registry Safety verificada no UI-SPEC |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `cn` (clsx/tailwind-merge) | (em uso) | Composição condicional de classes | Toda lógica de classe CSS condicional |
| `Intl.NumberFormat("es-PY")` | nativo JS | Formatação de valores em Guaraníes | Exibição de totais — sem biblioteca externa |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `safeAction` wrapper | try/catch manual | `safeAction` é o padrão do projeto — usar `safeAction` |
| `AdminFilterBar` existente | Select nativo | `AdminFilterBar` já tem o padrão correto para busca + filtro de categoria |
| Debounce manual (`setTimeout`) | `useDebounce` hook | O projeto não tem hook de debounce externo; usar `setTimeout` + `clearTimeout` inline (padrão do projeto) |

---

## Architecture Patterns

### System Architecture Diagram

```
Admin browser
    │
    ├─ [page load] GET /admin/config/cotizacion
    │       └─> RSC page.tsx
    │               └─> actions-cotizacion.ts: getCotizacionAtual()
    │                       └─> prisma.cotizacionDia.findFirst({ orderBy: createdAt desc })
    │
    ├─ [save cotização] POST via Server Action
    │       └─> actions-cotizacion.ts: salvarCotizacion(brlToPyg, usdToPyg)
    │               ├─> requireAuth(["ADMIN"])
    │               └─> prisma.cotizacionDia.create({ data: { brl_to_py, usd_to_py } })
    │
    ├─ [page load] GET /admin/pdv
    │       └─> RSC page.tsx
    │               ├─> actions-cotizacion.ts: getCotizacionAtual()  (cotização inicial)
    │               └─> actions-categories.ts: getCategories()       (filtros)
    │               └─> PdvClient.tsx (Client Component com todo o state)
    │
    ├─ [busca RUC] debounce 400ms → buscarClientePorRuc(ruc)
    │       └─> actions-clientes.ts (já existe)
    │               └─> prisma.cliente.findUnique({ where: { ruc } })
    │
    ├─ [criar cliente inline] → criarCliente(data)
    │       └─> actions-clientes.ts (já existe)
    │
    ├─ [busca produto] debounce → getVariantsParaPdv(search, categoryId)
    │       └─> actions-pdv.ts (nova)
    │               └─> prisma.productVariant.findMany({
    │                       where: { stock_quantity: { gt: 0 }, product: { name: contains search, categories: { some: { category_id } } } }
    │                   })
    │
    ├─ [confirmar venda] → criarVentaLoja(input)
    │       └─> actions-pdv.ts (nova)
    │               ├─> requireAuth(["ADMIN"])
    │               ├─> Pré-leitura: getCotizacionAtual() → falha se null
    │               ├─> Pré-leitura: getVariants stock_quantity para cada item
    │               ├─> Validação stock (fail fast, fora da transaction)
    │               ├─> prisma.ventaLoja.create({ data: { ..., cotizacion_snapshot: {...} } })
    │               ├─> loop: prisma.productVariant.update({ data: { stock_quantity: { decrement } } })
    │               ├─> compensação se stock error
    │               └─> loop: prisma.estoqueMovimento.create({ tipo: "venda_loja" })
    │
    └─ [splash sucesso] → state reset in-place (sem router.push)
```

### Recommended Project Structure

```
src/app/admin/
├── actions-cotizacion.ts         # salvarCotizacion, getCotizacionAtual
├── actions-pdv.ts                # criarVentaLoja, getVariantsParaPdv
├── config/
│   └── cotizacion/
│       ├── page.tsx              # RSC: force-dynamic, carrega cotização atual
│       └── CotizacionClient.tsx  # Client Component: formulário BRL/USD + historial
└── pdv/
    ├── page.tsx                  # RSC: force-dynamic, carrega cotização + categorias
    └── PdvClient.tsx             # Client Component: 4 steps + carrinho + splash
```

### Pattern 1: Server Action com safeAction (padrão do projeto)

Usar `safeAction` para TODAS as actions novas (padrão estabelecido em `actions-clientes.ts`):

```typescript
// Source: src/app/admin/actions-clientes.ts (verificado)
"use server";
import { safeAction, BusinessError } from "@/lib/action-utils";
import { requireAuth } from "@/lib/user";
import type { ActionResult } from "@/lib/action-utils";

export async function salvarCotizacion(
  brlToPyg: number,
  usdToPyg: number
): Promise<ActionResult<{ id: string }>> {
  return safeAction(async () => {
    await requireAuth(["ADMIN"]);
    if (brlToPyg <= 0 || usdToPyg <= 0) {
      throw new BusinessError("Las tasas deben ser mayores a cero.");
    }
    const cotizacion = await prisma.cotizacionDia.create({
      data: { brl_to_py: brlToPyg, usd_to_py: usdToPyg },
    });
    return { id: cotizacion.id };
  }, { actionName: "salvarCotizacion" });
}
```

### Pattern 2: getCotizacionAtual — insert-por-update (D-17-01)

```typescript
// Source: D-17-01 em CONTEXT.md + schema CotizacionDia verificado
export async function getCotizacionAtual(): Promise<ActionResult<CotizacionAtual | null>> {
  return safeAction(async () => {
    await requireAuth(["ADMIN"]);
    const cotizacion = await prisma.cotizacionDia.findFirst({
      orderBy: { created_at: "desc" },
    });
    if (!cotizacion) return null;
    return {
      id: cotizacion.id,
      brlToPyg: Number(cotizacion.brl_to_py),
      usdToPyg: Number(cotizacion.usd_to_py),
      createdAt: cotizacion.created_at.toISOString(),
    };
  }, { actionName: "getCotizacionAtual" });
}
```

### Pattern 3: criarVentaLoja — espelho de criarMaleta (D-17-02)

```typescript
// Source: src/app/admin/actions-maletas.ts:criarMaleta (verificado)
export async function criarVentaLoja(input: CriarVentaLojaInput): Promise<ActionResult<{ id: string }>> {
  return safeAction(async () => {
    const user = await requireAuth(["ADMIN"]);

    // 1. Pré-leitura: reler cotização do DB (D-17-03 — nunca aceitar do payload)
    const cotizacion = await prisma.cotizacionDia.findFirst({ orderBy: { created_at: "desc" } });
    if (!cotizacion) throw new BusinessError("No hay cotización registrada. Configurá la cotización antes de registrar ventas.");

    // 2. Pré-leitura: estoque para validação (fail fast)
    const variantIds = input.itens.map(i => i.product_variant_id);
    const variants = await prisma.productVariant.findMany({ where: { id: { in: variantIds } } });
    const variantMap = new Map(variants.map(v => [v.id, v]));
    for (const item of input.itens) {
      const variant = variantMap.get(item.product_variant_id);
      if (!variant) throw new BusinessError(`Variante ${item.product_variant_id} no encontrada.`);
      if (variant.stock_quantity < item.cantidad) {
        throw new BusinessError(`Stock insuficiente para "${variant.attribute_value}": disponible ${variant.stock_quantity}.`);
      }
    }

    // 3. Calcular total com precisão (D-17-04)
    const brlToPyg = Number(cotizacion.brl_to_py);
    const usdToPyg = Number(cotizacion.usd_to_py);
    let totalPyg = 0;
    for (const item of input.itens) {
      const variant = variantMap.get(item.product_variant_id)!;
      const precioUnit = Number(variant.price ?? 0); // price em Guaraníes (moeda base do catálogo)
      const subtotalPyg = Math.round(precioUnit * item.cantidad);
      totalPyg += subtotalPyg;
    }
    // Conversão se moeda != PYG: totalOriginal = totalPyg / taxa
    const total = input.moneda === "PYG" ? totalPyg
      : input.moneda === "USD" ? Math.round(totalPyg / usdToPyg * 100) / 100
      : Math.round(totalPyg / brlToPyg * 100) / 100;

    // 4. Criar VentaLoja com snapshot imutável
    const venta = await prisma.ventaLoja.create({
      data: {
        cliente_id: input.clienteId ?? null,  // REQUER migration nullable (ver pitfall abaixo)
        total: total,
        moneda: input.moneda,
        total_pyg: totalPyg,
        cotizacion_snapshot: { brl_to_py: brlToPyg, usd_to_py: usdToPyg, cotizacion_id: cotizacion.id },
        created_by: user.profileId!,
        itens: {
          create: input.itens.map(item => {
            const variant = variantMap.get(item.product_variant_id)!;
            const precioUnit = Number(variant.price ?? 0);
            return {
              product_variant_id: item.product_variant_id,
              cantidad: item.cantidad,
              precio_unitario: precioUnit,
              subtotal: Math.round(precioUnit * item.cantidad),
            };
          }),
        },
      },
    });

    // 5. Decrementar estoque — sequential com compensação (padrão criarMaleta)
    const stockErrors: { variantId: string; qty: number }[] = [];
    for (const item of input.itens) {
      try {
        await prisma.productVariant.update({
          where: { id: item.product_variant_id },
          data: { stock_quantity: { decrement: item.cantidad } },
        });
      } catch (err) {
        console.error("[criarVentaLoja] Error decrementing stock:", item.product_variant_id, err);
        stockErrors.push({ variantId: item.product_variant_id, qty: item.cantidad });
      }
    }
    if (stockErrors.length > 0) {
      await prisma.ventaLoja.delete({ where: { id: venta.id } }).catch(() => {});
      throw new BusinessError("Error al actualizar el stock. Intentá de nuevo.");
    }

    // 6. Registrar movimentos de estoque (best-effort)
    for (const item of input.itens) {
      await prisma.estoqueMovimento.create({
        data: {
          product_variant_id: item.product_variant_id,
          quantidade: item.cantidad,
          tipo: "venda_loja",
          motivo: `Venta en loja #${venta.id.slice(0, 8)}`,
          venta_loja_id: venta.id,
        },
      }).catch(err => console.error("[criarVentaLoja] Movement log failed:", err));
    }

    invalidateCache.path.admin("/pdv");
    return { id: venta.id };
  }, { actionName: "criarVentaLoja" });
}
```

### Pattern 4: RSC page.tsx (padrão das config pages)

```typescript
// Source: src/app/admin/config/comissoes/page.tsx + niveis/page.tsx (verificado)
import { getCotizacionAtual } from "../../actions-cotizacion";
import CotizacionClient from "./CotizacionClient";

export const dynamic = "force-dynamic";

export default async function CotizacionPage() {
  const result = await getCotizacionAtual();
  const cotizacionAtual = result.success ? result.data : null;

  return <CotizacionClient cotizacionAtual={cotizacionAtual} />;
}
```

### Pattern 5: Busca com debounce manual (padrão do projeto)

```typescript
// Source: inferido do padrão de maleta/nova (sem hook externo no projeto)
const [search, setSearch] = useState("");
const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

function handleSearchChange(q: string) {
  setSearch(q);
  if (debounceRef.current) clearTimeout(debounceRef.current);
  debounceRef.current = setTimeout(() => {
    loadVariants(q);
  }, 400);
}
```

### Pattern 6: AdminStepIndicator — uso confirmado

```typescript
// Source: src/components/admin/AdminStepIndicator.tsx (verificado)
// Props: steps: { label: string }[], currentStep: number, className?: string
const PDV_STEPS = [
  { label: "Cliente" },
  { label: "Productos" },
  { label: "Moneda" },
  { label: "Resumen" },
];

<AdminStepIndicator steps={PDV_STEPS} currentStep={step} />
```

### Anti-Patterns to Avoid

- **Aceitar cotização do payload do client:** Viola D-17-03. A cotização DEVE ser relida do DB dentro da Server Action.
- **Usar interactive transaction (`$transaction(async tx => ...)`):** O driver PrismaPg não suporta. Usar sequential ops com compensação manual (padrão confirmado em `criarMaleta`).
- **Calcular totais com floats acumulados:** Viola D-17-04. Usar `Math.round()` por linha, somar inteiros.
- **Passar hex hardcoded no JSX:** Viola D-15-02. Usar CSS variables `var(--admin-*)` exclusivamente.
- **Usar `router.push()` após sucesso no PDV:** O UI-SPEC especifica reset de state in-place — desmonta steps, monta splash no mesmo componente.
- **Criar variante de busca sem filtrar `stock_quantity > 0`:** Produtos sem estoque não devem aparecer na lista do PDV.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Error wrapping em actions | try/catch manual | `safeAction` de `@/lib/action-utils` | Projeto padronizou — 100% das actions novas usam |
| Auth guard | lógica inline | `requireAuth(["ADMIN"])` de `@/lib/user` | Cache React deduplicado; RBAC centralizado |
| Busca de cliente por RUC | nova action | `buscarClientePorRuc` de `actions-clientes.ts` | Já implementado na Fase 16 |
| Criação de cliente inline | nova action | `criarCliente` de `actions-clientes.ts` | Já implementado na Fase 16 |
| Lista de categorias | nova action | `getCategories` de `actions-categories.ts` | Já implementado |
| Formatação de moeda | biblioteca | `Intl.NumberFormat("es-PY")` nativo | Padrão do projeto — sem dependência extra |
| Invalidação de cache | `revalidatePath` direto | `invalidateCache.path.admin(...)` | Wrapper centralizado em `src/lib/cache/invalidate.ts` |
| Decremento atômico de estoque | transaction interativa | Sequential ops + compensação (padrão `criarMaleta`) | PrismaPg driver não suporta interactive transactions |
| Step indicator | componente customizado | `AdminStepIndicator` existente | Já tem os estilos de step ativo/concluído/inativo |
| Empty state | markup inline | `AdminEmptyState` existente | Encapsula `admin-empty` CSS class |
| Busca com filtro | select nativo custom | `AdminFilterBar` existente | Já tem padrão de search + select para filtros |

**Key insight:** 80% das ações necessárias já existem. A Fase 16 criou schema + actions de clientes. A `maleta/nova` criou o padrão de busca + carrinho. O único código genuinamente novo são `actions-cotizacion.ts`, `actions-pdv.ts:getVariantsParaPdv`, `actions-pdv.ts:criarVentaLoja`, e as duas páginas de UI.

---

## Common Pitfalls

### Pitfall 1: cliente_id não-nullable — schema gap crítico

**O que vai errar:** `VentaLoja.cliente_id` é `String @db.Uuid` (NOT NULL) no schema atual. A decisão D-17-PDV-01 requer `clienteId: null` para consumidor final. Tentar criar uma `VentaLoja` com `cliente_id: null` lançará um erro de constraint no Postgres.

**Por que acontece:** A Fase 16 criou o schema antes de D-17-PDV-01 ser definido como locked. A CONTEXT.md da Fase 17 especifica o comportamento, mas o schema não foi atualizado.

**Como evitar:** Wave 0 DEVE incluir uma migration Prisma que torna `cliente_id` nullable:
```prisma
// prisma/schema.prisma
model VentaLoja {
  cliente_id         String?  @db.Uuid  // era: String @db.Uuid
  cliente      Cliente?        @relation(...)  // era: Cliente (não optional)
}
```
Gerar migration com `npx prisma migrate dev --name "make-venta-loja-cliente-nullable"`.

**Warning signs:** Erro Postgres `null value in column "cliente_id" violates not-null constraint`.

---

### Pitfall 2: stock_quantity já é o estoque real — não recalcular com reservas

**O que vai errar:** O CONTEXT.md descreve estoque disponível como `product.quantity − sum(maletaItem reservas)`. Se o executor implementar essa query com JOIN em maletas ativas, vai calcular dobro — porque `stock_quantity` JÁ foi decrementado quando a maleta foi criada.

**Por que acontece:** A descrição no CONTEXT.md reflete a lógica conceitual de negócio, não a implementação física. `criarMaleta` decrementa `stock_quantity` imediatamente (linha 231 de `actions-maletas.ts`); `conferirEFecharMaleta` incrementa de volta (linha 555). O campo sempre reflete o estoque líquido real.

**Como evitar:** Na query de produtos para o PDV, usar `where: { stock_quantity: { gt: 0 } }` diretamente — exatamente como `getAvailableVariants` já faz.

---

### Pitfall 3: Interactive transaction não funciona com PrismaPg

**O que vai errar:** Usar `await prisma.$transaction(async (tx) => { ... })` causa erro silencioso ou exception com o driver PrismaPg.

**Por que acontece:** O header do `actions-maletas.ts` documenta explicitamente: "Prisma 7 + PrismaPg driver adapter does NOT support interactive transactions". A solução é o batch format `$transaction([...ops])` OU sequential ops com compensação.

**Como evitar:** Seguir o padrão de `criarMaleta` — sequential ops com array `stockErrors[]` para rastrear falhas e compensation rollback.

---

### Pitfall 4: Aceitar cotização do payload do cliente

**O que vai errar:** Se a Server Action `criarVentaLoja` aceitar `brlToPyg` e `usdToPyg` do input do client, um atacante pode manipular a taxa de câmbio.

**Por que acontece:** É tentador passar a cotização exibida no Step 3 diretamente para a action.

**Como evitar:** A action SEMPRE faz `findFirst({ orderBy: { created_at: "desc" } })` internamente. O payload do client pode passar `moneda` (enum seguro) e os `itens`, mas nunca as taxas. O `cotizacion_snapshot` salvo é o que veio do DB.

---

### Pitfall 5: Acumular floats para total em PYG

**O que vai errar:** `total_pyg` calculado como `items.reduce((acc, i) => acc + i.precio * i.cotizacion_rate, 0)` acumula erros de ponto flutuante.

**Por que acontece:** Multiplicação de decimais em JS não é exata.

**Como evitar (D-17-04):**
```typescript
// POR LINHA (não acumular float)
const subtotalPyg = Math.round(Number(precioUnitario) * item.cantidad);
// Somar inteiros
const totalPyg = itens.reduce((acc, item) => acc + item.subtotalPyg, 0);
```

---

### Pitfall 6: AdminPageHeader com `breadcrumb` em vez de `admin-header`/`admin-content`

**O que vai errar:** As config pages antigas (`comissoes`, `niveis`) usam `<header className="admin-header">` + `<div className="admin-content">` em vez do componente `AdminPageHeader`. A Fase 15 e o UI-SPEC definem `AdminPageHeader` como padrão.

**Por que acontece:** As config pages existentes são legadas e ainda não foram migradas pela Fase 15.

**Como evitar:** Para as novas telas da Fase 17, usar `AdminPageHeader` com as props corretas, não replicar o padrão antigo de `admin-header` / `admin-content`.

---

### Pitfall 7: Cotização com campo `brl_to_py` (underscore) vs `brlToPyg` (camelCase)

**O que vai errar:** O schema usa `brl_to_py` e `usd_to_py` (snake_case), mas o CONTEXT.md e o código de exemplo usam `brlToPyg` e `usdToPyg` (camelCase). Misturar os dois gera TypeScript errors.

**Por que acontece:** Convenção de naming diferente entre schema Prisma e código TS.

**Como evitar:** No schema, os campos são `brl_to_py` e `usd_to_py`. Ao serializar para TS, mapear explicitamente:
```typescript
const cotizacion = await prisma.cotizacionDia.findFirst(...);
// Usar: cotizacion.brl_to_py, cotizacion.usd_to_py
// Mapear para DTO: { brlToPyg: Number(cotizacion.brl_to_py), usdToPyg: Number(cotizacion.usd_to_py) }
```

---

## Code Examples

### Busca de variantes para PDV (nova action)

```typescript
// Source: baseado em getAvailableVariants (actions-maletas.ts linha 972) verificado
export async function getVariantsParaPdv(params?: {
  search?: string;
  categoryId?: string;
}): Promise<ActionResult<VariantParaPdv[]>> {
  return safeAction(async () => {
    await requireAuth(["ADMIN"]);

    const where: Prisma.ProductVariantWhereInput = { stock_quantity: { gt: 0 }, ativo: true };

    if (params?.search) {
      where.product = {
        name: { contains: params.search, mode: "insensitive" },
        ativo: true,
      };
    } else {
      where.product = { ativo: true };
    }

    if (params?.categoryId && params.categoryId !== "all") {
      (where.product as Prisma.ProductWhereInput).categories = {
        some: { category_id: params.categoryId },
      };
    }

    const variants = await prisma.productVariant.findMany({
      where,
      include: {
        product: {
          select: { id: true, name: true, images: true, price: true },
        },
      },
      orderBy: { product: { name: "asc" } },
      take: 50,
    });

    return variants.map(v => ({
      id: v.id,
      attribute_name: v.attribute_name,
      attribute_value: v.attribute_value,
      price: v.price ? Number(v.price) : (v.product.price ? Number(v.product.price) : null),
      stock_quantity: v.stock_quantity,
      product: { id: v.product.id, name: v.product.name, images: v.product.images as string[] },
    }));
  }, { actionName: "getVariantsParaPdv" });
}
```

### Historial de cotizaciones (tabela)

```typescript
// Source: D-17-01 CONTEXT.md — insert-por-update pattern
export async function getHistorialCotizaciones(limit = 20): Promise<ActionResult<CotizacionHistorialItem[]>> {
  return safeAction(async () => {
    await requireAuth(["ADMIN"]);
    const registros = await prisma.cotizacionDia.findMany({
      orderBy: { created_at: "desc" },
      take: limit,
    });
    return registros.map(r => ({
      id: r.id,
      brlToPyg: Number(r.brl_to_py),
      usdToPyg: Number(r.usd_to_py),
      createdAt: r.created_at.toISOString(),
    }));
  }, { actionName: "getHistorialCotizaciones" });
}
```

### Formatação de cotização para display (UI-SPEC)

```typescript
// Source: UI-SPEC 17 — Exchange Rate Display section
function formatCotizacion(value: number): string {
  return new Intl.NumberFormat("es-PY", {
    maximumFractionDigits: 0,
    useGrouping: true,
  }).format(value); // "7.800"
}

function formatCotizacionDisplay(brlToPyg: number, usdToPyg: number, createdAt: string): string {
  const date = new Date(createdAt);
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `1 USD = ${formatCotizacion(usdToPyg)} Gs. · Actualizado ${dd}/${mm} ${hh}:${min}`;
}
```

---

## Schema Verificado — Campos Relevantes para Fase 17

### CotizacionDia

```prisma
// Source: prisma/schema.prisma (verificado)
model CotizacionDia {
  id         String   @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  brl_to_py  Decimal  @db.Decimal(12, 2)   // BRL → PYG
  usd_to_py  Decimal  @db.Decimal(12, 2)   // USD → PYG
  created_at DateTime @default(now()) @db.Timestamptz()
  @@map("cotizacion_dia")
}
```

**Nota:** NÃO há `created_by` no model atual. O CONTEXT.md mostra `createdBy: user.profileId` no snippet de exemplo, mas o schema não tem esse campo. Não há necessidade de salvar quem configurou para v1.4 — a Fase 17 não deve adicionar esse campo sem uma migration explícita.

### VentaLoja (com gap crítico marcado)

```prisma
// Source: prisma/schema.prisma (verificado)
model VentaLoja {
  id                 String   @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  cliente_id         String   @db.Uuid    // ⚠️ DEVE ser String? — requer migration Wave 0
  total              Decimal  @db.Decimal(12, 2)
  moneda             Moneda               // enum: PYG | USD | BRL
  total_pyg          Decimal  @db.Decimal(12, 2)
  talonario          String?              // null em v1.4 (factura = v1.5)
  numero_factura     String?              // null em v1.4
  tipo_operacion     String?              // null em v1.4
  cotizacion_snapshot Json    @default("{}")  // snapshot imutável {brl_to_py, usd_to_py, cotizacion_id}
  created_by         String   @db.Uuid
  created_at         DateTime @default(now()) @db.Timestamptz()
  updated_at         DateTime @default(now()) @updatedAt @db.Timestamptz()
  @@map("ventas_loja")
}
```

### VentaLojaItem

```prisma
// Source: prisma/schema.prisma (verificado)
model VentaLojaItem {
  id                  String   @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  venta_loja_id       String   @db.Uuid
  product_variant_id  String   @db.Uuid
  cantidad            Int
  precio_unitario     Decimal  @db.Decimal(12, 2)
  subtotal            Decimal  @db.Decimal(12, 2)
  created_at          DateTime @default(now()) @db.Timestamptz()
  // onDelete: Cascade (via VentaLoja relation)
  @@map("venta_loja_itens")
}
```

### EstoqueMovimento — tipo venda_loja já existe

```prisma
// Source: prisma/schema.prisma (verificado)
enum EstoqueMovimentoTipo {
  reserva_maleta
  devolucao_maleta
  ajuste_manual
  venda_direta
  venda_loja    // ✅ criado na Fase 16 — usar em criarVentaLoja
  @@map("estoque_movimento_tipo")
}

model EstoqueMovimento {
  // ...
  venta_loja    VentaLoja? @relation(fields: [venta_loja_id], references: [id])
  venta_loja_id String?    @db.Uuid
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Config pages com `<header className="admin-header">` | `AdminPageHeader` component | Fase 15+ | Novas telas usam componente — não replicar markup legado |
| `throw new Error(...)` em actions | `throw new BusinessError(...)` + `safeAction` wrapper | Fases anteriores | Todas as actions novas seguem `safeAction` |
| Interactive transaction `$transaction(async tx => ...)` | Sequential ops + compensação manual | Migração para PrismaPg driver | Documentado em header de `actions-maletas.ts` |

**Deprecated/outdated:**
- Padrão `try/catch` manual em actions (fases antigas): Substituído por `safeAction`. Não reintroduzir.
- `async function _fecharMaleta` / `_conciliarMaleta`: Funções legadas não exportadas em `actions-maletas.ts`. Não referenciar.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `ProductVariant.price` é o preço em Guaraníes (PYG) — moeda base do catálogo | Code Examples — criarVentaLoja | Se price fosse em outra moeda, o cálculo de total_pyg estaria errado |
| A2 | `CotizacionDia` não tem campo `created_by` (não está no schema) | Schema Verificado | Se o CONTEXT.md exige `created_by`, uma migration adicional seria necessária |
| A3 | O PDV deve filtrar variantes por `ativo: true` na query (igual a produtos) | Code Examples — getVariantsParaPdv | Se variantes inativas tivessem stock > 0, apareceriam na busca |

---

## Open Questions

1. **Preço em PYG vs. preço em outra moeda**
   - O que sabemos: `ProductVariant.price` é `Decimal?` sem campo de moeda explícito
   - O que não está claro: O catálogo admin trata price como PYG por convenção ou existe conversão?
   - Recomendação: Verificar `fmtCurrency` em `src/lib/maleta-helpers.ts` — se formata como PYG, confirma o padrão

2. **`created_by` em CotizacionDia**
   - O que sabemos: O schema atual NÃO tem esse campo; o snippet do CONTEXT.md inclui `createdBy: user.profileId`
   - O que não está claro: Era intenção ter esse campo auditável ou foi um erro no snippet?
   - Recomendação: Implementar sem `created_by` por ora (v1.4); se necessário para auditoria, adicionar migration separada

3. **Timezone do display de cotização**
   - O que sabemos: UI-SPEC exige `HH:mm` em timezone Assunção (`America/Asuncion`)
   - O que não está claro: `created_at` é stored como UTC no Postgres (`@db.Timestamptz()`); o front-end precisa converter
   - Recomendação: Usar `new Intl.DateTimeFormat("es-PY", { timeZone: "America/Asuncion", ... })` no client

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Prisma Client (gerado) | actions-cotizacion.ts, actions-pdv.ts | Confirmado (schema existe) | v7.x | — |
| `npx prisma migrate dev` | Wave 0 — migration nullable | Deve ser executado | CLI disponível | — |
| lucide-react | Ícones do PDV | Confirmado (em uso no projeto) | Instalado | — |
| shadcn/ui | Input, Button, Badge | Confirmado (inicializado) | Instalado | — |

**Bloqueadores:** Nenhum. Todas as dependências confirmadas.

---

## Project Constraints (from CLAUDE.md)

- **Idioma da UI:** espanhol paraguaio em todas as interfaces
- **Paper MCP antes de implementar telas:** Obrigatório (D-15-01); consultar artboard antes de escrever JSX
- **Tokens `--admin-*`:** Nenhum hex/px hardcoded em JSX de produção (D-15-02)
- **`requireAuth` via `getCurrentUser` cached:** Sempre importar de `@/lib/user` — nunca chamar `supabase.auth.getUser()` diretamente em Server Components
- **`force-dynamic`:** Obrigatório em todas as páginas de `/admin/*` autenticadas
- **Defesa em profundidade:** Guard em Server Action (requireAuth) + validação de stock (fail fast antes da transaction) + re-validação implícita no Postgres via constraints
- **PII:** Nunca logar dados de cliente (nome, RUC, telefone) em `console.error`
- **`git push client <branch>`:** Remote correto para o repo do cliente

---

## Sources

### Primary (HIGH confidence — verificado diretamente no codebase)

- `prisma/schema.prisma` — models CotizacionDia, Cliente, VentaLoja, VentaLojaItem, EstoqueMovimento, Moneda enum
- `src/app/admin/actions-maletas.ts` — padrão completo de criarMaleta (pré-leitura, sequential ops, compensação)
- `src/app/admin/actions-clientes.ts` — buscarClientePorRuc, criarCliente, safeAction wrapper pattern
- `src/app/admin/maleta/nova/page.tsx` — padrão de busca/carrinho com AdminStepIndicator
- `src/components/admin/AdminStepIndicator.tsx` — props: steps, currentStep
- `src/components/admin/AdminEmptyState.tsx` — props: icon, title, description, action
- `src/components/admin/AdminFilterBar.tsx` — props: searchValue, onSearchChange, filters
- `src/components/admin/AdminPageHeader.tsx` — props: title, description, breadcrumb, backHref, action
- `src/lib/user.ts` — requireAuth, getCurrentUser (React.cache)
- `src/lib/action-utils.ts` — safeAction, BusinessError, ActionResult
- `src/lib/cache/invalidate.ts` — invalidateCache.path.admin
- `src/app/admin/actions-categories.ts` — getCategories
- `.planning/phases/17-pdv-core-cotizacion-fluxo-venda/17-CONTEXT.md` — decisões locked
- `.planning/phases/17-pdv-core-cotizacion-fluxo-venda/17-UI-SPEC.md` — contrato visual completo
- `.planning/config.json` — nyquist_validation: false

### Secondary (MEDIUM confidence)

- `src/app/admin/config/comissoes/page.tsx` + `config/niveis/page.tsx` — padrão de RSC config page (usados como referência visual, mas padrão legado — novas telas usam AdminPageHeader)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — tudo verificado diretamente no código
- Architecture: HIGH — baseado em padrões estabelecidos e código existente
- Schema gap (cliente_id nullable): HIGH — verificado no schema, discrepância clara com D-17-PDV-01
- Pitfalls: HIGH — todos com evidência direta no código (cabeçalho de actions-maletas.ts, schema)

**Research date:** 2026-05-08
**Valid until:** 2026-06-07 (30 dias — stack estável)
