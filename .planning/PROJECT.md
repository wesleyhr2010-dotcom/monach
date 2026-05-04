# NEXT-MONARCA

## What This Is

Plataforma de gestão de revendedoras de semijoias Monarca (Paraguai). Integra PWA mobile-first para revendedoras gerenciarem maletas em consignação, painel desktop para admin/consultoras operarem o negócio, e vitrina pública por revendedora para clientes finais. O ciclo central é a **maleta em consignação**: admin envia produtos, revendedora vende e devolve o restante, sistema congela valores e calcula comissões por tier.

## Core Value

Revendedoras conseguem receber, registrar vendas e devolver maletas com comprovante — e receber a comissão calculada automaticamente.

## Requirements

### Validated

<!-- Implementado e em operação. -->

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

### Active

<!-- Pendente — ordenado por prioridade definida em docs/next_steps.md -->

- [ ] Conectar editor de Templates de Notificação ao cron (helper `substituirVariaveis`, refatorar geradores automáticos para ler `NotificacaoTemplate` por tipo)
- [ ] Pipeline de Leads da landing "Seja Revendedora" → admin (SPEC: `admin/SPEC_ADMIN_LEADS.md`)
- [ ] Desempenho da revendedora — analytics individual no PWA (SPEC: `revendedoras/SPEC_DESEMPENHO.md`)
- [ ] Dashboard admin com KPIs globais/grupo (SPEC: `admin/SPEC_ADMIN_DASHBOARD.md`)
- [ ] Configurações globais admin (tiers, níveis, contratos) (SPEC: `admin/SPEC_ADMIN_CONFIG.md`)
- [ ] Vitrina pública `/vitrina/[slug]` com SEO e tracking (SPEC: `revendedoras/SPEC_VITRINE_PUBLICA.md`)
- [ ] Padronizar layout/branding dos emails transacionais (identidade visual, copy espanhol paraguaio)
- [ ] Otimizar build Vercel — remover `force-dynamic` das páginas públicas; configurar `DATABASE_URL` no build step ou migrar para ISR
- [ ] Analytics agregados admin além de campanhas push (SPEC: `admin/SPEC_ADMIN_ANALYTICS_NOTIFICATIONS.md`)
- [ ] Error handling centralizado (ActionResult + mensagens) (SPEC: `sistema/SPEC_ERROR_HANDLING.md`)
- [ ] Skeleton / empty / error states consistentes (SPEC: `sistema/SPEC_SKELETON_EMPTY_STATES.md`)
- [ ] Testes E2E com Playwright — golden paths (login → maleta → venda → devolução)
- [ ] Observabilidade — Sentry + logs estruturados + alertas (SPEC: `sistema/SPEC_LOGGING_MONITORING.md`)
- [ ] Rate limiting nos endpoints sensíveis via Upstash Redis (SPEC: `sistema/SPEC_SECURITY_API_ENDPOINTS.md`)
- [ ] Migração para domínio oficial `monarcasemijoyas.com.py` (DNS, Vercel, Supabase Auth, Brevo SPF/DKIM, R2, OneSignal, PWA)
- [ ] Estratégia de cache e revalidação com `revalidateTag` por entidade (SPEC: `sistema/SPEC_CACHING_STRATEGY.md`)
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
*Last updated: 2026-05-04 after initialization (brownfield)*
