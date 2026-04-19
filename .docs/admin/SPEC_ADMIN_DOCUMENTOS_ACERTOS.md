# SPEC — Admin: Aprovação de Documentos e Gestão de Acertos

**Rotas (admin):**
- `/admin/revendedoras` — Lista de revendedoras
- `/admin/revendedoras/[id]/documentos` — Aprovar/rejeitar CI
- `/admin/maletas/[id]/acerto` — Confirmar acerto enviado pela revendedora
- `/admin/brindes` — Gerenciar catálogo de brindes + solicitações

---

## Tela 1: Lista de Revendedoras `/admin/revendedoras`

### Layout

```
┌─────────────────────────────────────────────────────┐
│  Revendedoras                    [+ Nova Revendedora] │
│                                                      │
│  [🔍 Buscar por nome ou WhatsApp...]   [Filtros ▼]  │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │ Ana Silva     WhatsApp  Rank: Prata   [Ver →] │   │
│  │ ⚠️ Doc pendente                               │   │
│  └──────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────┐   │
│  │ Maria Gómez   WhatsApp  Rank: Bronze  [Ver →] │   │
│  │ ✅ Doc aprovado                               │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### Indicadores de Atenção
- `⚠️ Doc pendente` — há `ResellerDocumento` com `status = 'em_analise'`
- `⏰ Acerto aguardando` — há `AcertoRevendedora` com `status = 'pendente'`
- `✅ OK` — tudo em dia

---

## Tela 2: Aprovação de Documentos `/admin/revendedoras/[id]/documentos`

### Layout

```
┌─────────────────────────────────────────────────────┐
│  ← Ana Silva — Documentos                           │
│                                                      │
│  Identidade (CI)                                    │
│  ┌─────────────────────────────────────────────┐   │
│  │ [Preview da imagem enviada]                  │   │
│  │                                              │   │
│  │ Enviado em: 15 Dez 2024                     │   │
│  │ Status atual: ⏳ Em Análise                  │   │
│  │                                              │   │
│  │ Observação (opcional):                       │   │
│  │ [__________________________________]         │   │
│  │                                              │   │
│  │ [✅ Aprovar]     [❌ Rejeitar]               │   │
│  └─────────────────────────────────────────────┘   │
│                                                      │
│  Histórico                                          │
│  ─── 15 Dez 2024: CI enviado (pendente)            │
│  ─── 10 Nov 2024: CI rejeitado — "Imagem borrada"  │
└─────────────────────────────────────────────────────┘
```

### Server Action: `aprovarDocumento(documentoId)`

```ts
async function aprovarDocumento(documentoId: string) {
  await prisma.resellerDocumento.update({
    where: { id: documentoId },
    data: { status: 'aprovado', observacao: '' },
  });

  // Notificar revendedora
  const doc = await prisma.resellerDocumento.findUnique({
    where: { id: documentoId },
    include: { reseller: true },
  });
  await enviarPushParaRevendedora(
    doc.reseller.user_id,
    '✅ Seu documento foi aprovado! Seu cadastro está completo.'
  );
}
```

### Server Action: `rejeitarDocumento(documentoId, observacao)`

```ts
async function rejeitarDocumento(documentoId: string, observacao: string) {
  if (!observacao.trim()) throw new Error('Observação obrigatória ao rejeitar');

  await prisma.resellerDocumento.update({
    where: { id: documentoId },
    data: { status: 'rejeitado', observacao },
  });

  // Notificar revendedora com o motivo
  await enviarPushParaRevendedora(
    resellerId,
    `❌ Documento rejeitado: ${observacao}. Por favor, envie novamente.`
  );
}
```

---

## Tela 3: Confirmar Acerto `/admin/maletas/[id]/acerto`

Quando a revendedora submete o acerto, o admin valida e fecha a maleta.

### Layout

```
┌─────────────────────────────────────────────────────┐
│  ← Maleta #102 — Acerto Enviado por Ana Silva       │
│                                                      │
│  Submetido em: 15 Dez 2024 às 14:32                │
│                                                      │
│  ── Itens confirmados como VENDIDOS pela Ana ──     │
│  ┌────────────────────────────────────────────┐    │
│  │ ✅ Gargantilha Dourada   G$ 1.250           │    │
│  │ ✅ Brincos Argola        G$ 800             │    │
│  └────────────────────────────────────────────┘    │
│                                                      │
│  ── Itens para RETORNO ───────────────────────      │
│  ┌────────────────────────────────────────────┐    │
│  │ ↩ Ring Ouro Rosé        G$ 1.250           │    │
│  └────────────────────────────────────────────┘    │
│                                                      │
│  ── Resumo Financeiro ────────────────────────      │
│  Total vendido:   G$ 2.050                          │
│  Comissão Ana (25%): G$ 512                         │
│  A receber pela loja: G$ 1.538                      │
│                                                      │
│  [Editar itens]   [✅ Confirmar e Fechar Maleta]    │
└─────────────────────────────────────────────────────┘
```

### Fluxo de Confirmação

```ts
async function confirmarAcerto(acertoId: string) {
  const acerto = await prisma.acertoRevendedora.findUniqueOrThrow({
    where: { id: acertoId },
    include: { maleta: { include: { itens: true } } },
  });

  // Chamar closeMaleta com os IDs confirmados
  await closeMaleta(acerto.maleta_id, acerto.itens_vendidos_ids);

  // Atualizar acerto
  await prisma.acertoRevendedora.update({
    where: { id: acertoId },
    data: { status: 'confirmado' },
  });

  // Notificar revendedora
  await enviarPushParaRevendedora(
    acerto.maleta.reseller_id,
    '💰 Seu acerto foi confirmado! Fale com sua consultora sobre o pagamento.'
  );
}
```

---

## Tela 4: Gerenciar Brindes `/admin/brindes`

### Layout

```
┌──────────────────────────────────────────────────────┐
│  Brindes                              [+ Novo Brinde] │
│                                                       │
│  ── Solicitações Pendentes (3) ───────────────────── │
│  Ana Silva   → Nécessaire Gold    ⭐ 500   [Entregar] │
│  Maria Góm   → Kit Premium       ⭐ 1.000  [Entregar] │
│                                                       │
│  ── Catálogo de Brindes ──────────────────────────── │
│  [img] Nécessaire Gold   500 pts  Estoque: 12  [Edit] │
│  [img] Kit Premium      1000 pts  Estoque: 5   [Edit] │
│  [img] Pulseira VIP     2000 pts  Estoque: 3   [Edit] │
└──────────────────────────────────────────────────────┘
```

### Ações Admin
- **[+ Novo Brinde]** → modal com: nome, imagem upload, custo_pontos, estoque
- **[Entregar]** → muda `SolicitacaoBrinde.status = 'entregue'` + push notification
- **[Edit]** → editar campos do brinde

---

## Resumo de Schemas Novos (desta spec)

| Modelo | Descrição |
|--------|-----------|
| `AcertoRevendedora` | Acerto submetido pela revendedora, aguardando confirmação admin |
| `Brinde` | Catálogo de prêmios para resgate |
| `SolicitacaoBrinde` | Pedido de resgate de brinde por uma revendedora |
| `NotificacaoPreferencia` | Preferências de push notification por revendedora |

> Schemas completos definidos em `SPEC_EXTRATO_BRINDES.md` e `SPEC_DEVOLUCAO.md`.
