# SPEC — Admin: Gestão de Produtos e Categorias

**Rotas (SUPER_ADMIN only):**
- `/admin/produtos` — Lista de produtos
- `/admin/produtos/novo` — Cadastrar produto
- `/admin/produtos/[id]` — Editar produto + variantes + estoque
- `/admin/categorias` — CRUD de categorias

---

## Schema Real (Prisma)

```prisma
// Modelos existentes — referência para esta spec:

model Product {
  id                String   @id @db.Uuid
  sku               String   @unique
  name              String
  short_description String   @default("")
  description       String   @default("")
  price             Decimal? @db.Decimal(12, 2)  // Preço genérico (sem variantes)
  images            String[] @default([])        // URLs das imagens no R2
  product_type      String   @default("simple")  // "simple" | "variable"

  variants    ProductVariant[]
  categories  ProductCategory[]
}

model ProductVariant {
  id              String  @id @db.Uuid
  product_id      String  @db.Uuid
  attribute_name  String  // Ex: "Cor", "Tamanho"
  attribute_value String  // Ex: "Dourado", "P"
  price           Decimal? @db.Decimal(12, 2)
  sku             String?
  in_stock        Boolean @default(true)
  stock_quantity  Int     @default(0)  // ← Campo importante para maletas
}

model Category {
  id         String  @id @db.Uuid
  name       String  @unique
  slug       String  @unique
  parent_id  String? @db.Uuid  // Suporte a subcategorias
  sort_order Int     @default(0)

  parent   Category?  @relation("CategoryHierarchy")
  children Category[] @relation("CategoryHierarchy")
  products ProductCategory[]
}

// Novo modelo necessário: Histórico de movimentação de estoque
model EstoqueMovimento {
  id                 String   @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  product_variant_id String   @db.Uuid
  quantidade         Int      // + entrada / - saída manual
  tipo               String   // "entrada" | "ajuste_manual" | "reserva_maleta" | "devolucao_maleta"
  motivo             String   @default("")   // Observação livre
  admin_id           String?  @db.Uuid      // Quem fez o ajuste
  created_at         DateTime @default(now()) @db.Timestamptz()

  product_variant ProductVariant @relation(fields: [product_variant_id], references: [id])
  @@map("estoque_movimentos")
}
```

> **Adição necessária:** `EstoqueMovimento` para audit trail de movimentações. Adicionar ao `schema.prisma` e gerar migration.

---

## Tela 1: Lista de Produtos `/admin/produtos`

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Produtos                                    [+ Novo Produto] │
│                                                              │
│  [🔍 Buscar por nome ou SKU...] [Categoria ▼] [Status ▼]   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ [img] │ Nome / SKU           │ Preço    │ Estoque    │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │ [🔴]  │ Gargantilha Dourada  │ G$1.250  │ ⚠️  2 est. │   │
│  │       │ SKU: MON-GAR-001     │          │ [Editar →] │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │ [img] │ Ring Ouro Rosé       │ G$890    │ ✅ 14 est. │   │
│  │       │ SKU: MON-RNG-002     │          │ [Editar →] │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │ [img] │ Brincos Argola       │ --       │ 3 variantes│   │
│  │       │ SKU: MON-BRI-003     │          │ [Editar →] │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ⚠️ 4 produtos com estoque baixo (< 3 unidades)             │
│  Mostrando 1–20 de 148 produtos          [< Pág 1 2 3 4 >]  │
└─────────────────────────────────────────────────────────────┘
```

### Indicadores Visuais de Estoque

| Estoque | Visual | Threshold |
|---------|--------|-----------|
| Zerado | 🔴 vermelho `"Sem estoque"` | `stock_quantity = 0` |
| Baixo | 🟡 amarelo `"⚠️ 2 est."` | `stock_quantity < 3` |
| Normal | 🟢 verde `"14 est."` | `stock_quantity >= 3` |
| Variantes | Cinza `"3 variantes"` | `product_type = 'variable'` |

### Filtros
| Filtro | Opções |
|--------|--------|
| Categoria | Dropdown de todas as categorias (hierárquico) |
| Status | Todos / Com estoque / Estoque baixo / Sem estoque |
| Tipo | Simples / Com variantes |

---

## Tela 2: Criar / Editar Produto `/admin/produtos/novo` e `/admin/produtos/[id]`

### Layout — Estrutura em Seções

```
┌─────────────────────────────────────────────────────────────┐
│  ← Novo Produto                          [Cancelar] [Salvar] │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  INFORMAÇÕES BÁSICAS                                 │   │
│  │  Nome:  [_______________________________________]    │   │
│  │  SKU:   [___________] (gerado automaticamente)      │   │
│  │                                                      │   │
│  │  Categorias: [Anéis ×] [Ouro ×]  [+ Adicionar]     │   │
│  │                                                      │   │
│  │  Descrição curta:                                    │   │
│  │  [______________________________________________]    │   │
│  │                                                      │   │
│  │  Descrição completa:                                 │   │
│  │  [Editor de texto... ___________________________]   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  IMAGENS                                             │   │
│  │  [+ Adicionar fotos]                                 │   │
│  │                                                      │   │
│  │  [img1 ×] [img2 ×] [img3 ×] [+ ]                   │   │
│  │  Arraste para reordenar. 1ª imagem = capa.           │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  TIPO DE PRODUTO                                     │   │
│  │  ○ Produto Simples (sem variantes)                   │   │
│  │  ● Produto com Variantes                             │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ── Se SIMPLES ─────────────────────────────────────────    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  PREÇO E ESTOQUE                                     │   │
│  │  Preço:   [G$ _______]                              │   │
│  │  Estoque: [_____] unidades                          │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ── Se COM VARIANTES ───────────────────────────────────    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  VARIANTES                          [+ Nova Variante]│   │
│  │                                                      │   │
│  │  ┌───────────────────────────────────────────────┐  │   │
│  │  │ Atributo: [Cor_________] Valor: [Dourado____] │  │   │
│  │  │ SKU:    [MON-GAR-001-D]  Preço: [G$ 1.250]  │  │   │
│  │  │ Estoque: [8]                          [🗑 Del]│  │   │
│  │  └───────────────────────────────────────────────┘  │   │
│  │  ┌───────────────────────────────────────────────┐  │   │
│  │  │ Atributo: [Cor_________] Valor: [Prata______] │  │   │
│  │  │ SKU:    [MON-GAR-001-P]  Preço: [G$ 1.100]  │  │   │
│  │  │ Estoque: [3]                          [🗑 Del]│  │   │
│  │  └───────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Geração Automática de SKU

```ts
// SKU gerado a partir do nome, com sufixo aleatório
function gerarSku(name: string): string {
  const prefix = name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6);
  const suffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `MON-${prefix}-${suffix}`; // Ex: MON-GARGAN-042
}
```

O admin pode sobrescrever o SKU gerado.

### Upload de Imagens (R2)

```ts
// Upload para R2 ao selecionar o arquivo (client-side)
async function uploadImagem(file: File, productId: string): Promise<string> {
  const ext = file.name.split('.').pop();
  const key = `produtos/${productId}/${Date.now()}.${ext}`;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('key', key);

  const res = await fetch('/api/upload-r2', { method: 'POST', body: formData });
  const { url } = await res.json();
  return url; // URL pública do R2
}
```

- Máximo de **10 imagens** por produto
- Formatos aceitos: `.jpg`, `.jpeg`, `.png`, `.webp`
- Tamanho máximo: 5MB por imagem
- A **primeira imagem** é a capa (usada no catálogo e nas maletas)
- Reordenação via drag-and-drop (atualiza o array `Product.images`)

### Server Actions

```ts
// Criar produto
async function createProduct(input: CreateProductInput) {
  const product = await prisma.product.create({
    data: {
      sku: input.sku,
      name: input.name,
      short_description: input.short_description,
      description: input.description,
      price: input.product_type === 'simple' ? input.price : null,
      images: input.images,
      product_type: input.product_type,
    },
  });

  // Criar variantes (se product_type = 'variable')
  if (input.variants) {
    await prisma.productVariant.createMany({
      data: input.variants.map(v => ({
        product_id: product.id,
        attribute_name: v.attribute_name,
        attribute_value: v.attribute_value,
        sku: v.sku,
        price: v.price,
        stock_quantity: v.stock_quantity,
        in_stock: v.stock_quantity > 0,
      })),
    });

    // Criar registro inicial no histórico de estoque
    if (input.variants.some(v => v.stock_quantity > 0)) {
      await registrarEntradaEstoqueInicial(product.id, input.variants);
    }
  }

  // Vincular categorias
  if (input.category_ids?.length) {
    await prisma.productCategory.createMany({
      data: input.category_ids.map(cid => ({
        product_id: product.id,
        category_id: cid,
      })),
    });
  }

  return product;
}
```

---

## Seção: Gestão de Estoque (dentro de `/admin/produtos/[id]`)

### Aba "Estoque" no Produto

```
┌─────────────────────────────────────────────────────────────┐
│  Estoque — Gargantilha Dourada                              │
│                                                              │
│  ─── Situação Atual ──────────────────────────────────────  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Variante      │ Estoque │ Em Maleta │ Disponível     │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │ Cor: Dourado  │  8 un.  │   3 un.   │  5 un. [+/-]  │   │
│  │ Cor: Prata    │  3 un.  │   0 un.   │  3 un. [+/-]  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ─── Ajustar Estoque ─────────────────────────────────────  │
│  Variante: [Cor: Dourado ▼]                                 │
│  Tipo:     ● Entrada  ○ Saída Manual                        │
│  Quantidade: [___8___]                                      │
│  Motivo: [Reposição de fornecedor _______________]          │
│                                                              │
│  [Registrar Ajuste]                                         │
│                                                              │
│  ─── Histórico ───────────────────────────────────────────  │
│  15 Dez · Reserva Maleta   -3   → 8 un.  (auto)            │
│  10 Dez · Entrada Estoque  +20  → 11 un. (admin@mail.com)  │
│  05 Dez · Devolução Maleta +2   → -9 un. (auto)            │
└─────────────────────────────────────────────────────────────┘
```

### Campos do Histórico
| Campo | Valor |
|-------|-------|
| `tipo` | `"entrada"` `"ajuste_manual"` `"reserva_maleta"` `"devolucao_maleta"` |
| `quantidade` | Positivo = entrada / Negativo = saída |
| `motivo` | Texto livre (obrigatório em ajustes manuais) |
| `admin_id` | ID do admin que fez o ajuste (null se automático) |

### Estoque "Em Maleta"

Calculado em runtime:
```ts
const estoque_em_maleta = await prisma.maletaItem.aggregate({
  where: {
    product_variant_id: variantId,
    maleta: { status: { in: ['ativa', 'atrasada', 'aguardando_revisao'] } },
  },
  _sum: { quantidade_enviada: true },
}).then(r => (r._sum.quantidade_enviada ?? 0) - /* vendidos */ );
```

> O estoque **disponível para novas maletas** = `stock_quantity` − `em_maleta_ativo`.

### Server Action: `ajustarEstoque(variantId, quantidade, tipo, motivo, adminId)`

```ts
async function ajustarEstoque(input: {
  product_variant_id: string;
  quantidade: number;        // positivo ou negativo
  tipo: 'entrada' | 'ajuste_manual';
  motivo: string;
  admin_id: string;
}) {
  return prisma.$transaction(async (tx) => {
    // 1. Atualizar stock_quantity
    await tx.productVariant.update({
      where: { id: input.product_variant_id },
      data: {
        stock_quantity: { increment: input.quantidade },
        in_stock: true, // será reavaliado após update
      },
    });

    // 2. Verificar se ficou negativo (não permitido em ajuste manual)
    const variant = await tx.productVariant.findUnique({
      where: { id: input.product_variant_id },
    });
    if (variant!.stock_quantity < 0) {
      throw new Error('Estoque não pode ficar negativo');
    }

    // 3. Atualizar in_stock
    await tx.productVariant.update({
      where: { id: input.product_variant_id },
      data: { in_stock: variant!.stock_quantity > 0 },
    });

    // 4. Registrar no histórico
    await tx.estoqueMovimento.create({
      data: {
        product_variant_id: input.product_variant_id,
        quantidade: input.quantidade,
        tipo: input.tipo,
        motivo: input.motivo,
        admin_id: input.admin_id,
      },
    });
  });
}
```

---

## Tela 3: Categorias `/admin/categorias`

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Categorias                               [+ Nova Categoria] │
│                                                              │
│  ─── Principais ──────────────────────────────────────────  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  🗂️ Anéis                    42 produtos  [Edit] [🗑]  │   │
│  │     └── 🏷️ Solitários       18 produtos  [Edit] [🗑]  │   │
│  │     └── 🏷️ Aliança          14 produtos  [Edit] [🗑]  │   │
│  │     └── 🏷️ Cocktail         10 produtos  [Edit] [🗑]  │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │  🗂️ Colares e Gargantilhas   31 produtos  [Edit] [🗑]  │   │
│  │     └── 🏷️ Gargantilha      20 produtos  [Edit] [🗑]  │   │
│  │     └── 🏷️ Colar Longo      11 produtos  [Edit] [🗑]  │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │  🗂️ Brincos                  28 produtos  [Edit] [🗑]  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Arraste para reordenar. A ordem define o menu do catálogo. │
└─────────────────────────────────────────────────────────────┘
```

### Modal: Criar/Editar Categoria

```
┌─────────────────────────────────┐
│  Nova Categoria                 │
│                                 │
│  Nome: [___________________]   │
│  Slug: [___________________]   │
│  (gerado automaticamente)       │
│                                 │
│  Categoria pai: (nenhuma) ▼     │
│  (fazê-la subcategoria)         │
│                                 │
│  Ordem: [___]                   │
│                                 │
│  [Cancelar]   [Salvar]          │
└─────────────────────────────────┘
```

### Regras de Negócio
1. Máximo **2 níveis** de hierarquia (categoria + subcategoria)
2. Não é possível deletar uma categoria que tem produtos vinculados
3. Slug é gerado automaticamente a partir do nome mas é editável
4. `sort_order` define a ordem de exibição no catálogo e na vitrine pública

### Server Actions

```ts
async function createCategory(input: {
  name: string;
  slug?: string;
  parent_id?: string;
  sort_order?: number;
}) {
  const slug = input.slug ?? slugify(input.name);

  // Validar: se tem parent_id, verificar que o parent não é subcategoria
  if (input.parent_id) {
    const parent = await prisma.category.findUniqueOrThrow({
      where: { id: input.parent_id },
    });
    if (parent.parent_id) throw new Error('Máximo 2 níveis de categorias');
  }

  return prisma.category.create({ data: { ...input, slug } });
}

async function deleteCategory(categoryId: string) {
  const count = await prisma.productCategory.count({
    where: { category_id: categoryId },
  });
  if (count > 0) throw new Error(`Categoria tem ${count} produtos vinculados`);
  await prisma.category.delete({ where: { id: categoryId } });
}
```

---

## Atualizar Sidebar do Admin

Adicionar ao `SPEC_ADMIN_LAYOUT.md`:

```
│  📦 Produtos    ← NOVO item na sidebar
│  🏷️  Categorias ← NOVO item na sidebar
│  👜 Maletas
│  👥 Revendedoras
```

---

## Componentes

| Componente | Tipo | Responsabilidade |
|-----------|------|-----------------|
| `ProdutosPage` | Server | Lista paginada com filtros |
| `ProdutoFiltros` | **Client** | Dropdowns + busca |
| `ProdutoForm` | **Client** | Formulário completo (criação/edição) |
| `VariantesEditor` | **Client** | Adicionar/remover variantes inline |
| `ImageUploader` | **Client** | Drag-and-drop + ordenação |
| `EstoqueTab` | Server | Tabela de estoque por variante |
| `AjusteEstoqueForm` | **Client** | Formulário de entrada/saída |
| `HistoricoEstoque` | Server | Log de movimentações paginado |
| `CategoriasPage` | Server | Árvore de categorias |
| `CategoriaForm` | **Client** | Modal de criação/edição |
