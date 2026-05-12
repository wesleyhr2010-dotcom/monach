# Plan 16-02 Summary — Server Actions de Clientes

**Phase:** 16-foundation-schema-clientes  
**Plan:** 02  
**Wave:** 2  
**Status:** ✅ Complete  
**Completed:** 2026-05-08

## What Was Built

Server Actions para CRUD de clientes e lista unificada, seguindo os padrões do projeto (`ActionResult<T>`, `safeAction`, `requireAuth`, `$transaction` array form).

### Actions Exportadas

| Action | Descrição |
|--------|-----------|
| `criarCliente(data)` | Cria cliente com validação de RUC único. Retorna `ActionResult<ClienteItem>`. |
| `editarCliente(id, data)` | Edita cliente existente com validação de RUC duplicado em outro registro. Retorna `ActionResult<ClienteItem>`. |
| `buscarClientePorRuc(ruc)` | Busca cliente por RUC exato. Retorna `ActionResult<ClienteItem \| null>`. |
| `getClientes({ origem })` | Lista unificada: clientes da loja + compradores de maleta (two-query merge). Filtro por origem. Retorna `ActionResult<ClienteItem[]>`. |

### Tipos Criados

- `ClienteItem` — DTO serializado para UI (datas como ISO string, origem como union literal)
- `ClienteFormData` — Input de criação/edição

### Padrões Aplicados

- `requireAuth(["ADMIN"])` em todas as actions
- `safeAction` com `ActionResult<T>` em todas
- `BusinessError` com mensagens em espanhol paraguaio
- Validação de duplicidade de RUC com `findFirst({ where: { ruc, NOT: { id } } })`
- Two-query merge (D-16-02): `prisma.cliente.findMany()` + `prisma.vendaMaleta.findMany({ distinct: [...] })`
- IDs sintéticos `REV-${idx}` para compradores de maleta

## Key Files Created/Modified

| File | Action |
|------|--------|
| `src/app/admin/actions-clientes.ts` | Created — 4 Server Actions |
| `src/lib/types.ts` | Modified — +`ClienteItem`, +`ClienteFormData` |

## Self-Check

- ✅ 4 actions exportadas com `requireAuth(["ADMIN"])`
- ✅ Todas retornam `ActionResult<T>` via `safeAction`
- ✅ Duplicidade de RUC bloqueada com `BusinessError` em espanhol
- ✅ `getClientes` implementa two-query merge com filtro por origem
- ✅ Lint passa sem erros nos arquivos novos

## Next Up

Plan 16-03 — UI `/admin/clientes` com lista unificada, tabs, modal de criação/edição
