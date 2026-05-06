# Roadmap: NEXT-MONARCA

## Milestones

- ✅ **v1.0 Operação e Visibilidade** — Phases 1-5 (shipped 2026-05-05)
- 🔄 **v1.1 Visibilidade e Polimento** — Phases 6-8 (planning)

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
<summary>🔄 v1.1 Visibilidade e Polimento (Phases 6-8) — PLANNING</summary>

- [x] Phase 6: Vitrina Pública — SEO, Tracking & WhatsApp Integration — completed 2026-05-05
- [ ] Phase 7: Email Branding — Layout Padronizado & Identidade Visual
- [ ] Phase 8: Admin Analytics Extension — Métricas de Vitrina no Dashboard

</details>

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 3/3 | Complete | 2026-05-04 |
| 2. Core Business | 5/5 | Complete | 2026-05-04 |
| 3. Visibility & Analytics | 2/2 | Complete | 2026-05-04 |
| 4. Build Optimization | 3/3 | Complete | 2026-05-04 |
| 5. Validation & Hardening | 6/6 | Complete | 2026-05-05 |
| 6. Vitrina Pública | 4/4 | Complete | 2026-05-05 |
| 7. Email Branding | 0/TBD | Planning | — |
| 8. Admin Analytics Extension | 0/TBD | Planning | — |

---

## Phase Details

### Phase 6: Vitrina Pública

**Goal:** Lançar vitrina pública por revendedora com SEO, tracking anônimo, página de detalhe do produto, carrinho de compras e checkout via WhatsApp.

**Requirements:** VITR-01 .. VITR-17 (17 requirements)

**Success Criteria:**
1. URL `/vitrina/{slug}` acessível publicamente sem autenticação
2. Vitrina renderiza perfil + produtos da maleta ativa em < 2s
3. Grid de produtos leva para página de detalhe (`/vitrina/{slug}/{produtoId}`)
4. Página de detalhe exibe fotos, descrição e botão "Agregar al carrito"
5. Carrinho armazenado em localStorage com persistência entre navegações
6. Badge flutuante sticky exibe contador de itens em todas as páginas da vitrina
7. Drawer do carrinho exibe itens, quantidades, total e botão "Finalizar pedido"
8. Checkout gera mensagem formatada para WhatsApp com lista de produtos + total
9. Cookie `visitor_id` criado automaticamente (30 dias)
10. Eventos de acesso e checkout gravados em `AnalyticsAcesso`
11. 404 para slug inexistente ou revendedora inativa
12. SEO metadata dinâmica com OG tags para preview em redes sociais
13. RLS permite SELECT anônimo em `Reseller`, `Maleta`, `MaletaItem`, `Product`, `ProductVariant`

**Dependencies:**
- Schema Prisma: `Reseller.slug`, `AnalyticsAcesso`, `Maleta`, `MaletaItem` (já existem)
- Infra: R2 para imagens, Supabase para banco
- Design: Paper MCP para layout da vitrina
- Página de catálogo existente (`/catalogo/[slug]`) — reusar como base visual

**Pitfalls to Address:**
- RLS bloqueando leituras anônimas → policies `anon` já existentes, verificar
- Conflito ISR vs tracking dinâmico → resolvido: ISR (revalidate=300) para conteúdo + API client-side para tracking
- URLs R2 expirando antes de unfurl → usar URLs públicas quando possível
- N+1 ao carregar produtos → usar `include` otimizado no Prisma
- Carrinho em localStorage não persiste entre dispositivos → aceitável para MVP
- Badge flutuante pode sobrepor conteúdo em mobile → z-index e padding adequados
- Mensagem WhatsApp pode exceder limite de caracteres → limitar a ~2000 chars

**Plans:** 4 plans in 3 waves

Plans:
- [ ] `06-01-PLAN.md` — Vitrina Base: ISR page, metadata, getVitrinaData(), shared components, empty state, RLS policies
- [ ] `06-02-PLAN.md` — Tracking & Analytics: /api/vitrina/track endpoint, middleware cookie, VitrinaAnalyticsTracker
- [ ] `06-04-PLAN.md` — Cart & Checkout: CartProvider, localStorage, CartBadge, CartDrawer, WhatsApp message builder
- [ ] `06-03-PLAN.md` — Product Detail Page: /vitrina/[slug]/[produtoId] with photos, description, "Agregar al carrito"

---

### Phase 7: Email Branding

**Goal:** Padronizar identidade visual de todos os emails transacionais com layout consistente e copy espanhol paraguaio.

**Requirements:** EMAIL-01 .. EMAIL-08 (8 requirements)

**Success Criteria:**
1. Wrapper `renderEmailBase()` aplicado em todos os 7 templates transacionais
2. Layout 600px mobile-friendly com cores do design system (`#35605a`, `#C9A84C`)
3. Copy revisada em espanhol paraguaio (tonalidade premium, emojis 💎🦋)
4. Templates Supabase Auth (reset/invite) atualizados no dashboard com identidade visual
5. Email de acerto exibe tabela visual de breakdown (vendido, comissão, %)
6. Fallback plaintext funcional para todos os emails
7. Zero PII em plaintext no corpo dos emails

**Dependencies:**
- `src/lib/emails.ts` (cliente Brevo) já existente
- 7 templates em `src/lib/email-templates/` já existentes
- Variáveis de ambiente Brevo já configuradas

**Pitfalls to Address:**
- CSS inline duplicado → centralizar no wrapper
- Renderização quebrada no Outlook/dark mode → testar em clients principais
- Templates Supabase Auth fora do repo → atualizar manualmente no dashboard
- Vazamento PII em logs → usar IDs em vez de nomes/emails

---

### Phase 8: Admin Analytics Extension

**Goal:** Estender dashboard admin com métricas de engajamento da vitrina pública (visitas, cliques WhatsApp, CTR).

**Requirements:** ANLT-01 .. ANLT-06 (6 requirements)

**Success Criteria:**
1. Dashboard `/admin/analytics` exibe novos cards: visitas, cliques WhatsApp, CTR
2. Gráfico de visitas ao longo do tempo (série temporal) adicionado
3. Ranking de revendedoras por engajamento da vitrina (visitas + cliques)
4. Filtro de período (7d/30d/3m/12m) aplicado às métricas de vitrina
5. Escopo RBAC respeitado (consultora vê apenas suas revendedoras)
6. Export CSV inclui métricas de vitrina agregadas sem PII

**Dependencies:**
- Phase 6 completa (fonte de dados da vitrina)
- `actions-analytics.ts` já funcional com KPIs operacionais
- `recharts` já instalado
- `getResellerScope()` para RBAC

**Pitfalls to Address:**
- Aggregates em raw SQL sem índices → verificar índices em `AnalyticsAcesso`
- N+1 após groupBy → pré-carregar nomes das revendedoras
- RBAC scope leak → validar `Prisma.empty` vs `Prisma.sql` na query
- Export CSV consumindo RAM → paginar ou limitar registros
- Timezone `America/Asuncion` em GROUP BY → usar `AT TIME ZONE` corretamente

---

## Requirement Coverage

**v1.0 Requirements Mapped:**

| Category | Requirement IDs | Phase | Count |
|----------|----------------|-------|-------|
| Estabilização Técnica | TECH-01 .. TECH-06 | 1 | 6 |
| Notificações | NOTF-01 .. NOTF-09 | 2 | 9 |
| Leads | LEAD-01 .. LEAD-07 | 2 | 7 |
| Configurações Globais | CONF-01 .. CONF-06 | 2 | 6 |
| Desempenho Revendedora | DESE-01 .. DESE-09 | 3 | 9 |
| Dashboard Admin | DASH-01 .. DASH-08 | 3 | 8 |
| Estabilização Técnica (Build) | TECH-07 .. TECH-10 | 4 | 4 |
| **Total v1.0** | | | **49** |

**v1.1 Requirements Mapped:**

| Category | Requirement IDs | Phase | Count |
|----------|----------------|-------|-------|
| Vitrina Pública | VITR-01 .. VITR-17 | 6 | 17 |
| Email Branding | EMAIL-01 .. EMAIL-08 | 7 | 8 |
| Admin Analytics Extension | ANLT-01 .. ANLT-06 | 8 | 6 |
| **Total v1.1** | | | **31** |

✓ All v1.1 requirements mapped to exactly one phase  
✓ No orphaned requirements  
✓ No duplicate assignments

**Changelog do Escopo:**
- 2026-05-05: Fase 6 expandida de 12 para 17 requisitos (adicionados VITR-13..VITR-17: página de detalhe, carrinho localStorage, badge flutuante, checkout WhatsApp formatado)

---

*Roadmap created: 2026-05-04*  
*Last updated: 2026-05-05 — Milestone v1.1 roadmap created*  
*Milestone: v1.1 — Visibilidade e Polimento (PLANNING)*  
