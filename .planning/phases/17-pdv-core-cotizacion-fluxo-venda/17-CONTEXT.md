# Phase 17: PDV Core — Cotização + Fluxo de Venda — Context

**Gathered:** 2026-05-08
**Status:** Ready for planning
**Source:** Discussion with user + ROADMAP.md + research/SUMMARY.md

<domain>
## Phase Boundary

Esta fase entrega: (1) configuração de cotação do dia BRL→PYG / USD→PYG em `/admin/config/cotizacion`; (2) fluxo completo de venda de loja no PDV em `/admin/pdv` — identificação de cliente por RUC, adição de produtos (busca + navegação), seleção de moeda, total convertido em PYG, confirmação com snapshot imutável de cotização e decremento de estoque.

Escopo: `src/app/admin/actions-cotizacion.ts`, `src/app/admin/actions-pdv.ts`, `src/app/admin/config/cotizacion/`, `src/app/admin/pdv/`.
</domain>

<decisions>
## Decisions

### Locked — Decidido com o usuário (2026-05-08)

- **D-17-PDV-01**: **Cliente no PDV é opcional.** Admin pode confirmar venda sem identificar cliente (RUC nulo). Quando sem cliente, histórico exibe "Consumidor Final". Se admin digitar RUC e não encontrar, aparece mini-form inline (nome, cidade, telefone) para criar o cliente sem sair do PDV.

- **D-17-PDV-02**: **Adicionar produtos: busca por nome + navegação por categoria.** Duas formas de adicionar itens ao carrinho: (a) campo de busca por nome/código com sugestões; (b) navegação por categoria. PDV exibe estoque disponível de cada produto (quantity - reservas em maletas ativas).

- **D-17-PDV-03**: **Bloquear estoque ao adicionar ao carrinho.** Se quantidade solicitada > estoque disponível, o item NÃO é adicionado — erro imediato na tela. A Server Action `criarVentaLoja` valida novamente no servidor como segunda linha de defesa (fail fast fora da transaction), mas o bloqueio principal é no client.

- **D-17-PDV-04**: **Pós-confirmação: splash de sucesso + PDV limpo.** Após venda confirmada, exibe tela de sucesso com resumo (cliente/consumidor, total em moeda e PYG, quantidade de itens). Botão "Nueva Venta" limpa o PDV para próxima venda. Mesmo padrão da devolução no PWA.

### Locked — Herdados de fases anteriores

- **D-17-02** (STATE.md): `criarVentaLoja` espelha `criarMaleta` — pré-leitura de estoque fora da transaction, `$transaction([...ops])` array form, snapshot imutável de cotização nas colunas na criação.
- **D-17-03** (STATE.md): Cotização SEMPRE relida do DB dentro da Server Action — nunca aceitar do payload do cliente.
- **D-17-04** (STATE.md): Precisão monetária — `Math.round(Number(price) * Number(rate))` por linha; somar inteiros.
- **D-17-01** (STATE.md): `CotizacionDia` insert-por-update (não singleton upsert) — `findFirst({ orderBy: { createdAt: "desc" } })` para taxa corrente.
- **D-15-01** (v1.3): Paper MCP consultado antes de implementar cada tela nova.
- **D-15-02** (v1.3): Tokens `--admin-*` obrigatórios — zero hex/px hardcoded no JSX.

### Agent's Discretion

- Componente de busca de produto: reutilizar padrão existente de `maleta/nova` (select com combobox) ou criar componente dedicado ao PDV.
- Layout do carrinho no PDV: tabela simples de itens ou cards de produto.
- Formato de exibição do estoque: número puro ("12 unidades") ou com badge de alerta quando baixo (ex.: < 5).
- Formato da linha de cotização no PDV: "1 USD = 7.800 PYG · Atualizado 08/05 14:30" ou similar.
- Tratamento de cotização não configurada (primeira vez): mensagem de aviso ou bloquear PDV até configurar?
</decisions>

<canonical_refs>
## Canonical References

### Padrão de transação existente
- `src/app/admin/actions-maletas.ts` — `criarMaleta` (linha ~152) e `conferirEFecharMaleta` (linha ~457): padrão de pré-leitura de estoque + `$transaction([...ops])` array form com compensação em falha. COPIAR este padrão em `criarVentaLoja`.

### Componentes admin reutilizáveis
- `src/components/admin/AdminPageHeader.tsx` — header padrão de páginas admin
- `src/components/admin/AdminEmptyState.tsx` — empty state para lista de produtos no carrinho
- `src/components/admin/AdminStatusBadge.tsx` — badges de status

### Config pages existentes (padrão visual)
- `src/app/admin/config/comissoes/` — CRUD de tiers, mesmo padrão para cotizacion
- `src/app/admin/config/niveis/` — outra referência de config CRUD

### Analytics (DatePickerWithRange)
- `src/app/admin/analytics/page.tsx` — uso do DatePickerWithRange do v1.3 (reutilizar em fase 18)

### Design system
- `docs/design-system/tokens.md` — tokens CSS do projeto
- `CLAUDE.md` §3.1 — Paper-first, modular, design system primeiro
- `CLAUDE.md` §3.3 — Performance (getCurrentUser cached)
</canonical_refs>

<code_context>
## Code Context — Reusable Assets

### Padrão de Server Action existente
```typescript
// Copiar de actions-maletas.ts:criarMaleta
export async function criarVentaLoja(data: CriarVentaLojaInput): Promise<ActionResult<VentaLoja>> {
  const user = await requireAuth(["ADMIN"]);
  // 1. Pré-ler estoque (fail fast fora da transaction)
  // 2. Pré-gerar id com crypto.randomUUID()
  // 3. $transaction([...ops]) array form
  // Em falha: cascade delete via onDelete: Cascade
}
```

### Padrão de cotizacion insert-por-update
```typescript
// Nova linha a cada atualização, não upsert
await prisma.cotizacionDia.create({ data: { brlToPyg, usdToPyg, createdBy: user.profileId } })
// Leitura: findFirst({ orderBy: { createdAt: 'desc' } })
```

### Precisão monetária
```typescript
// POR LINHA (não acumular float)
const subtotalPyg = Math.round(Number(precioUnitario) * Number(cotizacion.brlToPyg));
// Somar inteiros
const totalPyg = items.reduce((acc, item) => acc + item.subtotalPyg, 0);
```

### Componentes disponíveis para reutilização
- `AdminPageHeader` — título + breadcrumb padrão
- `AdminEmptyState` — carrinho vazio no PDV
- `AdminFilterBar` — filtros (pode ser usado para busca de produto)
</code_context>

<specifics>
## Specific Behaviors

### Fluxo do PDV (passo a passo)
1. Admin abre `/admin/pdv`
2. Campo de RUC (opcional): digita RUC → busca → seleciona cliente existente ou preenche mini-form inline para criar
3. Adiciona produtos: busca por nome OU navega por categoria → seleciona quantidade → estoque exibido → bloquear se insuficiente
4. Seleciona moeda (Guaraní / Dólar / Real)
5. Vê total em PYG com cotação do dia exibida (data/hora da última atualização)
6. Tela de resumo — lista de itens, total, cliente, moeda
7. Confirma → `criarVentaLoja` executada → splash de sucesso
8. Botão "Nueva Venta" → PDV limpo para próxima venda

### Tratamento de "Consumidor Final"
- `clienteId: null` em `VentaLoja` quando sem RUC
- Histórico exibe "Consumidor Final" no lugar do nome
- Campos reservados de factura (`talonario`, `numero_factura`, `tipo_operacion`) permanecem `null`

### Estoque disponível no PDV
- Estoque disponível = `product.quantity` (stock total) − `sum(maletaItem.quantidade_enviada - maletaItem.quantidade_vendida - maletaItem.quantidade_devolvida)` onde maleta está em status `ativa` ou `atrasada`
- Exibir número junto ao produto na busca/navegação
- Bloquear adição se `quantidade_solicitada > estoque_disponivel`
</specifics>

<deferred>
## Deferred Ideas

- Impressão de recibo / envio por WhatsApp após confirmação — v1.5 (junto com factura)
- Desconto percentual por venda — v1.5 CRM
- Venda a crédito/cuotas — v1.5 CRM
- Busca por código de barras — v1.5
</deferred>

---

*Phase: 17-pdv-core-cotizacion-fluxo-venda*
*Context gathered: 2026-05-08 via user discussion*
