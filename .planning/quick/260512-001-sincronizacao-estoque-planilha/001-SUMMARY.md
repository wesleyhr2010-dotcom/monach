---
status: complete
completed: "2026-05-12"
---

# Quick Task 001 — Sincronização de Estoque via Upload de Planilha

## Resumo

Implementada funcionalidade de sincronização de estoque via upload de planilha Excel do CRM externo.

## Entregas

### 1. Server Actions (`src/lib/actions/estoque-sync.ts`)
- `parseSpreadsheet(file)` — Lê arquivo XLSX usando SheetJS (já instalado), extrai colunas Artículo/Saldo/Precio
- `previewSync(fileData, options)` — Preview sem modificar banco, cruza SKUs com ProductVariant
- `executeSync(fileData, options)` — Atualiza em transação Prisma, cria EstoqueMovimento com tipo `ajuste_manual`
- Parse de SKU: split da string "Artículo" por " - " para extrair código numérico

### 2. UI Components
- `src/app/admin/estoque/sincronizar/page.tsx` — Página com auth guard
- `src/components/admin/estoque/StockSyncUpload.tsx` — Upload com drag-and-drop, checkboxes de opções, fluxo completo
- `src/components/admin/estoque/StockSyncPreview.tsx` — Tabela de preview com matched/rejected products

### 3. Navegação
- Link "Stock" adicionado no sidebar admin (seção Catálogo), ícone Package, roles: ADMIN

## Critérios de Aceite Verificados

- ✅ Tela existe em `/admin/estoque/sincronizar`
- ✅ Checkboxes para atualizar quantidade e/ou preço
- ✅ Preview antes de confirmar alterações
- ✅ Lista detalhada de produtos rejeitados (SKU não encontrado)
- ✅ Transação Prisma atualiza ProductVariant e cria EstoqueMovimento
- ✅ UI em espanhol paraguaio
- ✅ Lint passa sem erros
- ✅ TypeScript compila sem erros nos novos arquivos
