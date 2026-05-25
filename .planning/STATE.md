---
gsd_state_version: 1.0
milestone: v1.5
milestone_name: Dark Mode & Temas
status: executing
stopped_at: Phase 22 complete — Milestone v1.5 Dark Mode & Temas ready for verification
last_updated: "2026-05-22T20:46:09.330Z"
last_activity: 2026-05-23 — Completed quick task 260523-001: Corrigir trava ao ativar push na PWA iOS
progress:
  total_phases: 7
  completed_phases: 7
  total_plans: 22
  completed_plans: 20
  percent: 100
---

# STATE.md — NEXT-MONARCA

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-08)

**Core value:** Revendedoras conseguem receber, registrar vendas e devolver maletas com comprovante — e receber a comissão calculada automaticamente.
**Current focus:** Milestone v1.5 — Dark Mode & Temas

## Current Position

Phase: 22 — Toggle UI
Plan: 02 — Admin Account Integration & Sonner Verification
Status: Phase 22 complete — all TOG requirements satisfied
Last activity: 2026-05-16 — Phase 22 execution completed (2 plans)

Progress: [██████████████] 100% (7/7 phases complete, 2/2 plans in Phase 22) | Milestone v1.5

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

- **D-21-03** (2026-05-16): SonnerThemer uses `useTheme(storageKey)` directly instead of `useThemeContext()` because it is rendered outside the ThemeProvider tree (as a sibling of the shell in the server layout)
- **D-21-04** (2026-05-16): MutationObserver with 1s safety timeout in ThemeScript ensures the anti-flash script can find `.app-shell`/`.admin-layout` even when those elements are rendered by client components and not present at HTML parse time
- **D-21-01** (2026-05-16): Lazy state initialization in useState instead of useEffect for localStorage reads — avoids react-hooks/set-state-in-effect ESLint error and eliminates an extra render cycle
- **D-21-02** (2026-05-16): Anti-flash script wrapped in try/catch per threat model T-21-03 — prevents hydration blocking on localStorage/DOM errors
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
| analytics-date-range-fix | 2026-05-12 | Fix DatePickerWithRange — 3 bugs (addToRange min=0, classNames mismatch, CSS conflito v9) | e071250 |
| bottom-nav-mas-sheet | 2026-05-12 | Bottom nav mobile — botão Más com sheet de itens extras e logout | 2ad87c6 |
| vamos-atualizar-todo-o-texto-do-painel-a | 2026-05-22 | Admin panel text translated to Spanish (all pages) | da5721a |
| fix-onesignal-optin-freeze | 2026-05-23 | Corrigir trava ao ativar push na PWA iOS — remover await SW ready antes de optIn() | 34ac17d |
| bot-o-de-compartilhar-link-da-vitrina-co | 2026-05-25 | Botão de compartilhar link da vitrina com pontos de gamificação | cf1edba |

## Session Continuity

Last session: 2026-05-25
Stopped at: Quick task 260525-qg0 completed — Botão compartilhar link da vitrina com pontos
Resume: Milestone v1.5 ready for verification
