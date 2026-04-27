# Documentação — NEXT-MONARCA

Esta pasta é a **fonte única de verdade** da documentação do sistema. Todas as SPECs seguem a mesma estrutura: **Objetivo · Atores · Fluxo · Regras de negócio · Edge cases · Dependências**, com os detalhes técnicos originais preservados em "Detalhes técnicos / Referência" ao final de cada arquivo.

> Para visão geral do produto, stack e arquitetura, ver [`project_overview.md`](./project_overview.md).

---

## Estrutura

```
docs/
├── README.md                 ← você está aqui (índice)
├── project_overview.md       ← descrição do sistema e stack
├── CHANGELOG.md              ← histórico de mudanças
├── admin/                    ← SPECs do painel admin / consultora
├── revendedoras/             ← SPECs do portal PWA da revendedora
├── sistema/                  ← SPECs transversais (infra, segurança, design)
├── prd/                      ← documentos de produto
├── design-system/            ← tokens, componentes, visão geral
├── assets/                   ← materiais de marca (PDFs)
└── archive/                  ← documentos históricos (não mais canônicos)
```

---

## 1. Visão geral

| Documento | Descrição |
|-----------|-----------|
| [`project_overview.md`](./project_overview.md) | Stack, arquitetura, módulos principais |
| [`CHANGELOG.md`](./CHANGELOG.md) | Histórico de alterações relevantes |

---

## 2. Produto (PRDs)

| Documento | Descrição |
|-----------|-----------|
| [`prd/PRD.md`](./prd/PRD.md) | PRD principal do sistema |
| [`prd/PRD_OneSignal_PWA.md`](./prd/PRD_OneSignal_PWA.md) | PRD específico de push notifications |

---

## 3. Portal da Revendedora (`/app/*`)

PWA mobile-first em espanhol paraguaio.

| SPEC | Descrição |
|------|-----------|
| [`revendedoras/SPEC_LOGIN.md`](./revendedoras/SPEC_LOGIN.md) | Login via Supabase Auth |
| [`revendedoras/SPEC_RECUPERAR_CONTRASENA.md`](./revendedoras/SPEC_RECUPERAR_CONTRASENA.md) | Fluxo de recuperação de senha |
| [`revendedoras/SPEC_ONBOARDING_REVENDEDORA.md`](./revendedoras/SPEC_ONBOARDING_REVENDEDORA.md) | Primeiro acesso e completude de perfil |
| [`revendedoras/SPEC_SEJA_REVENDEDORA.md`](./revendedoras/SPEC_SEJA_REVENDEDORA.md) | Landing pública para captação de leads |
| [`revendedoras/SPEC_HOME.md`](./revendedoras/SPEC_HOME.md) | Dashboard home com métricas e maleta ativa |
| [`revendedoras/SPEC_MENU_MAS.md`](./revendedoras/SPEC_MENU_MAS.md) | Hub de navegação `/app/mais` (Más Opciones) |
| [`revendedoras/SPEC_CATALOGO.md`](./revendedoras/SPEC_CATALOGO.md) | Catálogo de produtos |
| [`revendedoras/SPEC_MALETA.md`](./revendedoras/SPEC_MALETA.md) | Maleta em consignação (ciclo de vida) |
| [`revendedoras/SPEC_DEVOLUCAO.md`](./revendedoras/SPEC_DEVOLUCAO.md) | Devolução com comprovante |
| [`revendedoras/SPEC_PROGRESSO.md`](./revendedoras/SPEC_PROGRESSO.md) | Progresso de níveis e pontos |
| [`revendedoras/SPEC_EXTRATO_BRINDES.md`](./revendedoras/SPEC_EXTRATO_BRINDES.md) | Extrato de pontos e catálogo de brindes |
| [`revendedoras/SPEC_DESEMPENHO.md`](./revendedoras/SPEC_DESEMPENHO.md) | Analytics de desempenho da revendedora |
| [`revendedoras/SPEC_NOTIFICACOES.md`](./revendedoras/SPEC_NOTIFICACOES.md) | Centro de notificações |
| [`revendedoras/SPEC_PERFIL.md`](./revendedoras/SPEC_PERFIL.md) | Perfil, dados bancários e documentos |
| [`revendedoras/SPEC_VITRINE_PUBLICA.md`](./revendedoras/SPEC_VITRINE_PUBLICA.md) | Vitrina pública `/vitrina/[slug]` |

---

## 4. Painel Admin / Consultora (`/admin/*`)

Desktop em espanhol paraguaio. Consultora (`COLABORADORA`) compartilha o mesmo path com escopo reduzido ao seu grupo.

| SPEC | Descrição |
|------|-----------|
| [`admin/SPEC_ADMIN_LAYOUT.md`](./admin/SPEC_ADMIN_LAYOUT.md) | Shell, navegação e permissões |
| [`admin/SPEC_ADMIN_DASHBOARD.md`](./admin/SPEC_ADMIN_DASHBOARD.md) | KPIs globais / do grupo |
| [`admin/SPEC_ADMIN_EQUIPE.md`](./admin/SPEC_ADMIN_EQUIPE.md) | Gestão de revendedoras e consultoras |
| [`admin/SPEC_ADMIN_CONSULTORA_PERFIL.md`](./admin/SPEC_ADMIN_CONSULTORA_PERFIL.md) | Perfil da consultora (mesmo path, acesso reduzido) |
| [`admin/SPEC_ADMIN_MALETAS.md`](./admin/SPEC_ADMIN_MALETAS.md) | Gestão de maletas em consignação |
| [`admin/SPEC_ADMIN_CONFERIR_MALETA.md`](./admin/SPEC_ADMIN_CONFERIR_MALETA.md) | Fluxo de conferência e fechamento |
| [`admin/SPEC_ADMIN_PRODUTOS.md`](./admin/SPEC_ADMIN_PRODUTOS.md) | Catálogo, variantes e estoque |
| [`admin/SPEC_ADMIN_BRINDES.md`](./admin/SPEC_ADMIN_BRINDES.md) | Brindes e solicitações de resgate |
| [`admin/SPEC_ADMIN_GAMIFICACAO.md`](./admin/SPEC_ADMIN_GAMIFICACAO.md) | Regras de gamificação, níveis e tiers |
| [`admin/SPEC_ADMIN_DOCUMENTOS_ACERTOS.md`](./admin/SPEC_ADMIN_DOCUMENTOS_ACERTOS.md) | Documentos pessoais e acertos financeiros |
| [`admin/SPEC_ADMIN_LEADS.md`](./admin/SPEC_ADMIN_LEADS.md) | Pipeline de leads "Seja Revendedora" |
| [`admin/SPEC_ADMIN_ANALYTICS_NOTIFICATIONS.md`](./admin/SPEC_ADMIN_ANALYTICS_NOTIFICATIONS.md) | Analytics agregados e campanhas push |
| [`admin/SPEC_ADMIN_CONFIG.md`](./admin/SPEC_ADMIN_CONFIG.md) | Configurações globais |

---

## 5. Sistema & Infraestrutura

### 5.1 Arquitetura

| SPEC | Descrição |
|------|-----------|
| [`sistema/SPEC_DATABASE.md`](./sistema/SPEC_DATABASE.md) | Schema Prisma e modelos |
| [`sistema/SPEC_BACKEND.md`](./sistema/SPEC_BACKEND.md) | Server Actions, padrões, transações |
| [`sistema/SPEC_FRONTEND.md`](./sistema/SPEC_FRONTEND.md) | App Router, layouts, rotas, SSR/SSG |
| [`sistema/SPEC_GAMIFICACAO_OVERVIEW.md`](./sistema/SPEC_GAMIFICACAO_OVERVIEW.md) | Motor de maletas, pontos e comissão |

### 5.2 Integrações

| SPEC | Descrição |
|------|-----------|
| [`sistema/SPEC_API_UPLOAD_R2.md`](./sistema/SPEC_API_UPLOAD_R2.md) | Upload centralizado para Cloudflare R2 |
| [`sistema/SPEC_EMAILS.md`](./sistema/SPEC_EMAILS.md) | Emails transacionais via Brevo |
| [`sistema/SPEC_CRON_JOBS.md`](./sistema/SPEC_CRON_JOBS.md) | Jobs agendados (Supabase Edge Functions) |

### 5.3 Qualidade & Performance

| SPEC | Descrição |
|------|-----------|
| [`sistema/SPEC_CACHING_STRATEGY.md`](./sistema/SPEC_CACHING_STRATEGY.md) | Cache Next.js (Data, Route, React) |
| [`sistema/SPEC_ERROR_HANDLING.md`](./sistema/SPEC_ERROR_HANDLING.md) | ActionResult e mensagens centralizadas |
| [`sistema/SPEC_LOGGING_MONITORING.md`](./sistema/SPEC_LOGGING_MONITORING.md) | Sentry, logs estruturados e alertas |
| [`sistema/SPEC_SKELETON_EMPTY_STATES.md`](./sistema/SPEC_SKELETON_EMPTY_STATES.md) | Loading, empty e error states |
| [`sistema/SPEC_TESTING_STRATEGY.md`](./sistema/SPEC_TESTING_STRATEGY.md) | Vitest, Playwright, cobertura |

### 5.4 Segurança

| SPEC | Descrição |
|------|-----------|
| [`sistema/SPEC_SECURITY_RBAC.md`](./sistema/SPEC_SECURITY_RBAC.md) | Roles, guards e prevenção de IDOR |
| [`sistema/SPEC_SECURITY_API_ENDPOINTS.md`](./sistema/SPEC_SECURITY_API_ENDPOINTS.md) | Rate limiting e validação de endpoints |
| [`sistema/SPEC_SECURITY_DATA_PROTECTION.md`](./sistema/SPEC_SECURITY_DATA_PROTECTION.md) | PII, documentos e dados bancários |

### 5.5 Deploy & Operação

| SPEC | Descrição |
|------|-----------|
| [`sistema/SPEC_DEPLOY_STRATEGY.md`](./sistema/SPEC_DEPLOY_STRATEGY.md) | CI/CD, ambientes e rollback |
| [`sistema/SPEC_MIGRATIONS_SEED.md`](./sistema/SPEC_MIGRATIONS_SEED.md) | Prisma Migrate, seed e backups |
| [`sistema/SPEC_ENVIRONMENT_VARIABLES.md`](./sistema/SPEC_ENVIRONMENT_VARIABLES.md) | Variáveis de ambiente por contexto |
| [`sistema/SPEC_DOMAIN_MIGRATION.md`](./sistema/SPEC_DOMAIN_MIGRATION.md) | Checklist de migração para o domínio oficial `monarcasemijoyas.com.py` |
| [`sistema/SPEC_CAPACITOR_MIGRATION.md`](./sistema/SPEC_CAPACITOR_MIGRATION.md) | Migração futura do PWA para app nativo via Capacitor (iOS + Android) |
| [`sistema/SPEC_OFFLINE_SYNC.md`](./sistema/SPEC_OFFLINE_SYNC.md) | Modo offline do PWA — outbox, sync, resolução de conflitos, idempotência |

### 5.6 Design

| SPEC | Descrição |
|------|-----------|
| [`sistema/SPEC_DESIGN_MODULES.md`](./sistema/SPEC_DESIGN_MODULES.md) | Átomos, moléculas e organismos do PWA |
| [`sistema/SPEC_TRANSICOES_TELAS.md`](./sistema/SPEC_TRANSICOES_TELAS.md) | Transições entre telas no PWA (View Transitions API + padrões push/pop/sheet/crossfade/hero) |
| [`design-system/README.md`](./design-system/README.md) | Visão geral do design system |
| [`design-system/tokens.md`](./design-system/tokens.md) | Tokens de cor, tipografia e espaçamento |
| [`design-system/DESIGN_SYSTEM.md`](./design-system/DESIGN_SYSTEM.md) | Referência consolidada |

### 5.7 Referência adicional

| Documento | Descrição |
|-----------|-----------|
| [`sistema/CODE_PATTERNS.md`](./sistema/CODE_PATTERNS.md) | Padrões de código e convenções |

---

## 6. Arquivo histórico

Documentação superada ou snapshot de sessões de pesquisa. Não usar como fonte de verdade.

- [`archive/OLD_DOCS_README.md`](./archive/OLD_DOCS_README.md)
- [`archive/research_codebase.md`](./archive/research_codebase.md)
- [`archive/CONTEXTO_SESSAO.md`](./archive/CONTEXTO_SESSAO.md)

---

## Convenções

- **Idioma de interface**: espanhol paraguaio em toda UI voltada ao usuário final.
- **Idioma da documentação**: português nas seções funcionais; conteúdo técnico original preservado no idioma em que foi escrito sob "Detalhes técnicos / Referência".
- **Nomes de path, rotas e identificadores**: mantidos em inglês/espanhol conforme o código.
- **Toda SPEC nova** deve seguir a estrutura: Objetivo · Atores · Fluxo · Regras de negócio · Edge cases · Dependências.
