# Research Summary — NEXT-MONARCA v1.4 PDV e Ventas de Loja

**Synthesized from:** STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md
**Date:** 2026-05-08

---

## Stack Additions

**Zero new npm packages.** Tudo implementável com a stack existente.

Additions ao schema — **todos os 5 itens em UMA única migration:**

| Item | Tipo |
|------|------|
| `ClienteOrigem` | Novo enum (`LOJA`, `REVENDEDORA`) |
| `Moneda` | Novo enum (`PYG`, `USD`, `BRL`) |
| `venda_loja` | Novo valor em `EstoqueMovimentoTipo` |
| `CotizacionDia` | Novo model (colunas tipadas BRL/USD, insert-por-update para histórico) |
| `Cliente` | Novo model (`ruc String? @unique`, partial unique index em raw SQL) |
| `VentaLoja` | Novo model (snapshot imutável: `cotizacion_brl_pyg`, `cotizacion_usd_pyg`, `total_pyg`, campos reservados para factura) |
| `VentaLojaItem` | Novo model (`precio_unitario_pyg` snapshot imutável) |

Novo utilitário: `src/lib/currency.ts` — `formatCurrency(amount, moeda)` e `toPYG(amount, moeda, rates)`, TypeScript puro usando `Intl.NumberFormat`.

---

## Feature Table Stakes (10)

1. Busca de cliente por RUC antes da venda
2. Criação de cliente inline na tela do PDV
3. Busca e adição de produtos ao carrinho
4. Preço unitário editável por linha
5. Seletor de moeda (PYG / USD / BRL)
6. Total em PYG com cotação exibida em tempo real
7. Decremento de estoque na confirmação da venda
8. Tela de resumo antes de confirmar
9. Histórico de vendas com filtro por período
10. Página de configuração de cotação (`/admin/config/cotizacion`)

**Anti-features excluídos:** factura PDF, crédito/cuotas, desconto percentual, integração AVATI, impressão de recibo, câmbio automático BCP.

---

## Decisões Arquiteturais

**`criarVentaLoja` espelha `criarMaleta` / `conferirEFecharMaleta`:**
- Pré-ler estoque de todos os itens (fail fast fora da transaction)
- Pré-gerar `ventaId = crypto.randomUUID()`
- `$transaction([ventaLoja.create, ventaLojaItem.createMany, ...productVariant.update × N, ...estoqueMovimento.create × N])`
- Em falha: cascade delete via `onDelete: Cascade` em `VentaLojaItem`

**Cotização snapshot imutável em `VentaLoja`:** taxas lidas do DB na Server Action, escritas nas colunas na criação — nunca recalculadas.

**Lista unificada de clientes via two-query merge:** `getClientes` = `prisma.cliente.findMany()` + `prisma.vendaMaleta.findMany({ distinct: [...] })`, merge na action. Filtro por `origem` por branch.

**`CotizacionDia` insert-por-update** (não singleton upsert) — histórico preservado, `findFirst({ orderBy: created_at desc })` para a taxa corrente.

---

## Watch Out For

| Pitfall | Prevenção |
|---------|-----------|
| `$transaction(async tx => {})` QUEBRADO com PrismaPg | Usar sempre `$transaction([...ops])` array form |
| `venda_loja` não existe no enum — Prisma falha em runtime | Adicionar em `EstoqueMovimentoTipo` na primeira migration |
| Colunas de snapshot ausentes em `VentaLoja` | `cotizacion_brl_pyg`, `cotizacion_usd_pyg`, `total_pyg` desde o schema inicial |
| Sem row seed em `CotizacionDia` | `INSERT ... ON CONFLICT DO NOTHING` na migration |
| RUC paraguaio: sem hífen, check digit=0, base de 7 dígitos | Normalizar na escrita; check-digit inválido = warning, não blocker |
| Precisão: acumulação de float em conversão PYG | `Math.round(Number(price) * Number(rate))` por linha; somar inteiros |
| Cotização aceita do client payload | Sempre reler do DB dentro da Server Action |
| Double submit em rede lenta | Desabilitar botão na confirmação; UUID de idempotência com `UNIQUE` |

---

## Paraguay Factura — Referência para v1.5

**Formato RUC:** `^\d{1,8}-\d$` com check digit Modulo-11 SET.

**13 campos obrigatórios SET:** talonario, número de factura (sequencial), data de emissão, RUC/razão social/endereço do vendedor, RUC/CI/nome do comprador, condição de venda, descrição + qtd + preço unitário (em PYG), IVA (10%/5%/isento), total IVA, total geral (PYG).

`talonario`, `numero_factura`, `tipo_operacion` reservados como `String?` nullable em `VentaLoja` desde v1.4.

---

## Suggested Phase Order

**Phase 16: Foundation — Schema + Gestão de Clientes**
- Migration única: todos os 5 itens + constraint de estoque + seed de cotizacion
- `actions-clientes.ts`, `/admin/clientes`, nav wiring
- Entrega: CLI-01..05, VIS-01..02

**Phase 17: PDV Core — Cotización + Fluxo de Venda**
- `actions-pdv.ts` (`setCotizacion`, `criarVentaLoja`, `getCotizacion`)
- `/admin/config/cotizacion`, `/admin/pdv`
- Entrega: COT-01..02, PDV-01..06

**Phase 18: Histórico de Ventas**
- `getVentasLoja` com filtro de período, `/admin/ventas-loja`
- Reutiliza `DatePickerWithRange` do v1.3
- Entrega: VLJ-01..02

---

*Research completed: 2026-05-08*
