# Roadmap: NEXT-MONARCA

## Milestones

- ✅ **v1.0 Operação e Visibilidade** — Phases 1-5 (shipped 2026-05-05)
- ✅ **v1.1 Visibilidade e Polimento** — Phases 6-8 (shipped 2026-05-06)
- ✅ **v1.2 Produção e Qualidade** — Phases 9-11 (shipped 2026-05-07)
- 🚧 **v1.3 Polimento, Segurança e UX Admin** — Phases 12-15 (in progress)

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

### 🚧 v1.3 Polimento, Segurança e UX Admin (Phases 12-15) — Active

- [ ] **Phase 12: Segurança e Dependências** — Fechar vulnerabilidades Snyk e achados críticos antes de iniciar features
- [ ] **Phase 13: Email Templates Admin** — Admin pode editar templates de email transacional diretamente no painel
- [ ] **Phase 14: Analytics Período Personalizado** — Admin pode filtrar dashboard por qualquer período customizado
- [ ] **Phase 15: Admin UI Consistência Visual** — Admin panel com visual consistente com design system e Paper

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
| 12. Segurança e Dependências | v1.3 | 0/5 | Not started | - |
| 13. Email Templates Admin | v1.3 | 0/? | Not started | - |
| 14. Analytics Período Personalizado | v1.3 | 0/? | Not started | - |
| 15. Admin UI Consistência Visual | v1.3 | 0/? | Not started | - |

---

## Requirement Coverage

**v1.0 Requirements:** 49 complete (see `.planning/milestones/v1.0-REQUIREMENTS.md`)

**v1.1 Requirements:** 31 complete (see `.planning/milestones/v1.1-REQUIREMENTS.md`)

**v1.2 Requirements:** 23 complete (see `.planning/milestones/v1.2-REQUIREMENTS.md`)

**v1.3 Requirements:** 23 total, 0/23 complete (see `.planning/REQUIREMENTS.md`)

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
- [ ] 12-01-PLAN.md — Auth guard em /api/export e /api/export/pdf + testes de regressão (SEC-01)
- [ ] 12-02-PLAN.md — Atualizar Next.js 16.2.5 e serwist 9.5.11 (SEC-02, SEC-03)
- [ ] 12-03-PLAN.md — sanitize-html helper + integração em emails.ts + testes (SEC-04)
- [ ] 12-04-PLAN.md — getSinceDate timezone fix UTC-3 + testes (SEC-05)
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
**Plans**: TBD
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
**Plans**: TBD
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
**Plans**: TBD
**UI hint**: yes

---

*Roadmap created: 2026-05-04*
*Last updated: 2026-05-07 — Phase 12 planned (5 plans, 3 waves, SEC-01..SEC-06)*
