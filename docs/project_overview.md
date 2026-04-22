# NEXT-MONARCA — Visão Geral do Sistema

> Plataforma de gestão de revendedoras de semijoias Monarca (Paraguai). Integra portal PWA mobile-first para revendedoras, painel desktop para admin/consultora, vitrina pública por revendedora, motor de maletas em consignação, gamificação e comissões progressivas.

**Fonte única de verdade:** esta pasta `/docs/` e o [README](./README.md) de índice.

---

## 1. Descrição do sistema

NEXT-MONARCA é o sistema operacional da marca Monarca Semijoyas. Suporta três públicos distintos em um único produto:

| Público | Interface | Idioma | Dispositivo alvo |
|---------|-----------|--------|------------------|
| Revendedora | `/app/*` (PWA) | Espanhol paraguaio | Mobile-first |
| Admin / Consultora | `/admin/*` | Espanhol paraguaio | Desktop |
| Cliente final | `/vitrina/[slug]` | Espanhol paraguaio | Mobile-first |

O ciclo central do negócio é a **maleta em consignação**: admin/consultora envia produtos para a revendedora, que registra vendas durante o prazo e devolve o restante. O sistema congela valores, calcula comissões por faixa (tiers), concede pontos de gamificação e permite resgate de brindes.

---

## 2. Stack

### Runtime & Frameworks

- **Next.js 15** (App Router, Server Components, Server Actions, Route Handlers)
- **React 19**
- **TypeScript** estrito
- **Tailwind CSS** + tokens do design system
- **Zod** para validação de schemas em Server Actions e Route Handlers

### Persistência & Auth

- **PostgreSQL (Supabase)** — banco principal
- **Prisma ORM** — schema, migrations e client type-safe
- **Supabase Auth** — email/senha, reset via SMTP
- **Row-Level Security (RLS)** — defesa em profundidade além do middleware

### Armazenamento & Integrações

- **Cloudflare R2** (S3-compatible) — imagens de produto, avatares, comprovantes, documentos
- **Brevo (Sendinblue)** — emails transacionais customizados
- **OneSignal** — push notifications PWA
- **Supabase Edge Functions** — cron jobs (ex.: notificação de prazo de maleta)

### Qualidade & Operação

- **Vercel** — hosting Next.js, preview por PR, produção em `main`
- **GitHub Actions** — CI (typecheck, lint, tests, E2E) + deploy
- **Vitest** — unit/integration
- **Playwright** — E2E
- **Sentry** — error tracking
- **Upstash Redis** (opcional) — rate limiting
- **UptimeRobot** — health check externo

---

## 3. Arquitetura geral

### 3.1 Camadas

```
┌───────────────────────────────────────────────────────────────┐
│  Client (Browser / PWA)                                       │
│  ├── /app/*        Portal revendedora (mobile-first)          │
│  ├── /admin/*      Painel admin/consultora (desktop)          │
│  └── /vitrina/*    Vitrina pública por slug                   │
└──────────────────┬────────────────────────────────────────────┘
                   │  Server Actions · Route Handlers
┌──────────────────▼────────────────────────────────────────────┐
│  Next.js (Vercel)                                             │
│  ├── Middleware (auth + role check)                           │
│  ├── Server Components (fetch via Prisma)                     │
│  ├── Server Actions (mutações transacionais + Zod)            │
│  ├── /api/upload-r2 · /api/track-evento · /api/health         │
│  └── Cache (Data, Route, React) + revalidateTag               │
└────┬────────────┬────────────┬────────────┬──────────────────┘
     │            │            │            │
┌────▼────┐ ┌─────▼────┐ ┌─────▼────┐ ┌────▼──────┐
│Supabase │ │Cloudflare│ │ OneSignal│ │   Brevo   │
│Postgres │ │    R2    │ │   Push   │ │   Email   │
│+ Auth   │ │ (S3 API) │ │          │ │           │
│+ RLS    │ │          │ │          │ │           │
│+ Edge Fn│ │          │ │          │ │           │
└─────────┘ └──────────┘ └──────────┘ └───────────┘
```

### 3.2 RBAC (três roles)

| Role | Escopo |
|------|--------|
| `REVENDEDORA` | Apenas dados próprios (maletas, pontos, perfil) |
| `COLABORADORA` | Próprio perfil + revendedoras com `manager_id = self.id` |
| `ADMIN` | Acesso global |

`COLABORADORA` e `ADMIN` compartilham o path `/admin/*`; o escopo é aplicado em cada query.

### 3.3 Fluxo central — Maleta em consignação

```
Admin/Consultora  →  createMaleta (reserva estoque, snapshot de preços)
      │
      ▼
Revendedora      →  registra vendas + compartilha catálogo
      │
      ▼
Admin/Consultora  →  closeMaleta (congela valores, devolve o restante)
      │
      ▼
  Gamificação    →  awardPoints (prazo, meta, completude)
      │
      ▼
   Comissão     →  calculateCurrentCommission (mês corrente × tier)
```

---

## 4. Módulos principais

### 4.1 Portal da Revendedora (`/app/*`)

Login, onboarding, home com métricas, catálogo, maleta ativa, devolução com câmera, progresso de níveis, extrato + brindes, notificações, perfil. Ver [`docs/revendedoras/`](./revendedoras/).

### 4.2 Painel Admin / Consultora (`/admin/*`)

Dashboard, equipe, produtos, gamificação, brindes, maletas (criar/conferir), documentos e acertos, leads, analytics + campanhas push, configurações globais (tiers, níveis, contratos). Ver [`docs/admin/`](./admin/).

### 4.3 Vitrina pública (`/vitrina/[slug]`)

Página indexável por revendedora, com produtos ativos e link para WhatsApp. Expõe apenas `name`, `avatar_url`, `slug`. Tracking de eventos via `/api/track-evento`. Ver [`docs/revendedoras/SPEC_VITRINE_PUBLICA.md`](./revendedoras/SPEC_VITRINE_PUBLICA.md).

### 4.4 Infraestrutura transversal

- **Auth & RBAC** ([SPEC_SECURITY_RBAC](./sistema/SPEC_SECURITY_RBAC.md))
- **Proteção de dados** ([SPEC_SECURITY_DATA_PROTECTION](./sistema/SPEC_SECURITY_DATA_PROTECTION.md))
- **Upload centralizado** ([SPEC_API_UPLOAD_R2](./sistema/SPEC_API_UPLOAD_R2.md))
- **Emails** ([SPEC_EMAILS](./sistema/SPEC_EMAILS.md))
- **Cron jobs** ([SPEC_CRON_JOBS](./sistema/SPEC_CRON_JOBS.md))
- **Cache & revalidação** ([SPEC_CACHING_STRATEGY](./sistema/SPEC_CACHING_STRATEGY.md))
- **Observabilidade** ([SPEC_LOGGING_MONITORING](./sistema/SPEC_LOGGING_MONITORING.md))
- **Deploy & rollback** ([SPEC_DEPLOY_STRATEGY](./sistema/SPEC_DEPLOY_STRATEGY.md))
- **Migrations & seed** ([SPEC_MIGRATIONS_SEED](./sistema/SPEC_MIGRATIONS_SEED.md))

---

## 5. Princípios de produto

1. **Mobile-first no PWA da revendedora** — cada tela pensada para uso rápido no celular.
2. **Valores imutáveis em maletas fechadas** — comissão e totais são snapshots.
3. **Idioma único para o usuário final** — espanhol paraguaio em todas as interfaces.
4. **Defesa em profundidade** — middleware + guard de Server Action + RLS.
5. **Nunca vazar PII em logs** — sanitização obrigatória via helper.
6. **Zero-downtime em deploys** — migrations aditivas, rollback Vercel em < 2 min.
7. **Documentação como fonte de verdade** — código segue as SPECs desta pasta; divergências exigem atualização da SPEC antes do merge.

---

## 6. O que já foi desenvolvido

Snapshot do código em `src/` e `prisma/` (fonte: árvore atual do repositório + [`CHANGELOG.md`](./CHANGELOG.md)).

### 6.1 Site público e e-commerce base

- Homepage em `src/app/page.tsx` com 11 componentes (Header, HeroBanner, ValueProps, CategoryTabs, ProductGrid, ResellerCTA, HistoryCTA, FAQ, Footer).
- Rota dinâmica `src/app/produto/[slug]/page.tsx` (página de detalhe, produtos relacionados, botão "Agregar a mi joyero").
- Catálogo público (`src/app/catalogo/`) e carrinho (`src/app/carrinho/` + `CartDrawer.tsx`, `AddToCartButton.tsx`).
- Landing "Seja Revendedora" em `src/app/seja-revendedora/`.
- Server Actions públicas em `src/app/actions.ts` (`getProductBySlug`, `getRelatedProducts`).

### 6.2 Painel Admin (`/admin/*`)

Rotas implementadas em `src/app/admin/`:

- `produtos/` — listagem SSR com paginação, busca, filtro por categoria; formulário novo/editar com `ImageUploader` (upload direto R2), `VariantManager`, `CategorySelect` hierárquico.
- `categorias/` — árvore com CRUD inline (adicionar pai/filho, editar, deletar em cascata).
- `maleta/` (incluindo `nova/` e `[id]/conferir/`) — telas refatoradas com tema dark consistente usando design system admin (8 componentes reutilizáveis em `src/components/admin/` + helpers em `src/lib/maleta-helpers.ts`). Tema dark do shadcn/ui mapeado via CSS variables no `.admin-layout`.
- `equipe/`, `revendedoras/`, `gamificacao/`, `leads/`, `analytics/`, `relatorios/`, `login/` — páginas placeholder/base.
- Server Actions: `actions-products.ts`, `actions-categories.ts`, `actions-maletas.ts`, `actions-equipe.ts`, `actions-gamificacao.ts`, `actions-leads.ts`, `actions-dashboard.ts`, `actions-analytics.ts`.
- Shell `layout.tsx` admin + `admin.css` + `BottomNav.tsx`.

### 6.3 Portal Revendedora (`/app/*`)

- `layout.tsx`, `login/`, `progresso/`, `vendas/` — rotas base presentes.
- Server Action central em `actions-revendedora.ts`.
- Componentes PWA: `AppHeader`, `AppBottomNav`, `MaletaCard`, `StatCard`, `SectionHeader`, `CommissionTiers`.
- **Maleta PWA (parcial)**:
  - `/app/maleta/` — listagem de consignações com `MaletaList` + `MaletaListItemCard`.
  - `/app/maleta/[id]/` — detalhes com itens, total vendido, badge de status, botões Registrar Venta e Devolver.
  - `/app/maleta/[id]/registrar-venta/` — formulário de venda com seleção de cliente e artigo.
  - Componentes reutilizáveis: `StatusBadge`, `MaletaList`, `MaletaItemRow`, `ActionButton`, `AppPageHeader`, `SummaryCard`, `CommissionCard`, `AlertBanner`, `SummaryRow`, `BottomAction`.
  - Server action `registrarVenda` no `actions-revendedora.ts`.
  - **Pendente**: validação Zod, lock pessimista, gamificação (`awardPoints`), fluxo de devolução (4 pasoso com câmera), imagens com `next/image`, skeletons, testes.

### 6.4 Infraestrutura técnica em operação

- **Auth**: Supabase SSR (`@supabase/ssr`), `middleware.ts`, `role-gate.tsx`, rotas `src/app/api/auth/`.
- **Banco**: Prisma com schema em `prisma/schema.prisma`, migrations aplicadas, seed de gamificação (`seed-gamificacao.ts`).
- **Uploads**: API `src/app/api/` + integração Cloudflare R2 via `@aws-sdk/client-s3` (bucket `fotos-monarca`).
- **PWA**: Serwist (`sw.ts`, `manifest.ts`, `ServiceWorkerRegistration.tsx`), OneSignal (`OneSignalWrapper.tsx`).
- **Cron**: `src/app/api/cron/`.
- **Tracking**: `src/app/api/track/` + `AnalyticsTracker.tsx`.
- **Export**: `src/app/api/export/`.
- **Tooling**: Vitest configurado (`vitest.config.ts`, `src/__tests__/`), ESLint 9, Tailwind v4.

### 6.5 Correções recentes (últimos commits)

iOS viewport bounce, bottom nav safe-area, OneSignal slidedown → native prompt (ver `git log`).

---

## 7. Status atual do sistema

| Área | Status | Observação |
|------|--------|-----------|
| Site público + catálogo | **Funcional** | Homepage, produto, carrinho, landing de captação rodando em produção interna. |
| Admin — Produtos e Categorias | **Funcional** | CRUD completo, upload R2, hierarquia. |
| Admin — Maletas | **Funcional** | Ciclo completo implementado (criar, conferir, fechar, fechar sem comprovante). Telas refatoradas com tema dark consistente + componentes reutilizáveis. Bug de transações Prisma 7 resolvido. |
| Admin — Equipe / Gamificação / Leads / Analytics / Relatórios | **Stub / placeholder** | Rotas criadas, SPECs prontas, lógica a implementar. |
| Portal Revendedora (PWA) | **Em desenvolvimento** | Login, home, maleta (listagem/detalhes/venta), progresso, vendas iniciados; fluxo de devolução pendente. |
| Vitrina pública `/vitrina/[slug]` | **Não iniciada** | SPEC pronta, rota ausente. |
| RBAC + RLS | **Parcial** | `role-gate.tsx` + middleware existem; RLS Supabase a validar por tabela. |
| Gamificação (motor) | **Parcial** | Seed presente; regras de pontos/tiers/comissão a implementar. |
| Notificações (OneSignal) | **Parcial** | Wrapper + prompt nativo; campanhas admin e centro de notificações pendentes. |
| Emails transacionais (Brevo) | **Não iniciado** | SPEC pronta, integração ausente. |
| Testes (Vitest + Playwright) | **Inicial** | Vitest configurado; E2E Playwright a configurar. |
| Observabilidade (Sentry) | **Não iniciado** | SPEC pronta, integração ausente. |

---

## 8. Onde começar

- **Desenvolvedor novo no projeto** → [`README.md`](./README.md) → depois [`sistema/SPEC_BACKEND.md`](./sistema/SPEC_BACKEND.md) e [`sistema/SPEC_FRONTEND.md`](./sistema/SPEC_FRONTEND.md).
- **Design** → [`design-system/README.md`](./design-system/README.md) + [`sistema/SPEC_DESIGN_MODULES.md`](./sistema/SPEC_DESIGN_MODULES.md).
- **Produto** → [`prd/PRD.md`](./prd/PRD.md).
- **DevOps** → [`sistema/SPEC_DEPLOY_STRATEGY.md`](./sistema/SPEC_DEPLOY_STRATEGY.md) + [`sistema/SPEC_ENVIRONMENT_VARIABLES.md`](./sistema/SPEC_ENVIRONMENT_VARIABLES.md).
