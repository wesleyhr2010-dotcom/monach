# Plan 16-03 Summary — UI /admin/clientes

**Phase:** 16-foundation-schema-clientes  
**Plan:** 03  
**Wave:** 3  
**Status:** ✅ Complete  
**Completed:** 2026-05-08

## What Was Built

Tela `/admin/clientes` com lista unificada de clientes da loja e compradores de maleta, filtro por origem via tabs, e formulário de criação/edição em modal.

### Componentes

| Componente | Função |
|------------|--------|
| `page.tsx` | Server Component — carrega dados iniciais via `getClientes({ origem: "TODOS" })` |
| `ClientesClient.tsx` | Client Component — estado de tabs, lista, modal, loading |
| `ClienteRow.tsx` | Linha de cliente com avatar, nome, badge de origem, RUC, cidade, telefone |
| `ClienteFormModal.tsx` | Modal reutilizável de criação/edição com validação de RUC duplicado |

### Features

- **Tabs:** Todos / Loja / Revendedoras — com contagem dinâmica
- **Filtro:** Ao trocar de tab, recarrega lista via Server Action
- **Criação:** Botão "Nuevo Cliente" abre modal vazio
- **Edição:** Botão "Editar" na linha do cliente (apenas origem LOJA)
- **Validação:** RUC duplicado exibe erro em banner vermelho dentro do modal — modal NÃO fecha
- **Empty state:** `AdminEmptyState` com mensagem contextual por tab
- **Tokens:** 100% `var(--admin-*)` — zero hex/px hardcoded

### Paper Audit

- Artboard `/admin/clientes` **não encontrado** no Paper
- Design system existente usado como referência (tokens + componentes admin)
- Audit registrado em `16-PAPER-AUDIT.md`

## Key Files Created/Modified

| File | Action |
|------|--------|
| `src/app/admin/clientes/page.tsx` | Created |
| `src/app/admin/clientes/ClientesClient.tsx` | Created |
| `src/app/admin/clientes/ClienteRow.tsx` | Created |
| `src/app/admin/clientes/ClienteFormModal.tsx` | Created |
| `.planning/phases/16-foundation-schema-clientes/16-PAPER-AUDIT.md` | Created |

## Self-Check

- ✅ Rota `/admin/clientes` renderiza
- ✅ Tabs Loja / Revendedoras / Todos funcionam com contagem
- ✅ Modal de criação/edição funciona com validação de RUC duplicado
- ✅ Feedback de erro em espanhol sem fechar modal
- ✅ Zero hex/px hardcoded — 100% tokens admin
- ✅ `AdminEmptyState` usado para estado vazio
- ✅ Lint passa
- ✅ Build passa

## Next Up

Fase 17 — PDV Core: Cotização + Fluxo de Venda
