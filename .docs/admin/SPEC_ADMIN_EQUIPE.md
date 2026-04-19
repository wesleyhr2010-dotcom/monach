# SPEC — Admin: Gestão de Consultoras e Revendedoras

**Rotas:**
- `/admin/consultoras` — Lista (SUPER_ADMIN only)
- `/admin/consultoras/nova` — Cadastrar
- `/admin/consultoras/[id]` — Perfil e desempenho
- `/admin/revendedoras` — Lista
- `/admin/revendedoras/nova` — Cadastrar
- `/admin/revendedoras/[id]` — Perfil completo

---

## CONSULTORAS (SUPER_ADMIN only)

### Tela 1: Lista de Consultoras `/admin/consultoras`

```
┌─────────────────────────────────────────────────────────────┐
│  Consultoras                            [+ Nova Consultora]  │
│                                                              │
│  [🔍 Buscar por nome...]                                    │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Nome          │ Revend. │ Faturamento  │ Comissão    │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │ Maria Flores  │  12     │ G$ 18.5M     │ 10% = G$1.85M│  │
│  │               │         │ ████████⬜ 85%│[Ver →]     │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │ Sofia Gómez   │   8     │ G$ 12.1M     │ 8% = G$968k │   │
│  │               │         │ ██████⬜⬜ 65%│[Ver →]     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Tela 2: Cadastrar Consultora `/admin/consultoras/nova`

```
┌─────────────────────────────────────┐
│  Nova Consultora                    │
│                                     │
│  Nome Completo: [_______________]   │
│  Email:         [_______________]   │
│  WhatsApp:      [_______________]   │
│                                     │
│  Taxa de Comissão sobre Vendas:     │
│  [____] %                           │
│  ↑ Percentual sobre o faturamento   │
│    das revendedoras do seu grupo    │
│                                     │
│  [Criar e Enviar Convite por Email] │
└─────────────────────────────────────┘
```

**Fluxo:**
1. Admin preenche dados + taxa de comissão
2. Sistema cria usuário no Supabase com role `CONSULTORA`
3. Envia email de boas-vindas com link de definição de senha
4. Consultora acessa `/admin/login` e define sua senha

### Tela 3: Perfil da Consultora `/admin/consultoras/[id]`

```
┌─────────────────────────────────────────────────────────────┐
│  ← Maria Flores                          [Editar] [Pausar]  │
│                                                              │
│  [Avatar] Maria Flores                                       │
│           maria.flores@mail.com                             │
│           WhatsApp: +595 981 234 567                        │
│           Taxa de Comissão: 10%                             │
│                                                              │
│  ── Desempenho Consolidado ──────────────────────────────── │
│  Revendedoras ativas:  12                                    │
│  Faturamento total:    G$ 124.500.000                       │
│  Comissão total paga:  G$ 12.450.000                        │
│                                                              │
│  ── Suas Revendedoras ───────────────────────────────────── │
│  Ana Silva     Ouro   G$ 18.2M   Maleta ativa ↗            │
│  Joana Lima    Prata  G$ 12.5M   Maleta ativa ↗            │
│  Sofia Rod.   Bronze  G$  8.1M   Sem maleta ⚠              │
│                                                              │
│  [Editar Taxa de Comissão]   [Ver Histórico de Comissões]  │
└─────────────────────────────────────────────────────────────┘
```

### Server Action: `createConsultora(data)`

```ts
async function createConsultora(input: {
  name: string;
  email: string;
  whatsapp: string;
  taxa_comissao: number; // percentual, ex: 10.0
}) {
  // 1. Criar usuário no Supabase Auth com role CONSULTORA
  const { data: authUser } = await supabase.auth.admin.createUser({
    email: input.email,
    password: crypto.randomUUID(), // senha temporária
    email_confirm: true,
  });

  // 2. Criar registro na tabela Colaboradora
  await prisma.colaboradora.create({
    data: {
      user_id: authUser.user.id,
      name: input.name,
      email: input.email,
      whatsapp: input.whatsapp,
      taxa_comissao: input.taxa_comissao,
    },
  });

  // 3. Enviar email de boas-vindas com link de definição de senha
  await supabase.auth.admin.generateLink({
    type: 'recovery',
    email: input.email,
  });
}
```

---

## REVENDEDORAS

### Tela 1: Lista de Revendedoras `/admin/revendedoras`

_(Ver `SPEC_ADMIN_DOCUMENTOS_ACERTOS.md` para o layout base)_

**Colunas adicionais para o admin:**

| Coluna | Campo |
|--------|-------|
| Nome | `reseller.name` |
| Consultora | `reseller.colaboradora.name` |
| Rank | `getRankAtual(resellerId)` |
| Faturamento mês | `SUM(maleta.valor_total_vendido)` |
| Status | Ativa / Inativa |
| Alertas | Doc pendente / Acerto aguardando |

### Tela 2: Cadastrar Revendedora `/admin/revendedoras/nova`

```
┌─────────────────────────────────────┐
│  Nova Revendedora                   │
│                                     │
│  Nome:      [___________________]   │
│  Email:     [___________________]   │
│  WhatsApp:  [___________________]   │
│                                     │
│  Consultora responsável:            │
│  [Maria Flores ▼]                   │
│  (só SUPER_ADMIN vê este campo)     │
│                                     │
│  Taxa de Comissão:  [____] %        │
│  ↑ Percentual sobre vendas          │
│                                     │
│  [Criar e Enviar Convite]           │
└─────────────────────────────────────┘
```

**Regras:**
- CONSULTORA cria revendedoras automaticamente no seu grupo (campo consultora pré-preenchido)
- SUPER_ADMIN escolhe a consultora via dropdown

### Tela 3: Perfil da Revendedora `/admin/revendedoras/[id]`

```
┌─────────────────────────────────────────────────────────────┐
│  ← Ana Silva                      [Editar] [Suspender]      │
│                                                              │
│  [Avatar] Ana Silva                                          │
│           anasilva@gmail.com                                │
│           WhatsApp: +595 971 111 222                        │
│           Taxa de Comissão: 25%  [Editar]                   │
│           Consultora: Maria Flores                          │
│           Rank: Prata 🥈 (2.100 pts)                        │
│                                                              │
│  Tabs: [Maletas] [Documentos] [Dados Bancários] [Extrato]  │
│                                                              │
│  ── ABA: MALETAS ───────────────────────────────────────── │
│  #102  [ATIVA]    01 Nov – 20 Dez  G$ 3.030               │
│  #089  [FECHADA]  01 Out – 15 Nov  G$ 8.500  Comis: G$2.1k│
│  #075  [FECHADA]  01 Set – 10 Out  G$ 6.200  Comis: G$1.5k│
│                                                              │
│  ── ABA: DOCUMENTOS ────────────────────────────────────── │
│  {ver SPEC_ADMIN_DOCUMENTOS_ACERTOS.md}                     │
│                                                             │
│  ── ABA: DADOS BANCÁRIOS ───────────────────────────────── │
│  Tipo: Alias (Bancard)                                      │
│  CI: 1234567   Titular: Ana M. Silva                       │
│                                                             │
│  ── ABA: EXTRATO DE PONTOS ─────────────────────────────── │
│  {lista de PontosExtrato — read-only para o admin}          │
└─────────────────────────────────────────────────────────────┘
```

### Editar Taxa de Comissão da Revendedora

```ts
// Server Action
async function updateTaxaComissao(resellerId: string, novaTaxa: number) {
  // A taxa nova só se aplica em MALETAS FUTURAS
  // Maletas já fechadas têm valor_comissao_revendedora congelado
  await prisma.reseller.update({
    where: { id: resellerId },
    data: { taxa_comissao: novaTaxa },
  });
}
```

> A mudança de taxa tem efeito apenas nas maletas criadas **após** a alteração. Histórico de comissões anteriores permanece inalterado (campos congelados no `Maleta`).

---

## Schema: Colaboradora

A tabela `Colaboradora` (Consultora) no Prisma:

```prisma
model Colaboradora {
  id             String  @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  user_id        String  @unique @db.Uuid // Supabase Auth user_id
  name           String
  email          String  @unique
  whatsapp       String
  taxa_comissao  Decimal @db.Decimal(5, 2) // % sobre vendas das revendedoras
  ativo          Boolean @default(true)
  avatar_url     String?

  resellers Reseller[] @relation("ColaboradoraResellers")
  @@map("colaboradoras")
}
```
