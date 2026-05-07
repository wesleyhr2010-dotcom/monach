# Phase 15: Admin UI Consistência Visual - Context

**Gathered:** 2026-05-07
**Status:** Ready for planning
**Source:** ROADMAP.md + REQUIREMENTS.md

<domain>
## Phase Boundary

Esta fase entrega o painel administrativo (`/admin/*`) com visual 100% consistente com o design system definido em `docs/design-system/`. Nenhum valor hex hardcoded deve permanecer em arquivos de rota admin; todos os status devem usar `AdminStatusBadge`; todos os empty states devem usar `AdminEmptyState`.

Escopo: rotas e componentes em `src/app/admin/*` e `src/components/admin/*`.

## Decisions

### Locked Decisions
- **D-15-01 (ADUI-01)**: Auditoria por rota OBRIGATÓRIA antes de qualquer modificação de código. Cada rota `/admin/*` deve ter seus desvios listados.
- **D-15-02 (ADUI-02)**: Todos os valores hex hardcoded em arquivos admin devem ser substituídos por tokens CSS `var(--admin-*)`. Exceção: valores em `admin.css` (fonte dos tokens) e em arquivos de assets estáticos.
- **D-15-03 (ADUI-03)**: `AdminStatusBadge` deve ser usado em TODOS os lugares onde status é exibido. Atualmente ele mesmo usa hex hardcoded — isso também deve ser corrigido.
- **D-15-04 (ADUI-04)**: `AdminEmptyState` deve ser usado em TODOS os empty states de admin. Atualmente há mistura de `EmptyState` (de `@/components/ui/empty-state`), `<div className="admin-empty">` e markup inline.
- **D-15-05 (ADUI-05)**: Para cada rota modificada, o artboard correspondente no Paper DEVE ser consultado via MCP antes da alteração. Se não houver artboard, a rota pode ser alterada com base no design system existente.

### the agent's Discretion
- Ordem de execução das rotas dentro de cada plano (priorizar rotas mais críticas/visíveis).
- Se `AdminStatusBadge` precisar suportar novos status (lead, contrato, brinde), estender o componente.
- Se `AdminEmptyState` precisar de nova prop ou variante, estender o componente.

</decisions>

<canonical_refs>
## Canonical References

### Design System
- `docs/design-system/DESIGN_SYSTEM.md` — Identidade visual, cores, tipografia
- `docs/design-system/tokens.md` — Tokens CSS do projeto
- `docs/sistema/SPEC_DESIGN_MODULES.md` — Módulos pré-modulados do app revendedora (referência de patterns)

### Código Fonte
- `src/app/admin/admin.css` — Definição dos tokens `--admin-*`
- `src/components/admin/AdminStatusBadge.tsx` — Componente de badge de status (usa hex hardcoded)
- `src/components/admin/AdminEmptyState.tsx` — Componente de estado vazio
- `src/components/ui/empty-state.tsx` — Componente genérico (NÃO usar em admin)

### Regras de Negócio
- `CLAUDE.md` §3.1 — Paper-first, modular, design system primeiro
- `CLAUDE.md` §3.2 — `git push` vai para remote `client`

</canonical_refs>

<specifics>
## Specific Ideas

### Tokens Admin Existentes (src/app/admin/admin.css)
```css
--admin-bg: #0a0a0a;
--admin-surface: #171717;
--admin-surface-hover: #222222;
--admin-border: #2a2a2a;
--admin-text: #ededed;
--admin-text-muted: #888888;
--admin-text-dim: #444444;
--admin-accent: #35605a;
--admin-accent-hover: #2a4d48;
--admin-danger: #e05c5c;
--admin-danger-hover: #c44545;
--admin-success: #4ade80;
--admin-warning: #facc15;
```

### Hex Hardcoded Encontrados (amostra)
- `AdminStatusBadge.tsx`: `#4ADE80`, `#E05C5C`, `#FACC15`, `#555555`, `#646464`, `#777777`
- `src/app/admin/page.tsx`: `#35605A`, `#1a1a1a`, `#888`, `#333`
- `src/app/admin/analytics/page.tsx`: `#35605A`, `#1a1a1a`, `#888`, `#333`
- `src/app/admin/login/reset-password/page.tsx`: `#0A0A0A`
- `src/app/admin/maleta/page.tsx`: `#1a1a1a`, `#2a2a2a`
- `src/app/admin/revendedoras/page.tsx`: `#1a1a1a`, `#2a2a2a`
- `src/app/admin/revendedoras/[id]/page.tsx`: `#555555`

### Empty States Inline Encontrados
- `admin/config/niveis/NiveisClient.tsx`: `<p>Nenhum nivel cadastrado.</p>`
- `admin/config/comissoes/ComissoesClient.tsx`: `<p>Nenhuma faixa cadastrada.</p>`
- `admin/config/contratos/ContratosClient.tsx`: `<p>Nenhum contrato cadastrado.</p>`
- `admin/config/notif-push/NotifPushClient.tsx`: markup inline com `admin-empty`
- `admin/leads/page.tsx`: `<div className="admin-empty">Nenhuma lead...</div>`
- `admin/revendedoras/[id]/page.tsx`: `<p style={{ color: "#555555" }}>Nenhuma maleta</p>`
- `admin/revendedoras/[id]/documentos/page.tsx`: `<p className="text-muted-foreground">Nenhum documento</p>`
- `admin/minha-conta/comissoes/page.tsx`: `<div className="admin-empty-state">`
- `admin/maleta/page.tsx`: usa `EmptyState` de `@/components/ui/empty-state`
- `admin/revendedoras/page.tsx`: usa `EmptyState` de `@/components/ui/empty-state`

### Rotas Admin Existentes
```
/admin
/admin/login/reset-password
/admin/analytics
/admin/maleta
/admin/maleta/nova
/admin/maleta/[id]
/admin/maleta/[id]/editar
/admin/maleta/[id]/conferir
/admin/revendedoras
/admin/revendedoras/[id]
/admin/revendedoras/[id]/documentos
/admin/leads
/admin/equipe
/admin/consultoras
/admin/brindes
/admin/brindes/nuevo
/admin/brindes/[id]/editar
/admin/brindes/solicitudes
/admin/config/comissoes
/admin/config/niveis
/admin/config/contratos
/admin/config/notif-push
/admin/config/emails
/admin/config/emails/[tipo]
/admin/minha-conta/comissoes
/admin/relatorios
```

</specifics>

<deferred>
## Deferred Ideas

None — all requirements mapped to this phase.

</deferred>

---

*Phase: 15-admin-ui-consistencia-visual*
*Context gathered: 2026-05-07*
