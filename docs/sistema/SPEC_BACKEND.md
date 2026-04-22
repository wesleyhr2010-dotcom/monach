# SPEC — Backend: Server Actions & Lógica de Negócios

## Objetivo
Descrever as Server Actions centrais do NEXT-MONARCA (criação/fechamento de maleta, gamificação, comissões) incluindo transações de estoque, regras de comissão e integração com seeds.

## Atores
- **Server Actions** (`/src/app/admin/actions-*.ts`) — executam a lógica transacional.
- **Validadores Zod** — blindam payloads.
- **Prisma $transaction** — garante atomicidade (estoque + maleta).
- **Sistema de gamificação** — consumidor de `awardPoints`.

## Fluxo (principais actions)
1. `createMaleta` — verifica maleta ativa, reserva estoque com `SELECT FOR UPDATE`, cria `Maleta`.
2. `closeMaleta` — fecha maleta, devolve estoque, congela valores financeiros, dispara `awardPoints`.
3. `awardPoints` — valida saldo (se negativo) e grava em `PontosExtrato`.
4. `computeCommissionPct` — retorna percentual com base em `CommissionTier` e faturamento do mês.

## Regras de negócio
- Revendedora não pode ter mais de uma maleta `ativa`/`atrasada` simultaneamente.
- Estoque reservado só é liberado em `closeMaleta` (ou cancelamento).
- Comissão da colaboradora é **independente** e **adicional** à da revendedora, calculada sobre o mesmo `valor_total_vendido` usando `taxa_comissao` da colaboradora.
- Valores financeiros são congelados na maleta ao fechar.
- Tiers e regras de gamificação mudadas depois não retroagem a maletas já fechadas.

## Edge cases
- Saldo insuficiente em `awardPoints` negativo → retorna erro, não grava.
- Falha no lock de estoque → aborta transação, não cria maleta.
- Revendedora sem colaboradora → comissão da colaboradora = 0.
- Alteração de taxa durante maleta ativa → aplica só a novas maletas (a aberta usa valor do momento da criação).
- Concorrência: duas tentativas de criar maleta simultaneamente → lock da transação resolve.

## Dependências
- `SPEC_DATABASE.md` — modelos.
- `SPEC_ADMIN_MALETAS.md` / `SPEC_ADMIN_CONFERIR_MALETA.md` — consumidores.
- `SPEC_ADMIN_GAMIFICACAO.md` / `SPEC_PROGRESSO.md` — regras de pontos.
- `SPEC_ADMIN_CONFIG.md` — `CommissionTier`.
- `SPEC_ERROR_HANDLING.md` — padrão de erros.

---

## Detalhes técnicos / Referência

## Server Actions Core (Next.js `/src/app/admin`)

Toda a lógica transacional é validada e disparada via Server Actions utilizando tipagens do Schema Zod para blindar requisições malformadas.

---

## 1. `actions-maletas.ts`

### `createMaleta(input)`
Etapas:
1. Avalia se a revendedora já tem uma maleta com status `ativa` ou `atrasada` em aberto. Se sim, bloqueia e retorna erro.
2. Varre o array de itens solicitados (`product_variant_id[]`).
3. **[LOCK DE ESTOQUE]** Reserva o estoque via `SELECT FOR UPDATE` dentro da `$transaction` — ver seção 4 abaixo.
4. Instancia a `Maleta` com status `ativa`.

### `closeMaleta(maletaId, acerto: { itemId, qtdVendida }[])`
Etapas:
1. Para cada `MaletaItem`, registra `qtdVendida` com base no acerto informado. A `qtdDevolvida` = `qtd_enviada - qtdVendida`.
2. Devolve `qtdDevolvida` de volta ao `stock_quantity` da `ProductVariant`.
3. Congela os valores financeiros na `Maleta` (`valor_total_vendido`, `valor_comissao_revendedora`, `valor_comissao_colaboradora`) — ver seção 3 abaixo.
4. Dispara `awardPoints()` do módulo de gamificação.
5. Altera status da maleta para `concluida`.

---

## 2. `actions-gamificacao.ts`

### `awardPoints(resellerId, reason, amount)`
- Salva entrada em `PontosExtrato`. Amount positivo = ganho, negativo = resgate de prêmio.
- Antes de salvar negativo, verifica se `SUM(pontos) WHERE reseller_id = X >= |amount|`. Se não, retorna erro de saldo insuficiente.

### `computeCommissionPct(resellerId)`
- Ver seção 5 abaixo para especificação completa do período e cache.

---

## 3. Comissão da Colaboradora sobre Revendedoras

### Regra de Negócio
A Colaboradora (líder de equipe) recebe uma comissão sobre o valor total vendido pelas **revendedoras sob sua gestão** (`colaboradora_id`). Essa comissão é **independente** e **adicional** à comissão da revendedora — ambas são calculadas sobre o mesmo `valor_total_vendido` da maleta.

### Taxa aplicada
- A taxa da Colaboradora é definida no campo `taxa_comissao` do modelo `Reseller` (do perfil da própria Colaboradora), permitindo taxas individualizadas por líder.
- **Exemplo:** Revendedora vende Gs 1.500.000. A Colaboradora tem `taxa_comissao = 10%`. A Colaboradora recebe Gs 150.000, independentemente da comissão da revendedora.

### Cálculo no fechamento da maleta (`closeMaleta`)
```
valor_comissao_colaboradora = valor_total_vendido * (colaboradora.taxa_comissao / 100)
valor_comissao_revendedora  = valor_total_vendido * (revendedora.taxa_comissao / 100)
```

Ambos os valores são **congelados** (snapshot) nos campos da `Maleta` no momento do `closeMaleta`, garantindo histórico imutável mesmo que as taxas mudem no futuro.

### Fluxo de busca da Colaboradora na action
```ts
// Dentro de closeMaleta()
const revendedora = await prisma.reseller.findUnique({ where: { id: maleta.reseller_id } });
const colaboradora = revendedora.colaboradora_id
  ? await prisma.reseller.findUnique({ where: { id: revendedora.colaboradora_id } })
  : null;

const valorVendido = calcularTotalVendido(acerto);
const comissaoRevendedora = valorVendido * (revendedora.taxa_comissao / 100);
const comissaoColaboradora = colaboradora
  ? valorVendido * (colaboradora.taxa_comissao / 100)
  : 0;
```

### Relatório da Colaboradora (`/admin/equipe`)
A Colaboradora pode ver, por período, o somatório de `valor_comissao_colaboradora` de todas as maletas de suas revendedoras. Esse dado é lido direto das maletas já fechadas (`status = concluida`), **sem recalcular** — os valores já estão congelados.

---

## 4. Mecanismo de Lock de Estoque (Race Condition)

### Problema
Se duas Colaboradoras criarem maletas simultaneamente para o mesmo `ProductVariant`, uma transação Prisma simples não garante exclusividade — ambas podem ler o mesmo `stock_quantity` antes de qualquer uma decrementar, resultando em estoque negativo.

### Solução: `SELECT FOR UPDATE` via SQL Raw no Prisma

Dentro da `$transaction`, antes de decrementar o estoque, executa-se um lock pessimista no nível da linha do banco de dados (PostgreSQL/Supabase):

```ts
// Dentro de prisma.$transaction(async (tx) => { ... })

// 1. Busca e TRAVA as linhas de variante atomicamente
const variants = await tx.$queryRaw<ProductVariant[]>`
  SELECT id, stock_quantity
  FROM product_variants
  WHERE id = ANY(${variantIds}::uuid[])
  FOR UPDATE
`;

// 2. Verifica estoque com os dados do lock
for (const item of requestedItems) {
  const variant = variants.find(v => v.id === item.product_variant_id);
  if (!variant || variant.stock_quantity < item.quantidade) {
    throw new Error(`Estoque insuficiente para variante ${item.product_variant_id}`);
  }
}

// 3. Decrementa (em sequência, ainda na mesma transaction)
for (const item of requestedItems) {
  await tx.productVariant.update({
    where: { id: item.product_variant_id },
    data: { stock_quantity: { decrement: item.quantidade } },
  });
}

// 4. Cria a Maleta e MaletaItens
// ...
```

### Comportamento
- A segunda requisição concorrente ficará **bloqueada** na linha do `FOR UPDATE` até a primeira transaction confirmar ou cancelar (commit/rollback).
- Se a primeira transaction consumir o estoque restante, a segunda receberá o saldo correto (zero ou insuficiente) e lançará o erro de rollback adequado.
- O Postgres garante que **nenhuma maleta será criada com estoque negativo**.

### Timeout
- Definir `statement_timeout = 5000ms` na conexão para evitar deadlocks eternos. Se o lock não for obtido em 5s, a transaction falha com erro legível para o usuário.

---

## 5. CommissionTier — Período de Referência e Cache

### Período de Referência: Mês Civil
O cálculo de comissão usa o **mês civil corrente** como janela:

- **Início do período:** Primeiro dia do mês corrente, às 00:00:00 (timezone: America/Asuncion)
- **Fim do período:** Último dia do mês corrente, às 23:59:59 (timezone: America/Asuncion)
- **Reset:** Automaticamente, na virada de mês. Não há acúmulo entre meses — cada mês é uma competição nova.

```ts
// Utilitário: gerar janela do mês atual
function getMonthWindow() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
  const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return { start, end };
}
```

### Cálculo do tier
A função `computeCommissionPct(resellerId)` soma o `valor_total_vendido` de todas as maletas com `status = concluida` da revendedora dentro da janela do mês:

```ts
const { start, end } = getMonthWindow();

const resultado = await prisma.maleta.aggregate({
  where: {
    reseller_id: resellerId,
    status: 'concluida',
    updated_at: { gte: start, lte: end },
  },
  _sum: { valor_total_vendido: true },
});

const totalVendido = resultado._sum.valor_total_vendido ?? 0;

// Busca o tier mais alto que o total vendido alcança (ordem decrescente)
const tier = await prisma.commissionTier.findFirst({
  where: { min_sales_value: { lte: totalVendido } },
  orderBy: { min_sales_value: 'desc' },
});

return tier?.commission_pct ?? taxa_base_revendedora;
```

### Invalidação do cache (Next.js `cache()`)
O resultado de `computeCommissionPct` pode ser cacheado por sessão usando `unstable_cache` do Next.js com as seguintes regras:

| Evento | Ação |
|--------|------|
| Fechamento de maleta (`closeMaleta`) | `revalidateTag('commission-{resellerId}')` |
| Virada de mês (cron job) | Não precisa — o cache já expira pois a janela de data muda |
| Mudança manual de `taxa_comissao` pela admin | `revalidateTag('commission-{resellerId}')` |

```ts
// Wrapping com cache tag (src/app/app/actions-revendedora.ts)
export const getCommissionPct = unstable_cache(
  (resellerId: string) => computeCommissionPct(resellerId),
  ['commission'],
  { tags: [`commission-${resellerId}`], revalidate: 3600 } // max 1h stale
);
```

---

## 6. Testes Automatizados (Vitest)

Cobertura obrigatória para as unidades críticas:

| Módulo | Casos de teste |
|--------|---------------|
| `math.commissions` | Tier com 0 vendas, tier em exato no limite, tier entre faixas, mês sem maleta fechada |
| `math.closeMaleta` | Comissão da revendedora, comissão da colaboradora, revendedora sem colaboradora (comissão = 0) |
| `zod.maleta_schema` | Payload válido, produto sem estoque, revendedora com maleta ativa já existente |
| `lock.createMaleta` | Simular duas transactions concorrentes (usar `pg` client de teste) |
