# Requirements: NEXT-MONARCA

**Defined:** 2026-05-04
**Core Value:** Revendedoras conseguem receber, registrar vendas e devolver maletas com comprovante — e receber a comissão calculada automaticamente.
**Milestone:** v1.0 — Operação e Visibilidade

## v1 Requirements

### Notificações (NOTF)

- [ ] **NOTF-01**: Helper `substituirVariaveis(template, contexto)` substitui placeholders (`{maleta_id}`, `{dias_restantes}`, `{nome_revendedora}`, `{pontos}`) em templates de notificação
- [ ] **NOTF-02**: Cron job `check-maleta-prazo` lê template ativo do tipo `prazo_proximo` em `NotificacaoTemplate` e aplica substituição; cai para texto default se template inativo/ausente
- [ ] **NOTF-03**: Cron job `marcar-maletas-atrasadas` lê template ativo do tipo `maleta_atrasada` e aplica substituição
- [ ] **NOTF-04**: Server Action `registrarVenda` lê template ativo do tipo `pontos_ganhos` e envia notificação com substituição de variáveis
- [ ] **NOTF-05**: Server Action `conferirEFecharMaleta` lê template ativo do tipo `acerto_confirmado` e envia notificação com substituição
- [ ] **NOTF-06**: Server Action `submitDevolucao` lê template ativo do tipo `devolucao_recebida` e envia notificação com substituição
- [ ] **NOTF-07**: Modal de edição de template exibe hint "Variables disponibles" listando variáveis permitidas por tipo
- [ ] **NOTF-08**: Whitelist de variáveis por tipo de template; variáveis não reconhecidas são ignoradas (não quebram o template)
- [ ] **NOTF-09**: Sanitização de HTML em variáveis para emails; plain-text only para push OneSignal

### Leads (LEAD)

- [ ] **LEAD-01**: Landing "Seja Revendedora" persiste lead em `RevendedoraLead` com estado `pendente`
- [ ] **LEAD-02**: Admin vê lista de leads pendentes em `/admin/leads` com filtros (todos/pendentes/aprovados/rejeitados)
- [ ] **LEAD-03**: Admin pode aprovar lead — cria usuário Supabase Auth, cria perfil `Reseller`, atualiza lead para `aprovado`, envia email de boas-vindas via Brevo
- [ ] **LEAD-04**: Admin pode rejeitar lead — atualiza lead para `rejeitado` com observação obrigatória, envia email de rejeição via Brevo
- [ ] **LEAD-05**: Aprovação é idempotente — re-aprovação de lead já aprovado retorna sucesso sem criar duplicatas
- [ ] **LEAD-06**: Race condition protegida — WHERE clause exige `status = 'pendente'`; compensação remove usuário Auth se Prisma falhar
- [ ] **LEAD-07**: Email de convite usa template Brevo com branding Monarca (não texto plano)

### Desempenho da Revendedora (DESE)

- [x] **DESE-01**: Rota `/app/desempeno` existe e é acessível pelo menu "Más" e pelo link "Análisis" da home
- [x] **DESE-02**: 4 cards de métricas: Acessos ao Catálogo, Visitantes Únicos, Clipes no WhatsApp, Peças Vendidas
- [x] **DESE-03**: Seletor de período: Esta Semana / Este Mes / Últimos 30 dias / Este Ano
- [x] **DESE-04**: Tendência percentual vs período anterior (verde ↑, vermelho ↓, "Nuevo" se período anterior = 0)
- [x] **DESE-05**: Gráfico de barras de visitas diárias (recharts) com tooltip personalizado
- [x] **DESE-06**: Lista dos 10 produtos mais populares com imagem, visitas e vendidos
- [x] **DESE-07**: Server Action `getMetricasDesempenho(resellerId, rango)` consulta `AnalyticsDiario` para ranges > 7 dias; `AnalyticsAcesso` apenas para ranges curtos
- [x] **DESE-08**: Dados respeitam RBAC — revendedora só vê seus próprios dados
- [x] **DESE-09**: Estado vazio (sem acessos) exibe mensagem amigável em vez de cards zerados

### Dashboard Admin (DASH)

- [x] **DASH-01**: KPIs globais visíveis para ADMIN: faturamento total, revendedoras ativas, maletas em circulação, taxa de conversão
- [x] **DASH-02**: KPIs por grupo visíveis para COLABORADORA: faturamento do grupo, revendedoras ativas do grupo, comissão total
- [x] **DASH-03**: Filtro de período (7d/30d/3m/12m) reflete em todos os KPIs
- [x] **DASH-04**: Gráfico de fluxo de maletas (barras) por status ao longo do tempo
- [x] **DASH-05**: Ranking de produtos mais vendidos (top 10)
- [x] **DASH-06**: Alertas de prazo (maletas com ≤7 dias para vencimento)
- [x] **DASH-07**: Scope seguro — COLABORADORA só vê dados do seu grupo via `getResellerScope`
- [x] **DASH-08**: Estados de loading com skeleton cards consistentes

### Configurações Globais (CONF)

- [ ] **CONF-01**: Admin edita tiers de comissão (`CommissionTier`) em `/admin/config/comissoes` — label, valor mínimo, percentual
- [ ] **CONF-02**: Admin edita níveis de gamificação (`NivelRegra`) em `/admin/config/niveis` — label, pontos mínimos, benefício
- [ ] **CONF-03**: Admin edita contratos (`Contrato`) em `/admin/config/contratos` — upload de PDF para R2, versão, ativo/inativo
- [ ] **CONF-04**: Contrato ativo é exibido para novas revendedoras no onboarding
- [ ] **CONF-05**: Mudanças em tiers/níveis não afetam maletas já fechadas (snapshots imutáveis)
- [ ] **CONF-06**: Validação Zod em todos os formulários de configuração

### Estabilização Técnica (TECH)

- [x] **TECH-01**: Padrão `ActionResult<T>` adotado em todos os Server Actions novos; `safeAction()` wrapper implementado
- [x] **TECH-02**: Helper `mapError()` mapeia erros Prisma (`P2002`, `P2025`, `P2014`) para mensagens amigáveis em espanhol
- [x] **TECH-03**: Componente `SkeletonCard` reutilizável em `src/components/ui/`
- [x] **TECH-04**: Componente `EmptyState` reutilizável com ícone, título e descrição
- [x] **TECH-05**: Componente `ErrorState` reutilizável com retry action
- [x] **TECH-06**: `sonner` instalado e montado nos root layouts (PWA + Admin); substitui toasts inline ad-hoc
- [ ] **TECH-07**: `force-dynamic` removido de páginas públicas (`/`, `/catalogo`, `/produto/[slug]`, `/seja-revendedora`)
- [ ] **TECH-08**: ISR (`revalidate = 60`) configurado em páginas públicas
- [ ] **TECH-09**: `DATABASE_URL` configurado nas env vars do Vercel (Production + Preview + Development)
- [ ] **TECH-10**: `revalidateTag`/`revalidatePath` adicionados a todas as Server Actions de mutação

## v2 Requirements

### Analytics Avançado

- **ANLT-01**: Export CSV do dashboard admin
- **ANLT-02**: Simulador de comissão ("Se vendes X, ganhás Y")
- **ANLT-03**: Preview de template com substituição de variáveis

### Observabilidade

- **OBSV-01**: Sentry configurado para captura de erros em produção
- **OBSV-02**: Logs estruturados com nível (info/warn/error)
- **OBSV-03**: Alertas automáticos para taxa de erro > 1%

## Out of Scope

| Feature | Reason |
|---------|--------|
| Real-time analytics com WebSocket | Alta complexidade, não core para v1.0 |
| CRM completo para leads | Lead pipeline resolve o problema imediato; CRM é expansão |
| Dashboard drag-and-drop customizável | Over-engineering para v1.0; admin precisa de dados, não de widgets |
| Sentry + logs estruturados | Deferido para v1.1 (observabilidade) |
| Playwright E2E tests | Deferido para v1.1 (qualidade contínua) |
| Rate limiting Upstash | Deferido para v1.1 (segurança API) |
| Migração para domínio oficial | Deferido para v1.1 (infraestrutura) |
| Capacitor / modo offline | Deferido para v1.2 (expansão mobile) |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| NOTF-01 | Phase 2 | Pending |
| NOTF-02 | Phase 2 | Pending |
| NOTF-03 | Phase 2 | Pending |
| NOTF-04 | Phase 2 | Pending |
| NOTF-05 | Phase 2 | Pending |
| NOTF-06 | Phase 2 | Pending |
| NOTF-07 | Phase 2 | Pending |
| NOTF-08 | Phase 2 | Pending |
| NOTF-09 | Phase 2 | Pending |
| LEAD-01 | Phase 2 | Pending |
| LEAD-02 | Phase 2 | Pending |
| LEAD-03 | Phase 2 | Pending |
| LEAD-04 | Phase 2 | Pending |
| LEAD-05 | Phase 2 | Pending |
| LEAD-06 | Phase 2 | Pending |
| LEAD-07 | Phase 2 | Pending |
| DESE-01 | Phase 3 | Complete |
| DESE-02 | Phase 3 | Complete |
| DESE-03 | Phase 3 | Complete |
| DESE-04 | Phase 3 | Complete |
| DESE-05 | Phase 3 | Complete |
| DESE-06 | Phase 3 | Complete |
| DESE-07 | Phase 3 | Complete |
| DESE-08 | Phase 3 | Complete |
| DESE-09 | Phase 3 | Complete |
| DASH-01 | Phase 3 | Complete |
| DASH-02 | Phase 3 | Complete |
| DASH-03 | Phase 3 | Complete |
| DASH-04 | Phase 3 | Complete |
| DASH-05 | Phase 3 | Complete |
| DASH-06 | Phase 3 | Complete |
| DASH-07 | Phase 3 | Complete |
| DASH-08 | Phase 3 | Complete |
| CONF-01 | Phase 2 | Pending |
| CONF-02 | Phase 2 | Pending |
| CONF-03 | Phase 2 | Pending |
| CONF-04 | Phase 2 | Pending |
| CONF-05 | Phase 2 | Pending |
| CONF-06 | Phase 2 | Pending |
| TECH-01 | Phase 1 | Complete |
| TECH-02 | Phase 1 | Complete |
| TECH-03 | Phase 1 | Complete |
| TECH-04 | Phase 1 | Complete |
| TECH-05 | Phase 1 | Complete |
| TECH-06 | Phase 1 | Complete |
| TECH-07 | Phase 4 | Pending |
| TECH-08 | Phase 4 | Pending |
| TECH-09 | Phase 4 | Pending |
| TECH-10 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 49 total (NOTF 9 + LEAD 7 + DESE 9 + DASH 8 + CONF 6 + TECH 10)
- Mapped to phases: 49
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-04*
*Last updated: 2026-05-04 — Phase 3 requirements DESE-01..DESE-09 and DASH-01..DASH-08 marked complete*
