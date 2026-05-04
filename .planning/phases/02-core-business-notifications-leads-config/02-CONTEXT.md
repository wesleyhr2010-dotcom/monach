# Phase 2: Core Business — Notifications, Leads & Config - Context

**Gathered:** 2026-05-04
**Status:** Ready for planning
**Source:** SPEC analysis + ROADMAP requirements

<domain>
## Phase Boundary

This phase delivers three core operational features:
1. **Notifications** — Template-driven notification system with variable substitution, connected to cron jobs and Server Actions
2. **Leads** — Complete lead pipeline from landing page submission through admin approval/rejection to user creation
3. **Config** — Admin-editable commission tiers, gamification levels, and contracts

</domain>

<decisions>
## Implementation Decisions

### Notifications (NOTF-01..09)
- **D-01**: Helper `substituirVariaveis(template, contexto)` replaces placeholders (`{maleta_id}`, `{dias_restantes}`, `{nome_revendedora}`, `{pontos}`) in notification templates
- **D-02**: Cron jobs `check-maleta-prazo` and `marcar-maletas-atrasadas` must read active templates from `NotificacaoTemplate` table by type, not use hardcoded strings
- **D-03**: Template whitelist per type — unknown variables are silently ignored, not replaced
- **D-04**: HTML sanitization for email variables; plain-text only for OneSignal push notifications (NOTF-09)
- **D-05**: Admin template editor at `/admin/config/notificacoes` displays "Variables disponibles" hint per template type
- **D-06**: Server Actions `registrarVenda`, `conferirEFecharMaleta`, `submitDevolucao` send templated notifications with variable substitution

### Leads (LEAD-01..07)
- **D-07**: Landing `/seja-revendedora` persists leads to `RevendedoraLead` with status `pendente`
- **D-08**: Admin `/admin/leads` shows tabs: Pendientes / Aprobadas / Rechazadas with filtering
- **D-09**: Approval creates Supabase Auth user + `Reseller` profile + sends welcome email via Brevo template
- **D-10**: Rejection updates lead to `rejeitado` with required observation + sends rejection email via Brevo
- **D-11**: Approval is idempotent — re-approving already approved lead returns success without duplicates
- **D-12**: Race condition protected via WHERE clause requiring `status = 'pendente'`; compensation removes Auth user if Prisma fails
- **D-13**: Welcome email uses Brevo template with Monarca branding (not plain text)

### Config (CONF-01..06)
- **D-14**: Commission tiers (`CommissionTier`) editable at `/admin/config/comissoes` — label, min_sales_value, commission_pct
- **D-15**: Gamification levels (`NivelRegra`) editable at `/admin/config/niveis` — label, min_points, benefit
- **D-16**: Contracts (`Contrato`) editable at `/admin/config/contratos` — PDF upload to R2, version, active/inactive
- **D-17**: Active contract displayed during new reseller onboarding
- **D-18**: Changes to tiers/levels do NOT affect already closed maletas (snapshots remain immutable)
- **D-19**: All config forms use Zod validation

### the agent's Discretion
- Specific toast messages and UI copy (follow Spanish Paraguayan conventions)
- Exact layout of config tables (follow existing admin patterns)
- Error message wording for validation failures

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Notifications
- `docs/revendedoras/SPEC_NOTIFICACOES.md` — Notification types, OneSignal integration, preferences
- `docs/sistema/SPEC_CRON_JOBS.md` — Cron job structure, schedules, Edge Functions
- `docs/admin/SPEC_ADMIN_ANALYTICS_NOTIFICATIONS.md` — Admin template editor, OneSignal config

### Leads
- `docs/admin/SPEC_ADMIN_LEADS.md` — Lead approval flow, modals, server actions, emails
- `docs/revendedoras/SPEC_SEJA_REVENDEDORA.md` — Landing page lead submission

### Config
- `docs/admin/SPEC_ADMIN_CONFIG.md` — Commission tiers, contract management, schemas
- `docs/sistema/SPEC_DATABASE.md` — Prisma schemas for `CommissionTier`, `NivelRegra`, `Contrato`

### Cross-cutting
- `docs/sistema/SPEC_EMAILS.md` — Brevo email system, templates
- `.planning/phases/01-foundation-error-handling-ui-states/01-01-PLAN.md` — ActionResult<T> pattern (depends on Phase 1)

</canonical_refs>

<specifics>
## Specific Ideas

- Commission tier base rule: always at least one tier with `min_sales_value = 0`
- Contract upload: PDF only, max 10MB, stored in R2 bucket under `contratos/{id}.pdf`
- Lead approval modal requires consultora selection + comissão taxa input
- Notification template types: `prazo_proximo`, `maleta_atrasada`, `pontos_ganhos`, `acerto_confirmado`, `devolucao_recebida`

</specifics>

<deferred>
## Deferred Ideas

- Real-time analytics WebSocket (out of scope v1.0)
- Preview de template com substituição de variáveis (ANLT-03, v2)
- Rate limiting on lead approval endpoint (v1.1)

</deferred>

---

*Phase: 02-core-business-notifications-leads-config*
*Context gathered: 2026-05-04 via SPEC analysis*
