# Phase 16: Foundation — Schema + Gestão de Clientes - Context

**Gathered:** 2026-05-08
**Status:** Ready for planning
**Source:** ROADMAP.md + REQUIREMENTS.md + STATE.md

<domain>
## Phase Boundary

Esta fase entrega a base de dados (schema v1.4) e o CRUD completo de clientes para o PDV. Inclui: migration Prisma com enums e models novos, Server Actions de criação/edição/busca, e UI `/admin/clientes` com lista unificada de clientes da loja e compradores de maleta.

Escopo: `prisma/schema.prisma`, `src/lib/actions/actions-clientes.ts`, `src/app/admin/clientes/*`, e componentes admin reutilizáveis.

## Decisions

### Locked Decisions
- **D-16-01 (2026-05-08)**: Migration única para todos os 5 itens de schema v1.4 — `ClienteOrigem`, `Moneda`, `venda_loja` em enum, `CotizacionDia`, `Cliente`, `VentaLoja`, `VentaLojaItem`. Executar tudo em uma migration só.
- **D-16-02 (2026-05-08)**: Lista unificada de clientes via two-query merge — `prisma.cliente.findMany()` + `prisma.vendaMaleta.findMany({ distinct: [...] })`; filtro por `origem` por branch na Server Action.
- **D-15-01** (herdado): Paper MCP consultado antes de implementar cada tela nova.
- **D-15-02** (herdado): Tokens `--admin-*` obrigatórios — zero hex/px hardcoded no JSX.

### the agent's Discretion
- Componente de lista: usar tabela admin existente ou criar nova `DataTable` se necessário.
- Formulário de cliente: modal inline ou página separada `/admin/clientes/nuevo`.
- Ordenação e paginação da lista unificada (não especificado nas requirements).
- Tratamento de telefone: formato livre ou normalizado.

</decisions>

<canonical_refs>
## Canonical References

### Design System
- `docs/design-system/tokens.md` — Tokens CSS do projeto
- `docs/sistema/SPEC_DESIGN_MODULES.md` — Módulos pré-modulados

### Código Fonte
- `prisma/schema.prisma` — Schema atual (v1.3)
- `src/lib/actions/` — Server Actions existentes (padrão `ActionResult<T>`)
- `src/lib/user.ts` — `getCurrentUser()` cached + `requireAuth()`
- `src/app/admin/` — Rotas admin existentes
- `src/components/admin/` — Componentes admin reutilizáveis

### Regras de Negócio
- `CLAUDE.md` §3.1 — Paper-first, modular, design system primeiro
- `CLAUDE.md` §3.2 — `git push` vai para remote `client`
- `CLAUDE.md` §2.3 — Surgical changes
- `CLAUDE.md` §3.3 — Performance (getCurrentUser cached, middleware sem query)

</canonical_refs>

<specifics>
## Specific Ideas

### Schema v1.4 (de ROADMAP.md)
```
enum ClienteOrigem { LOJA REVENDEDORA }
enum Moneda { PYG USD BRL }
// valor venda_loja em EstoqueMovimentoTipo
model CotizacionDia { id, brlToPyg, usdToPyg, createdAt }
model Cliente { id, nombre, ruc, ciudad, telefono, origen, createdAt, updatedAt }
model VentaLoja { id, clienteId, total, moneda, totalPyg, talonario, numeroFactura, tipoOperacion, cotizacionSnapshot, createdAt, updatedAt, createdBy }
model VentaLojaItem { id, ventaLojaId, productoVarianteId, cantidad, precioUnitario, subtotal, createdAt }
```

### Patterns do Projeto (de STATE.md)
- `$transaction([...ops])` array form — nunca `$transaction(async tx)`
- `ActionResult<T>` em todas as Server Actions
- `requireAuth(["ADMIN"])` em todas as mutações
- `Math.round(Number(price) * Number(rate))` por linha

### Two-Query Merge (de D-16-02)
- Query 1: `prisma.cliente.findMany()` (origem = LOJA)
- Query 2: `prisma.vendaMaleta.findMany({ distinct: [...] })` (origem = REVENDEDORA)
- Branch por `origem` param na action `getClientes`

</specifics>

<deferred>
## Deferred Ideas

- Emissão de factura paraguaia (talonario, PDF) — v1.5
- CRM completo (crédito, cuotas) — v1.5
- Cadastro de clientes pelo PWA revendedora — fora de escopo v1.4

</deferred>

---

*Phase: 16-foundation-schema-clientes*
*Context gathered: 2026-05-08 via ROADMAP + STATE synthesis*
