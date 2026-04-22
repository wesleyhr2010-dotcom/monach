# SPEC — Admin: Configurador de Gamificação

## Objetivo
Oferecer ao SUPER_ADMIN uma interface para ativar/desativar e parametrizar cada módulo de gamificação (pontos por ação, limites, metas) sem alterar código.

## Atores
- **SUPER_ADMIN** — único com acesso.
- **Sistema de gamificação (código)** — consome `GamificacaoRegra` nos triggers.
- **Revendedora** — beneficiária das regras (ver `SPEC_PROGRESSO.md`).

## Fluxo
1. Admin acessa `/admin/gamificacao`.
2. Vê lista de módulos pré-definidos com toggle ON/OFF e campos editáveis (pontos, limites, metas).
3. Edita valores → salva → `GamificacaoRegra` é atualizada.
4. Próximos triggers no código leem a regra atualizada.
5. Aba adicional: níveis (`NivelRegra`) com faixas de pontos para badge (Bronce/Plata/Oro/Diamante).

## Regras de negócio
- Módulos são **fixos no código** — admin não pode criar novos gatilhos.
- Cada módulo corresponde a uma `acao` pré-definida: `venda_maleta`, `meta_mensal`, `devolucao_prazo`, `compartilhou_catalogo`, `maleta_completa`, `perfil_completo`, `primeiro_acesso`.
- Cada regra tem: `ativo`, `pontos`, `limite_diario` (se aplicável), `meta_valor` (se aplicável).
- `NivelRegra` define umbrales mínimos por badge.
- Mudanças não retroagem — histórico de `PontosExtrato` preservado.

## Edge cases
- Desativar módulo mid-mês → trigger deixa de conceder pontos imediatamente.
- Limite diário reduzido → próximas ações do dia usam o novo limite.
- Nível removido → rank da revendedora pode descer; preservar histórico.
- Salvar regra com `pontos = 0` → permitido mas aviso visual.
- Alteração de `meta_valor` durante mês → vale para cálculo do mês seguinte.

## Dependências
- `SPEC_PROGRESSO.md` — consumidora principal no app da revendedora.
- `SPEC_HOME.md` — exibe rank e pontos.
- `SPEC_DATABASE.md` — `GamificacaoRegra`, `NivelRegra`, `PontosExtrato`.
- `prisma/seed-gamificacao.ts` — valores padrão.

---

## Detalhes técnicos / Referência

> Localização: `/admin/gamificacao`
> Acesso: ADMIN (Super Admin) apenas

---

## Visão Geral

O sistema de gamificação é construído em torno de **módulos pré-definidos** — cada módulo é uma regra de pontuação com trigger específico no código. O Super Admin pode **ativar/desativar** cada módulo e **configurar** os parâmetros de cada um (pontos, limites) sem precisar mexer no código.

### Princípio fundamental
> O Admin controla **O QUÊ paga pontos** e **QUANTO paga** — mas os **gatilhos** (quando o ponto é disparado) são fixos no código. Não é possível criar gatilhos novos sem desenvolvimento.

Isso evita configurações impossíveis (ex: Admin criar uma regra `"ganhar pontos ao respirar"` que nenhum código dispara).

---

## Módulos Disponíveis (pré-definidos)

Cada módulo corresponde a um valor de `acao` no banco, que é chamado pelo código automaticamente:

| Módulo | `acao` | Gatilho no código | Configurável |
|--------|--------|------------------|--------------|
| 🛍️ **Venda na Maleta** | `venda_maleta` | Chamado em `registrarVenda()` | Pontos, ativo |
| 🏆 **Meta Mensal** | `meta_mensal` | Chamado em `closeMaleta()` ao atingir meta | Pontos, valor da meta, ativo |
| ⏱️ **Devolução no Prazo** | `devolucao_prazo` | Chamado em `closeMaleta()` se `returnedAt < endsAt` | Pontos, ativo |
| 📤 **Compartilhar Catálogo** | `compartilhou_catalogo` | Chamado no `CompartilharButton` | Pontos, limite diário, ativo |
| 👜 **Maleta Completa** | `maleta_completa` | Chamado em `closeMaleta()` se 100% vendido | Pontos, ativo |
| 👤 **Atualizar Perfil** | `perfil_completo` | Chamado quando revendedora completa o perfil | Pontos, ativo |
| 🎉 **Primeiro Acesso** | `primeiro_acesso` | Chamado no primeiro login | Pontos, ativo |

---

## Layout da Tela `/admin/gamificacao`

```
┌─────────────────────────────────────────────────────────┐
│  ⚙️ Configurações de Gamificação                         │
│                                                         │
│  Módulos de Pontuação                                   │
│  ─────────────────────────────────────────────────────  │
│  ┌── 🛍️ Venda na Maleta ──────────────────── [ON] ──┐  │
│  │  Pontos por venda:  [ 50 ]                        │  │
│  │  Limite diário:     [ sem limite ▼ ]              │  │
│  └────────────────────────────────────────────────────┘ │
│                                                         │
│  ┌── 🏆 Meta Mensal Atingida ─────────────── [ON] ──┐  │
│  │  Pontos ao atingir:  [ 100 ]                      │  │
│  │  Valor da meta (Gs): [ 2.000.000 ]                │  │
│  └────────────────────────────────────────────────────┘ │
│                                                         │
│  ┌── ⏱️ Devolução no Prazo ──────────────── [ON] ──┐   │
│  │  Pontos:  [ 30 ]                                  │  │
│  └────────────────────────────────────────────────────┘ │
│                                                         │
│  ┌── 📤 Compartilhar Catálogo ────────────── [ON] ──┐  │
│  │  Pontos por compartilhamento:  [ 50 ]             │  │
│  │  Limite diário:                [ 5   ]            │  │
│  └────────────────────────────────────────────────────┘ │
│                                                         │
│  ┌── 👜 Maleta Completa (100% vendida) ───── [OFF] ──┐ │
│  │  Pontos bônus:  [ 200 ]                            │  │
│  │  [Ativar este módulo]                              │  │
│  └────────────────────────────────────────────────────┘ │
│                                                         │
│  Níveis da Revendedora                                  │
│  ─────────────────────────────────────────────────────  │
│  ┌── Bronze ──────────────────────────────────────────┐ │
│  │  Pontos mínimos: [ 0 ]   Cor: [#CD7F32 ■]         │  │
│  └────────────────────────────────────────────────────┘ │
│  ┌── Prata ───────────────────────────────────────────┐ │
│  │  Pontos mínimos: [ 1.000 ]  Cor: [#C0C0C0 ■]      │  │
│  └────────────────────────────────────────────────────┘ │
│  [ + Adicionar Nível ]                                   │
└─────────────────────────────────────────────────────────┘
```

---

## Schema — Campos Necessários

O modelo `GamificacaoRegra` precisa dos seguintes campos adicionais:

```prisma
model GamificacaoRegra {
  id            String   @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  nome          String   // Label exibido no admin e na tela da revendedora
  descricao     String   @default("") // Subtítulo explicativo
  acao          String   @unique // Chave técnica — imutável após criação
  pontos        Int      // Configurável pelo admin
  ativo         Boolean  @default(true)
  created_at    DateTime @default(now()) @db.Timestamptz()

  // Novos campos
  icone         String   @default("star") // Nome do ícone Lucide (ex: "shopping-bag", "clock")
  tipo          String   @default("por_evento") // "por_evento" | "diario" | "unico" | "mensal"
  limite_diario Int?     // null = ilimitado; só aplicável se tipo = "diario"
  meta_valor    Decimal? @db.Decimal(12, 2) // Só para acao = "meta_mensal"
  ordem         Int      @default(0) // Ordem de exibição na tela da revendedora

  @@map("gamificacao_regras")
}
```

### Modelo `NivelRegra` (novo)

```prisma
model NivelRegra {
  id          String @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  nome        String // "Bronze", "Prata", "Ouro", "Diamante"
  min_pontos  Int    // Pontos acumulados históricos mínimos para atingir esse nível
  cor_hex     String // Cor do badge na UI (ex: "#CD7F32")
  icone       String @default("award") // Ícone Lucide
  ordem       Int    @default(0)

  @@map("nivel_regras")
}
```

---

## Sistema de Ranks — Arquitetura e Visão de Futuro

### Como o rank funciona

O rank é **calculado dinamicamente** com base nos pontos acumulados historicamente (nunca resetam). É meramente informativo hoje — sem impacto funcional — mas a arquitetura suporta feature gating no futuro.

```
Pontos acumulados totais  →  consulta NivelRegra  →  retorna nível atual
         850 pts          →  Bronze (≥0) ✅ / Prata (≥1000) ❌  →  Bronze
```

### Progressão visual no app
```
[Bronze] →→→→→ [Prata] →→→→→ [Ouro] →→→→→ [Diamante]
   0pts         1.000pts      5.000pts      15.000pts
```

A revendedora vê seu rank como badge no perfil e no dashboard, junto com a barra de progresso para o próximo nível.

### Features futuras possíveis por rank

O design atual não libera features por rank, mas a estrutura está pronta. Exemplos de uso futuro:

| Feature | Rank mínimo | Observação |
|---------|-------------|------------|
| Maleta de até 30 itens | Bronze (padrão) | Todos têm |
| Maleta de até 50 itens | Prata | Futuramente |
| Catálogo exclusivo de lançamentos | Ouro | Futuramente |
| Condição de pagamento especial | Diamante | Futuramente |
| Suporte prioritário | Diamante | Futuramente |

> **Design decision:** Por enquanto, o rank é **100% informativo e motivacional** — não bloqueia nada. Quando a loja quiser criar benefícios por rank, basta adicionar a verificação no código usando `getRankAtual()`, sem mudar o schema.

### Helper reutilizável: `getRankAtual(resellerId)`

```ts
// src/lib/gamificacao.ts
export async function getRankAtual(resellerId: string) {
  const { _sum } = await prisma.pontosExtrato.aggregate({
    where: { reseller_id: resellerId },
    _sum: { pontos: true },
  });

  const saldo = _sum.pontos ?? 0;

  const nivel = await prisma.nivelRegra.findFirst({
    where: { min_pontos: { lte: saldo } },
    orderBy: { min_pontos: 'desc' },
  });

  const proximo = await prisma.nivelRegra.findFirst({
    where: { min_pontos: { gt: saldo } },
    orderBy: { min_pontos: 'asc' },
  });

  return {
    nivel,          // nível atual (nunca null — Bronze = min 0)
    saldo,          // pontos totais acumulados
    proximo,        // próximo nível (null se já no máximo)
    falta: proximo ? proximo.min_pontos - saldo : 0,
  };
}
```

**Uso no feature gating futuro:**
```ts
const { nivel } = await getRankAtual(resellerId);
// Nomes definidos pelo admin — evitar hardcode se possível
if (nivel.ordem >= 3) { /* Ouro ou superior */ }
```

---

## Server Actions — `/admin/actions-gamificacao.ts`

### `updateGamificacaoRegra(id, data)`
Atualiza um módulo. Campos editáveis: `pontos`, `ativo`, `limite_diario`, `meta_valor`, `icone`, `ordem`, `nome`, `descricao`.

> ⚠️ O campo `acao` é **imutável** — não pode ser editado pelo admin. É a chave que o código usa para disparar os pontos.

```ts
const editableFields = z.object({
  pontos: z.number().int().min(1).max(10000),
  ativo: z.boolean(),
  limite_diario: z.number().int().min(1).nullable(),
  meta_valor: z.number().positive().nullable(),
  nome: z.string().min(3).max(80),
  descricao: z.string().max(200),
  icone: z.string(),
  ordem: z.number().int(),
});
```

### `upsertNivelRegra(data)`
Cria ou atualiza um nível. Validação: não pode ter dois níveis com o mesmo `min_pontos`.

```ts
const nivelSchema = z.object({
  id: z.string().uuid().optional(), // se omitido = novo nível
  nome: z.string().min(2).max(40),
  min_pontos: z.number().int().min(0),
  cor_hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  icone: z.string(),
});
```

### `deleteNivelRegra(id)`
Só pode deletar se não for o nível base (Bronze / `min_pontos = 0`).

---

## Como os módulos se conectam ao código

A regra fundamental é: **o campo `acao` do banco deve bater exatamente com a string passada para `awardPoints()`**.

```ts
// Exemplo de chamada automática dentro de registrarVenda()
await awardPoints(resellerId, 'venda_maleta');
// ↑ O sistema busca GamificacaoRegra WHERE acao = 'venda_maleta'
// Se ativo = false → não pontua. Se ativo = true → pontua com o valor configurado.

// A função awardPoints() sempre consulta o banco para obter o valor de pontos:
async function awardPoints(resellerId: string, acao: string) {
  const regra = await prisma.gamificacaoRegra.findFirst({
    where: { acao, ativo: true },
  });
  if (!regra) return; // módulo desativado ou não existe — silencioso

  await prisma.pontosExtrato.create({
    data: {
      reseller_id: resellerId,
      pontos: regra.pontos,
      descricao: regra.nome,
      regra_id: regra.id,
    },
  });
}
```

Isso garante que **trocar o valor de pontos no admin tem efeito imediato** na próxima ação que ocorrer.

---

## Regras de negócio do admin

1. **Não pode deletar módulos** — apenas desativar (`ativo = false`). Manter histórico intacto.
2. **`acao` é imutável** — impedir edição no formulário (campo read-only).
3. **Limite diário só aplicável a `tipo = 'diario'`** — validação no frontend e no Zod.
4. **`meta_valor` só aplicável ao módulo `meta_mensal`** — idem.
5. **Ao desativar um módulo**, os pontos já ganhos anteriormente **permanecem** no `PontosExtrato` — não são removidos retroativamente.

---

## Fluxo de exibição na tela da revendedora

A tela `/app/progresso` ("Como Ganhar Pontos") busca as regras **dinamicamente** do banco:

```ts
// Ordenado por regra.ordem ASC, filtrando só ativas
const regras = await prisma.gamificacaoRegra.findMany({
  where: { ativo: true },
  orderBy: { ordem: 'asc' },
});
```

Se o admin desativar um módulo, ele **some automaticamente** da tela da revendedora na próxima renderização (sem deploy necessário).

---

## Seed Atualizado

O seed `prisma/seed-gamificacao.ts` deve incluir os 7 módulos com os novos campos e valores corretos do design:

```ts
const regras = [
  {
    nome: "Venda na Maleta", acao: "venda_maleta", pontos: 50,
    icone: "shopping-bag", tipo: "por_evento", limite_diario: null,
    descricao: "Pontos por cada venda registrada na maleta", ordem: 2,
  },
  {
    nome: "Meta Mensal Atingida", acao: "meta_mensal", pontos: 100,
    icone: "trophy", tipo: "mensal", limite_diario: null,
    meta_valor: 2000000, // Gs 2.000.000
    descricao: "Bônus por atingir a meta de vendas do mês", ordem: 1,
  },
  {
    nome: "Devolução Antecipada", acao: "devolucao_prazo", pontos: 30,
    icone: "clock", tipo: "por_evento", limite_diario: null,
    descricao: "Devolver a maleta antes do prazo combinado", ordem: 3,
  },
  {
    nome: "Compartilhar Catálogo", acao: "compartilhou_catalogo", pontos: 50,
    icone: "share-2", tipo: "diario", limite_diario: 5,
    descricao: "Compartilhe produtos no WhatsApp (máx 5x/dia)", ordem: 4,
  },
  {
    nome: "Maleta Completa", acao: "maleta_completa", pontos: 200,
    icone: "briefcase", tipo: "por_evento", limite_diario: null,
    descricao: "Bônus por vender 100% dos itens da maleta", ordem: 5,
  },
  {
    nome: "Atualizar Perfil", acao: "perfil_completo", pontos: 20,
    icone: "user-check", tipo: "unico", limite_diario: null,
    descricao: "Complete seu perfil de revendedora", ordem: 6,
  },
  {
    nome: "Primeiro Acesso", acao: "primeiro_acesso", pontos: 20,
    icone: "sparkles", tipo: "unico", limite_diario: null,
    descricao: "Bem-vinda ao app Monarca!", ordem: 7,
  },
];
```

### Seed dos Níveis
```ts
const niveis = [
  { nome: "Bronze",   min_pontos: 0,     cor_hex: "#CD7F32", icone: "award", ordem: 1 },
  { nome: "Prata",    min_pontos: 1000,  cor_hex: "#C0C0C0", icone: "award", ordem: 2 },
  { nome: "Ouro",     min_pontos: 5000,  cor_hex: "#FFD700", icone: "award", ordem: 3 },
  { nome: "Diamante", min_pontos: 15000, cor_hex: "#B9F2FF", icone: "gem",   ordem: 4 },
];
```
