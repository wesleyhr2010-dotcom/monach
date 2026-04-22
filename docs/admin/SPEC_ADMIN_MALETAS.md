# SPEC — Admin: Gestão de Maletas

## Objetivo
Permitir que admin/consultora crie, acompanhe e finalize maletas (consignações) de revendedoras, incluindo a conferência física do retorno e baixa de estoque.

## Atores
- **SUPER_ADMIN** — todas as maletas.
- **CONSULTORA** — maletas do seu grupo.
- **Revendedora** — recebe a maleta e envia acerto (`SPEC_DEVOLUCAO.md`).

## Fluxo
1. Admin acessa `/admin/maletas` com filtros por status, consultora, período.
2. "Nova Maleta" → multi-step: escolhe revendedora, produtos, quantidades, preços, prazo.
3. Ao criar, estoque é reservado e maleta entra em `ativa`.
4. Revendedora recebe maleta física e inicia acerto quando terminar.
5. Maleta em `aguardando_revisao` aparece destacada na lista.
6. Admin em `/admin/maletas/[id]/conferir` confirma recepção física, faz baixa no estoque e calcula comissões → `concluida`.

## Regras de negócio
- Filtros: status (Ativa, Atrasada, Aguardando Conferência, Concluída), consultora (SUPER_ADMIN), período.
- `aguardando_revisao` tem destaque amarelo; `atrasada` destaque vermelho.
- Preço dos itens é **congelado** no momento da criação (`preco_fixado`).
- Estoque só é movimentado em 2 pontos: reserva na criação, baixa na conferência.
- Conferência exige verificação física do admin antes do status `concluida`.
- Comissões da revendedora e consultora calculadas ao concluir.

## Edge cases
- Estoque insuficiente na criação → bloqueia o passo.
- Maleta vencida sem acerto → vira `atrasada` automaticamente via cron.
- Divergência entre acerto da revendedora e conferência física → admin pode ajustar antes de concluir.
- Maleta cancelada antes de enviar → devolve estoque reservado.
- Revendedora desativada com maleta ativa → permite conclusão normal.

## Dependências
- `SPEC_ADMIN_CONFERIR_MALETA.md` — tela de conferência detalhada.
- `SPEC_MALETA.md` — visão da revendedora.
- `SPEC_DEVOLUCAO.md` — fluxo de acerto.
- `SPEC_CRON_JOBS.md` — transição automática para `atrasada`.
- `SPEC_DATABASE.md` — `Maleta`, `MaletaItem`, `VendaMaleta`.

---

## Detalhes técnicos / Referência

**Rotas:**
- `/admin/maletas` — Lista de maletas
- `/admin/maletas/nova` — Criar nova maleta
- `/admin/maletas/[id]` — Detalhe e gestão de uma maleta
- `/admin/maletas/[id]/conferir` — ⭐ Confirmar recebimento físico + baixa no estoque

---

## Tela 1: Lista de Maletas `/admin/maletas`

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Maletas                                   [+ Nova Maleta]   │
│                                                              │
│  [🔍 Buscar revendedora...]  [Status ▼]  [Consultora ▼]    │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ #  │ Revendedora  │ Consultora │ Status    │ Prazo   │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │102 │ Ana Silva    │ Maria F.   │[ATRASADA] │15/12/24 │   │
│  │    │                          │           │[Ver →]  │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │101 │ Joana Lima   │ Sofia G.   │[ATIVA]    │20/12/24 │   │
│  │    │                          │           │[Ver →]  │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │099 │ Maria Góm.   │ Maria F.   │[EM ACERTO]│10/12/24 │   │
│  │    │                          │           │[Ver →]  │   │
│  └──────────────────────────────────────────────────────┘   │
│  Mostrando 1-20 de 87 maletas              [< 1 2 3 4 5 >]  │
└─────────────────────────────────────────────────────────────┘
```

### Filtros
| Filtro | Opções |
|--------|--------|
| Status | Todas / Ativa / Atrasada / **Aguardando Conferência** / Concluída |
| Consultora | Dropdown de consultoras (só SUPER_ADMIN) |
| Periodo | Mês corrente / Últimos 30 dias / Personalizado |

### Badge de Atenção na Lista
```
#102  Ana Silva  [⏳ AGUARDANDO CONFERÊNCIA]  ← destaque amarelo
#099  Maria Góm. [⛔ ATRASADA — 3 dias]       ← destaque vermelho
```

A coluna de status mostra `aguardando_revisao` como **"⏳ Ag. Conferência"** em amarelo — sinaliza que a maleta fisicamente está a caminho.

### RBAC
- **SUPER_ADMIN**: vê maletas de todas as consultoras
- **CONSULTORA**: vê apenas maletas do seu grupo automaticamente

---

## Tela 2: Criar Nova Maleta `/admin/maletas/nova`

### Layout — Formulário Multi-Step

```
Passo 1 ──── Passo 2 ──── Passo 3
Revendedora  Produtos     Revisão

── PASSO 1: SELECIONAR REVENDEDORA ────────────────────
┌─────────────────────────────────────────────────────┐
│  Selecionar Revendedora                             │
│                                                     │
│  [🔍 Buscar revendedora...]                         │
│                                                     │
│  ┌─── Ana Silva ─── 25% de comissão ──────────┐    │
│  │  Consultora: Maria Flores                   │    │
│  │  Rank: Prata ⭐ 2.100 pts                   │    │
│  │  Última maleta: 10 Nov 2024 (devolvida ✅)  │    │
│  │  [Selecionar]                               │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  Data de vencimento: [__/__/____]                   │
│                                                     │
│  [Próximo: Selecionar Produtos →]                   │
└─────────────────────────────────────────────────────┘

── PASSO 2: SELECIONAR PRODUTOS ───────────────────────
┌─────────────────────────────────────────────────────┐
│  Adicionar Produtos à Maleta              [🔍 Buscar]│
│                                                     │
│  Categorias: [Todos] [Anéis] [Brincos] [Colares]   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ [img] Gargantilha G$1.250  Estoque: 8       │   │
│  │ Qtd: [─] [1] [+]                            │   │
│  └─────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────┐   │
│  │ [img] Ring Ouro   G$890    Estoque: 3       │   │
│  │ Qtd: [─] [2] [+]                            │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  Itens selecionados: 3  │  Total: G$ 3.030          │
│  [← Voltar]   [Próximo: Revisar →]                  │
└─────────────────────────────────────────────────────┘

── PASSO 3: REVISÃO E CONFIRMAÇÃO ─────────────────────
┌─────────────────────────────────────────────────────┐
│  Revisar Maleta                                     │
│                                                     │
│  Revendedora:  Ana Silva (25% comissão)             │
│  Consultora:   Maria Flores (10% comissão)          │
│  Vencimento:   20 Dezembro 2024                     │
│                                                     │
│  Produtos:                                          │
│  Gargantilha   x1   G$ 1.250                        │
│  Ring Ouro     x2   G$ 1.780                        │
│  ─────────────────────────────────────              │
│  Total da maleta: G$ 3.030                          │
│                                                     │
│  ⚠️ O estoque será reservado imediatamente          │
│                                                     │
│  [← Voltar]   [✅ Criar Maleta]                     │
└─────────────────────────────────────────────────────┘
```

### Regras de Negócio
1. Só é possível criar maleta para revendedora **sem** maleta ativa
2. Não é possível selecionar produtos com `estoque = 0`
3. Validação no servidor: `quantidade_selecionada <= estoque_disponivel`
4. O estoque é decrementado atomicamente com `SELECT FOR UPDATE` (ver `SPEC_BACKEND.md §4`)
5. Ao criar, gera push notification para a revendedora: "Nova maleta disponível! 📦"
6. CONSULTORA só vê suas próprias revendedoras no passo 1

### Server Action: `createMaleta(input)`

```ts
async function createMaleta(input: {
  reseller_id: string;
  ends_at: Date;
  itens: { product_variant_id: string; quantidade: number }[];
}) {
  return await prisma.$transaction(async (tx) => {
    // 1. Validar ownership (consultora só pode criar para sua revendedora)
    // 2. Verificar que revendedora não tem maleta ativa
    // 3. SELECT FOR UPDATE nos product_variants para lock de estoque
    // 4. Validar estoque disponível para cada item
    // 5. Decrementar estoque (reserva)
    // 6. Criar Maleta + MaletaItem com preco_fixado snapshot
    // 7. Disparar push notification para a revendedora
  });
}
```

---

## Tela 3: Detalhe da Maleta `/admin/maletas/[id]`

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  ← Maleta #102 — Ana Silva                  [ATRASADA 3d]   │
│                                                              │
│  ┌──────────────────────┐  ┌───────────────────────────┐   │
│  │ Revendedora          │  │ Prazos                     │   │
│  │ Ana Silva            │  │ Início: 01 Nov 2024        │   │
│  │ WhatsApp: [💬]       │  │ Vence: 15 Dez 2024         │   │
│  │ Comissão: 25%        │  │ Status: ⛔ Atrasada        │   │
│  │ Consultora: Maria F. │  └───────────────────────────┘   │
│  └──────────────────────┘                                    │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Resumo Financeiro                                    │   │
│  │ Total enviado:  G$ 12.500   │  Vendido: G$ 8.050    │   │
│  │ Comissão Rev.:  G$ 2.012   │  Retorno: G$ 4.450     │   │
│  │ Comissão Col.:  G$ 805     │                        │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Itens (12)                                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ [img] Gargantilha  G$1.250  Qtd:3  Vendido:2  [Parc]│   │
│  │ [img] Brincos      G$800    Qtd:5  Vendido:5  [✅]  │   │
│  │ [img] Ring Ouro    G$1.780  Qtd:2  Vendido:0  [Disp]│   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  [📲 Contatar Ana]   [Fechar Maleta Manualmente]            │
└─────────────────────────────────────────────────────────────┘
```

### Botão "Fechar Maleta Manualmente"
- Visível apenas se não houver `AcertoRevendedora` pendente
- Usado quando o acerto é feito pessoalmente (sem submissão pelo app)
- Abre modal para informar quais itens foram vendidos
- Chama `closeMaleta()` diretamente

### Abas da Maleta
| Aba | Conteúdo |
|-----|---------|
| Itens | Lista completa com status por item |
| Acerto | Se existe `AcertoRevendedora`, mostra o que a revendedora declarou |
| Histórico | Timeline: criação, vendas registradas, acerto, fechamento |

---

## Tela 4: Confirmar Recebimento `/admin/maletas/[id]/conferir`

Acessível apenas quando `maleta.status = 'aguardando_revisao'`.

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  ← Conferir Maleta #102 — Ana Silva     [⏳ Ag. Conferência]│
│                                                              │
│  Revendedora declarou:                                      │
│  ✅ Vendidos (8 itens)   G$ 12.500                          │
│  ↩ Retorno (4 itens)    G$ 4.200                           │
│                                                              │
│  ── Comprovante de Devolução ───────────────────────────── │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  [📸 Ver foto do comprovante]                        │   │  ← abre em lightbox
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ── Conferir Itens Recebidos ────────────────────────────── │
│  Confirme o que REALMENTE chegou de volta:                  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Gargantilha (devolver 1 un.)  Qtd recebida: [─][1][+]│   │
│  │ Ring Ouro   (devolver 2 un.)  Qtd recebida: [─][2][+]│   │
│  │ Brincos     (devolver 1 un.)  Qtd recebida: [─][0][+]│   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Observação (opcional):                                     │
│  [item danificado, não repor estoque __________________]    │
│                                                              │
│  [📲 Contatar Ana]   [✅ Confirmar Recebimento]             │
└─────────────────────────────────────────────────────────────┘
```

### Lógica de Conferência

- O admin/consultora pode ajustar a quantidade recebida de volta por item
- Se a quantidade recebida < quantidade_enviada_para_retorno → diferença fica como "perda" com observação
- Somente os itens **efetivamente recebidos** têm o estoque restaurado

### Server Action: `confirmarRecebimento(input)`

```ts
async function confirmarRecebimento(input: {
  maleta_id: string;
  itens_recebidos: { maleta_item_id: string; qtd_recebida: number }[];
  observacao?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const maleta = await tx.maleta.findUniqueOrThrow({
      where: { id: input.maleta_id },
      include: { itens: { include: { product_variant: true } } },
    });

    // 1. Para cada item com retorno confirmado → restaurar estoque
    for (const item of input.itens_recebidos) {
      if (item.qtd_recebida > 0) {
        await tx.productVariant.update({
          where: { id: item.maleta_item_id }, // via join
          data: { stock_quantity: { increment: item.qtd_recebida } },
        });

        // Registrar no histórico de estoque
        await tx.estoqueMovimento.create({
          data: {
            product_variant_id: /* resolver via maleta_item */,
            quantidade: item.qtd_recebida,
            tipo: 'devolucao_maleta',
            motivo: `Retorno Maleta #${maleta.numero} — ${input.observacao ?? ''}`,
          },
        });
      }
    }

    // 2. Calcular valores finais e congelar na maleta
    const total_vendido     = calcTotalVendido(maleta.itens);
    const comissao_rev      = total_vendido * (maleta.reseller.taxa_comissao / 100);
    const taxa_colab        = maleta.reseller.colaboradora?.taxa_comissao ?? 0;
    const comissao_colab    = total_vendido * (taxa_colab / 100);

    // 3. Fechar a maleta
    await tx.maleta.update({
      where: { id: input.maleta_id },
      data: {
        status: 'concluida',
        valor_total_vendido: total_vendido,
        valor_comissao_revendedora: comissao_rev,
        valor_comissao_colaboradora: comissao_colab,
      },
    });

    // 4. Gamificação (só agora porque é a confirmação real)
    if (new Date() <= maleta.data_limite) {
      await awardPoints(maleta.reseller_id, 'devolucao_prazo');  // +30 pts
    }
    const pct_vendido = calcPctVendido(maleta.itens);
    if (pct_vendido === 1.0) {
      await awardPoints(maleta.reseller_id, 'maleta_completa');  // +200 pts
    }

    // 5. Notificar revendedora
    await enviarPushParaReseller(
      maleta.reseller.auth_user_id!,
      '✅ Sua maleta foi conferida e encerrada! Fale com sua consultora sobre o pagamento.'
    );
  });
}
```

### O que acontece com os itens perdidos/danificados

Se `qtd_recebida < qtd_esperada_retorno`, a diferença é considerada perda:
- **Não** restaura estoque dessa quantidade
- **Não** desconta da comissão da revendedora (decisão da loja — fora do escopo técnico)
- Fica registrado na `observacao` para controle manual

---

## Schema: Número Sequencial da Maleta

```prisma
model Maleta {
  // ...campos existentes
  numero Int @default(autoincrement()) // Para exibir como "#102"
}
```

---

## Componentes

| Componente | Tipo | Responsabilidade |
|-----------|------|-----------------|
| `MaletasPage` | Server | Lista paginada com filtros + badge ag. conferência |
| `MaletaFiltros` | **Client** | Dropdowns de filtro |
| `NovaMaletaPage` | **Client** | Multi-step form |
| `RevendedoraSelectorStep` | **Client** | Busca + seleção de revendedora |
| `ProdutosSelectorStep` | **Client** | Grid de produtos com quantidades |
| `RevisaoStep` | Server | Resumo final antes de criar |
| `MaletaDetalhePage` | Server | Dashboard da maleta |
| `ConferirMaletaPage` | **Client** | Ajuste de qtd recebida + confirmar |
| `ComprovanteViewer` | **Client** | Lightbox da foto do comprovante |
