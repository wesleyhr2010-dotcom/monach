---
slug: migrate-xlsx-to-exceljs
date: 2026-05-12
status: complete
commit: ddb44fe
---

# Summary: Migração xlsx → exceljs

## O que foi feito

- `xlsx@0.18.5` removido; `exceljs@4.4.0` instalado
- `src/app/api/export/route.ts` — geração de xlsx migrada para ExcelJS; CSV reescrito com builder inline (sem dependência extra)
- `src/lib/actions/estoque-sync.ts` — leitura de planilha migrada para `wb.xlsx.load()` do ExcelJS
- `src/components/admin/estoque/StockSyncUpload.tsx` — `accept=".xlsx,.xls"` → `accept=".xlsx"`; validação e label atualizados

## Por que não há versão patched no npm

`xlsx@0.18.5` é a última versão gratuita do SheetJS. Os fixes (0.19.3 e 0.20.2) existem apenas na distribuição Pro paga. A migração para ExcelJS é a única solução open source.

## CVEs corrigidos

| CVE | Tipo | CVSS | Fix |
|-----|------|------|-----|
| CVE-2024-22363 | ReDoS em múltiplas funções do parser | 7.5 High | removido xlsx |
| CVE-2023-30533 | Prototype Pollution ao ler arquivos | 5.3 Medium | removido xlsx |

## Nota sobre .xls

ExcelJS não suporta o formato binário `.xls` (Excel 97-2003). O suporte a `.xls` foi removido; `.xlsx` é o formato exigido. CRMs modernos exportam `.xlsx` por padrão.

## Commit

`ddb44fe` — `fix: replace xlsx with exceljs to remediate CVE-2024-22363 and CVE-2023-30533`
