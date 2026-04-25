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
- `consultoras/` — lista com métricas agregadas (faturamento do grupo, comissão, revendedoras ativas); perfil detalhado `/consultoras/[id]` com revendedoras do grupo, KPIs e comissão total. Criação de nova consultora integra Supabase Auth (`auth.admin.createUser`) + envio de convite por email via Brevo.
- `revendedoras/` — listagem com busca, filtros, vínculo de colaboradora; perfil detalhado `/revendedoras/[id]` com dados de candidatura, documentos, maletas, dados bancários (mascarados), faturamento total/mensal, pontos e nível. Criação de nova revendedora integra Supabase Auth + convite por email.
- `equipe/` — mantido como legado (redireciona para consultoras).
- `login/` — página de login admin + recuperação de senha (`/admin/login/recuperar`) + callback de redefinição (`/admin/login/reset-password`).
- `gamificacao/`, `leads/`, `analytics/`, `relatorios/` — páginas placeholder/base.
- Server Actions: `actions-products.ts`, `actions-categories.ts`, `actions-maletas.ts`, `actions-equipe.ts`, `actions-gamificacao.ts`, `actions-leads.ts`, `actions-dashboard.ts`, `actions-analytics.ts`.
- Shell `layout.tsx` admin + `admin.css` + `BottomNav.tsx`.

### 6.3 Portal Revendedora (`/app/*`)

- `layout.tsx` (Server Component) + `AppShell.tsx` (Client Component) — refatorado para suportar redirect de onboarding.
- `login/`, `progresso/`, `vendas/` — rotas base presentes.
- Server Action central em `actions-revendedora.ts`.
- Componentes PWA: `AppHeader`, `AppBottomNav`, `MaletaCard`, `StatCard`, `SectionHeader`, `CommissionTiers`.
- **Onboarding**:
  - `/app/bienvenida/` — fluxo multi-step (boas-vindas + pontos, 3 slides explicativos, completar perfil, opt-in push, conclusão). Server Actions: `awardPrimeiroAcesso`, `completeOnboarding`.
- **Perfil**:
  - `/app/perfil/` — resumo com avatar, nome, pontos, tasa de comisión, consultora e menu.
  - `/app/perfil/datos/` — edição de dados pessoais (nome, whatsapp, avatar, endereço) com upload R2.
  - `/app/perfil/bancario/` — formulário de dados bancários (Alias Bancard / Cuenta Bancaria).
  - `/app/perfil/soporte/` — redirect automático para WhatsApp da consultora.
  - `documentos/` — stub.
  - `notificaciones/` — configuração de preferências push (6 toggles com auto-save).
  - Server Actions em `perfil/actions.ts`: `actualizarPerfilRevendedora`, `guardarDatosBancarios`, `getPerfilCompleto`, `getPreferenciasNotificaciones`, `actualizarPreferenciasNotificaciones`.
- **Notificações (Centro)**:
  - `/app/notificaciones/` — histórico persistente agrupado por día (Hoy, Ayer, Anteriores). Cards com ícone, título, mensagem, timestamp e CTA. Marcar como lida com dot interativo + `useOptimistic`. Badge de não lidas no menu "Más".
  - Server Actions em `notificaciones/actions.ts`: `getNotificacoes`, `marcarComoLida`, `getContagemNaoLidas`.
  - Helper central `src/lib/notifications.ts`: `criarNotificacao`, `podeEnviarPush`, `enviarPushSePermitido`, `notificarRevendedora` — persiste no banco e envia push condicionalmente conforme `NotificacaoPreferencia`.
  - Ações instrumentadas: `nova_maleta` (criarMaleta), `acerto_confirmado` (conferirEFecharMaleta), `prazo_proximo`/`maleta_atrasada` (cron job), `pontos_ganhos` (registrarVenda, registrarVendaMultipla, awardPoints).
- **Maleta PWA**:
  - `/app/maleta/` — listagem de consignações com `MaletaList` + `MaletaListItemCard`.
  - `/app/maleta/[id]/` — detalhes com itens, total vendido, badge de status, botões Registrar Venta y Devolver.
  - `/app/maleta/[id]/registrar-venta/` — formulário de venda com seleção de cliente e artigo.
  - `/app/maleta/[id]/devolver/` — fluxo multi-step de devolução (4 pasos: resumen, foto, revisión, confirmación) com câmera nativa PWA, compressão de imagem, upload via `/api/upload-r2` e Server Action `submitDevolucao`.
  - Componentes reutilizáveis: `StatusBadge`, `MaletaList`, `MaletaItemRow`, `ActionButton`, `AppPageHeader`, `SummaryCard`, `CommissionCard`, `AlertBanner`, `SummaryRow`, `BottomAction`.
  - Server actions `registrarVenda`, `registrarVendaMultipla`, `submitDevolucao` no `actions-revendedora.ts`.
  - **Pendente**: desempenho.
- **Catálogo PWA**:
  - `/app/catalogo/` — vitrine dos produtos da maleta ativa com busca, filtros por categoria e botão "Compartir" individual (Web Share API com imagem real via proxy `/api/proxy-image`).
  - `/app/catalogo/compartir/` — seleção multi-foto (máx. 10) com grid 3 colunas, checkmark verde, barra inferior sticky com contagem e botão "Compartir". Download das imagens via proxy `/api/proxy-image` (contorna CORS do R2) e compartilhamento via `navigator.share({ files })` com fallback para WhatsApp incluindo links dos produtos. Tratamento de `AbortError` como cancelamento.
  - Server Actions: `getCatalogoRevendedora` (itens da maleta ativa com saldo), `registrarPuntosCompartirCatalogo` (gamificação: +50 pts, limite 5x/dia).
- **Menu "Más" (`/app/mais`)**:
  - Hub de navegação secundária com 3 grupos: "Mi Cuenta" (perfil, notificações, documentos), "Actividad" (desempeño, pontos, vitrina pública) e "Soporte" (WhatsApp, onboarding).
  - Componentes reutilizáveis: `MenuHeader`, `MenuSectionCard`, `MenuRow`, `LogoutButton`.
  - Logout com `OneSignal.logout()` antes do `signOut()` para evitar vazamento de `external_id`.
  - Badge dot em "Mis Documentos" quando há documentos pendentes.
  - Abas "Más" e "Perfil" sincronizadas no `AppBottomNav`.

### 6.4 Infraestrutura técnica em operação

- **Auth & RBAC**: Supabase SSR (`@supabase/ssr`), `middleware.ts` com verificação de `is_active` e restrição de rotas admin para COLABORADORA, `role-gate.tsx` usando `getCurrentUser`, guard `requireAuth` com throw de `BUSINESS:` errors, helpers `assertIsInGroup` e `getResellerScope`.
- **Banco**: Prisma com schema em `prisma/schema.prisma`, migrations aplicadas, seed de gamificação (`seed-gamificacao.ts`).
- **Uploads**: APIs `src/app/api/` incluindo `/api/upload-r2` (upload autenticado para R2 com validação de path, tipo e tamanho) + integração Cloudflare R2 via `@aws-sdk/client-s3` (bucket `fotos-monarca`).
- **PWA**: Serwist (`sw.ts`, `manifest.ts`, `ServiceWorkerRegistration.tsx`), OneSignal (`OneSignalWrapper.tsx`).
- **Cron**: `src/app/api/cron/`.
- **Tracking**: `src/app/api/track/` + `AnalyticsTracker.tsx`.
- **Export**: `src/app/api/export/`.
- **RLS**: Script consolidado `scripts/rls-policies.sql` com policies para 23 tabelas (resellers, maletas, maleta_itens, vendas_maleta, pontos_extrato, reseller_documentos, datos_bancarios, notificacao_preferencias, solicitacoes_brinde, resgates, analytics_acessos, analytics_diario, revendedora_leads, gamificacao_regras, nivel_regras, commission_tiers, brindes, contratos, categories, products, product_variants, reseller_products, estoque_movimentos).
- **Proteção de dados**: Prisma Client Extension com criptografia AES-256-GCM para `DadosBancarios` (`src/lib/prisma/encrypt-middleware.ts`); upload de documentos para path `private/` no R2; Server Actions de signed URLs com auditoria (`src/lib/data-protection/document-access.ts`); helpers de máscara para UI (`src/lib/data-protection/mask-utils.ts`); sanitizador de vitrina pública (`src/lib/data-protection/vitrina-sanitizer.ts`); helper `sanitizeForLog` para logs (`src/lib/errors/sanitize-log.ts`).
- **Tooling**: Vitest configurado (`vitest.config.ts`, `src/__tests__/`), ESLint 9, Tailwind v4.

### 6.5 Correções recentes (últimos commits)

iOS viewport bounce, bottom nav safe-area, OneSignal slidedown → native prompt (ver `git log`).

---

## 7. Status atual do sistema

| Área | Status | Observação |
|------|--------|-----------|
| Site público + catálogo | **Funcional** | Homepage, produto, carrinho, landing de captação rodando em produção interna. |
| Admin — Produtos e Categorias | **Funcional** | CRUD completo, upload R2, hierarquia. |
| Admin — Maletas | **Funcional** | Ciclo completo implementado (criar, editar, conferir, fechar, fechar sem comprovante). Telas refatoradas com tema dark consistente + componentes reutilizáveis. Bug de transações Prisma 7 resolvido. |
| Admin — Gestão de Equipe | **Parcial** | Lista de consultoras (`/admin/consultoras`) com métricas agregadas; perfil detalhado de revendedora (`/admin/revendedoras/[id]`) com maletas, pontos, dados bancários, documentos; perfil detalhado de consultora (`/admin/consultoras/[id]`) com grupo e comissões. **Sidebar da consultora implementada**: layout e bottom nav filtrados por role, rotas `/admin/minha-conta` e `/admin/minha-conta/comissoes` com resumo e extrato. **Criação via Supabase Auth + convite por email implementada**: `criarColaboradora` e `criarRevendedora` criam usuário no Auth, gravam `auth_user_id` e enviam convite via Brevo. |
| Admin — Analytics | **Funcional** | Dashboard operacional de maletas com KPIs (ativas, devolvidas, taxa de atraso, ticket médio, tempo médio de devolução), gráficos (fluxo de maletas, distribuição por status), ranking de revendedoras por volume, alertas de prazo e produtos mais vendidos. Filtro por período (7d/30d/3m/12m) e escopo RBAC (COLABORADORA vê apenas seu grupo). Ref.: `SPEC_ADMIN_ANALYTICS_NOTIFICATIONS.md`. |
| Admin — Documentos e Acertos | **Funcional** | Lista de revendedoras com badges de atenção (doc pendente, acerto aguardando, OK). Tela `/admin/revendedoras/[id]/documentos` para aprovar/rejeitar CI com preview, observação obrigatória e histórico. Server Actions com RBAC + notificações push (`documento_aprovado` / `documento_reprovado`). Acerto de maleta já coberto pela conferência em `/admin/maletas/[id]/conferir`. Ref.: `SPEC_ADMIN_DOCUMENTOS_ACERTOS.md`. |
| Admin — Gamificação / Leads / Relatórios | **Stub / placeholder** | Rotas criadas, SPECs prontas, lógica a implementar. |
| Portal Revendedora (PWA) | **Em desenvolvimento** | Login (com recuperação de senha via email + redefinição), onboarding completo, perfil (resumo/datos/bancario/soporte), maleta (listagem/detalhes/venta/devolução), progresso, vendas iniciados; devolução com câmera + comprovante implementada. **Home com métricas reais do mês, rank, pontos e pills de comissão implementada. Extrato de pontos + catálogo de brindes implementado. Centro de notificações com histórico persistente (Hoy/Ayer/Anteriores) e badge de não lidas implementado.** |
| Vitrina pública `/vitrina/[slug]` | **Não iniciada** | SPEC pronta, rota ausente. |
| RBAC + RLS | **Funcional — auditoria 2026-04-22 resolvida** | Todas as vulnerabilidades críticas corrigidas: `requireAuth` + ownership check em `devolverMaleta`; removidos exports inseguros de `fecharMaleta`/`conciliarMaleta`; `checkOverdueMaletas` convertida em cron job autenticado; `getActiveResellers`/`getAvailableVariants` protegidos; middleware fail-closed para `userRole=null`; auto-link restrito a `REVENDEDORA`; `assertIsInGroup` aplicado nas actions `/app` para COLABORADORA; `registrarVenda` usa `preco_fixado` do banco. Testes de regressão em `src/__tests__/security/rbac-regression.test.ts`. RLS cobre 23 tabelas. |
| Proteção de dados sensíveis | **Funcional** | Criptografia AES-256-GCM via Prisma Client Extension para `DadosBancarios` (campos `alias_ci_ruc`, `alias_valor`, `cuenta`, `ci_ruc`). Upload de documentos para `private/` no R2. Signed URLs de documentos com TTL de 1h + log de auditoria. Helper `sanitizeForLog` para sanitização de PII em logs. Helpers de máscara (`maskAlias`, `maskCuenta`, `maskCI`, `maskEmail`, `maskWhatsApp`). Sanitizador de vitrina pública (`getPublicVitrinaData`). Ref.: `SPEC_SECURITY_DATA_PROTECTION.md`. |
| Gamificação (motor) | **Funcional** | `awardPoints` respeita tipo (único/diário/mensal/evento), limite diário e flag ativo. 7 regras seedadas. Tela `/app/progresso` mostra tarefas e progresso. Admin pode configurar regras e níveis. |
| Notificações (OneSignal) | **Parcial** | Wrapper + prompt nativo; centro de notificações no PWA implementado (histórico persistente, badge de não lidas). **Admin AlertBell implementado** — sininho persistente no layout admin com badge de maletas `aguardando_revisao` e drawer de devoluções pendentes. **Configuração de notificações push no admin implementada** (`/admin/config/notif-push`) — 7 templates seedados, edição de título/corpo, toggle ativo/inativo, teste de push e histórico de envios. Campanhas push em massa ainda pendentes. |
| Emails transacionais (Brevo) | **Funcional** | SDK `@getbrevo/brevo` instalado, cliente central `src/lib/emails.ts`, 7 templates. Emails transacionais da aplicação funcionam via API Brevo. SMTP do Brevo configurado no Supabase Dashboard — reset de senha, convite por email e magic links do Supabase Auth enviados via Brevo. Rota de callback `/admin/login/reset-password` criada. Domínio: `monarcasemijoyas.com.py`. |
| Testes (Vitest + Playwright) | **Inicial** | Vitest configurado; E2E Playwright a configurar. |
| Observabilidade (Sentry) | **Não iniciado** | SPEC pronta, integração ausente. |

---

## 8. Onde começar

- **Desenvolvedor novo no projeto** → [`README.md`](./README.md) → depois [`sistema/SPEC_BACKEND.md`](./sistema/SPEC_BACKEND.md) e [`sistema/SPEC_FRONTEND.md`](./sistema/SPEC_FRONTEND.md).
- **Design** → [`design-system/README.md`](./design-system/README.md) + [`sistema/SPEC_DESIGN_MODULES.md`](./sistema/SPEC_DESIGN_MODULES.md).
- **Produto** → [`prd/PRD.md`](./prd/PRD.md).
- **DevOps** → [`sistema/SPEC_DEPLOY_STRATEGY.md`](./sistema/SPEC_DEPLOY_STRATEGY.md) + [`sistema/SPEC_ENVIRONMENT_VARIABLES.md`](./sistema/SPEC_ENVIRONMENT_VARIABLES.md).
