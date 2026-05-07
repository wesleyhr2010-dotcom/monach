# Requirements: NEXT-MONARCA v1.3

**Defined:** 2026-05-07
**Core Value:** Revendedoras conseguem receber, registrar vendas e devolver maletas com comprovante — e receber a comissão calculada automaticamente.

## v1 Requirements

### Segurança

- [ ] **SEC-01**: Admin e dados de revendedoras protegidos em `/api/export` — `requireAuth(["ADMIN","COLABORADORA"])` adicionado em ambas as export routes (xlsx e pdf)
- [ ] **SEC-02**: Next.js atualizado para 16.2.5 fecha 5 CVEs (recursos/limites, HTTP request smuggling, CSRF, WebSocket origin)
- [ ] **SEC-03**: `@serwist/next` e `serwist` atualizados para 9.5.11 fecha vulnerabilidade brace-expansion (CVSS 8.7)
- [ ] **SEC-04**: Sanitização de HTML em email templates usa `sanitize-html` com allowlist de tags de email (substitui regex com bypass confirmado)
- [ ] **SEC-05**: Cálculos de período no analytics usam timezone correto do Paraguai (UTC-3) — `getSinceDate` corrigido em todos os 7 call sites atomicamente
- [ ] **SEC-06**: Risco de `xlsx` e `jspdf` documentado como aceito em SPEC — uso restrito ao path de write/export, sem fix disponível upstream

### Email Templates Admin

- [ ] **ETML-01**: Admin pode visualizar a lista dos 7 templates de email com status (padrão ou com override ativo)
- [ ] **ETML-02**: Admin pode editar o assunto de cada template de email
- [ ] **ETML-03**: Admin pode editar o corpo HTML de cada template num textarea com destaque de variáveis
- [ ] **ETML-04**: Admin pode editar o corpo em texto plano como fallback
- [ ] **ETML-05**: Editor exibe chips clicáveis com variáveis disponíveis por tipo de template (mesma UX do push template editor)
- [ ] **ETML-06**: Ao salvar, apenas o inner HTML é armazenado — o wrapper `renderEmailBase()` sempre envolve ao enviar
- [ ] **ETML-07**: Send logic consulta DB primeiro e cai para template TypeScript hardcoded se não houver override ativo

### Analytics — Período Personalizado

- [ ] **ANLT-07**: Admin pode selecionar data de início e fim personalizadas no dashboard de analytics
- [ ] **ANLT-08**: Presets existentes (7d/30d/3m/12m) continuam funcionando sem alteração
- [ ] **ANLT-09**: Período selecionado (preset ou personalizado) refletido em URL params (`?from=YYYY-MM-DD&to=YYYY-MM-DD`)
- [ ] **ANLT-10**: Range personalizado limitado a máximo de 366 dias para evitar queries lentas
- [ ] **ANLT-11**: Export CSV usa o período atualmente selecionado (preset ou range personalizado)

### Admin UI — Consistência Visual

- [ ] **ADUI-01**: Auditoria produz lista de desvios por rota antes de qualquer implementação
- [ ] **ADUI-02**: Todos os valores hex hardcoded substituídos por tokens `--admin-*` do design system
- [ ] **ADUI-03**: `AdminStatusBadge` usado em todos os lugares onde status é exibido atualmente com classes diretas
- [ ] **ADUI-04**: `AdminEmptyState` usado em todos os empty states que atualmente usam markup inline
- [ ] **ADUI-05**: Paper MCP consultado para cada rota admin modificada — nenhuma mudança de layout sem referência visual

## v2 Requirements (deferred)

### Segurança da Gamificação (deferred to v1.4)

- **GAM-SEC-01**: `awardPoints` removida do export público — wrapper validado como único caller autorizado
- **GAM-SEC-02**: `registrarPuntosCompartirCatalogo` exige evidência de compartilhamento ou rate limit rigoroso
- **GAM-SEC-03**: Ownership check em `awardPoints` — caller deve ser o próprio resellerId ou ADMIN com assertIsInGroup
- **GAM-SEC-04**: Rate limiting via Upstash nas Server Actions de gamificação
- **GAM-SEC-05**: Suite de testes de segurança para gamificação

### Infraestrutura Mobile (deferred to v1.4)

- **INFRA-01**: Migração para domínio `monarcasemijoyas.com.py`
- **INFRA-02**: Migração PWA → Capacitor (iOS + Android)
- **INFRA-03**: Modo offline com outbox e sync idempotente

## Out of Scope

| Feature | Motivo |
|---------|--------|
| WYSIWYG editor de email (TipTap, Quill) | Admin é 1-3 operadores internos; textarea + HTML raw é suficiente e seguro |
| Test-send de email no editor | Risco de esgotar cota Brevo (300/dia); deferred com rate limit para v1.4 |
| Preview renderizado de email | Requer sandboxed iframe; escopo insuficiente neste milestone |
| Migração de vite/vitest CVEs | 3 CVEs high mas não afetam produção (só dev tooling); deferred v1.4 |
| Internacionalização ou mudança de idioma | Sistema usa espanhol paraguaio fixo |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SEC-01 | Phase 12 | Pending |
| SEC-02 | Phase 12 | Pending |
| SEC-03 | Phase 12 | Pending |
| SEC-04 | Phase 12 | Pending |
| SEC-05 | Phase 12 | Pending |
| SEC-06 | Phase 12 | Pending |
| ETML-01 | Phase 13 | Pending |
| ETML-02 | Phase 13 | Pending |
| ETML-03 | Phase 13 | Pending |
| ETML-04 | Phase 13 | Pending |
| ETML-05 | Phase 13 | Pending |
| ETML-06 | Phase 13 | Pending |
| ETML-07 | Phase 13 | Pending |
| ANLT-07 | Phase 14 | Pending |
| ANLT-08 | Phase 14 | Pending |
| ANLT-09 | Phase 14 | Pending |
| ANLT-10 | Phase 14 | Pending |
| ANLT-11 | Phase 14 | Pending |
| ADUI-01 | Phase 15 | Pending |
| ADUI-02 | Phase 15 | Pending |
| ADUI-03 | Phase 15 | Pending |
| ADUI-04 | Phase 15 | Pending |
| ADUI-05 | Phase 15 | Pending |

**Coverage:**
- v1 requirements: 23 total
- Mapped to phases: 23
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-07*
*Last updated: 2026-05-07 after initial definition*
