# Roadmap: NEXT-MONARCA

## Milestones

- ✅ **v1.0 Operação e Visibilidade** — Phases 1-5 (shipped 2026-05-05)
- ✅ **v1.1 Visibilidade e Polimento** — Phases 6-8 (shipped 2026-05-06)
- ✅ **v1.2 Produção e Qualidade** — Phases 9-11 (shipped 2026-05-07)
- ✅ **v1.3 Polimento, Segurança e UX Admin** — Phases 12-15 (shipped 2026-05-07)
- ✅ **v1.4 PDV e Ventas de Loja** — Phases 16-18 (shipped)
- 🔄 **v1.5 Dark Mode & Temas** — Phases 19-22 (active)

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

### ✅ v1.4 PDV e Ventas de Loja (Phases 16-18) — SHIPPED

- [x] **Phase 16: Foundation — Schema + Gestão de Clientes** — Schema v1.4 migrado e CRUD completo de clientes com lista unificada
- [x] **Phase 17: PDV Core — Cotización + Fluxo de Venda** — Admin configura cotação do dia e registra vendas físicas da loja
- [x] **Phase 18: Histórico de Ventas** — Admin consulta vendas de loja com filtro por período

### 🔄 v1.5 Dark Mode & Temas (Phases 19-22) — ACTIVE

- [ ] **Phase 19: CSS Token Foundation** — Tokens dark/light declarados no CSS; sem mudança visual; build e lint passam — planned
- [ ] **Phase 20: /app Hardcoded Color Migration** — PWA sem valores hex hardcoded; dark mode testável via DevTools — planned
- [ ] **Phase 21: ThemeProvider Infrastructure** — Providers escopados, anti-flash e Sonner funcionando em ambas as surfaces — planned
- [ ] **Phase 22: Toggle UI** — Revendedora e admin alternam tema manualmente via toggle em suas telas de preferências — planned

## Phase Details

### Phase 16: Foundation — Schema + Gestão de Clientes
**Goal**: Schema v1.4 migrado e CRUD completo de clientes com lista unificada
**Depends on**: Phase 15
**Requirements**: CLI-01, CLI-02, CLI-03, CLI-04, CLI-05, VIS-01, VIS-02
**Success Criteria** (what must be TRUE):
  1. Admin cadastra um novo cliente com nome, RUC, cidade e telefone — sistema rejeita o cadastro se o RUC já existir, exibindo mensagem de erro em espanhol
  2. Admin edita dados de um cliente existente e as alterações são persistidas imediatamente
  3. Admin acessa `/admin/clientes` e vê uma lista unificada com clientes da loja (com RUC) e compradores históricos das maletas das revendedoras (nome + telefone) — ambas as origens na mesma tabela
  4. Admin aplica o filtro "Loja" e vê apenas clientes com origem PDV; aplica "Revendedoras" e vê apenas compradores de maleta — as contagens batem com os dados cadastrados
  5. Todas as telas novas de clientes usam exclusivamente tokens `--admin-*` sem valores hex ou px hardcoded no JSX
**Plans**: 3 plans
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
**UI hint**: yes

---

### Phase 19: CSS Token Foundation
**Goal**: Todos os tokens `--color-app-*` e `--admin-*` têm variantes dark/light declarados no CSS e a diretiva `@custom-variant dark` está configurada — sem mudança visual, build e lint continuam passando
**Depends on**: Phase 18
**Requirements**: TKN-01, TKN-02, TKN-03
**Success Criteria** (what must be TRUE):
  1. Adicionar `@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *))` em `globals.css` não quebra o build nem introduz regressões visuais na sessão atual
  2. Inspecionando `.app-shell[data-theme="dark"]` via DevTools, todos os tokens `--color-app-*` exibem os valores dark correspondentes
  3. Inspecionando `.admin-layout[data-theme="light"]` via DevTools, todos os tokens `--admin-*` exibem os valores light correspondentes
  4. `npm run build` e `npm run lint` passam sem erros novos após as alterações de CSS
**Plans**: TBD

---

### Phase 20: /app Hardcoded Color Migration
**Goal**: PWA (`/app`) não contém valores hex hardcoded em nenhum componente ou layout — todas as cores controladas exclusivamente por tokens `--color-app-*`, tornando o dark mode testável via DevTools
**Depends on**: Phase 19
**Requirements**: APM-01, APM-02, APM-03
**Success Criteria** (what must be TRUE):
  1. `grep -rn 'bg-\[#\|text-\[#\|border-\[#\|style={{' src/app` retorna zero ocorrências após a migração
  2. `AppShell.tsx` não contém classes Tailwind com valores hex arbitrários — todas as cores referenciam tokens CSS
  3. `src/app/layout.tsx` não possui `<body style={{ backgroundColor: ... }}>` — a cor de fundo do body é controlada por CSS variable
  4. Aplicando `data-theme="dark"` manualmente no `.app-shell` via DevTools, todas as páginas do PWA exibem cores escuras sem janelas de cor incorreta
  5. `npm run build` passa após as migrações de tokens
**Plans**: TBD
**UI hint**: yes

---

### Phase 21: ThemeProvider Infrastructure
**Goal**: Dois ThemeProviders escopados estão ativos — `AppThemeProvider` para `/app` e `AdminThemeProvider` para `/admin` — com anti-flash funcional, preferência persistida em localStorage e Sonner seguindo o tema correto em ambas as surfaces
**Depends on**: Phase 20
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-05, INFRA-06
**Success Criteria** (what must be TRUE):
  1. Recarregar `/app` com o OS em dark mode e sem preferência salva: a PWA carrega diretamente no tema escuro, sem flash do fundo claro entre o HTML e o CSS
  2. Recarregar `/admin` com o OS em light mode e sem preferência salva: o painel admin carrega diretamente no tema claro, sem flash do fundo escuro
  3. Definir manualmente `localStorage.setItem('monarca-app-theme', 'dark')` e recarregar `/app`: a preferência é respeitada independente da configuração do OS
  4. Definir manualmente `localStorage.setItem('monarca-admin-theme', 'light')` e recarregar `/admin`: a preferência é respeitada e não interfere com a preferência do `/app`
  5. Com o tema dark ativo no PWA, um toast de sucesso exibe com fundo escuro — o `<Toaster>` Sonner acompanha o tema localStorage, não a media query do OS
**Plans**: TBD
**UI hint**: yes

---

### Phase 22: Toggle UI
**Goal**: Revendedora e admin/colaboradora podem alternar entre dark e light mode diretamente nas suas telas de preferências — sem precisar alterar configurações do dispositivo
**Depends on**: Phase 21
**Requirements**: TOG-01, TOG-02, TOG-03
**Success Criteria** (what must be TRUE):
  1. Revendedora acessa `/app/perfil`, localiza a seção "Apariencia", clica no toggle sol/lua — a interface alterna imediatamente entre dark e light, e a preferência persiste após recarregar a página
  2. Admin/Colaboradora acessa `/admin/minha-conta`, localiza a seção "Apariencia", usa o toggle para alternar o tema — o painel admin alterna imediatamente e a preferência persiste após recarregar
  3. Após alternar o tema no PWA via toggle, disparar qualquer ação que gera um toast (ex: salvar perfil) — o toast aparece no tema correto, confirmando que o Sonner segue a preferência localStorage
**Plans**: TBD
**UI hint**: yes

---

## Progress Table

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 16. Schema + Gestão de Clientes | 3/3 | Done | 2026-05-08 |
| 17. PDV Core — Cotización + Fluxo de Venda | 0/4 | Not started | - |
| 18. Histórico de Ventas | 0/2 | Not started | - |
| 19. CSS Token Foundation | 0/? | Not started | - |
| 20. /app Hardcoded Color Migration | 0/? | Not started | - |
| 21. ThemeProvider Infrastructure | 0/? | Not started | - |
| 22. Toggle UI | 0/? | Not started | - |

---

*Roadmap created: 2026-05-04*
*Last updated: 2026-05-15 — v1.5 milestone added: Phases 19-22 (Dark Mode & Temas)*
