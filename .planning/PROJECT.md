# NEXT-MONARCA

## What This Is

Plataforma de gestão de revendedoras de semijoias Monarca (Paraguai). Integra PWA mobile-first para revendedoras gerenciarem maletas em consignação, painel desktop para admin/consultoras operarem o negócio, e vitrina pública por revendedora para clientes finais. O ciclo central é a **maleta em consignação**: admin envia produtos, revendedora vende e devolve o restante, sistema congela valores e calcula comissões por tier.

## Core Value

Revendedoras conseguem receber, registrar vendas e devolver maletas com comprovante — e receber a comissão calculada automaticamente.

## Requirements

### Validated

- ✓ Auth & RBAC (3 roles: REVENDEDORA, COLABORADORA, ADMIN) com middleware fail-closed, guards de Server Action e RLS no Supabase (23 tabelas) — auditoria 2026-04-22 resolvida
- ✓ Portal Admin — CRUD de Produtos e Categorias com upload R2 e hierarquia
- ✓ Portal Admin — Ciclo completo de Maleta (criar, editar, conferir, fechar com e sem comprovante)
- ✓ Portal Admin — Gestão de Equipe (lista + perfil de Consultoras e Revendedoras; criação via Supabase Auth + convite Brevo)
- ✓ Portal Admin — Analytics operacional de maletas (KPIs, gráficos, filtro por período, escopo RBAC)
- ✓ Portal Admin — Documentos e Acertos (aprovar/rejeitar CI com preview + notificação push)
- ✓ Portal Admin — AlertBell com badge de devoluções pendentes e drawer
- ✓ Portal Admin — Configuração de templates de push + campanhas push em massa (segmentos, batches de 2000)
- ✓ Portal Admin — Sidebar da Consultora com `/admin/minha-conta` e extrato de comissões
- ✓ PWA Revendedora — Login + recuperação de senha via email (SMTP Brevo)
- ✓ PWA Revendedora — Onboarding multi-step (boas-vindas, slides, perfil, opt-in push)
- ✓ PWA Revendedora — Perfil completo (dados pessoais, bancário, suporte, preferências push)
- ✓ PWA Revendedora — Maleta (listagem, detalhes, registrar venda, devolução com câmera + comprovante)
- ✓ PWA Revendedora — Catálogo com busca, filtro, compartilhamento individual e multi-foto via Web Share API
- ✓ PWA Revendedora — Home com métricas reais, rank, pontos, pills de comissão e maleta ativa
- ✓ PWA Revendedora — Extrato de pontos + catálogo de brindes
- ✓ PWA Revendedora — Centro de notificações com histórico persistente (Hoy/Ayer/Anteriores) e badge
- ✓ PWA Revendedora — Menu "Más" com grupos Mi Cuenta / Actividad / Soporte
- ✓ PWA Revendedora — View Transitions (crossfade tabs, slide-up modal, push/pop horizontal, shared element hero)
- ✓ Motor de gamificação (pontos por tipo, progressão de níveis, tiers de comissão, 7 regras seedadas)
- ✓ Brindes (catálogo admin + resgates + extrato de brindes no PWA)
- ✓ Notificações OneSignal (wrapper, prompt nativo, preferências, histórico persistente)
- ✓ Emails transacionais via Brevo (7 templates, SMTP configurado no Supabase)
- ✓ Cron jobs Supabase Edge Functions (check-maleta-prazo D-3/D-1, marcar-atrasadas, agrega-analytics-diario)
- ✓ Proteção de dados (criptografia AES-256-GCM para dados bancários, signed URLs, sanitização de PII em logs)
- ✓ Site público (homepage, catálogo, produto, carrinho, landing "Seja Revendedora")
- ✓ Infraestrutura (Prisma + Supabase, Cloudflare R2, Serwist PWA, Vercel deploy, RLS 23 tabelas)

### v1.0 — Operação e Visibilidade (SHIPPED 2026-05-05)

- ✓ Error handling centralizado (`ActionResult<T>`, `safeAction()`, `mapError()`, `BusinessError`) — Phase 1
- ✓ UI state components (`SkeletonCard`, `EmptyState`, `ErrorState`) integrados em 6+ rotas — Phase 1
- ✓ Toast system unificado (`sonner` em PWA + Admin layouts) — Phase 1
- ✓ Notification template system (`substituirVariaveis`, whitelist, DOMPurify, editor com chips) — Phase 2
- ✓ Lead pipeline (landing → admin approval → Supabase Auth + Brevo emails, idempotente, race-protected) — Phase 2
- ✓ Admin config: CommissionTier CRUD (`/admin/config/comissoes`) — Phase 2
- ✓ Admin config: NivelRegra CRUD (`/admin/config/niveis`) — Phase 2
- ✓ Admin config: Contrato CRUD com R2 PDF upload (`/admin/config/contratos`) — Phase 2
- ✓ Contract integration in onboarding PWA (`contrato_aceite_em`) — Phase 2
- ✓ Templates wired into cron jobs and Server Actions — Phase 2
- ✓ Reseller performance dashboard (`/app/desempeno` com recharts, period filter, trends) — Phase 3
- ✓ Admin dashboard polish (period filter 7d/30d/3m/12m, skeleton loading) — Phase 3
- ✓ ISR on public pages (`revalidate = 60`), `force-dynamic` removed — Phase 4
- ✓ Centralized cache invalidation (`invalidateCache` helper, 14 action files wired) — Phase 4
- ✓ Build verification (lint, typecheck, build pass) — Phase 4
- ✓ BUSINESS throw cleanup (9 files migrated to `ActionResult<T>`) — Phase 5
- ✓ Security validation (XSS tests, OneSignal plain-text, RLS verification) — Phase 5
- ✓ Performance validation (34 composite index tests) — Phase 5
- ✓ Critical acceptance tests (timezone, commission, stock, lead idempotency — 19 tests) — Phase 5
- ✓ RBAC scope leak suite (23 isolation tests, all passing) — Phase 5
- ✓ CI/CD quality gate (GitHub Actions workflow: lint + typecheck + test + build) — Phase 5

## Current Milestone: v1.2 Produção e Qualidade

**Goal:** Elevar a qualidade do sistema com testes E2E, observabilidade, rate limiting e preparação para produção.

**Target features:**
- Testes E2E com Playwright — golden paths (login → maleta → venda → devolução)
- Observabilidade — Sentry + logs estruturados + alertas (SPEC: `sistema/SPEC_LOGGING_MONITORING.md`)
- Rate limiting nos endpoints sensíveis via Upstash Redis (SPEC: `sistema/SPEC_SECURITY_API_ENDPOINTS.md`)
- Migração para domínio oficial `monarcasemijoyas.com.py`
- Migração PWA → Capacitor (iOS + Android) (SPEC: `sistema/SPEC_CAPACITOR_MIGRATION.md`)
- Modo offline do PWA — outbox, sync idempotente, resolução de conflitos (SPEC: `sistema/SPEC_OFFLINE_SYNC.md`)

### Validated

- ✓ Vitrina pública `/vitrina/[slug]` com SEO, tracking, carrinho e checkout WhatsApp — v1.1
- ✓ Padronização de email branding — wrapper `renderEmailBase()`, 7 templates refatorados, Supabase Auth sync — v1.1
- ✓ Analytics de vitrina no admin — KPIs, gráfico temporal, ranking, export CSV — v1.1

### Active

<!-- v1.2 — Produção e Qualidade -->

- [ ] Testes E2E com Playwright — golden paths
- [ ] Observabilidade — Sentry + logs estruturados + alertas
- [ ] Rate limiting nos endpoints sensíveis
- [ ] Migração para domínio oficial
- [ ] Migração PWA → Capacitor
- [ ] Modo offline do PWA

### Future (v1.3+)

- [ ] Testes E2E com Playwright — golden paths (login → maleta → venda → devolução)
- [ ] Observabilidade — Sentry + logs estruturados + alertas (SPEC: `sistema/SPEC_LOGGING_MONITORING.md`)
- [ ] Rate limiting nos endpoints sensíveis via Upstash Redis (SPEC: `sistema/SPEC_SECURITY_API_ENDPOINTS.md`)
- [ ] Migração para domínio oficial `monarcasemijoyas.com.py` (DNS, Vercel, Supabase Auth, Brevo SPF/DKIM, R2, OneSignal, PWA)
- [ ] Migração PWA → Capacitor (iOS + Android) — push nativo APNs, Universal Links (SPEC: `sistema/SPEC_CAPACITOR_MIGRATION.md`)
- [ ] Modo offline do PWA — outbox, sync idempotente, resolução de conflitos (SPEC: `sistema/SPEC_OFFLINE_SYNC.md`)

### Out of Scope

- Multi-tenant / multi-marca — sistema é exclusivo para Monarca Semijoyas
- E-commerce com checkout próprio (carrinho atual é vitrina, não loja com pagamento integrado)
- App separado para clientes finais — clientes acessam via vitrina pública
- Internacionalização (i18n) — idioma fixo: espanhol paraguaio

## Context

**Projeto:** Sistema operacional completo da marca Monarca Semijoyas (Paraguai). Produto em desenvolvimento ativo com base de revendedoras crescendo.

**Stack:**
- Next.js 15 (App Router, Server Components, Server Actions) + React 19 + TypeScript estrito
- Tailwind CSS v4 + tokens de design system + Raleway (fonte padrão PWA)
- Prisma ORM + PostgreSQL via Supabase + Supabase Auth (email/senha) + RLS
- Cloudflare R2 (S3-compatible) para imagens, comprovantes e documentos privados
- Brevo para emails transacionais; OneSignal para push PWA
- Supabase Edge Functions para cron jobs; Vercel para hosting
- Vitest (unit/integration); Playwright (E2E, ainda não configurado)

**Codebase map:** `.planning/codebase/` (ARCHITECTURE, STACK, STRUCTURE, INTEGRATIONS, CONVENTIONS, CONCERNS, TESTING)

**Padrões estabelecidos:**
- `getCurrentUser()` cached via `React.cache()` — nunca criar wrapper alternativo
- Middleware só refresca JWT; verificação de role nos layouts e Server Actions
- `force-dynamic` em páginas autenticadas; ISR (`revalidate = 60`) em páginas públicas
- Defesa em profundidade: middleware + guard Server Action + RLS Supabase
- Valores de maleta fechada são imutáveis (snapshots)
- Nunca vazar PII em logs (helper `sanitizeForLog`)
- `git push` vai para remote `client` (repo oficial Monarca)

**Design system:** `docs/design-system/tokens.md` + CSS variables `--app-*` / `--admin-*`. Paper é a fonte visual de verdade — consultar MCP Paper antes de qualquer tela nova.

**Shipped v1.0:** 5 phases, 19 plans, 229 tests, 33 commits, ~21.5h timeline.
**Shipped v1.1:** 3 phases, 10 plans, 272 tests, 34 commits, ~1.5 days timeline.
**Current:** v1.2 planning — E2E, observabilidade, rate limiting, domínio oficial, Capacitor, offline mode.

## Constraints

- **Stack:** Next.js 15 + Prisma + Supabase — não migrar sem decisão explícita
- **Idioma da UI:** Espanhol paraguaio em todas as interfaces — nunca português ou espanhol neutro
- **Imutabilidade:** Valores de maletas fechadas são snapshots — nunca recalcular
- **Segurança:** Toda mutação financeira exige `requireAuth` + ownership check — sem exceções
- **Remote git:** Push padrão para `client` (repo Monarca oficial), não `origin`
- **Design:** Tokens do design system obrigatórios — zero valores hex/px hardcoded no JSX de produção
- **Paper:** Consultar artboard correspondente no Paper MCP antes de implementar qualquer UI

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Prisma 7 com operações sequenciais em vez de `$transaction(async)` | Driver adapter PrismaPg não suporta `$transaction(async tx)` | ✓ Funciona — usado em maleta, conferência, gamificação |
| Supabase Edge Functions para cron jobs (em vez de Route Handlers) | Route Handlers ficam expostos publicamente; Edge Functions autenticadas por `CRON_SECRET` | ✓ Bom — corrigi vulnerabilidade `checkOverdueMaletas` |
| Criptografia AES-256-GCM via Prisma Client Extension | Dados bancários sensíveis exigem at-rest encryption transparente | ✓ Funcional em produção |
| OneSignal prompt nativo em vez de slidedown | slidedown iOS não confiável; prompt nativo destrava casos de PWA ainda não em Ajustes | ✓ Melhor conversão no iOS |
| View Transitions via `notifyAppRouteCommit()` + `useLayoutEffect` | React 19 App Router + `startViewTransition` causavam deadlock sem mecanismo de commit | ✓ Resolvido — animações funcionando |
| Auto-link restrito a `REVENDEDORA` no `getCurrentUser` | ADMIN/COLABORADORA com auto-link permitiria takeover de perfis elevados | ✓ Segurança — auditoria 2026-04-22 |
| `force-dynamic` como workaround de build Vercel | Build sem `DATABASE_URL` válida falha em qualquer prerender com Prisma | ⚠️ Revisitar — degradação de performance em páginas públicas |
| `BusinessError` class em vez de string-prefixed `BUSINESS:` throws | Mais limpo que parsing `Error.message`; integra naturalmente com `safeAction` | ✓ Funciona — usado em 9+ arquivos na migração v1.0 |
| `isomorphic-dompurify` para sanitização server-side | Permite formatação básica (`b`, `i`, `a`) enquanto stripa scripts/event handlers | ✓ Funciona — 28 testes passando |
| `continue-on-error` para lint/typecheck no CI | Projeto tem 48 erros pré-existentes; bloquear CI impediria merges | ⚠️ Revisitar — remover quando erros forem corrigidos |

---

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-06 after v1.1 milestone completion*
