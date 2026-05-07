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
- **sonner** — toast notifications unificadas PWA + Admin
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
  - `leads/` — pipeline completo com tabs (Pendientes/Aprobadas/Rechazadas), modais de ação e Server Actions `aprovarLead`/`recusarLead` com email Brevo. Ref.: `SPEC_ADMIN_LEADS.md`.
  - `config/comissoes/` — CRUD de faixas de comissão (`CommissionTier`) com cards de resumo, tabela e proteção do tier base. Ref.: `CONF-01`, `CONF-02`.
  - `config/niveis/` — CRUD de níveis de gamificação (`NivelRegra`) com cards de resumo, tabela e drag-and-drop. Ref.: `CONF-06`.
  - `config/contratos/` — CRUD de versões de contrato (`ContratoVersao`) com upload PDF R2 (limite 10MB), validação MIME e tabela de histórico. Ref.: `CONF-03..05`.
  - `config/notif-push/` — configuração de templates push (7 templates seedados), toggle ativo/inativo, teste de push e campanhas em massa.
  - `gamificacao/`, `analytics/`, `relatorios/` — páginas placeholder/base.
  - Server Actions: `actions-products.ts`, `actions-categories.ts`, `actions-maletas.ts`, `actions-equipe.ts`, `actions-gamificacao.ts`, `actions-leads.ts`, `actions-dashboard.ts`, `actions-analytics.ts`, `actions-config.ts`.
- Shell `layout.tsx` admin + `admin.css` + `BottomNav.tsx`.

### 6.3 Portal Revendedora (`/app/*`)

- `layout.tsx` (Server Component) + `AppShell.tsx` (Client Component) — refatorado para suportar redirect de onboarding.
- `login/`, `progresso/`, `vendas/` — rotas base presentes.
- Server Action central em `actions-revendedora.ts`.
- Componentes PWA: `AppHeader`, `AppBottomNav`, `MaletaCard`, `StatCard`, `SectionHeader`, `CommissionTiers`.
- **Onboarding**:
  - `/app/bienvenida/` — fluxo multi-step (boas-vindas + pontos, 3 slides explicativos, aceite de contrato, completar perfil, opt-in push, conclusão). Server Actions: `awardPrimeiroAcesso`, `completeOnboarding`. Aceite de contrato (passo 3) exibe o contrato ativo mais recente (`ContratoVersao`) e grava `contrato_aceite_em` em `Reseller`.
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
  - Helper central `src/lib/notifications.ts`: `criarNotificacao`, `podeEnviarPush`, `enviarPushSePermitido`, `notificarRevendedora`, `notificarComTemplate` — persiste no banco e envia push condicionalmente conforme `NotificacaoPreferencia`. **Sistema de templates (Phase 2):** `substituirVariaveis()` com whitelist de variáveis por tipo (`VARIAVEIS_POR_TIPO`), sanitização DOMPurify, `htmlToPlainText`, `mapTipoParaWhitelist`. Editor admin com chips de variáveis (`TemplateEditor.tsx`).
  - Ações instrumentadas com templates: `nova_maleta` (criarMaleta), `acerto_confirmado` (conferirEFecharMaleta), `prazo_proximo`/`maleta_atrasada` (cron job), `pontos_ganhos` (registrarVenda, registrarVendaMultipla, awardPoints), `devolucao_recebida` (submitDevolucao).
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
- **Menu "Más" (`/app/mas`)**:
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
- **Cron**: Edge Functions em `supabase/functions/` agendadas via `pg_cron` (check-maleta-prazo, marcar-maletas-atrasadas, agrega-analytics-diario).
- **Tracking**: `src/app/api/track/` + `AnalyticsTracker.tsx`.
- **Export**: `src/app/api/export/`.
- **RLS**: Script consolidado `scripts/rls-policies.sql` com policies para 25 tabelas (resellers, maletas, maleta_itens, vendas_maleta, pontos_extrato, reseller_documentos, datos_bancarios, notificacao_preferencias, solicitacoes_brinde, resgates, analytics_acessos, analytics_diario, revendedora_leads, gamificacao_regras, nivel_regras, commission_tiers, brindes, contratos, contrato_versao, notificacao_templates, categories, products, product_variants, reseller_products, estoque_movimentos).
- **Proteção de dados**: Prisma Client Extension com criptografia AES-256-GCM para `DadosBancarios` (`src/lib/prisma/encrypt-middleware.ts`); upload de documentos para path `private/` no R2; Server Actions de signed URLs com auditoria (`src/lib/data-protection/document-access.ts`); helpers de máscara para UI (`src/lib/data-protection/mask-utils.ts`); sanitizador de vitrina pública (`src/lib/data-protection/vitrina-sanitizer.ts`); helper `sanitizeForLog` para logs (`src/lib/errors/sanitize-log.ts`).
- **Observabilidade**: Sentry SDK (`@sentry/nextjs`) com client/server config, performance monitoring (`browserTracingIntegration`), session replay com privacy masking (`maskAllText`, `maskAllInputs`, `blockAllMedia`), release tracking via CI (`SENTRY_RELEASE`). Logger estruturado JSON (`src/lib/logger.ts`) com sanitização automática de PII (`sanitizeForLog`). Captura de erros em Server Actions (`captureServerActionError`) com contexto de usuário (`setUserContext`). Edge Functions com logs estruturados (JSON). Health endpoint `/api/health`.
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
| Admin — Analytics | **Funcional** | Dashboard operacional de maletas com KPIs (ativas, devolvidas, taxa de atraso, ticket médio, tempo médio de devolução), gráficos (fluxo de maletas, distribuição por status), ranking de revendedoras por volume, alertas de prazo e produtos mais vendidos. **Extensão de vitrina pública implementada (Phase 8):** KPIs de vitrina (visitas, visitantes únicos, cliques WhatsApp, CTR checkout, CTR contato), gráfico de visitas diárias (recharts), ranking de revendedoras por engajamento da vitrina, seletor de revendedora para drill-down, export CSV sem PII. Filtro por período (7d/30d/3m/12m) e escopo RBAC. Ref.: `SPEC_ADMIN_ANALYTICS_NOTIFICATIONS.md`. |
| Admin — Documentos e Acertos | **Funcional** | Lista de revendedoras com badges de atenção (doc pendente, acerto aguardando, OK). Tela `/admin/revendedoras/[id]/documentos` para aprovar/rejeitar CI com preview, observação obrigatória e histórico. Server Actions com RBAC + notificações push (`documento_aprovado` / `documento_reprovado`). Acerto de maleta já coberto pela conferência em `/admin/maletas/[id]/conferir`. Ref.: `SPEC_ADMIN_DOCUMENTOS_ACERTOS.md`. |
| Admin — Leads | **Funcional** | Pipeline completo: landing `/seja-revendedora` → API `/api/leads/submit` → admin `/admin/leads` com tabs e modais. Server Actions `aprovarLead` (idempotente, cria usuário Supabase Auth + perfil + email welcome Brevo) e `recusarLead` (email rejection Brevo). Ref.: `SPEC_ADMIN_LEADS.md`.
| Admin — Config (Tiers, Níveis, Contratos) | **Funcional** | CRUD completo: `CommissionTier` (faixas de comissão), `NivelRegra` (níveis de gamificação), `ContratoVersao` (upload PDF R2). Telas `/admin/config/comissoes`, `/admin/config/niveis`, `/admin/config/contratos`. Integração contrato no onboarding PWA. Ref.: `CONF-01..06`.
| Admin — Gamificação / Relatórios | **Stub / placeholder** | Rotas criadas, SPECs prontas, lógica a implementar. |
| Portal Revendedora (PWA) | **Funcional** | Login (com recuperação de senha via email + redefinição), onboarding completo (incluindo aceite de contrato), perfil (resumo/datos/bancario/soporte/notificações), maleta (listagem/detalhes/venta/devolução), catálogo (busca/filtro/compartilhamento), progresso/brindes, centro de notificações persistente, menu "Más". **Dashboard de desempenho (`/app/desempeno`) implementado com métricas, filtro de período, gráfico recharts e top produtos.** View Transitions funcionando. |
| Vitrina pública `/vitrina/[slug]` | **Funcional** | Página pública com ISR (`revalidate = 300`), perfil da revendedora, grid de produtos da maleta ativa, página de detalhe (`[produtoId]`), carrinho localStorage com badge flutuante, checkout via WhatsApp com mensagem formatada. Tracking anônimo via `mnrc_vid` cookie + `/api/vitrina/track`. RLS policies `anon` para `maletas` e `maleta_itens`. Phase 6 concluída em 2026-05-05. |
| RBAC + RLS | **Funcional — auditoria 2026-04-22 resolvida** | Todas as vulnerabilidades críticas corrigidas: `requireAuth` + ownership check em `devolverMaleta`; removidos exports inseguros de `fecharMaleta`/`conciliarMaleta`; `checkOverdueMaletas` convertida em cron job autenticado; `getActiveResellers`/`getAvailableVariants` protegidos; middleware fail-closed para `userRole=null`; auto-link restrito a `REVENDEDORA`; `assertIsInGroup` aplicado nas actions `/app` para COLABORADORA; `registrarVenda` usa `preco_fixado` do banco. Testes de regressão em `src/__tests__/security/rbac-regression.test.ts`. RLS cobre 23 tabelas. |
| Cache & Revalidação | **Funcional** | Helper centralizado `invalidateCache` em `src/lib/cache/invalidate.ts` com métodos tipados para todas as tags (`catalog`, `brindes`, `gamificacao-config`, `vitrine-*`, `tiers-config`, `niveis-config`, `admin-dashboard`, `desempeno-*`, `commission-*`). Todas as mutation Server Actions (14 arquivos) invalidam cache após escrita. Páginas públicas usam ISR (`revalidate = 60`). Ref.: `SPEC_CACHING_STRATEGY.md`. |
| Proteção de dados sensíveis | **Funcional** | Criptografia AES-256-GCM via Prisma Client Extension para `DadosBancarios` (campos `alias_ci_ruc`, `alias_valor`, `cuenta`, `ci_ruc`). Upload de documentos para `private/` no R2. Signed URLs de documentos com TTL de 1h + log de auditoria. Helper `sanitizeForLog` para sanitização de PII em logs. Helpers de máscara (`maskAlias`, `maskCuenta`, `maskCI`, `maskEmail`, `maskWhatsApp`). Sanitizador de vitrina pública (`getPublicVitrinaData`). Ref.: `SPEC_SECURITY_DATA_PROTECTION.md`. |
| Gamificação (motor) | **Funcional** | `awardPoints` respeita tipo (único/diário/mensal/evento), limite diário e flag ativo. 7 regras seedadas. Tela `/app/progresso` mostra tarefas e progresso. Admin pode configurar regras e níveis. |
| Notificações (OneSignal + Templates) | **Funcional** | Wrapper + prompt nativo; centro de notificações no PWA implementado (histórico persistente, badge de não lidas). **Admin AlertBell implementado** — sininho persistente no layout admin com badge de maletas `aguardando_revisao` e drawer de devoluções pendentes. **Configuração de notificações push no admin implementada** (`/admin/config/notif-push`) — 7 templates seedados, edição de título/corpo, toggle ativo/inativo, teste de push, histórico de envios e **campanhas push em massa** (filtros por segmento, seleção múltipla, envio em batches de 2000). **Sistema de templates (Phase 2):** `substituirVariaveis()` com whitelist, sanitização, editor com chips de variáveis. Wire em `registrarVenda`, `conferirEFecharMaleta`, `submitDevolucao` e cron jobs Edge Functions. Ref.: `NOTF-01..09`.
| Emails transacionais (Brevo) | **Completo** | Wrapper unificado `renderEmailBase()` com dark mode, logo Monarca, footer padronizado e fallback plaintext. 7 templates refatorados (`convite-usuario`, `candidatura-aprovada`, `candidatura-rechazada`, `documento-aprovado`, `documento-pendente`, `documento-rejeitado`, `acerto-confirmado` com tabela visual de breakdown). Utilitários híbridos: `emailButton()`, `emailTable()`, `emailAlert()`, `emailDivider()`. Templates Supabase Auth (reset/invite) com branding Monarca + script de sync `sync-supabase-auth-templates.ts` (`--dry-run`, `--check`) + GitHub Actions workflow. 43 testes (272 passando). SDK `@getbrevo/brevo`, `src/lib/emails.ts` com dual-format (html+text). SMTP Brevo configurado no Supabase Dashboard. Domínio: `monarcasemijoyas.com.py`. Ref.: `SPEC_EMAILS.md`.
| Rate Limiting | **Funcional** | Upstash Redis com sliding window. Endpoints protegidos: `/api/track` (100 req/min/IP), `/api/vitrina/track` (100 req/min/IP), `/api/upload-r2` (10 req/min/userId). Admin/COLABORADORA bypass. Fallback graceful quando Redis indisponível. 17 testes. Ref.: `SPEC_SECURITY_API_ENDPOINTS.md`, `RATE_LIMITS.md`. Phase 11 concluída em 2026-05-06. |
| Testes (Vitest + Playwright) | **Funcional (Vitest)** | 295 testes passando em 23 arquivos. Playwright E2E a configurar. |
| Observabilidade (Sentry) | **Funcional** | Sentry integrado (client + server) com release tracking, performance monitoring (Web Vitals, traces), session replay com privacy masking. Logger estruturado JSON com sanitização automática de PII. Captura automática de erros em Server Actions com contexto (userId, action name). Endpoint `/api/health` para monitoramento externo. CI cria releases no Sentry para main. Ref.: `SPEC_LOGGING_MONITORING.md`. Phase 10 concluída em 2026-05-06. |

---

## 8. Onde começar

- **Desenvolvedor novo no projeto** → [`README.md`](./README.md) → depois [`sistema/SPEC_BACKEND.md`](./sistema/SPEC_BACKEND.md) e [`sistema/SPEC_FRONTEND.md`](./sistema/SPEC_FRONTEND.md).
- **Design** → [`design-system/README.md`](./design-system/README.md) + [`sistema/SPEC_DESIGN_MODULES.md`](./sistema/SPEC_DESIGN_MODULES.md).
- **Produto** → [`prd/PRD.md`](./prd/PRD.md).
- **DevOps** → [`sistema/SPEC_DEPLOY_STRATEGY.md`](./sistema/SPEC_DEPLOY_STRATEGY.md) + [`sistema/SPEC_ENVIRONMENT_VARIABLES.md`](./sistema/SPEC_ENVIRONMENT_VARIABLES.md).
