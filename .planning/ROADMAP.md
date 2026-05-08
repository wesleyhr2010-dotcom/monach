# Roadmap: NEXT-MONARCA

## Milestones

- ✅ **v1.0 Operação e Visibilidade** — Phases 1-5 (shipped 2026-05-05)
- ✅ **v1.1 Visibilidade e Polimento** — Phases 6-8 (shipped 2026-05-06)
- ✅ **v1.2 Produção e Qualidade** — Phases 9-11 (shipped 2026-05-07)
- ✅ **v1.3 Polimento, Segurança e UX Admin** — Phases 12-15 (shipped 2026-05-07)
- 🔄 **v1.4 PDV e Ventas de Loja** — Phases 16-18 (active)

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

- [ ] **Phase 16: Foundation — Schema + Gestão de Clientes** — Schema v1.4 migrado e CRUD completo de clientes com lista unificada
- [ ] **Phase 17: PDV Core — Cotização + Fluxo de Venda** — Admin confirma vendas de loja com cotação do dia, multi-moeda e decremento de estoque
- [ ] **Phase 18: Histórico de Ventas** — Admin consulta e filtra todas as vendas de loja com cliente, itens e responsável

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
| 16. Foundation — Schema + Clientes | v1.4 | 0/3 | Not started | - |
| 17. PDV Core — Cotización + Venda | v1.4 | 0/4 | Not started | - |
| 18. Histórico de Ventas | v1.4 | 0/2 | Not started | - |

---

## Requirement Coverage

**v1.0 Requirements:** 49 complete (see `.planning/milestones/v1.0-REQUIREMENTS.md`)

**v1.1 Requirements:** 31 complete (see `.planning/milestones/v1.1-REQUIREMENTS.md`)

**v1.2 Requirements:** 23 complete (see `.planning/milestones/v1.2-REQUIREMENTS.md`)

**v1.3 Requirements:** 23 total, 19/23 complete (Phases 12-14 done, 15 pending)

**v1.4 Requirements:** 17 total, 0/17 complete (Phases 16-18 pending)

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

## v1.4 — PDV e Ventas de Loja

### Phase 16: Foundation — Schema + Gestão de Clientes
**Goal**: Schema v1.4 está migrado e admin pode cadastrar, editar e consultar clientes com lista unificada de compradores da loja e das revendedoras
**Depends on**: Phase 15
**Requirements**: CLI-01, CLI-02, CLI-03, CLI-04, CLI-05, VIS-01, VIS-02
**Success Criteria** (what must be TRUE):
  1. Admin cadastra um novo cliente com nome, RUC, cidade e telefone — sistema rejeita o cadastro se o RUC já existir, exibindo mensagem de erro em espanhol
  2. Admin edita dados de um cliente existente e as alterações são persistidas imediatamente
  3. Admin acessa `/admin/clientes` e vê uma lista unificada com clientes da loja (com RUC) e compradores históricos das maletas das revendedoras (nome + telefone) — ambas as origens na mesma tabela
  4. Admin aplica o filtro "Loja" e vê apenas clientes com origem PDV; aplica "Revendedoras" e vê apenas compradores de maleta — as contagens batem com os dados cadastrados
  5. Todas as telas novas de clientes usam exclusivamente tokens `--admin-*` sem valores hex ou px hardcoded no JSX
**Plans**: TBD

**Wave 1** *(sem dependências — schema first)*
- [ ] 16-01-PLAN.md — Migration Prisma v1.4: enums `ClienteOrigem`, `Moneda`, valor `venda_loja` em `EstoqueMovimentoTipo`; models `CotizacionDia`, `Cliente`, `VentaLoja`, `VentaLojaItem`; seed row em `CotizacionDia`

**Wave 2** *(bloqueado pela Wave 1 — requer schema migrado)*
- [ ] 16-02-PLAN.md — Server Actions `actions-clientes.ts`: `criarCliente`, `editarCliente`, `buscarClientePorRuc`, `getClientes` (two-query merge com filtro de origem); `requireAuth(["ADMIN"])` + `ActionResult<T>` em todas

**Wave 3** *(bloqueado pela Wave 2 — requer actions)*
- [ ] 16-03-PLAN.md — UI `/admin/clientes`: lista com filtro por origem (tabs Loja / Revendedoras), formulário de criação/edição inline, feedback de RUC duplicado; Paper MCP consultado; tokens `--admin-*` obrigatórios; espanhol paraguaio

**Cross-cutting constraints:**
- `requireAuth(["ADMIN"])` em todas as Server Actions
- Todas as Server Actions retornam `ActionResult<T>`
- `$transaction([...ops])` array form — nunca `$transaction(async tx)`
- Paper MCP consultado antes de implementar cada tela nova
- Tokens `--admin-*` obrigatórios — zero hex/px hardcoded no JSX
- Espanhol paraguaio na UI

**UI hint**: yes

---

### Phase 17: PDV Core — Cotización + Fluxo de Venda
**Goal**: Admin configura a cotação do dia e registra vendas físicas da loja com cliente identificado, multi-moeda e decremento de estoque integrado
**Depends on**: Phase 16
**Requirements**: COT-01, COT-02, PDV-01, PDV-02, PDV-03, PDV-04, PDV-05, PDV-06
**Success Criteria** (what must be TRUE):
  1. Admin acessa `/admin/config/cotizacion`, define taxa BRL→PYG e USD→PYG e salva — a data e hora da atualização aparecem imediatamente no PDV junto ao total convertido
  2. Admin abre o PDV, busca um cliente por RUC, adiciona produtos do catálogo com quantidade e preço unitário editável, seleciona a moeda (Guaraní / Dólar / Real) e vê o total convertido para Guaraní em tempo real
  3. Admin confirma a venda — o registro é criado no banco com snapshot imutável das taxas de câmbio e total em PYG, e o estoque de cada produto vendido é decrementado via `estoqueMovimento` tipo `venda_loja`
  4. Tentar confirmar uma venda com produto sem estoque suficiente exibe erro e a transação não é commitada
  5. Os campos `talonario`, `numero_factura` e `tipo_operacion` são persistidos como `null` na criação da venda — não há UI de emissão de factura
**Plans**: TBD

**Wave 1** *(sem dependências — cotização first)*
- [ ] 17-01-PLAN.md — Server Actions `actions-cotizacion.ts`: `setCotizacion`, `getCotizacionAtual`; `requireAuth(["ADMIN"])` + `ActionResult<T>`; `CotizacionDia` insert-por-update (não upsert singleton)

**Wave 2** *(bloqueado pela Wave 1 — requer cotização disponível via action)*
- [ ] 17-02-PLAN.md — UI `/admin/config/cotizacion`: formulário BRL→PYG e USD→PYG, exibição de data/hora da última atualização; Paper MCP consultado; tokens `--admin-*`; espanhol paraguaio

**Wave 3** *(bloqueado pela Wave 1 — requer `getCotizacionAtual` e schema de venda)*
- [ ] 17-03-PLAN.md — Server Action `criarVentaLoja` em `actions-pdv.ts`: pré-leitura de estoque (fail fast), `$transaction([ventaLoja.create, ventaLojaItem.createMany, ...productVariant.update × N, ...estoqueMovimento.create × N])`; snapshot imutável de cotização; UUID de idempotência; `requireAuth(["ADMIN"])` + `ActionResult<T>`

**Wave 4** *(bloqueado pela Wave 2+3 — requer UI de cotização e action de venda)*
- [ ] 17-04-PLAN.md — UI `/admin/pdv`: busca de cliente por RUC (com criação inline), adição de produtos ao carrinho, seletor de moeda, total em PYG com cotação exibida, tela de resumo e confirmação com disable de botão em submit; Paper MCP consultado; tokens `--admin-*`; espanhol paraguaio

**Cross-cutting constraints:**
- `requireAuth(["ADMIN"])` em todas as Server Actions
- Todas as Server Actions retornam `ActionResult<T>`
- `$transaction([...ops])` array form — nunca `$transaction(async tx)`
- Cotização SEMPRE relida do DB dentro da Server Action — nunca aceitar do payload do cliente
- `Math.round(Number(price) * Number(rate))` por linha; somar inteiros para evitar acumulação de float
- Paper MCP consultado antes de implementar cada tela nova
- Tokens `--admin-*` obrigatórios — zero hex/px hardcoded no JSX
- Espanhol paraguaio na UI

**UI hint**: yes

---

### Phase 18: Histórico de Ventas
**Goal**: Admin consulta todas as vendas de loja com cliente, itens, valor, moeda e responsável — com filtro por período
**Depends on**: Phase 17
**Requirements**: VLJ-01, VLJ-02
**Success Criteria** (what must be TRUE):
  1. Admin acessa `/admin/ventas-loja` e vê lista de todas as vendas com: nome do cliente, total, moeda, data da venda e quem registrou
  2. Admin seleciona data de início e data de fim no filtro de período — a lista exibe apenas as vendas dentro do intervalo selecionado, e limpar o filtro restaura a lista completa
**Plans**: TBD

**Wave 1** *(sem dependências)*
- [ ] 18-01-PLAN.md — Server Action `getVentasLoja` em `actions-pdv.ts`: query com join em `Cliente`, `VentaLojaItem`, `User` (responsável); filtro por `createdAt` entre `from` e `to`; `requireAuth(["ADMIN"])` + `ActionResult<T>`

**Wave 2** *(bloqueado pela Wave 1 — requer action)*
- [ ] 18-02-PLAN.md — UI `/admin/ventas-loja`: lista com colunas cliente/total/moeda/data/responsável, filtro de período reutilizando `DatePickerWithRange` do v1.3, empty state com `AdminEmptyState`; Paper MCP consultado; tokens `--admin-*`; espanhol paraguaio

**Cross-cutting constraints:**
- `requireAuth(["ADMIN"])` na Server Action
- Server Action retorna `ActionResult<T>`
- Reutilizar `DatePickerWithRange` (v1.3) — não duplicar
- Paper MCP consultado antes de implementar a tela
- Tokens `--admin-*` obrigatórios — zero hex/px hardcoded no JSX
- Espanhol paraguaio na UI

**UI hint**: yes

---

*Roadmap created: 2026-05-04*
*Last updated: 2026-05-08 — v1.4 milestone added: Phases 16-18 (PDV e Ventas de Loja)*
