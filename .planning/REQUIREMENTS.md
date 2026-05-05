# Requirements: NEXT-MONARCA v1.1

**Defined:** 2026-05-05
**Core Value:** Revendedoras conseguem receber, registrar vendas e devolver maletas com comprovante — e receber a comissão calculada automaticamente.
**Milestone:** v1.1 — Visibilidade e Polimento

## v1.1 Requirements

### Vitrina Pública

- [ ] **VITR-01**: Cliente pode acessar vitrina pública via URL `/vitrina/{slug}`
- [ ] **VITR-02**: Vitrina exibe foto de perfil, nome e CTA WhatsApp da revendedora
- [ ] **VITR-03**: Vitrina exibe grid de produtos da maleta ativa com preços
- [ ] **VITR-04**: Cada produto tem botão "Consultar por WhatsApp" com mensagem contextual (nome + preço)
- [ ] **VITR-05**: Slug inexistente ou revendedora inativa retorna 404
- [ ] **VITR-06**: Sem maleta ativa exibe mensagem "Próximamente artículos disponibles" + CTA WhatsApp
- [ ] **VITR-07**: SEO metadata gerada dinamicamente (título, descrição, OG tags, imagem perfil)
- [ ] **VITR-08**: Página usa `robots: noindex` para evitar thin content no Google
- [ ] **VITR-09**: Visitas são rastreadas anonimamente com `visitor_id` em cookie (30 dias, SameSite=Lax)
- [ ] **VITR-10**: Cliques em WhatsApp são rastreados como evento `clique_whatsapp` via API pública
- [ ] **VITR-11**: API de tracking aceita apenas eventos whitelist (`catalogo_revendedora`, `clique_whatsapp`)
- [ ] **VITR-12**: RLS permite leitura anônima de dados da vitrina sem autenticação

### Email Branding

- [ ] **EMAIL-01**: Todos os emails transacionais usam wrapper visual padronizado (`renderEmailBase`)
- [ ] **EMAIL-02**: Layout mobile-friendly 600px com cores do design system (`#35605a` primária)
- [ ] **EMAIL-03**: Copy em espanhol paraguaio em todos os templates transacionais
- [ ] **EMAIL-04**: Footer padronizado com link para site e disclaimer de seguridad
- [ ] **EMAIL-05**: Templates Supabase Auth (reset/invite) atualizados com identidade visual Monarca
- [ ] **EMAIL-06**: Email de acerto inclui tabela visual de breakdown (vendido, comissão, porcentaje)
- [ ] **EMAIL-07**: Fallback plaintext para todos os emails (clientes corporativos)
- [ ] **EMAIL-08**: Nenhum PII em plaintext no corpo dos emails (usar IDs em logs)

### Admin Analytics (Extensão)

- [ ] **ANLT-01**: Dashboard exibe métricas de vitrina (visitas, cliques WhatsApp, CTR)
- [ ] **ANLT-02**: Métricas de vitrina filtradas por período (7d / 30d / 3m / 12m)
- [ ] **ANLT-03**: Ranking de revendedoras por engajamento da vitrina (visitas + cliques)
- [ ] **ANLT-04**: Gráfico de visitas ao longo do tempo (série temporal)
- [ ] **ANLT-05**: Dados de vitrina respeitam escopo RBAC (consultora vê apenas suas revendedoras)
- [ ] **ANLT-06**: Export CSV inclui métricas de vitrina agregadas (sem PII)

## v2 Requirements (Future)

### Infraestrutura e Qualidade

- **E2E-01**: Testes E2E com Playwright — golden paths (login → maleta → venda → devolução)
- **OBSV-01**: Observabilidade — Sentry + logs estruturados + alertas
- **RATE-01**: Rate limiting nos endpoints sensíveis via Upstash Redis
- **DOMN-01**: Migração para domínio oficial `monarcasemijoyas.com.py`
- **MOBL-01**: Migração PWA → Capacitor (iOS + Android)
- **OFFL-01**: Modo offline do PWA — outbox, sync idempotente, resolução de conflitos

## Out of Scope

| Feature | Reason |
|---------|--------|
| Checkout próprio na vitrina | Carrinho atual é vitrina, não loja com pagamento integrado |
| Indexação Google da vitrina | `noindex` deliberado — evita thin content e concorrência entre URLs |
| Imagens pesadas em emails | Performance — manter layout leve e mobile-friendly |
| BI enterprise completo | Escopo é analytics operacional, não BI com drill-down |
| Real-time analytics push | Supabase Realtime não escala para aggregates; usar polling |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| VITR-01 | Phase 6 | Pending |
| VITR-02 | Phase 6 | Pending |
| VITR-03 | Phase 6 | Pending |
| VITR-04 | Phase 6 | Pending |
| VITR-05 | Phase 6 | Pending |
| VITR-06 | Phase 6 | Pending |
| VITR-07 | Phase 6 | Pending |
| VITR-08 | Phase 6 | Pending |
| VITR-09 | Phase 6 | Pending |
| VITR-10 | Phase 6 | Pending |
| VITR-11 | Phase 6 | Pending |
| VITR-12 | Phase 6 | Pending |
| EMAIL-01 | Phase 7 | Pending |
| EMAIL-02 | Phase 7 | Pending |
| EMAIL-03 | Phase 7 | Pending |
| EMAIL-04 | Phase 7 | Pending |
| EMAIL-05 | Phase 7 | Pending |
| EMAIL-06 | Phase 7 | Pending |
| EMAIL-07 | Phase 7 | Pending |
| EMAIL-08 | Phase 7 | Pending |
| ANLT-01 | Phase 8 | Pending |
| ANLT-02 | Phase 8 | Pending |
| ANLT-03 | Phase 8 | Pending |
| ANLT-04 | Phase 8 | Pending |
| ANLT-05 | Phase 8 | Pending |
| ANLT-06 | Phase 8 | Pending |

**Coverage:**
- v1.1 requirements: 26 total
- Mapped to phases: 26
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-05*
*Last updated: 2026-05-05 after initial definition*
