# Roadmap: NEXT-MONARCA

## Milestones

- ✅ **v1.0 Operação e Visibilidade** — Phases 1-5 (shipped 2026-05-05)
- ✅ **v1.1 Visibilidade e Polimento** — Phases 6-8 (shipped 2026-05-06)
- ✅ **v1.2 Produção e Qualidade** — Phases 9-11 (shipped 2026-05-07)
- ✅ **v1.3 Polimento, Segurança e UX Admin** — Phases 12-15 (shipped 2026-05-07)

## Phases

<details>
<summary>✅ v1.0 Operação e Visibilidade (Phases 1-5) — SHIPPED 2026-05-05</summary>

- [x] Phase 1: Foundation — Error Handling & UI States (3/3 plans) — completed 2026-05-04
- [x] Phase 2: Core Business — Notifications, Leads & Config (5/5 plans) — completed 2026-05-04
- [x] Phase 3: Visibility & Analytics — Reseller & Admin Dashboards (2/2 plans) — completed 2026-05-04
- [x] Phase 4: Build Optimization & Polish (3/3 plans) — completed 2026-05-04
- [x] Phase 5: Validation & Hardening (6/6 plans) — completed 2026-05-05

</details>

<details>
<summary>✅ v1.1 Visibilidade e Polimento (Phases 6-8) — SHIPPED 2026-05-06</summary>

- [x] Phase 6: Vitrina Pública — SEO, Tracking & WhatsApp Integration (4/4 plans) — completed 2026-05-05
- [x] Phase 7: Email Branding — Layout Padronizado & Identidade Visual (3/3 plans) — completed 2026-05-06
- [x] Phase 8: Admin Analytics Extension — Métricas de Vitrina no Dashboard (3/3 plans) — completed 2026-05-06

</details>

<details>
<summary>✅ v1.2 Produção e Qualidade (Phases 9-11) — SHIPPED 2026-05-07</summary>

- [x] Phase 9: E2E Testing (3/3 plans) — completed 2026-05-06
- [x] Phase 10: Observabilidade (4/4 plans) — completed 2026-05-06
- [x] Phase 11: Rate Limiting (3/3 plans) — completed 2026-05-06

</details>

### ✅ v1.3 Polimento, Segurança e UX Admin (Phases 12-15) — SHIPPED 2026-05-07

- [x] **Phase 12: Segurança e Dependências** — Fechar vulnerabilidades Snyk e achados críticos antes de iniciar features (5/5 plans) — completed 2026-05-07
- [x] **Phase 13: Email Templates Admin** — Admin pode editar templates de email transacional diretamente no painel (3/3 plans) — completed 2026-05-07
- [x] **Phase 14: Analytics Período Personalizado** — Admin pode filtrar dashboard por qualquer período customizado (3/3 plans) — completed 2026-05-07
- [ ] **Phase 15: Admin UI Consistência Visual** — Admin panel com visual consistente com design system e Paper — planned

### 🔄 v1.4 PDV e Ventas de Loja (Phases 16-18) — ACTIVE

- [x] **Phase 16: Foundation — Schema + Gestão de Clientes** — Schema v1.4 migrado e CRUD completo de clientes com lista unificada (3/3 plans) — completed 2026-05-08
- [x] **Phase 17: PDV Core — Cotización + Fluxo de Venda** — Admin configura cotação e registra vendas físicas da loja — completed 2026-05-08
- [ ] **Phase 18: Histórico de Ventas** — Admin consulta todas as vendas de loja com filtro por período — planned (2 plans)

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation | v1.0 | 3/3 | Complete | 2026-05-04 |
| 2. Core Business | v1.0 | 5/5 | Complete | 2026-05-04 |
| 3. Visibility & Analytics | v1.0 | 2/2 | Complete | 2026-05-04 |
| 4. Build Optimization | v1.0 | 3/3 | Complete | 2026-05-04 |
| 5. Validation & Hardening | v1.0 | 6/6 | Complete | 2026-05-05 |
| 6. Vitrina Pública | v1.1 | 4/4 | Complete | 2026-05-05 |
| 7. Email Branding | v1.1 | 3/3 | Complete | 2026-05-06 |
| 8. Admin Analytics Extension | v1.1 | 3/3 | Complete | 2026-05-06 |
| 9. E2E Testing | v1.2 | 3/3 | Complete | 2026-05-06 |
| 10. Observabilidade | v1.2 | 4/4 | Complete | 2026-05-06 |
| 11. Rate Limiting | v1.2 | 3/3 | Complete | 2026-05-06 |
| 12. Segurança e Dependências | v1.3 | 5/5 | Complete | 2026-05-07 |
| 13. Email Templates Admin | v1.3 | 3/3 | Complete | 2026-05-07 |
| 14. Analytics Período Personalizado | v1.3 | 3/3 | Complete | 2026-05-07 |
| 15. Admin UI Consistência Visual | v1.3 | 0/3 | Ready to execute | - |
| 16. Foundation — Schema + Gestão de Clientes | v1.4 | 3/3 | Complete | 2026-05-08 |
| 17. PDV Core — Cotización + Fluxo de Venda | v1.4 | 4/4 | Complete | 2026-05-08 |
| 18. Histórico de Ventas | v1.4 | 0/2 | Ready to execute | - |

---

## Requirement Coverage

**v1.0 Requirements:** 49 complete (see `.planning/milestones/v1.0-REQUIREMENTS.md`)

**v1.1 Requirements:** 31 complete (see `.planning/milestones/v1.1-REQUIREMENTS.md`)

**v1.2 Requirements:** 23 complete (see `.planning/milestones/v1.2-REQUIREMENTS.md`)

**v1.3 Requirements:** 23 total, 19/23 complete (Phases 12-14 done, 15 pending)

**v1.4 Requirements:** 9 total, 3/9 complete (Phase 16 done, 17-18 pending)

## Phase Details

---

### Phase 12: Segurança e Dependências
**Goal**: Sistema livre de vulnerabilidades conhecidas e dados de PII protegidos antes de iniciar novas features
**Depends on**: Phase 11 (baseline v1.2)
**Requirements**: SEC-01, SEC-02, SEC-03, SEC-04, SEC-05, SEC-06
**Success Criteria** (what must be TRUE):
  1. Admin não pode acessar `/api/export` (xlsx ou pdf) sem estar autenticado com role ADMIN ou COLABORADORA — request sem sessão retorna 401
  2. `npm audit` não lista CVEs para Next.js, @serwist/next, serwist ou brace-expansion
  3. Templates de email com HTML injetado pelo admin são sanitizados por `sanitize-html` com allowlist de tags seguras — scripts e event handlers são removidos
  4. Relatórios de analytics exibem o mesmo dia calendário no Paraguai (UTC-3) independente do horário UTC em que a query é executada
**Plans**: 5 plans
Plans:

**Wave 1** *(paralelo — sem dependências)*
- [ ] 12-01-PLAN.md — Auth guard em /api/export e /api/export/pdf + testes de regressão (SEC-01)
- [ ] 12-02-PLAN.md — Atualizar Next.js 16.2.5 e serwist 9.5.11 (SEC-02, SEC-03)

**Wave 2** *(bloqueado pela Wave 1 — requer build estável do Next.js 16.2.5)*
- [ ] 12-03-PLAN.md — sanitize-html helper + integração em emails.ts + testes (SEC-04)
- [ ] 12-04-PLAN.md — getSinceDate timezone fix UTC-3 + testes (SEC-05)

**Wave 3** *(bloqueado pela Wave 1+2 — verificação final e documentação)*
- [ ] 12-05-PLAN.md — Investigar jspdf@4.2.1 + documentar riscos aceitos xlsx/jspdf (SEC-06)

---

### Phase 13: Email Templates Admin
**Goal**: Admin pode editar assunto e corpo dos 7 templates de email transacional diretamente no painel, sem necessidade de deploy
**Depends on**: Phase 12
**Requirements**: ETML-01, ETML-02, ETML-03, ETML-04, ETML-05, ETML-06, ETML-07
**Success Criteria** (what must be TRUE):
  1. Admin vê a rota `/admin/config/emails` com lista dos 7 templates e indicador visual de quais têm override ativo no banco versus padrão TypeScript
  2. Admin abre o editor de um template, altera assunto e corpo HTML, insere variáveis via chips clicáveis, salva — e o próximo email desse tipo enviado pelo sistema usa o conteúdo editado
  3. Se o override for desativado ou deletado do banco, o sistema cai automaticamente para o template TypeScript hardcoded sem interrupção
  4. O wrapper `renderEmailBase()` envolve o corpo salvo em todos os envios — admin não precisa incluir o HTML do layout base no editor
**Plans**: 3 plans
Plans:

**Wave 1** *(infraestrutura inicial)*
- [ ] 13-01-PLAN.md — Prisma model, shared whitelists e helper getEmailContent (ETML-01, ETML-06, ETML-07)

**Wave 2** *(bloqueado pela Wave 1 — requer model e helper)*
- [ ] 13-02-PLAN.md — Admin UI: Lista de templates, Editor com chips e Server Actions (ETML-01, ETML-02, ETML-03, ETML-04, ETML-05)

**Wave 3** *(bloqueado pela Wave 1+2 — integração final e testes)*
- [ ] 13-03-PLAN.md — Refatoração de templates TS para suporte a override + Testes de integração (ETML-07)

**Cross-cutting constraints:**
- `requireAuth(["ADMIN"])` obrigatório em todas as rotas e actions de configuração de e-mail.
- Todas as Server Actions devem retornar `ActionResult<T>`.
- O wrapper `renderEmailBase` deve ser aplicado a todos os envios, independentemente da origem (DB ou TS).
- Labels da interface devem seguir o Espanhol Paraguaio (ex: "Estándar", "Restablecer").

**UI hint**: yes

---

### Phase 14: Analytics Período Personalizado
**Goal**: Admin pode filtrar o dashboard de analytics por qualquer intervalo de datas, além dos presets fixos existentes
**Depends on**: Phase 12
**Requirements**: ANLT-07, ANLT-08, ANLT-09, ANLT-10, ANLT-11
**Success Criteria** (what must be TRUE):
  1. Admin seleciona data de início e fim em um date range picker — todos os KPIs, gráficos e tabelas do dashboard refletem exatamente esse intervalo
  2. Presets 7d/30d/3m/12m continuam funcionando sem alteração de comportamento
  3. A URL reflete o período selecionado (`?from=YYYY-MM-DD&to=YYYY-MM-DD` ou `?period=N`) — compartilhar o link reproduz o mesmo filtro
  4. Tentar selecionar um range superior a 366 dias exibe mensagem de erro e não executa a query
  5. O botão de export CSV gera o arquivo com os dados do período atualmente selecionado no filtro
**Plans**: 3 plans
Plans:
- [ ] 14-01-PLAN.md — Refatoração do Backend para suporte a range customizado (SEC-05, ANLT-07, ANLT-11)
- [ ] 14-02-PLAN.md — DateRangePicker UI e integração com URL State (ANLT-07, ANLT-08, ANLT-09, ANLT-10)
- [ ] 14-03-PLAN.md — Export CSV range-aware e Verificação de Integração (ANLT-11)

**UI hint**: yes

---

### Phase 15: Admin UI Consistência Visual
**Goal**: Todas as rotas do admin panel usam tokens do design system e componentes padronizados — zero valores hex hardcoded, zero markup inline onde existem componentes disponíveis
**Depends on**: Phase 12
**Requirements**: ADUI-01, ADUI-02, ADUI-03, ADUI-04, ADUI-05
**Success Criteria** (what must be TRUE):
  1. Uma auditoria por rota (`/admin/*`) lista cada desvio visual antes de qualquer código ser alterado — nenhuma rota é modificada sem o artboard Paper correspondente ter sido consultado via MCP
  2. Inspeção do CSS em produção não encontra valores hex hardcoded (`#35605A`, `#4ADE80`, `#E05C5C` e similares) em nenhum arquivo de rota admin — todos substituídos por `var(--admin-*)`
  3. Status de maleta, status de lead, status de contrato e demais badges de estado usam `AdminStatusBadge` em todas as rotas — nenhum usa classes inline `bg-green-*` ou `bg-red-*` para comunicar estado
  4. Empty states em listas admin usam `AdminEmptyState` — nenhum usa `<p>Sem resultados</p>` ou markup ad-hoc inline
**Plans**: 3 plans
Plans:

**Wave 1** *(auditoria e tokenização — sem dependências)*
- [ ] 15-01-PLAN.md — Auditoria de desvios visuais por rota + substituição de hex hardcoded por tokens CSS (ADUI-01, ADUI-02)

**Wave 2** *(bloqueado pela Wave 1 — requer audit e tokens)*
- [ ] 15-02-PLAN.md — Padronização de status badges (AdminStatusBadge) e empty states (AdminEmptyState) em todas as rotas admin (ADUI-03, ADUI-04)

**Wave 3** *(bloqueado pela Wave 1+2 — verificação final)*
- [ ] 15-03-PLAN.md — Verificação automatizada (grep gates) + atualização da documentação do design system (ADUI-05)

**Cross-cutting constraints:**
- Paper MCP deve ser consultado para cada rota modificada (registrado no audit)
- Texto da UI em espanhol paraguaio
- `git push` para remote `client`

**UI hint**: yes

---

### Phase 18: Histórico de Ventas
**Goal**: Admin consulta todas as vendas de loja com filtro por período, busca por cliente, KPIs de resumo, detalhe completo por venda e possibilidade de cancelar/estornar
**Depends on**: Phase 17 (PDV Core)
**Requirements**: D-18-01, D-18-02, D-18-03, D-18-04, D-18-05, D-18-06, D-18-07, D-18-08, D-18-09, D-18-10, D-18-11, D-18-12, D-18-13
**Success Criteria** (what must be TRUE):
  1. Admin abre `/admin/ventas` e vê tabela paginada das últimas 7 dias com 4 KPIs no topo (Total Vendido, Qtd Ventas, Ticket Medio, Total Itens)
  2. Admin pode filtrar por período (DateRangePicker) e buscar por nome/RUC do cliente — KPIs recalculam com os filtros ativos
  3. Clicar em uma linha navega para `/admin/ventas/[id]` com resumo completo: data, cliente, moeda, total PYG, cotação snapshot, quem registrou, tabela de itens
  4. Admin pode cancelar uma venda não-cancelada — modal de confirmação, ao confirmar: marca como cancelada, devolve estoque, registra movimento reverso
  5. Vendas canceladas aparecem na listagem com indicador visual (badge "Cancelada" ou linha riscada)
  6. Botão "Exportar CSV" gera planilha com dados filtrados do período + busca
**Plans**: 2 plans
Plans:

**Wave 1** *(backend — schema + Server Actions + navegação)*
- [ ] 18-01-PLAN.md — Schema migration (cancelled_at), actions-ventas.ts (list, detail, cancel, KPIs, CSV), sidebar nav (D-18-01..D-18-13)

**Wave 2** *(frontend — páginas e componentes)*
- [ ] 18-02-PLAN.md — Listagem /admin/ventas (KPIs, filtros, tabela, paginação), Detalhe /admin/ventas/[id] (resumo, itens, cancel modal), Export CSV (D-18-01..D-18-13)

**Cross-cutting constraints:**
- `requireAuth(["ADMIN"])` em todas as Server Actions de ventas (cancelar requer ADMIN exclusivo)
- Todas as Server Actions retornam `ActionResult<T>`
- Timezone UTC-3 (PY) para limites de query
- URL state: `?from/to` > `?period`, `?page`, `?sort`, `?dir`, `?search`
- Tokens `--admin-*` obrigatórios — zero hex/px hardcoded no JSX
- Texto da UI em espanhol paraguaio
- `git push` para remote `client`

---

*Roadmap created: 2026-05-04*
*Last updated: 2026-05-09 — Phase 18 planned (2 plans, 2 waves, D-18-01..D-18-13)*
