---
title: "Sincronização de Estoque via Upload de Planilha (CRM)"
mode: quick
tasks: 3
created: "2026-05-12"
must_haves:
  truths:
    - "xlsx (SheetJS) já está instalado no projeto"
    - "ProductVariant tem campos: sku, stock_quantity, price"
    - "EstoqueMovimento tem enum ajuste_manual já existente"
    - "Admin layout usa AdminLayoutClient com sidebar navegável"
  artifacts:
    - ".planning/quick/260512-001-sincronizacao-estoque-planilha/001-PLAN.md"
    - "src/app/admin/estoque/sincronizar/page.tsx"
    - "src/lib/actions/estoque-sync.ts"
    - "src/components/admin/estoque/StockSyncUpload.tsx"
    - "src/components/admin/estoque/StockSyncPreview.tsx"
  key_links:
    - "prisma/schema.prisma — ProductVariant, EstoqueMovimento models"
    - "src/components/admin/AdminLayoutClient.tsx — sidebar navigation"
---

# Quick Task 001: Sincronização de Estoque via Upload de Planilha

## Task 1: Server Action — Parse e Processamento da Planilha

**files:** `src/lib/actions/estoque-sync.ts`
**action:** Criar Server Actions para:
1. `parseSpreadsheet(file: File)` — Lê o arquivo XLSX no lado do servidor usando `xlsx`, extrai colunas "Artículo", "Saldo", "Precio". Parse do SKU: split da string "Artículo" por " - " e pegar o primeiro elemento (código numérico). Retorna array de `{sku, nome, saldo, precio}`.
2. `previewSync(file: File, options: { updateStock: boolean; updatePrice: boolean })` — Chama parseSpreadsheet, busca ProductVariant por SKU no banco, retorna `{ matched: [...], rejected: [...], stockUpdates: [...], priceUpdates: [...] }` sem modificar nada.
3. `executeSync(file: File, options: { updateStock: boolean; updatePrice: boolean })` — Executa a atualização em transação Prisma ($transaction): atualiza ProductVariant.stock_quantity e/ou ProductVariant.price, cria EstoqueMovimento com tipo `ajuste_manual` e motivo "Sincronização de Estoque via Planilha do CRM". Retorna `{ updated: number, rejected: [...], movements: number }`.

**verify:** 
- parseSpreadsheet retorna dados corretos para planilha de exemplo
- previewSync não modifica o banco
- executeSync atualiza ProductVariant e cria EstoqueMovimento em transação
- Produtos sem SKU no banco são ignorados e listados como rejeitados

**done:** Server action criada, tipada, com tratamento de erro e sanitização

---

## Task 2: UI — Página de Upload e Preview

**files:** 
- `src/app/admin/estoque/sincronizar/page.tsx`
- `src/components/admin/estoque/StockSyncUpload.tsx`
- `src/components/admin/estoque/StockSyncPreview.tsx`

**action:** Criar:
1. Página `/admin/estoque/sincronizar` com layout admin padrão
2. Componente `StockSyncUpload`: file input para XLSX, checkboxes "Actualizar Cantidad en Stock" e "Actualizar Precios", botão "Analizar"
3. Componente `StockSyncPreview`: tabela de produtos que serão atualizados (SKU, nome, estoque atual → novo, preço atual → novo), seção de produtos rejeitados com lista detalhada, botão "Confirmar Sincronización"
4. Fluxo: upload → preview → confirmação → resultado

**verify:**
- Página acessível em /admin/estoque/sincronizar
- Upload de arquivo XLSX funciona
- Checkboxes habilitam/desabilitam colunas no preview
- Preview mostra dados corretos de matched/rejected
- Confirmação executa a sync e mostra resultado
- UI em espanhol paraguaio

**done:** Página funcional com fluxo completo de upload → preview → confirmação

---

## Task 3: Navegação — Link no Sidebar Admin

**files:** `src/components/admin/AdminLayoutClient.tsx`
**action:** Adicionar entrada de navegação "Stock" ou "Inventario" no sidebar admin (seção Catálogo), com href `/admin/estoque/sincronizar`, ícone de Package/Boxes, roles: ["ADMIN"]

**verify:** Link aparece no sidebar para ADMIN, navega corretamente para /admin/estoque/sincronizar

**done:** Link adicionado e funcional
