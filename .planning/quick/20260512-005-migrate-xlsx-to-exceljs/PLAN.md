---
slug: migrate-xlsx-to-exceljs
date: 2026-05-12
status: in-progress
---

# Quick Task: Migrar xlsx → exceljs

Remove `xlsx@0.18.5` (CVE-2024-22363 ReDoS + CVE-2023-30533 Prototype Pollution)
e substitui por `exceljs@4.4.0` em todos os usos do projeto.

Arquivos afetados:
- src/app/api/export/route.ts (escrita de xlsx + csv)
- src/lib/actions/estoque-sync.ts (leitura de planilha)
- src/components/admin/estoque/StockSyncUpload.tsx (valida .xls → apenas .xlsx)
