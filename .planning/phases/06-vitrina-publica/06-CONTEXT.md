# Phase 6: Vitrina Pública - Context

**Gathered:** 2026-05-05
**Status:** Ready for planning
**Note:** Fase expandida pelo usuário para incluir página de detalhe do produto e carrinho + checkout via WhatsApp.

<domain>
## Phase Boundary

Esta fase entrega a vitrina pública por revendedora (`/vitrina/{slug}`), acessível sem autenticação, com SEO dinâmico, tracking anônimo de visitas/clics, e integração WhatsApp com carrinho de compras.

**In scope (expandido pelo usuário):**
- Página pública `/vitrina/{slug}` com ISR (revalidate=300s)
- Perfil da revendedora (avatar, nome, bio) + CTA genérico WhatsApp
- Grid de produtos da **maleta ativa** (MaletaItem com saldo)
- Página de detalhe do produto (`/vitrina/{slug}/{produtoId}`)
- Carrinho de compras em localStorage com badge flutuante sticky
- Checkout via WhatsApp com mensagem formatada contendo lista de produtos + preços
- Tracking anônimo via cookie `mnrc_vid` + endpoint dedicado `/api/vitrina/track`
- SEO metadata dinâmica (título, descrição, OG tags) com `robots: noindex`
- RLS policies `anon` para leitura pública de dados da vitrina
- Empty state quando não há maleta ativa (perfil + mensagem simples)

**Out of scope:**
- Pagamento online/processo de checkout próprio (vitrina é showcase, não e-commerce)
- Indexação Google da vitrina (deliberado `noindex`)
- Persistência do carrinho no servidor/banco (apenas localStorage)
- Autenticação do cliente final na vitrina

**Dependências:**
- Schema Prisma: `Reseller.slug`, `Maleta`, `MaletaItem`, `ProductVariant`, `AnalyticsAcesso` (já existem)
- Infra: R2 para imagens, Supabase para banco
- Design: Reusar estrutura do catálogo existente com adaptações

</domain>

<spec_lock>
## Requirements (locked via SPEC.md)

**12 requirements base são locked.** Veja `docs/revendedoras/SPEC_VITRINE_PUBLICA.md` para requirements, boundaries e acceptance criteria originais.

**Expansão de escopo decidida pelo usuário:** A Fase 6 foi expandida para incluir:
- Página de detalhe do produto na vitrina
- Carrinho de compras com localStorage
- Checkout via WhatsApp com mensagem formatada

> ⚠️ **Ação necessária:** Atualizar `docs/revendedoras/SPEC_VITRINE_PUBLICA.md` e `.planning/ROADMAP.md` para refletir o novo escopo antes do merge.

Downstream agents DEVEM ler `docs/revendedoras/SPEC_VITRINE_PUBLICA.md` antes de planejar ou implementar. Os requirements originais não são duplicados aqui.

</spec_lock>

<decisions>
## Implementation Decisions

### Estratégia de Renderização
- **D-01:** ISR com `revalidate = 300` (5 minutos) para conteúdo da vitrina. Balance entre performance e frescor de dados.
- **D-02:** Endpoint dedicado `/api/vitrina/track` para tracking de eventos da vitrina (whitelist: `catalogo_revendedora`, `clique_whatsapp`).
- **D-03:** `visitor_id` gerado via **middleware + cliente** (defesa em profundidade). Middleware garante cookie base; endpoint valida/re-gera se necessário.

### Relação Vitrina ↔ Catálogo
- **D-04:** Reusar design do catálogo existente (`/catalogo/[slug]`) com adaptações. Estrutura similar: hero com avatar, grid de produtos, footer.
- **D-05:** Extrair componentes compartilhados em `src/components/vitrina/` (VitrinaHeader, ProductGrid, VitrinaFooter) para reuso entre catálogo e vitrina.
- **D-06:** Quando não há maleta ativa: exibir perfil + mensagem simples "Esta revendedora no tiene artículos disponibles momentáneamente." + CTA WhatsApp genérico.
- **D-07:** Futuro (pós-Fase 6): consolidar tudo na vitrina — `/catalogo/[slug]` redireciona para `/vitrina/[slug]`.

### Fonte de Produtos e Grid
- **D-08:** Vitrina mostra **apenas itens da maleta ativa**: `Maleta` onde `status = 'ativa'` + `MaletaItem` onde `quantidade_vendida < quantidade_enviada`.
- **D-09:** Preço exibido = **preço atual do ProductVariant**. Nota: exceção à regra de imutabilidade de maletas para vitrina pública — o cliente vê preços atualizados.
- **D-10:** Query encapsulada em função utilitária `getVitrinaData(slug)` em `src/lib/vitrina.ts`.
- **D-11:** Grid mostra **um card por variant** (cada `MaletaItem` é um card). Produto com 2 cores = 2 cards.

### Fluxo WhatsApp e Carrinho (Escopo Expandido)
- **D-12:** Grid da vitrina leva para **página de detalhe do produto** (`/vitrina/{slug}/{produtoId}`). Não tem CTA WhatsApp direto no card.
- **D-13:** CTA WhatsApp aparece **após adicionar produtos ao carrinho**. Fluxo: grid → detalhe → adicionar ao carrinho → ver carrinho → finalizar (WhatsApp).
- **D-14:** Carrinho armazenado em **localStorage do navegador**. Sem persistência no servidor.
- **D-15:** Carrinho acessível via **badge flutuante sticky** com contador de itens, visível em todas as páginas da vitrina.
- **D-16:** "Finalizar pedido" gera **mensagem formatada** para WhatsApp com lista de produtos (nome + preço) e total. Ex: `Hola [nombre], quiero consultar sobre: 1. Collar Elegance - G$ 1.250 2. Pulsera Boho - G$ 850 Total: G$ 2.100`

### the agent's Discretion
- Layout exato do badge flutuante do carrinho (posição, animação)
- Estrutura da mensagem WhatsApp formatada (formatação exata, emojis)
- Componentização interna da página de detalhe do produto
- Estado vazio do carrinho (mensagem e CTA)
- Transições/loading states entre grid → detalhe → carrinho

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Roadmap
- `.planning/ROADMAP.md` — Phase 6 goal, success criteria, pitfalls (inclui conflito ISR vs tracking dinâmico)
- `.planning/REQUIREMENTS.md` — VITR-01..VITR-12 requirements mapped to Phase 6
- `.planning/PROJECT.md` — Stack, constraints, established patterns, key decisions
- `docs/revendedoras/SPEC_VITRINE_PUBLICA.md` — SPEC original da vitrina (requer atualização para refletir escopo expandido)

### Prior Phase Context
- `.planning/phases/05-validation-hardening/05-CONTEXT.md` — ActionResult<T> pattern, safeAction, test patterns
- `.planning/phases/02-core-business-notifications-leads-config/02-CONTEXT.md` — Notification templates, lead pipeline
- `.planning/phases/01-foundation-error-handling-ui-states/01-CONTEXT.md` — UI state components, toast system

### Security & Data Protection
- `docs/sistema/SPEC_SECURITY_DATA_PROTECTION.md` — PII handling, vitrina sanitizer (`getPublicVitrinaData`)
- `docs/sistema/SPEC_SECURITY_RBAC.md` — RLS rules, role definitions
- `scripts/rls-policies.sql` — Live RLS policies (inclui `resellers_public_read_active`, `analytics_acessos_anon_insert`)

### Database & API
- `docs/sistema/SPEC_DATABASE.md` — Prisma schemas for `Reseller`, `Maleta`, `MaletaItem`, `ProductVariant`, `AnalyticsAcesso`
- `docs/sistema/SPEC_API_UPLOAD_R2.md` — Imagem handling, URLs públicas
- `src/lib/data-protection/vitrina-sanitizer.ts` — Sanitização de dados públicos da vitrina

### Design System
- `docs/design-system/tokens.md` — Tokens de design system (`--app-*`, `--admin-*`)
- `docs/sistema/SPEC_DESIGN_MODULES.md` — Padrões visuais aprovados

### Codebase Maps
- `.planning/codebase/CONVENTIONS.md` — Paper-first UI, Server Action pattern, Prisma usage
- `.planning/codebase/STRUCTURE.md` — Directory layout, component locations
- `.planning/codebase/STACK.md` — Technology stack (Next.js 16, Prisma 7, Tailwind v4)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`src/app/catalogo/[slug]/page.tsx`** — Página pública existente com estrutura similar (hero com avatar, grid de produtos, footer). Reusar como base para design da vitrina.
- **`src/app/api/track/route.ts`** — Endpoint de tracking existente com bot detection, cookie `mnrc_vid`, e gravação em `AnalyticsAcesso`. Referência para criar `/api/vitrina/track`.
- **`src/components/AnalyticsTracker.tsx`** — Componente client-side para tracking de página. Pode ser adaptado para a vitrina.
- **`src/lib/data-protection/vitrina-sanitizer.ts`** — `getPublicVitrinaData()` e `toPublicResellerPayload()` garantem exposição segura de dados públicos.
- **`src/lib/format.ts`** — Formatadores de moeda (G$) e data.

### Established Patterns
- **ISR público:** `export const revalidate = 60` em páginas públicas (homepage, catálogo, produto).
- **Defesa em profundidade:** middleware + guard Server Action + RLS. Para vitrina anônima, RLS policies `anon` já existem.
- **Server-first:** Páginas são Server Components; interatividade via `"use client"`.
- **No nested transactions:** Prisma 7 + PrismaPg constraint. Queries sequenciais ou array-form `$transaction([...])`.
- **Imutabilidade maleta:** `preco_fixado` em `MaletaItem` é snapshot. Nota: decisão D-09 faz exceção para vitrina pública (usa preço atual do ProductVariant).

### Integration Points
- **`src/app/vitrina/[slug]/page.tsx`** — Stub existente com ISR (`revalidate = 60`). Precisa ser expandido com query real, metadata, e componentes.
- **RLS policies** — `resellers_public_read_active`, `products_anon_read`, `product_variants_anon_read`, `analytics_acessos_anon_insert` já aplicados.
- **Middleware** (`src/lib/middleware-auth.ts`) — Atualmente só faz JWT refresh. Precisa ser estendido para gerar `mnrc_vid` cookie.
- **Catálogo existente** (`/catalogo/[slug]`) — Componentes extraídos devem ser compartilhados entre catálogo e vitrina.

</code_context>

<specifics>
## Specific Ideas

- **Middleware visitor_id:** Adicionar lógica no middleware para ler/gerar `mnrc_vid` cookie em todas as rotas públicas, não só vitrina.
- **Endpoint dedicado `/api/vitrina/track`:** Validar strict whitelist de eventos (`catalogo_revendedora`, `clique_whatsapp`), validar `reseller_id` contra slug, e rejeitar payloads malformados.
- **Página de detalhe:** Criar rota `/vitrina/[slug]/[produtoId]/page.tsx` com fotos do produto (do ProductVariant), nome, preço, descrição, e botão "Agregar al carrito".
- **Carrinho localStorage:** Estrutura: `{ items: [{ productId, variantId, name, price, quantity, image }] }`. TTL opcional (7 dias).
- **Mensagem WhatsApp:** Usar `encodeURIComponent` para a mensagem formatada. Limitar a ~2000 caracteres (limite prático do WhatsApp).
- **Badge flutuante:** Posicionar bottom-right com `position: fixed`, z-index acima de tudo. Animação de bounce ao adicionar item.
- **SEO metadata dinâmica:** `generateMetadata` deve buscar `Reseller` por slug e retornar title/description/OG tags. Se reseller não encontrada → `notFound()`.
- **Empty state (sem maleta):** Manter hero com perfil, esconder grid, mostrar mensagem centralizada + CTA WhatsApp genérico.

</specifics>

<deferred>
## Deferred Ideas

### Funcionalidades Futuras (fora do escopo da Fase 6)
- **Checkout próprio com pagamento** — Sistema de pagamento integrado na vitrina (PIX, cartão). Requer gateway de pagamento e mudança de modelo de negócio.
- **Persistência do carrinho no servidor** — Permitir que o cliente recupere o carrinho em outro dispositivo. Requer autenticação ou session server-side.
- **Compartilhamento do carrinho** — Link único com produtos pré-selecionados (`/vitrina/{slug}?cart=...`).
- **Notificações de estoque** — Cliente solicita notificação quando produto volta ao estoque da maleta.
- **Reviews/avaliações** — Clientes finais avaliam produtos/revendedoras.

### Revisão de Escopo Necessária
- ⚠️ **ROADMAP.md e SPEC_VITRINE_PUBLICA.md precisam ser atualizados** para refletir o escopo expandido (página de detalhe + carrinho + checkout WhatsApp) antes do merge da Fase 6.
- Adicionar novos requisitos (VITR-13+, VITR-14+) à SPEC para cobrir: página de detalhe, carrinho localStorage, badge flutuante, checkout WhatsApp formatado.

</deferred>

---

*Phase: 06-Vitrina Pública*
*Context gathered: 2026-05-05*
