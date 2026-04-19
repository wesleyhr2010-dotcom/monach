# Changelog — Monarca Semijoyas

## 2026-02-24 — Sessão 1: Homepage Migration

### Criado
- **Projeto Next.js 15** inicializado (App Router, TypeScript, Tailwind v4, ESLint)
- **Design system** em `globals.css`: Montserrat + Inter, cores da marca, container customizado
- **11 componentes** criados:
  - `Header.tsx` — Announcement bar animado, nav sticky transparent→solid, hamburger menu, logo centralizado, ícones search/cart
  - `HeroBanner.tsx` — Banner full-width com `banner01.jpg`, gradiente de topo (preto→transparente 50%), gradiente lateral (esquerda→direita)
  - `ValueProps.tsx` — 3 cards horizontais (Elegancia, Hechas para vos, Atención)
  - `CategoryTabs.tsx` — Tabs interativos (Aro, Pulsera, Collar, Anillo)
  - `ProductCard.tsx` — Card de produto reutilizável (imagem + nome + preço ₲)
  - `CategoryBanner.tsx` — Banner de categoria com overlay e label
  - `ProductGrid.tsx` — Grid assimétrico misturando ProductCards e CategoryBanners em 4 linhas
  - `ResellerCTA.tsx` — "Sé una Revendedora Autorizada" com gradiente bottom→top
  - `HistoryCTA.tsx` — "Conoce Nuestra Historia" com gradiente top→bottom
  - `FAQ.tsx` — Accordion pill-shaped com 5 perguntas
  - `Footer.tsx` — 3 colunas (enlaces, redes, copyright)
- **Page assembly** em `page.tsx` como Server Component
- **Placeholder SVGs** para produtos e categorias
- **SEO metadata** configurado (title, description, OpenGraph)

### Modificado
- `HeroBanner.tsx` — Imagem trocada de placeholder para `banner01.jpg` (real)
- `HeroBanner.tsx` — Adicionado gradiente de topo `linear-gradient(180deg, #000, transparent 50%)` conforme design WordPress original
- `Header.tsx` — Tentativa de extrair ícone do carrinho para `carrinho.svg`; revertido para SVG inline (arquivo deletado pelo usuário)

### Verificado
- ✅ Build com zero erros
- ✅ Dev server rodando em localhost:3000
- ✅ Screenshots visuais de todas as seções em 1440px
- ✅ Layout consistente com design original do WordPress

## 2026-02-24 — Sessão 2: Painel de Administração e Gestão de Produtos

### Criado
- **Painel Administrativo (`/admin`)** protegido, com layout em Sidebar escura estilo Vercel.
- **Tabela de Produtos (`/admin/produtos`)** com listagem SSR, paginação, busca por nome/SKU e filtro por categoria.
- **Formulário de Produtos (`/admin/produtos/novo` e `[id]`)**:
  - `ImageUploader`: Componente drag-and-drop com upload direto para Cloudflare R2 (bucket `fotos-monarca`).
  - `VariantManager`: Gerenciamento unificado de atributos e precificação para produtos variáveis.
  - `CategorySelect`: Dropdown avançado aninhado, com auto-seleção inteligente de categorias parent/child e busca.
- **Hierarquia de Categorias (`/admin/categorias`)**:
  - Tabela em árvore (Tree View) representando níveis de indentação.
  - CRUD inline completo (edição de nome, remoção com deleção em cascata, adição rápida de subcategorias pai/filho).

### Banco de Dados (Supabase)
- Adição de `parent_id` e `sort_order` à tabela de `categories`.
- Criação de scripts de migração (`seed-hierarchy.ts` e `migrate-products.ts`) que mapearam o caminho textual original legado (ex: `Aros > Grandes`) em nós relacionais em árvore robustos.
- Conexão e armazenamento corretos em bucket de Storage customizado via `S3Client`.

### Verificado
- ✅ Build otimizada do Next.js passando sem vazamento de erros de Hidratação (fix aplicado no RootLayout).
- ✅ Relacionamento Bidirecional de Categorias operando suavemente no Componente.
- ✅ Upload de imagens funcionando com feedback visual em tempo real.

## 2026-02-24 — Sessão 3: Página de Produto Pública e Integração de Dados

### Criado
- **Rota dinâmica `/produto/[slug]/page.tsx`**: Página pública de detalhe do produto com layout em duas colunas:
  - Coluna esquerda: Imagem principal responsiva (aspect 4:5).
  - Coluna direita: Nome, preço (₲), botão "Agregar a mi joyero", descrição e SKU.
- **Server Actions públicas (`src/app/actions.ts`)**:
  - `getProductBySlug()` — busca produto completo com variantes.
  - `getRelatedProducts()` — busca produtos para seção "Más Productos para Explorar".
- **Seção de produtos relacionados** com grid 2×2 (mobile) / 4 colunas (desktop) no fim da página.
- **Faixa de envíos** — barra preta estática com mensagem de frete.

### Modificado
- `ProductCard.tsx` — Agora recebe `id` como prop e envolve o card com `<Link>` para `/produto/{id}`.
- `ProductGrid.tsx` — Convertido de componente estático com dados mock para **Server Component async** que busca dados reais do Supabase.
- `CategorySelect.tsx` — Seleção inteligente: marcar filho auto-seleciona o pai; desmarcar pai remove todos os filhos.
- `layout.tsx` — Adicionado `suppressHydrationWarning` para suprimir erros de hydration causados por extensões do navegador.

### Scripts de Migração
- `scripts/migrate-products.ts` — Migrou 2014 produtos de caminhos flat legado ("Collar > Con dije") para nomes de nó corretos da árvore hierárquica.

### Verificado
- ✅ Página de produto renderiza dados reais do banco (nome, preço, descrição, SKU, imagem).
- ✅ Grid da homepage puxa produtos reais do Supabase com links funcionais.
- ✅ Navegação Homepage → Produto funcionando corretamente.
- ✅ Build sem erros de hydration.
