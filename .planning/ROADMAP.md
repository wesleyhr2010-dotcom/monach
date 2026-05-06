# Roadmap: NEXT-MONARCA

## Milestones

- ✅ **v1.0 Operação e Visibilidade** — Phases 1-5 (shipped 2026-05-05)
- ✅ **v1.1 Visibilidade e Polimento** — Phases 6-8 (shipped 2026-05-06)
- 📋 **v1.2 Produção e Qualidade** — Phases 9+ (planned)

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

### 📋 v1.2 Produção e Qualidade (Planned)

- [x] Phase 9: E2E Testing — Playwright golden paths — completed 2026-05-06
  - Plans:
    - [x] `09-01-PLAN.md` — Playwright Setup & Seed (E2E-01, E2E-02)
    - [x] `09-02-PLAN.md` — Golden Path Tests: Login → Maleta → Venda → Devolução (E2E-03..E2E-06)
    - [x] `09-03-PLAN.md` — Recovery, CI/CD & Documentation (E2E-07..E2E-09)
- [ ] Phase 10: Observabilidade — Sentry + logs estruturados + alertas
- [ ] Phase 11: Rate Limiting — Upstash Redis

### 📋 v1.3 Mobile e Infraestrutura (Future)

- [ ] Phase 12: Domínio Oficial — migração monarcasemijoyas.com.py
- [ ] Phase 13: Capacitor — PWA → iOS + Android
- [ ] Phase 14: Offline Mode — outbox, sync, conflitos

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
| 10. Observabilidade | v1.2 | 0/0 | Not started | - |
| 11. Rate Limiting | v1.2 | 0/0 | Not started | - |
| 12. Domínio Oficial | v1.3 | 0/0 | Planned | - |
| 13. Capacitor | v1.3 | 0/0 | Planned | - |
| 14. Offline Mode | v1.3 | 0/0 | Planned | - |

---

## Requirement Coverage

**v1.0 Requirements:** 49 complete (see `.planning/milestones/v1.0-REQUIREMENTS.md`)

**v1.1 Requirements:** 31 complete (see `.planning/milestones/v1.1-REQUIREMENTS.md`)

**v1.2 Requirements:** 23 total (see `.planning/REQUIREMENTS.md`)

## Phase Details

### Phase 9: E2E Testing — Playwright Golden Paths

**Goal:** Cobrir o fluxo crítico da revendedora com testes end-to-end automatizados, garantindo regressão zero nos caminhos de negócio.

**Requirements:** E2E-01 → E2E-09

**Success Criteria:**
1. `npm run test:e2e` executa todos os golden paths em < 5 minutos
2. CI roda suite E2E em todo PR sem falsos positivos
3. Seed script cria cenário completo (usuário + maleta + produtos) em < 10s
4. Documentação permite que qualquer dev rode E2E localmente em 3 comandos

### Phase 10: Observabilidade — Sentry + Logs Estruturados

**Goal:** Ter visibilidade total do comportamento do sistema em produção, com alertas proativos e zero vazamento de PII.

**Requirements:** OBS-01 → OBS-07

**Success Criteria:**
1. 100% dos erros de Server Actions aparecem no Sentry com userId e action name
2. Logs de produção são parseáveis como JSON (sem free-form text)
3. Nenhum log de erro contém email, telefone ou dados bancários (auditoria manual)
4. Alerta Sentry dispara quando taxa de erro > 1% em 5 minutos
5. Release tracking no Sentry associa cada erro ao commit exato

### Phase 11: Rate Limiting — Upstash Redis

**Goal:** Proteger endpoints sensíveis contra abuso e brute-force sem impactar usuários legítimos.

**Requirements:** RATE-01 → RATE-07

**Success Criteria:**
1. Endpoint `/api/auth/login` bloqueia após 5 tentativas/minuto por IP
2. Resposta 429 inclui header `Retry-After` e mensagem em espanhol paraguaio
3. Admin consegue executar 50+ ações/minuto sem ser limitado
4. Testes automatizados confirmam que limites funcionam e headers são enviados
5. Documentação de limites está acessível em `.planning/` e no README

---

*Roadmap created: 2026-05-04*  
*Last updated: 2026-05-06 — Milestone v1.2 scoped*  
*Milestone: v1.2 — Produção e Qualidade (PLANNED)*
