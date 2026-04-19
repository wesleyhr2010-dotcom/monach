# SPEC — Admin: Configurações (CommissionTiers, Contratos PDF)

**Rotas:**
- `/admin/commission-tiers` — Faixas de comissão da revendedora
- `/admin/contratos` — Upload e gestão de contratos PDF

---

## Tela 1: Faixas de Comissão `/admin/commission-tiers`

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Faixas de Comissão das Revendedoras        [+ Nova Faixa]  │
│                                                              │
│  As faixas são baseadas no faturamento do mês civil atual.  │
│  A revendedora sempre se enquadra na faixa mais alta        │
│  que seu faturamento supera.                                 │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Label     │ Mínimo (Gs)     │ Comissão │ [Editar]   │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │ Bronze    │ G$ 0            │ 20%      │ [Edit] [X] │   │
│  │ Prata     │ G$ 1.000.000    │ 25%      │ [Edit] [X] │   │
│  │ Ouro      │ G$ 3.000.000    │ 30%      │ [Edit] [X] │   │
│  │ Platina   │ G$ 5.000.000    │ 35%      │ [Edit] [X] │   │
│  │ Elite     │ G$ 8.000.000    │ 40%      │ [Edit] [X] │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ─── Exemplo de Cálculo ─────────────────────────────────   │
│  Revendedora que vendeu G$ 4.200.000 este mês:              │
│  → Enquadra em "Ouro" (≥ G$ 3.000.000) → 30% de comissão   │
│  → Comissão = G$ 4.200.000 × 30% = G$ 1.260.000            │
└─────────────────────────────────────────────────────────────┘
```

### Regras de Negócio

1. **Sempre deve existir pelo menos uma faixa com `min_sales_value = 0`** — é a faixa base
2. Não pode deletar a faixa com `min_sales_value = 0`
3. Não pode ter duas faixas com o mesmo `min_sales_value`
4. Mudanças nos tiers **não afetam maletas já fechadas** (valores congelados no `Maleta`)
5. **Período de referência:** Mês civil (dia 1 ao último dia, fuso `America/Asuncion`)

### Modal: Editar/Criar Faixa

```
┌─────────────────────────────┐
│  Editar Faixa               │
│                             │
│  Label: [Ouro___________]   │
│  Vendas mínimas (Gs):       │
│  [3.000.000__________]      │
│  Comissão (%):  [30____]    │
│                             │
│  [Cancelar]  [Salvar]       │
└─────────────────────────────┘
```

### Server Actions

```ts
const commissionTierSchema = z.object({
  label: z.string().min(2).max(30),
  min_sales_value: z.number().int().min(0),
  commission_pct: z.number().min(1).max(100),
});

async function upsertCommissionTier(data: CommissionTierInput) {
  // Validar: não duplicar min_sales_value
  const exists = await prisma.commissionTier.findFirst({
    where: { min_sales_value: data.min_sales_value, id: { not: data.id } }
  });
  if (exists) throw new Error('Já existe uma faixa com esse mínimo de vendas');

  return prisma.commissionTier.upsert({
    where: { id: data.id ?? 'new' },
    create: data,
    update: data,
  });
}

async function deleteCommissionTier(id: string) {
  const tier = await prisma.commissionTier.findUniqueOrThrow({ where: { id } });
  if (tier.min_sales_value === 0) throw new Error('Não é possível deletar a faixa base');
  await prisma.commissionTier.delete({ where: { id } });
}
```

### Visualização na UI da Revendedora

As pills de comissão no dashboard da revendedora são renderizadas a partir desta configuração. Ver `SPEC_HOME.md`.

---

## Tela 2: Gestão de Contratos `/admin/contratos`

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Contratos e Documentos                    [+ Novo Contrato] │
│                                                              │
│  Contratos são disponibilizados para todas as revendedoras  │
│  na tela de Documentos do app.                              │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Nome                   │ Obrigatório │ Status  │     │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │ Termo de Consignação   │ ✅ Sim      │ Ativo   │ ... │   │
│  │ 2026                   │             │         │ [↓] │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │ Manual de Conduta      │ ❌ Não      │ Ativo   │ ... │   │
│  │                        │             │         │ [↓] │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │ Contrato Antigo 2024   │ ❌ Não      │ Inativo │ ... │   │
│  │                        │             │         │ [↓] │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Modal: Adicionar/Editar Contrato

```
┌─────────────────────────────────────┐
│  Novo Contrato                      │
│                                     │
│  Nome: [_______________________]    │
│                                     │
│  Arquivo PDF:                       │
│  [📎 Clique para selecionar PDF]    │
│  (Ou arraste o arquivo aqui)        │
│                                     │
│  ☐ Obrigatório para todas as        │
│     revendedoras                    │
│                                     │
│  ☑ Ativo (visível no app)           │
│                                     │
│  [Cancelar]   [Salvar]              │
└─────────────────────────────────────┘
```

### Regras de Negócio
1. Apenas PDFs são aceitos (`.pdf`)
2. Tamanho máximo: 10MB
3. Upload vai para R2: `bucket/contratos/{id}.pdf`
4. Contratos com `ativo = false` somem do app das revendedoras
5. Contratos com `obrigatorio = true` → futuramente podem bloquear acesso se não lidos (fora do escopo atual)

### Server Action: `uploadContrato(data, file)`

```ts
async function uploadContrato(input: {
  nome: string;
  obrigatorio: boolean;
  ativo: boolean;
}, file: File) {
  // 1. Validar: tipo = PDF, tamanho <= 10MB
  if (!file.type.includes('pdf')) throw new Error('Apenas PDFs são aceitos');
  if (file.size > 10 * 1024 * 1024) throw new Error('Arquivo muito grande (máx 10MB)');

  // 2. Upload para R2
  const contratoId = crypto.randomUUID();
  const url = await uploadToR2(`contratos/${contratoId}.pdf`, file);

  // 3. Criar registro no banco
  return prisma.contrato.create({
    data: { ...input, url },
  });
}
```

---

## Resumo de Schemas Cobertos nesta Spec

```prisma
model CommissionTier {
  id              String  @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  label           String  // "Bronze", "Prata", "Ouro", "Platina", "Elite"
  min_sales_value Decimal @db.Decimal(12, 2)
  commission_pct  Decimal @db.Decimal(5, 2)

  @@map("commission_tiers")
}

model Contrato {
  id          String  @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  nome        String
  url         String  // URL do PDF no R2
  obrigatorio Boolean @default(false)
  ativo       Boolean @default(true)
  created_at  DateTime @default(now()) @db.Timestamptz()

  @@map("contratos")
}
```

---

## Componentes

| Componente | Tipo | Responsabilidade |
|-----------|------|-----------------|
| `CommissionTiersPage` | Server | Lista de faixas |
| `TierForm` | **Client** | Modal de criação/edição com validação |
| `ContratosPage` | Server | Lista de contratos |
| `ContratoUploadModal` | **Client** | Drag-and-drop PDF + preview nome |
