# Patrones de Código — Monarca Semijoyas

## Convenciones Generales

1. **Lenguaje del código**: Inglés (nombres de componentes, variables, props)
2. **Lenguaje del contenido de UI**: **Español** ✅ — todos los textos visibles al usuario (botones, labels, mensajes de error, notificaciones, etc.) deben estar en español
3. **Idioma de la documentación (`.docs/`)**: Español
4. **Formateo**: Prettier defaults (indentación 4 espacios en TSX)

---

## Componentes

### Nomenclatura
- PascalCase para componentes: `ProductCard.tsx`, `HeroBanner.tsx`
- Um componente por arquivo
- Arquivo = nome do componente

### Estrutura de componente
```tsx
// 1. Imports
import Image from "next/image";

// 2. Types/Interfaces (se necessário)
interface ProductCardProps {
  name: string;
  price: string;
  image: string;
}

// 3. Component (named export default)
export default function ProductCard({ name, price, image }: ProductCardProps) {
  return (
    <article className="...">
      {/* conteúdo */}
    </article>
  );
}
```

### Client vs Server
```
"use client";  ← SOMENTE na primeira linha, SOMENTE quando necessário
```

**Necessário quando:** `useState`, `useEffect`, `useCallback`, event handlers (`onClick`, `onChange`)

**NÃO necessário quando:** Renderizar HTML estático, receber props, usar `next/image`, `next/link`

---

## Tailwind CSS

### Ordem de classes (recomendada)
1. Layout: `flex`, `grid`, `relative`, `absolute`
2. Sizing: `w-full`, `h-[630px]`, `max-w-md`
3. Spacing: `py-10`, `px-5`, `gap-5`, `mb-5`
4. Typography: `text-base`, `font-inter`, `uppercase`, `tracking-[4px]`
5. Colors: `text-white`, `bg-black`
6. Effects: `overflow-hidden`, `transition-all`, `hover:scale-105`

### Valores arbitrários
- Usar `[]` para valores específicos: `h-[630px]`, `tracking-[19px]`
- Preferir tokens do design system quando possível

### Responsividade (mobile-first)
```
text-sm md:text-base lg:text-lg
grid-cols-2 md:grid-cols-4
```

---

## Imagens

### Background images (hero, CTAs):
```tsx
<div className="relative ...">
  <Image src="..." alt="..." fill className="object-cover" sizes="100vw" />
  <div className="absolute inset-0 bg-gradient-to-..." /> {/* overlay */}
  <div className="relative z-10">...</div> {/* content */}
</div>
```

### Product images (grid):
```tsx
<div className="relative overflow-hidden aspect-[260/340]">
  <Image src="..." alt="..." fill className="object-cover" sizes="..." />
</div>
```

---

## Estrutura de Seção

Todas as seções seguem o mesmo padrão:

```tsx
<section className="py-16 md:py-20 bg-white">
  <div className="container-monarca">
    {/* Conteúdo da seção */}
  </div>
</section>
```

Para seções full-bleed (com imagem de fundo):
```tsx
<section className="relative w-full h-[700px] flex items-center overflow-hidden">
  {/* Background + overlays */}
  <div className="container-monarca relative z-10">
    {/* Conteúdo */}
  </div>
</section>
```

---

## Links & Navegação

- Usar `next/link` para navegação interna: `<Link href="/nosotros">`
- Usar `<a>` com `target="_blank" rel="noopener noreferrer"` para links externos
- Sempre incluir `aria-label` em botões com ícones

---

## SEO

- Metadata definido no `layout.tsx` (title, description, keywords, openGraph)
- HTML semântico: `<header>`, `<main>`, `<section>`, `<article>`, `<footer>`, `<nav>`
- Um `<h1>` por página
- Alt text descritivo em todas as imagens

---

## Server Actions

### Organização
- `src/app/admin/actions.ts` — CRUD de produtos/categorias (admin, usa `SUPABASE_SERVICE_ROLE_KEY`)
- `src/app/actions.ts` — Leitura pública de dados do storefront (usa `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

### Regras
1. Todo arquivo `"use server"` **só pode exportar funções async**. Helpers síncronos devem ser `const` (sem `export`).
2. Funções retornam `{ success, error?, data? }` para mutações ou o dado diretamente para queries.
3. Revalidação de paths é feita com `revalidatePath()` após mutações.

```ts
// ✅ Correto — helper privado
const createClient = () => createClient(url, key);

// ✅ Correto — server action exportada
export async function getProducts() { ... }

// ❌ Errado — export de função síncrona em arquivo "use server"
export const createClient = () => { ... }
```

---

## Admin Panel

### Estrutura de rotas
```
src/app/admin/
├── layout.tsx          ← AdminLayout (sidebar + dark theme)
├── page.tsx            ← Dashboard com stats
├── actions.ts          ← Server Actions (CRUD)
├── admin.css           ← CSS do admin (variáveis + componentes)
├── produtos/
│   ├── page.tsx        ← Listagem com tabela
│   ├── novo/page.tsx   ← Formulário de criação
│   ├── [id]/page.tsx   ← Formulário de edição
│   ├── ProductForm.tsx ← Formulário reutilizável
│   ├── CategorySelect.tsx ← Dropdown hierárquico
│   └── ...outros componentes
└── categorias/
    ├── page.tsx        ← Gerenciador de categorias
    └── CategoryManager.tsx ← Tree view + CRUD inline
```

### CSS Admin customizado (NÃO usa Tailwind)
O admin usa classes prefixadas com `admin-` definidas em `admin.css`:
- `.admin-card`, `.admin-btn`, `.admin-input`, `.admin-table`
- Variáveis CSS: `--admin-bg`, `--admin-surface`, `--admin-border`, `--admin-primary`

---

## Data Fetching (Storefront)

### Padrão de página dinâmica
```tsx
// src/app/produto/[slug]/page.tsx
export async function generateMetadata({ params }: Props) {
    const { slug } = await params;
    const product = await getProductBySlug(slug);
    return { title: product?.name };
}

export default async function ProductPage({ params }: Props) {
    const { slug } = await params;
    const product = await getProductBySlug(slug);
    if (!product) notFound();
    return <div>...</div>;
}
```

### Componentes Server async
```tsx
// Componentes que buscam dados diretamente
export default async function ProductGrid() {
    const products = await getRelatedProducts(10);
    return <div>{products.map(p => <ProductCard key={p.id} {...p} />)}</div>;
}
```

---

## Performance Patterns

### Auth: sempre usar `getCurrentUser()` (cached)

```ts
// ✅ Correto — deduplica via React.cache()
import { getCurrentUser } from "@/lib/user";

export default async function AdminPage() {
    const user = await getCurrentUser(); // 1ª chamada: executa
    const data = await someAction();      // internamente chama getCurrentUser → usa cache
    // ...
}

// ❌ Errado — bypassa o cache, cria nova conexão
const supabase = await createSupabaseSSRClient();
const { data: { user } } = await supabase.auth.getUser();
```

### Middleware: sem query ao banco

```ts
// ✅ Middleware apenas refresca token e redireciona
export async function updateSession(request: NextRequest) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user && isProtectedRoute) redirect("/login");
    return supabaseResponse;
}

// ❌ Nunca fazer isso no middleware
await supabase.from('resellers').select('role').eq('auth_user_id', user.id);
await prisma.reseller.findUnique({ where: { auth_user_id: user.id } });
```

### Rotas: ISR para público, force-dynamic para autenticado

```ts
// ✅ Página pública — ISR com revalidação
export const revalidate = 60;

// ✅ Página autenticada — sempre fresco
export const dynamic = "force-dynamic";

// ❌ Nunca usar force-dynamic em página pública sem motivo
export const dynamic = "force-dynamic"; // em homepage ou catálogo
```

