# Changelog — Monarca Semijoyas

## 2026-04-22 — Correção de Vulnerabilidades Críticas RBAC

### Corrigido (todas as vulnerabilidades da auditoria 2026-04-22)
- **`src/app/admin/actions-maletas.ts`** — `devolverMaleta`: adicionado `requireAuth(["REVENDEDORA"])` + ownership check (`findFirst({ id, reseller_id })`) + validação de status. `fecharMaleta` e `conciliarMaleta`: removidos exports inseguros (renomeados para `_fecharMaleta` / `_conciliarMaleta`). `getActiveResellers`: adicionado `requireAuth(["ADMIN","COLABORADORA"])` + filtro por `colaboradora_id`. `getAvailableVariants`: adicionado `requireAuth(["ADMIN","COLABORADORA"])`. `getColaboradoras` duplicada removida; importação em `maleta/page.tsx` migrada para `actions-equipe.ts`.
- **`src/app/api/cron/check-overdue-maletas/route.ts`** — `checkOverdueMaletas` convertida de Server Action pública para cron job autenticado por `CRON_SECRET`. Chamada removida do client component `maleta/page.tsx`.
- **`src/lib/user.ts`** — Auto-link por email agora restrito a `role=REVENDEDORA` (previne takeover de perfis ADMIN/COLABORADORA). `getCurrentUser` retorna `null` quando não há perfil no banco, eliminando defaults permissivos (`role=REVENDEDORA`, `isActive=true`).
- **`src/lib/middleware-auth.ts`** — Middleware invertido para fail-closed: só permite `/admin` se `userRole` for explicitamente `'ADMIN'` ou `'COLABORADORA'`; todos os outros casos redirecionam para `/app`.
- **`src/app/app/actions-revendedora.ts`** — `getMinhasMaletas`, `getMinhasVendas`, `getResumoFinanceiro`: adicionado `assertIsInGroup` para COLABORADORA. `registrarVenda`: agora usa `item.preco_fixado` do banco em vez de `input.preco_unitario`; schema e frontend (`RegistrarVentaClient.tsx`) atualizados.
- **`src/__tests__/security/rbac-regression.test.ts`** — 11 testes de regressão cobrindo: (a) chamadas sem sessão retornam `BUSINESS:` error; (b) COLABORADORA não acessa dados fora do grupo; (c) `getCurrentUser` retorna `null` sem perfil.

## 2026-04-22 — Auditoria de Segurança RBAC (follow-up)

### Identificado
Auditoria crítica posterior à primeira implementação do RBAC revelou vulnerabilidades remanescentes — documentadas em `docs/next_steps.md` §Prioridade Crítica e nos novos padrões obrigatórios adicionados em `docs/sistema/SPEC_SECURITY_RBAC.md` §8–10.

- **CRÍTICO:** Server Actions de mutação financeira sem `requireAuth` — `devolverMaleta`, `fecharMaleta`, `conciliarMaleta`, `checkOverdueMaletas` em `src/app/admin/actions-maletas.ts`.
- **CRÍTICO:** Leitura de PII sem autenticação — `getActiveResellers`, `getColaboradoras` (em `actions-maletas.ts`), `getAvailableVariants`.
- **ALTO:** Email auto-linking em `getCurrentUser` permite takeover de perfis ADMIN/COLABORADORA com `auth_user_id=null`.
- **ALTO:** `getMinhasMaletas`, `getMinhasVendas`, `getResumoFinanceiro` em `actions-revendedora.ts` bloqueiam IDOR só para REVENDEDORA — COLABORADORA ainda vê dados fora do grupo (falta `assertIsInGroup`).
- **ALTO:** Middleware fail-open quando `userRole === null` (query Supabase falha → usuário autenticado passa para `/admin`).
- **MÉDIO:** `registrarVenda` aceita `preco_unitario` controlado pelo cliente.
- **MÉDIO:** `getCurrentUser` retorna `REVENDEDORA` ativa por default quando perfil não existe.

### Documentado (implementação pendente)
- **`docs/sistema/SPEC_SECURITY_RBAC.md` §8 "Padrões Obrigatórios — Anti-Patterns Proibidos"** — 8 anti-patterns com exemplo ❌/✅ para usar em code review.
- **`docs/sistema/SPEC_SECURITY_RBAC.md` §9 "Cron Jobs e Actions Automáticas"** — cron não expõe Server Action pública; usar Route Handler autenticado por `CRON_SECRET` ou Edge Function.
- **`docs/sistema/SPEC_SECURITY_RBAC.md` §10 "Testes de Regressão de Segurança"** — 7 casos mínimos por Server Action.
- **`docs/sistema/SPEC_SECURITY_RBAC.md` §7** — checklist expandido com 4 novos itens (cross-parent check, valores financeiros do banco, operações incrementais, whatsapp como PII).
- **`docs/next_steps.md`** — criada seção "Prioridade Crítica — Auditoria de segurança RBAC" com 13 itens acionáveis referenciando arquivo:linha e correção específica. Item RBAC anterior movido de `[x]` para `[~]` (parcial) até os críticos serem resolvidos.

### Não modificado neste commit
Esta entrada é apenas de documentação — nenhum código `.ts` foi alterado. As correções de código estão planejadas na seção Crítica do `next_steps.md`.

---

## 2026-04-22 — RBAC e RLS Validados por Tabela

### Criado
- **`src/lib/auth/assert-in-group.ts`** — helper `assertIsInGroup(resellerId, colaboradoraId)` que lança `BUSINESS:` error se a revendedora não pertencer ao grupo da colaboradora.
- **`src/lib/auth/get-reseller-scope.ts`** — helper `getResellerScope(caller)` que retorna filtro WHERE baseado na role (ADMIN = sem filtro, COLABORADORA = `colaboradora_id`, REVENDEDORA = `id`).
- **`scripts/rls-policies.sql`** — script consolidado com RLS policies para 23 tabelas sensíveis, incluindo owner checks, leitura pública para produtos/categorias, e restrições por role.

### Modificado
- **`src/lib/user.ts`** — `requireAuth` agora lança `BUSINESS:` errors (throw) em vez de retornar `null`; verifica `is_active` com mensagem específica; retorna `colaboradoraId` no `CurrentUser`.
- **`src/lib/middleware-auth.ts`** — middleware agora busca `is_active` no perfil e redireciona usuários inativos; adicionada restrição de rotas admin exclusivas para COLABORADORA (`/admin/productos`, `/admin/gamificacion`, `/admin/brindes`, `/admin/commission-tiers`, `/admin/contratos`, `/admin/equipo/consultoras`).
- **`src/components/auth/role-gate.tsx`** — agora usa `getCurrentUser` (não-throwing) adequado para Server Components.
- **Todas as Server Actions do admin** — `requireAuth` adicionado em `actions-products`, `actions-categories`, `actions-dashboard`, `actions-equipe`, `actions-gamificacao`, `actions-leads`, `actions-analytics`.
- **`actions-maletas.ts`** — `getMaletaById` agora usa `findFirst` com filtro de colaboradora; removidos checks `if (!user)` obsoletos.
- **`actions-revendedora.ts`** — `getMinhasMaletas`, `getMinhasVendas`, `getResumoFinanceiro` agora validam `profileId` contra o `resellerId` para prevenir IDOR.
- **Páginas (page.tsx)** — todas as páginas de `/app/*` e `/admin/page.tsx` migradas de `requireAuth` para `getCurrentUser` para evitar throw em Server Components.

---

## 2026-04-22 — Editar Maleta (Admin)

### Criado
- **Server Action `adicionarItensMaleta`** — permite a ADMIN/COLABORADORA adicionar itens a uma maleta `ativa` ou `atrasada`. Regras: apenas acréscimo, valida estoque, novos itens recebem snapshot de preço, itens existentes incrementam `quantidade_enviada` mantendo `preco_fixado`, registra `estoqueMovimento` tipo `reserva_maleta`, dispara push para revendedora. Implementa compensação de rollback se a reserva de estoque falhar (mesmo padrão de `criarMaleta`).
- **Schema Zod `adicionarItensMaletaSchema`** — validação de `maleta_id` + array de `itens` com `product_variant_id` e `quantidade`.
- **Página `/admin/maleta/[id]/editar/`** — interface para adicionar produtos novos ou aumentar quantidade de itens já existentes na consignação. Layout de duas colunas (busca + selecionados), reutilizando padrão visual do admin dark.

### Modificado
- **`src/app/admin/maleta/[id]/page.tsx`** — adicionado botão "Editar Consignación" visível quando status é `ativa` ou `atrasada`.
- **`docs/admin/SPEC_ADMIN_MALETAS.md`** — nova seção "Tela 5: Editar Maleta" com layout, regras de negócio e assinatura da Server Action.
- **`docs/revendedoras/SPEC_MALETA.md`** — adicionado edge case sobre notificação push quando a maleta é editada pelo admin.

---

## 2026-04-22 — Hotfix: Build Error no Vercel

### Corrigido
- **Import inválido do Prisma em `gamificacao.ts`** — O módulo `@/generated/prisma` não existe como entry point; o Prisma gera os arquivos em sub-módulos (`client.ts`, `browser.ts`, etc.). Import corrigido de `@/generated/prisma` para `@/generated/prisma/client`. O erro bloqueava todo o deploy na `main` com `Type error: Cannot find module '@/generated/prisma'`.
- **Propriedade CSS duplicada em `ConferirItemRow.tsx`** — Removida `borderRight` duplicada no objeto `style` que causava erro de TypeScript.

---

## 2026-04-22 — Fechar Maleta sem Comprovante (Admin)

### Modificado
- **`conferirEFecharMaleta`** — aceita parâmetro `cierre_manual_sin_comprobante?: boolean`. Quando `true`:
  - Permite maletas em `ativa`/`atrasada`/`aguardando_revisao` (sem exigir comprovante).
  - Pula validação de `comprovante_devolucao_url`.
  - Registra `nota_acerto` com prefixo `"Cierre manual sin comprobante"`.
- **Schema Zod `conferirMaletaSchema`** — adicionado campo `cierre_manual_sin_comprobante: z.boolean().optional()`.
- **Página `/admin/maleta/[id]/conferir/`** — botão "Cerrar sin Comprobante" na barra inferior de ações, visível quando a maleta está em `aguardando_revisao` sem comprovante. Abre diálogo com campo de justificativa opcional e confirmação.
- **Página `/admin/maleta/[id]/`** — removido botão "Cerrar sin Comprobante" daqui (movido para `/conferir` onde faz mais sentido no fluxo).

## 2026-04-22 — Devolução de Consignación (PWA)

### Criado
- **API de Upload R2** — `POST /api/upload-r2` centraliza uploads autenticados para Cloudflare R2 com validação de path por role, tipo MIME, tamanho máximo (10 MB) e autorização de comprovante por ownership da maleta.
- **Compressão de Imagem Client-Side** — `src/lib/compress-image.ts` usando Canvas API (redimensiona para max 1920px, JPEG 85% qualidade).
- **Fluxo de Devolução Multi-Step** — página `/app/maleta/[id]/devolver` com 4 pasos:
  1. Resumen — totais enviados/vendidos/a devolver, badge de atrasada, info de próximos passos.
  2. Foto — captura via `<input capture="environment">`, preview, opção de retomar.
  3. Revisión final — resumo financeiro + comissão estimada + preview do comprovante + confirmação.
  4. Confirmación — splash de sucesso com status "Esperando Recepción" e link para Início.
- **Server Action `submitDevolucao`** — em `src/app/app/actions-revendedora.ts`: verifica ownership, valida estado (`ativa`/`atrasada`), atualiza para `aguardando_revisao`, salva `comprovante_devolucao_url`, notifica consultora e admins via push (best-effort).

### Modificado
- **`src/app/app/actions-revendedora.ts`** — adicionadas `submitDevolucao` e `notificarDevolucaoPendente`.

## 2026-04-22 — Maleta: PWA da Revendedora

### Criado
- **Validação de Dados** — criados schemas Zod `registrarVendaSchema` e `registrarVendaMultiplaSchema` em `src/lib/validators/maleta.schema.ts`.
- **Motor de Gamificação** — criado utilitário `src/lib/gamificacao.ts` para conceder pontos de forma resiliente.
- **Testes Unitários** — base de testes criada em `src/__tests__/app/maleta-actions.test.ts`.

### Modificado
- **PWA Maletas (`src/app/app/actions-revendedora.ts`)** — adicionado *lock pessimista* (`SELECT FOR UPDATE`), validação Zod e integração da gamificação para pontos normais e bônus de maleta completa nas actions `registrarVenda` e `registrarVendaMultipla`.
- **UI de Imagens** — `MaletaItemRow.tsx` agora utiliza `next/image` otimizado (`unoptimized={true}`).
- **Loading UI** — Adicionados skeletons para carregamento assíncrono das páginas `/app/app/maleta/` e `/app/app/maleta/[id]/`.

### Corrigido
- **Build Error do Next.js** — Removida a dependência do componente inexistente `AppPageHeader` nas rotas de loading e substituída por layouts em HTML (`skeleton`) na funcionalidade `/app/maleta/`.


## 2026-04-20 — Maleta: backlog de flexibilização

### Documentado (pendente implementação)
- Fechamento de maleta pelo admin/consultora sem comprovante de devolução obrigatório (botão "Cerrar sin comprobante" com `nota_acerto` justificando). Ver `docs/next_steps.md` §Alta.
- Edição de maleta após criação — acréscimo de itens e aumento de quantidade enquanto a maleta estiver em `ativa`/`atrasada`. Ver `docs/next_steps.md` §Alta.

## 2026-04-20 — Admin Maleta UI Refatoração

### Refatorado
- Telas admin/maleta alinhadas com design system dark do Paper:
  - `/admin/maleta/` — lista com filtros, stats cards, tabela dark theme
  - `/admin/maleta/[id]/` — detalhe com tabs, info cards, diálogos
  - `/admin/maleta/[id]/conferir/` — conferência com tabela editável, resumo financeiro
  - `/admin/maleta/nova/` — wizard 4 steps (revendedora, prazo, produtos, confirmar)

### Criado
- **8 componentes reutilizáveis admin** em `src/components/admin/`:
  - `AdminPageHeader` — título + descrição + ação + botão voltar
  - `AdminStatCard` — card de estatística com ícone e cor
  - `AdminStatusBadge` — badge de status de maleta (ativa, atrasada, ag. conferência, concluída)
  - `AdminStepIndicator` — indicador de passos para wizard
  - `AdminFilterBar` — barra de busca + filtros select + botão limpar
  - `AdminEmptyState` — estado vazio com ícone, texto e ação
  - `AdminFinancialSummary` — grid de resumo financeiro
  - `AdminAvatar` — avatar com iniciais fallback
- **Helpers centralizados** em `src/lib/maleta-helpers.ts`:
  - `maletaStatusConfig`, `fmtCurrency`, `daysRemaining`, `daysLabel`, `daysColorClass`
- **Tema dark do shadcn/ui** mapeado no `.admin-layout` via CSS variables em `globals.css`

### Removido
- Código duplicado: `statusConfig`, `fmtCurrency`, `daysRemaining` que eram copiados em cada página de maleta

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

## 2026-04-19 — Sessão 4: Ciclo Completo da Maleta no Admin

### Criado
- **Server Action `conferirEFecharMaleta`** — fluxo de conferência e fechamento com RBAC (`requireAuth`), validação Zod, `quantidade_recebida`, `nota_acerto`, `EstoqueMovimento`, gamificação (`atribuirXP`), push notification, snapshot financeiro imutável
- **Server Action `fecharManualmenteMaleta`** — admin força fechamento de maleta ativa/atrasada, move para `aguardando_revisao`
- **Server Action `getColaboradoras`** — dropdown de filtro por consultora na listagem
- **Página `/admin/maleta/[id]/conferir`** — formulário interativo com tabela de conferência (Enviado/Vendido/Esperado/Recebido/Dif.), comprovante viewer (lightbox), preview financeiro em tempo real, campo de nota do acuerdo, alerta de divergência, botão WhatsApp
- **Model `EstoqueMovimento`** no Prisma — trilha de auditoria de estoque com enum `EstoqueMovimentoTipo` (`reserva_maleta`, `devolucao_maleta`, `ajuste_manual`, `venda_direta`), migração aplicada no Supabase
- **`conferirMaletaSchema`** (Zod) — validação de `quantidade_recebida` e `nota_acerto`
- **Validação comprovante obrigatório** no `conferirEFecharMaleta` — bloqueia conferência sem comprovante

### Modificado
- **`getMaletas`** — adicionados parâmetros `colaboradoraId`, `search`, `dataInicio`, `dataFim`; RBAC automático (COLABORADORA só vê suas maletas)
- **`criarMaleta`** — adicionado RBAC (COLABORADORA só cria para suas revendedoras), validação de maleta ativa por revendedora, `EstoqueMovimento` na reserva, campo `criada_por`
- **Página `/admin/maleta`** (listagem) — filtros por consultora, busca por revendedora, card "Total Vendido", badge "Conferir" em `aguardando_revisao`, coluna `#numero`
- **Página `/admin/maleta/[id]`** (detalhe) — abas (Itens/Acuerdo/Historial), botão "Cerrar Manualmente" com modal, botão "Conferir Consignación" para `aguardando_revisao`, resumo financeiro congelado na aba Acuerdo
- **Tipos** (`MaletaListItem`, `MaletaDetail`, `MaletaItemDetail`) — adicionados campos `numero`, `valor_total_enviado`, `pct_comissao_aplicado`, `nota_acerto`, `quantidade_recebida`, `colaboradora`
- **Mapper** (`maleta.mapper.ts`) — expandido para mapear novos campos incluindo `colaboradora`
- **`next_steps.md`** — item 1 marcado como `[~]` com sub-itens detalhados

## 2026-04-20 — Sessão 5: Fix de transações Prisma 7 + PrismaPg

### Corrigido
- **Bug crítico: `Cannot read properties of undefined (reading 'create')`** — Prisma 7 com driver adapter `PrismaPg` não suporta transações interativas (`$transaction(async tx => {...})`). O `tx` chega como `undefined`, causando erro em todas as operações dentro do callback.
- **`criarMaleta`** — Refatorada: validações (RBAC, maleta ativa, stock) como pre-reads fora da transação; criação da maleta como operação isolada; decrementos de stock como operações sequenciais com compensação (delete maleta se falhar); movimentos de estoque como writes sequenciais não-críticos; push notification fora da transação (best-effort).
- **`conferirEFecharMaleta`** — Refatorada: pre-read da maleta + validações fora da transação; operações batch em `$transaction([arr])` para update de itens, incrementos de stock, movimentos de estoque e freeze de valores; gamificação e push notification como best-effort fora da transação.
- **`conciliarMaleta`** (legado) — Refatorada de transação interativa para pre-read + `$transaction([arr])` batch.
- **`fecharMaleta`** — Refatorada de transação interativa para `$transaction([arr])` batch.
- **`fecharManualmenteMaleta`** — Refatorada: pre-read com RBAC + validação de status; operações batch em `$transaction([arr])`.

### Verificado
- ✅ Lint sem erros em `actions-maletas.ts`
- ✅ TypeScript sem novos erros (erros pré-existentes em outros arquivos)
- ✅ Nenhuma transação interativa (`$transaction(async tx => ...)`) restante no arquivo
