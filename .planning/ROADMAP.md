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
**Depends on**: Phase 15
**Requirements**: CLI-01, CLI-02, CLI-03, CLI-04, CLI-05, VIS-01, VIS-02
**Success Criteria** (what must be TRUE):
  1. Admin cadastra um novo cliente com nome, RUC, cidade e telefone — sistema rejeita o cadastro se o RUC já existir, exibindo mensagem de erro em espanhol
  2. Admin edita dados de um cliente existente e as alterações são persistidas imediatamente
  3. Admin acessa `/admin/clientes` e vê uma lista unificada com clientes da loja (com RUC) e compradores históricos das maletas das revendedoras (nome + telefone) — ambas as origens na mesma tabela
  4. Admin aplica o filtro "Loja" e vê apenas clientes com origem PDV; aplica "Revendedoras" e vê apenas compradores de maleta — as contagens batem com os dados cadastrados
  5. Todas as telas novas de clientes usam exclusivamente tokens `--admin-*` sem valores hex ou px hardcoded no JSX
**Plans**: 3 plans

**Wave 1** *(sem dependências — schema first)*
- [x] 16-01-PLAN.md — Migration Prisma v1.4: enums `ClienteOrigem`, `Moneda`, valor `venda_loja` em `EstoqueMovimentoTipo`; models `CotizacionDia`, `Cliente`, `VentaLoja`, `VentaLojaItem`; seed row em `CotizacionDia`

**Wave 2** *(bloqueado pela Wave 1 — requer schema migrado)*
- [x] 16-02-PLAN.md — Server Actions `actions-clientes.ts`: `criarCliente`, `editarCliente`, `buscarClientePorRuc`, `getClientes` (two-query merge com filtro de origem); `requireAuth(["ADMIN"])` + `ActionResult<T>` em todas

**Wave 3** *(bloqueado pela Wave 2 — requer actions)*
- [x] 16-03-PLAN.md — UI `/admin/clientes`: lista com filtro por origem (tabs Loja / Revendedoras), formulário de criação/edição inline, feedback de RUC duplicado; Paper MCP consultado; tokens `--admin-*` obrigatórios; espanhol paraguaio

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
