---
plan: 17-03
status: complete
completed_at: "2026-05-08T21:20:00.000Z"
---

# 17-03 SUMMARY — PDV Steps 1-2 (Cliente + Productos)

## Objective
Implement base do PDV em `/admin/pdv`: page.tsx, PdvClient.tsx (estado + navegação) e Steps 1-2 (Cliente, Productos).

## What was built
- `page.tsx` (RSC, force-dynamic): preloads cotização + categorias
- `PdvClient.tsx`: state global (cliente, carrito, step, moneda), AdminStepIndicator com 4 steps, navegação Anterior/Siguiente, placeholders para steps 3-4
- `PdvStepCliente.tsx`: busca RUC com debounce 400ms, mini-form inline para criar cliente, Consumidor Final, "Cambiar cliente"
- `PdvStepProductos.tsx`: busca por nome (debounce 400ms), filtro por categoria, lista de variantes, carrinho lateral com +/- e remover, bloqueio de stock, badges "Última unidad" e "En carrito"

## Paper MCP
No specific "PDV" artboard found. UI-SPEC used as canonical source.

## Key files created
- `src/app/admin/pdv/page.tsx` — new
- `src/app/admin/pdv/PdvClient.tsx` — new (exports: ClienteSeleccionado, CarritoItem, Moneda)
- `src/app/admin/pdv/PdvStepCliente.tsx` — new
- `src/app/admin/pdv/PdvStepProductos.tsx` — new

## TypeScript fixes applied
- `getCategories()` returns `Category[]` directly, not `ActionResult<Category[]>`
- `ClienteItem` uses `nombre`/`ciudad` (not `nome`/`cidade`)
- `ClienteFormData` requires `nombre`/`ruc`/`ciudad`/`telefono` as strings

## Self-Check: PASSED
- TypeScript compiles zero errors
- All acceptance criteria met
- Zero hex hardcoded, ES-PY copy exact per UI-SPEC

## Deviations
- Mini-form uses `ruc: ""` (empty string) when no RUC available — `criarCliente` validates non-empty RUC server-side
