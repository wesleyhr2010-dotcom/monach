# Requirements: NEXT-MONARCA v1.2

**Defined:** 2026-05-06
**Core Value:** Revendedoras conseguem receber, registrar vendas e devolver maletas com comprovante — e receber a comissão calculada automaticamente.

## v1 Requirements

### E2E Testing

- [ ] **E2E-01**: Playwright instalado e configurado com projeto Next.js (App Router)
- [ ] **E2E-02**: Seed script de banco para cenários de teste (usuário, maleta, produtos)
- [ ] **E2E-03**: Golden path — revendedora faz login com email/senha
- [ ] **E2E-04**: Golden path — revendedora visualiza maleta ativa
- [ ] **E2E-05**: Golden path — revendedora registra uma venda
- [ ] **E2E-06**: Golden path — revendedora registra devolução com comprovante
- [ ] **E2E-07**: Teste de recuperação de senha via email (fluxo completo)
- [ ] **E2E-08**: CI/CD roda suite E2E em PR (GitHub Actions)
- [ ] **E2E-09**: Documentação de como rodar E2E localmente

### Observabilidade

- [ ] **OBS-01**: Sentry integrado ao projeto Next.js (client + server)
- [ ] **OBS-02**: Erros de Server Actions reportados ao Sentry com contexto (userId, action name)
- [ ] **OBS-03**: Logs estruturados em JSON em todos os ambientes (desenvolvimento e produção)
- [ ] **OBS-04**: PII nunca aparece em logs de erro ou traces (sanitização via helper existente)
- [ ] **OBS-05**: Alerta Sentry quando taxa de erro > threshold configurado (ex: 1% das requisições)
- [ ] **OBS-06**: Dashboard Sentry com release tracking (associação commit ↔ erro)
- [ ] **OBS-07**: Performance monitoring — web vitals (LCP, FID, CLS) no Sentry

### Rate Limiting

- [ ] **RATE-01**: Middleware de rate limiting configurado via Upstash Redis
- [ ] **RATE-02**: Limite por IP em endpoints públicos (login, reset senha, API vitrina)
- [ ] **RATE-03**: Limite por userId em endpoints autenticados (mutações de maleta, venda)
- [ ] **RATE-04**: Headers de rate limit expostos (`X-RateLimit-Remaining`, `Retry-After`)
- [ ] **RATE-05**: Resposta 429 com mensagem amigável em espanhol paraguaio
- [ ] **RATE-06**: Rate limiting não impacta requisições legítimas de admin em uso normal
- [ ] **RATE-07**: Documentação dos limites e estratégia de burst

## v2 Requirements

None — all v1.2 requirements are committed.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Migração domínio oficial | Deferred to v1.3 — requires DNS, SSL, domain purchase coordination |
| Migração PWA → Capacitor | Deferred to v1.3 — mobile-native packaging, requires Apple/Google dev accounts |
| Modo offline do PWA | Deferred to v1.3 — depends on Capacitor for reliable background sync |
| Load testing / stress test | Out of scope for v1.2 — E2E foca em correctness, não performance |
| Log aggregation (Datadog/Grafana) | Sentry é suficiente para v1.2; complexidade extra não justifica |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| E2E-01 | Phase 9 | Pending |
| E2E-02 | Phase 9 | Pending |
| E2E-03 | Phase 9 | Pending |
| E2E-04 | Phase 9 | Pending |
| E2E-05 | Phase 9 | Pending |
| E2E-06 | Phase 9 | Pending |
| E2E-07 | Phase 9 | Pending |
| E2E-08 | Phase 9 | Pending |
| E2E-09 | Phase 9 | Pending |
| OBS-01 | Phase 10 | Pending |
| OBS-02 | Phase 10 | Pending |
| OBS-03 | Phase 10 | Pending |
| OBS-04 | Phase 10 | Pending |
| OBS-05 | Phase 10 | Pending |
| OBS-06 | Phase 10 | Pending |
| OBS-07 | Phase 10 | Pending |
| RATE-01 | Phase 11 | Pending |
| RATE-02 | Phase 11 | Pending |
| RATE-03 | Phase 11 | Pending |
| RATE-04 | Phase 11 | Pending |
| RATE-05 | Phase 11 | Pending |
| RATE-06 | Phase 11 | Pending |
| RATE-07 | Phase 11 | Pending |

**Coverage:**
- v1 requirements: 23 total
- Mapped to phases: 23
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-06*
*Last updated: 2026-05-06 after initial definition*
