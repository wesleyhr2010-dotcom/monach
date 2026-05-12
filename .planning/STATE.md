---
gsd_state_version: 1.0
milestone: v1.4
milestone_name: PDV e Ventas de Loja
status: active
last_updated: "2026-05-08T21:30:00.000Z"
last_activity: 2026-05-12 -- Completed quick task 002: Upgrade next to 16.2.6 to fix CVE-2026-45109
progress:
  total_phases: 3
  completed_phases: 3
  total_plans: 11
  completed_plans: 9
  percent: 82
---

# STATE.md — NEXT-MONARCA

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-08)

**Core value:** Revendedoras conseguem receber, registrar ventas e devolver maletas com comprobante — e receber a comisión calculada automaticamente.
**Current focus:** Milestone v1.4 — PDV e Ventas de Loja

## Current Position

Phase: 18 — Histórico de Ventas
Plan: 2/2 plans complete
Status: Complete
Last activity: 2026-05-09 — Phase 18 complete (2/2 plans)

Progress: [████████████░] 82% (3/3 phases complete, 9/11 plans complete) | Milestone v1.4 active

## Performance Metrics

**Velocity (v1.0 baseline):**

- Total plans completed: 19
- Average duration: ~45 min/plan
- Total execution time: ~21.5h

**Velocity (v1.1):**

- Total plans completed: 10
- Average duration: ~3.6h/plan
- Total execution time: ~1.5 days
- Commits: 34
- Files changed: 73 (+8,929 / −444)

**Velocity (v1.4 — Phase 16):**

- Plans completed: 3
- Commits: 3
- Duration: ~1 session

**Velocity (v1.4 — Phase 17):**

- Plans completed: 4
- Commits: 9
- Files created: 12 new
- Duration: ~1 session

## Accumulated Context

### Decisions

- **D-16-01** (2026-05-08): Migration única para todos os 5 itens de schema v1.4 — `ClienteOrigem`, `Moneda`, `venda_loja` em enum, `CotizacionDia`, `Cliente`, `VentaLoja`, `VentaLojaItem`
- **D-16-02** (2026-05-08): Lista unificada de clientes via two-query merge — `prisma.cliente.findMany()` + `prisma.vendaMaleta.findMany({ distinct: [...] })`; filtro por `origem` por branch na Server Action
- **D-14-01** (2026-05-07): Refatorar `actions-analytics.ts` — Assinaturas mudam de `periodDays` para `(from: Date, to: Date)` integralmente
- **D-14-02** (2026-05-07): UI Component `DatePickerWithRange` (Shadcn/ui) — Padronizado para seleção de range visual
- **D-14-03** (2026-05-07): Timezone UTC-3 (PY) para limites de query — `to` representa o fim do dia no Paraguai (23:59:59)
- **D-14-04** (2026-05-07): URL State Precedence — `?from/to` > `?period`. Estado persistente ao trocar revendedora
- **D-13-01** (2026-05-07): Sincronização Lazy + Fallback TS — DB vazio até edição; exclusão reseta para o padrão
- **D-13-02** (2026-05-07): Validação estrita de variáveis em src/lib/emails-shared.ts — bloqueio no save se desconhecidas
- **D-13-03** (2026-05-07): Editor com escopo ampliado — inclui Assunto, Corpo e Preview Text com Saudação editável
- **D-13-04** (2026-05-07): Wrapper Centralizado no envio com cache por request e erro rigoroso se DB falhar
- **D-07-01** (2026-05-06): Template engine híbrida aprovada — utilitários `email-base` geram HTML + text simultaneamente

**Velocity (v1.4 — Phase 18):**

- Plans completed: 2
- Commits: 11
- Files created: 8 new
- Duration: ~1 session
- Post-merge build: ✓ passes
- Post-merge tests: 26 pre-existing failures (email templates, unrelated)

*(Carried forward from v1.0/v1.1/v1.2/v1.3 — see MILESTONES.md for full history)*

### Pending Todos

None.

### Blockers/Concerns

None.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 001 | Sincronização de Estoque via Upload de Planilha (CRM) | 2026-05-12 | 06669fb | [001-sincronizacao-estoque-planilha](./quick/001-sincronizacao-estoque-planilha/) |
| 002 | Upgrade next to 16.2.6 to fix CVE-2026-45109 | 2026-05-12 | ae2e216 | [002-next-security-upgrade](./quick/20260512-002-next-security-upgrade/) |

## Deferred Items

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| Infra | Migração domínio oficial monarcasemijoyas.com.py | Deferred to v1.5 | 2026-05-08 |
| Mobile | Migração PWA → Capacitor (iOS + Android) | Deferred to v1.5 | 2026-05-08 |
| Offline | Modo offline PWA — outbox, sync, conflitos | Deferred to v1.5 | 2026-05-08 |
| Security | Segurança da Gamificação (awardPoints ownership, rate limiting) | Deferred to v1.5 | 2026-05-08 |
| PDV | Emissão de factura paraguaia (talonario, PDF) | Deferred to v1.5 | 2026-05-08 |

## Session Continuity

Last session: 2026-05-09
Stopped at: Phase 18 context gathered — 13 decisions captured across 4 areas
Resume: `/gsd-plan-phase 18` (Histórico de Ventas)
