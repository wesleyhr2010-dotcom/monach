---
gsd_state_version: 1.0
milestone: v1.4
milestone_name: PDV e Ventas de Loja
status: ready
last_updated: "2026-05-08T00:00:00.000Z"
last_activity: 2026-05-08 -- Roadmap created (Phases 16-18)
progress:
  total_phases: 3
  completed_phases: 0
  total_plans: 9
  completed_plans: 0
  percent: 0
---

# STATE.md — NEXT-MONARCA

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-08)

**Core value:** Revendedoras conseguem receber, registrar vendas e devolver maletas com comprovante — e receber a comissão calculada automaticamente.
**Current focus:** Milestone v1.4 — PDV e Ventas de Loja

## Current Position

Phase: 16 — Foundation: Schema + Gestão de Clientes
Plan: Not started
Status: Roadmap created — ready to execute Phase 16
Last activity: 2026-05-08 — Roadmap created (Phases 16-18 defined)

Progress: [░░░░░░░░░░░░] 0% (0/3 phases complete) | Milestone v1.4

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

## Accumulated Context

### Decisions

- **D-16-01** (2026-05-08): Migration única para todos os 5 itens de schema v1.4 — `ClienteOrigem`, `Moneda`, `venda_loja` em enum, `CotizacionDia`, `Cliente`, `VentaLoja`, `VentaLojaItem`
- **D-16-02** (2026-05-08): Lista unificada de clientes via two-query merge — `prisma.cliente.findMany()` + `prisma.vendaMaleta.findMany({ distinct: [...] })`; filtro por `origem` por branch na Server Action
- **D-17-01** (2026-05-08): `CotizacionDia` insert-por-update (não singleton upsert) — histórico preservado; `findFirst({ orderBy: { createdAt: "desc" } })` para taxa corrente
- **D-17-02** (2026-05-08): `criarVentaLoja` espelha `criarMaleta` — pré-leitura de estoque fora da transaction (fail fast), `$transaction([...ops])` array form; snapshot imutável de cotização gravado nas colunas na criação
- **D-17-03** (2026-05-08): Cotização SEMPRE relida do DB na Server Action — nunca aceitar taxa do payload do cliente
- **D-17-04** (2026-05-08): Precisão monetária — `Math.round(Number(price) * Number(rate))` por linha; somar inteiros para evitar acumulação de float em PYG
- **D-14-01** (2026-05-07): Refatorar `actions-analytics.ts` — Assinaturas mudam de `periodDays` para `(from: Date, to: Date)` integralmente
- **D-14-02** (2026-05-07): UI Component `DatePickerWithRange` (Shadcn/ui) — Padronizado para seleção de range visual
- **D-14-03** (2026-05-07): Timezone UTC-3 (PY) para limites de query — `to` representa o fim do dia no Paraguai (23:59:59)
- **D-14-04** (2026-05-07): URL State Precedence — `?from/to` > `?period`. Estado persistente ao trocar revendedora
- **D-13-01** (2026-05-07): Sincronização Lazy + Fallback TS — DB vazio até edição; exclusão reseta para o padrão
- **D-13-02** (2026-05-07): Validação estrita de variáveis em src/lib/emails-shared.ts — bloqueio no save se desconhecidas
- **D-13-03** (2026-05-07): Editor com escopo ampliado — inclui Assunto, Corpo e Preview Text com Saudação editável
- **D-13-04** (2026-05-07): Wrapper Centralizado no envio com cache por request e erro rigoroso se DB falhar
- **D-07-01** (2026-05-06): Template engine híbrida aprovada — utilitários `email-base` geram HTML + text simultaneamente

*(Carried forward from v1.0/v1.1/v1.2/v1.3 — see MILESTONES.md for full history)*

### Pending Todos

None.

### Blockers/Concerns

None.

### Accepted Security Risks

| ID | CVE / Advisory | Package | CVSS | Decisão | Justificativa | Data |
|----|---------------|---------|------|---------|--------------|------|
| SR-01 | CVE-2024-22363 | xlsx@0.18.5 | 7.5 H | Aceito | xlsx mantido exclusivamente para leitura de `.xls` (CRM do cliente). Sem fix gratuito disponível (SheetJS Pro only). Rota autenticada (ADMIN/COLABORADORA), arquivo de fonte confiável. | 2026-05-12 |
| SR-02 | CVE-2023-30533 | xlsx@0.18.5 | 5.3 M | Aceito | Idem SR-01. Prototype Pollution requer leitura de arquivo crafted — CRM é fonte interna confiável. | 2026-05-12 |
| SR-03 | CVE-2026-41907 | uuid@8.3.2 (via exceljs) | 8.2 H | Aceito | Exploração requer `uuid.v4(opt, buf, offset)` com buffer externo. ExcelJS chama `uuid.v4()` sem argumentos — superfície de ataque não existe neste uso. | 2026-05-12 |
| SR-04 | SNYK-JS-INFLIGHT-6095116 | inflight@1.0.6 (via exceljs) | 6.2 M | Aceito | Memory leak requer acesso local ao processo Node. Ambiente é Vercel Fluid Compute (processo recriado por invocação) — sem acúmulo entre requests. Sem CVE atribuído. Lib abandonada, sem fix disponível. | 2026-05-12 |

## Deferred Items

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| Infra | Migração domínio oficial monarcasemijoyas.com.py | Deferred to v1.5 | 2026-05-08 |
| Mobile | Migração PWA → Capacitor (iOS + Android) | Deferred to v1.5 | 2026-05-08 |
| Offline | Modo offline PWA — outbox, sync, conflitos | Deferred to v1.5 | 2026-05-08 |
| Security | Segurança da Gamificação (awardPoints ownership, rate limiting) | Deferred to v1.5 | 2026-05-08 |
| PDV | Emissão de factura paraguaia (talonario, PDF) | Deferred to v1.5 | 2026-05-08 |

## Quick Tasks Completed

| Slug | Date | Description | Commit |
|------|------|-------------|--------|
| upgrade-jspdf-security | 2026-05-12 | Upgrade jspdf 4.2.0→4.2.1 — patch CVE-2026-31938 (XSS) + CVE-2026-31898 | b5041fb |
| patch-fast-xml-builder | 2026-05-12 | npm override fast-xml-builder@^1.1.7 — patch CVE-2026-44665 (XXE) + CVE-2026-44664 (XML Injection) | a4322bf |
| migrate-xlsx-to-exceljs | 2026-05-12 | Replace xlsx@0.18.5 → exceljs@4.4.0 — remediate CVE-2024-22363 (ReDoS) + CVE-2023-30533 (Prototype Pollution) | ddb44fe |
| patch-postcss-xss | 2026-05-12 | npm override postcss@^8.5.10 — patch CVE-2026-41305 (XSS in CSS Stringify via next@16.2.6 nested dep) | 74999df |
| admin-sidebar-overflow | 2026-05-12 | Fix admin sidebar nav overflow — itens de menu desaparecendo (overflow-y: auto + scrollbar customizada) | 8cf5b4b |

## Session Continuity

Last session: 2026-05-08
Stopped at: Roadmap created — Phases 16-18 defined for v1.4
Resume: `/gsd-plan-phase 16` (Schema migration + Gestão de Clientes)
