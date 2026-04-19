# SPEC — Admin: Conferência Física de Maleta

**Rota:** `/admin/maletas/[id]/conferir`  
**Acesso:** ADMIN e COLABORADORA (apenas para maletas do seu grupo)  
**Trigger:** Revendedora submete devolução → status muda para `aguardando_revisao` → admin confere fisicamente

---

## Objetivo

Tela onde o admin/consultora recebe os produtos devolvidos pela revendedora, confere peça por peça, registra as quantidades realmente recebidas e fecha a maleta com o cálculo final de comissão.

---

## Pré-condições

- Maleta com `status = "aguardando_revisao"`
- Comprovante de devolução (`comprovante_devolucao_url`) já enviado pela revendedora
- Admin com role adequado e acesso ao grupo da revendedora

---

## Layout da Tela

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Volver        Conferir Consignación #102                      │
│  ────────────────────────────────────────────────────────────── │
│  Revendedora: Ana Silva  |  Plazo: 15/01/2026  |  ⚠️ Atrasada  │
│                                                                  │
│  Comprobante de devolución:                                      │
│  [🖼️ Ver imagen adjunta]                                        │
│                                                                  │
│  ──────────────────────────────────────────────────────────── │
│  CONFERENCIA DE ITEMS                                           │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Produto          │ Enviado │ Vendido │ Recibido │ Dif.  │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ Anillo Dorado    │   3     │    2    │  [1____] │  0    │   │
│  │ Collar Perla     │   2     │    0    │  [2____] │  0    │   │
│  │ Pulsera Plata    │   5     │    3    │  [1____] │ ⚠️ 1  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ⚠️ Atención: 1 ítem con diferencia (Pulsera Plata)            │
│                                                                  │
│  ── Resumen Financiero ──────────────────────────────────────   │
│  Total enviado:          G$ 2.500.000                           │
│  Total vendido:          G$ 1.800.000  (72%)                    │
│  Comisión revendedora:   G$   450.000  (25%)                    │
│  Comisión consultora:    G$   180.000  (10%)                    │
│                                                                  │
│  ── Nota del acerto ─────────────────────────────────────────   │
│  [_________________________________________________]            │
│  Ej: "1 pulsera llegó con daños, se acepta igual"               │
│                                                                  │
│     [Cancelar]           [Confirmar y Cerrar Consignación]       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Campos da Conferência

### Por Item

| Campo | Origem | Editável |
|-------|--------|---------|
| Produto | `product_variant.name` + `product.name` | ❌ |
| Quantidade enviada | `maleta_item.quantidade_enviada` | ❌ |
| Quantidade vendida | `maleta_item.quantidade_vendida` | ❌ |
| **Quantidade recebida** | Input do admin | ✅ |
| Diferença | `qtd_enviada - qtd_vendida - qtd_recebida` | ❌ Calculado |

**Diferença esperada = 0** → Indica conferência OK  
**Diferença > 0** → ⚠️ Alerta de perda/dano — admin decide se aceita mesmo assim  
**Diferença < 0** → ❌ Impossível — bloquear submit com erro de validação

### Nota do Acerto

Campo de texto livre (max 500 chars) salvo em `maleta.nota_acerto`.

---

## Resumo Financeiro (Preview)

Calculado em tempo real no client conforme admin preenche `quantidade_recebida`:

```ts
// Cálculo do preview financeiro (client-side)
const totalVendido = itens.reduce(
  (sum, item) => sum + (item.preco_fixado * item.quantidade_vendida), 0
);

const pctComissaoRevendedora = commissionTierAtual.pct;  // ex: 25%
const pctComissaoColaboradora = colaboradora?.taxa_comissao ?? 0;  // ex: 10%

const comissaoRevendedora = totalVendido * (pctComissaoRevendedora / 100);
const comissaoColaboradora = totalVendido * (pctComissaoColaboradora / 100);
```

---

## Server Action: `conferirEFecharMaleta`

```ts
// src/app/admin/maletas/[id]/conferir/actions.ts
const conferirMaletaSchema = z.object({
  maleta_id: z.string().uuid(),
  itens_conferidos: z.array(z.object({
    item_id: z.string().uuid(),
    quantidade_recebida: z.number().int().min(0),
  })).min(1),
  nota_acerto: z.string().max(500).optional(),
});

export async function conferirEFecharMaleta(
  input: z.infer<typeof conferirMaletaSchema>
): Promise<ActionResult<{ maleta_id: string }>> {
  const caller = await requireAuth(['ADMIN', 'COLABORADORA']);

  const parsed = conferirMaletaSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: 'Datos inválidos.', code: 'VALIDATION_ERROR' };

  return await prisma.$transaction(async (tx) => {
    const maleta = await tx.maleta.findFirst({
      where: {
        id: input.maleta_id,
        status: 'aguardando_revisao',
        // COLABORADORA: verificar que é do seu grupo
        ...(caller.role === 'COLABORADORA'
          ? { reseller: { manager_id: caller.id } }
          : {}),
      },
      include: {
        itens: true,
        reseller: { include: { colaboradora: true } },
      },
    });

    if (!maleta) return { success: false, error: 'Consignación no encontrada o ya fue cerrada.', code: 'NOT_FOUND' };

    // Validar: quantidade_recebida não pode ser > (enviada - vendida)
    for (const item of parsed.data.itens_conferidos) {
      const maletaItem = maleta.itens.find(i => i.id === item.item_id);
      if (!maletaItem) return { success: false, error: 'Ítem no válido.', code: 'NOT_FOUND' };

      const esperado = maletaItem.quantidade_enviada - maletaItem.quantidade_vendida;
      if (item.quantidade_recebida > esperado) {
        return { success: false, error: `Cantidad recibida de "${item.item_id}" supera lo esperado.`, code: 'VALIDATION_ERROR' };
      }
    }

    // 1. Atualizar quantidade_recebida de cada item
    for (const item of parsed.data.itens_conferidos) {
      await tx.maletaItem.update({
        where: { id: item.item_id },
        data: { quantidade_recebida: item.quantidade_recebida },
      });
    }

    // 2. Devolver ao estoque as quantidades recebidas (não vendidas)
    for (const item of parsed.data.itens_conferidos) {
      await tx.productVariant.update({
        where: { id: maleta.itens.find(i => i.id === item.item_id)!.product_variant_id },
        data: { stock_quantity: { increment: item.quantidade_recebida } },
      });
    }

    // 3. Calcular valores financeiros
    const valorTotalVendido = maleta.itens.reduce(
      (sum, item) => sum + Number(item.preco_fixado) * item.quantidade_vendida, 0
    );
    const valorTotalEnviado = maleta.itens.reduce(
      (sum, item) => sum + Number(item.preco_fixado) * item.quantidade_enviada, 0
    );

    const pctComissao = await computeCommissionPct(maleta.reseller_id);
    const pctColaboradora = maleta.reseller.colaboradora?.taxa_comissao ?? 0;

    const comissaoRevendedora = valorTotalVendido * (Number(pctComissao) / 100);
    const comissaoColaboradora = valorTotalVendido * (Number(pctColaboradora) / 100);

    // 4. Fechar a maleta com snapshot financeiro
    await tx.maleta.update({
      where: { id: maleta.id },
      data: {
        status: 'concluida',
        valor_total_enviado: valorTotalEnviado,
        valor_total_vendido: valorTotalVendido,
        valor_comissao_revendedora: comissaoRevendedora,
        pct_comissao_aplicado: pctComissao,
        nota_acerto: parsed.data.nota_acerto,
      },
    });

    // 5. Gamificação — devolução a tempo?
    if (new Date() <= maleta.data_limite) {
      await awardPoints(maleta.reseller_id, 'devolucao_prazo', 50);
    }

    // 6. Gamificação — maleta completa (100% vendida)?
    const percentualVendido = valorTotalEnviado > 0
      ? (valorTotalVendido / valorTotalEnviado) * 100
      : 0;
    if (percentualVendido >= 100) {
      await awardPoints(maleta.reseller_id, 'maleta_completa', 200);
    }

    // 7. Invalidar cache de comissão
    await invalidateCache.commission(maleta.reseller_id);

    return { success: true, data: { maleta_id: maleta.id } };
  });
}
```

---

## Fluxo de Navegação Pós-Confirmação

```
Conferência confirmada
    ↓
Redirect → /admin/maletas?status=concluida
    ↓
Toast: "Consignación #102 cerrada exitosamente. Comisión: G$ 450.000"
```

---

## Estados da Tela

| Estado | Comportamento |
|--------|--------------|
| Carregando | Skeleton da tabela + skeleton do resumo financeiro |
| Maleta não `aguardando_revisao` | Mostrar mensagem "Esta consignación ya fue procesada." com link para voltar |
| Enviando | Botão "Confirmar" desabilitado + spinner |
| Erro de servidor | Toast de erro + manter formulário preenchido |

---

## Componentes

| Componente | Tipo | Responsabilidade |
|-----------|------|-----------------|
| `ConferirMaletaPage` | Server | Fetch de dados da maleta + redirect guard |
| `ConferirMaletaForm` | **Client** | Tabela de conferência interativa + preview financeiro |
| `ItemConferenciaRow` | Client | Input de quantidade_recebida com validação |
| `ResumoFinanceiro` | Client | Preview calculado em tempo real |
| `ComprovanteViewer` | Client | Expandir/visualizar imagem de comprovante |
