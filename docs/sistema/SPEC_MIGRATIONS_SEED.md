# SPEC — Migrations, Seed e Setup de Banco

## Objetivo
Definir o ciclo de vida de alterações de schema via Prisma Migrate, o conjunto mínimo de dados (gamificação, níveis, tiers de comissão) que o sistema precisa para operar e a política de backup/restore.

## Atores
- **Dev (Dex)** — cria migrations em dev (`migrate dev`).
- **CI/CD (DevOps)** — aplica migrations em staging/produção (`migrate deploy`).
- **Seed script** — popula `GamificacaoRegra`, `NivelRegra` e `CommissionTier` via upsert idempotente.
- **Supabase** — provê PITR e dumps.

## Fluxo
1. Alterar `schema.prisma` → `npx prisma migrate dev --name "..."` localmente.
2. Revisar SQL gerado; commit e PR.
3. Pipeline aplica `prisma migrate deploy` antes do deploy Vercel.
4. `npx prisma db seed` roda após reset local e em setup inicial de ambiente.
5. Backup diário automático no Supabase; backup semanal manual 30 dias.

## Regras de negócio
- Nunca editar banco diretamente em produção.
- `prisma migrate reset` é proibido fora de dev.
- Migrations em produção devem ser aditivas (ver `SPEC_DEPLOY_STRATEGY.md` §6).
- Seed é idempotente (upsert) — pode rodar múltiplas vezes.
- Dados obrigatórios: 7 regras de gamificação, 4 níveis, ≥1 commission tier com `min_sales_value=0`.
- Nome de migration: `YYYY_MM_DD_descricao_curta`.

## Edge cases
- Seed falha por falta de `@unique` em `NivelRegra.nome` ou `CommissionTier.min_sales_value` → ajustar schema.
- Migration aplicada mas deploy falha → rollback coordenado (código + revert migration).
- PITR Supabase indisponível → restaurar do dump semanal.
- Seed sobrescreve valores custom de admin → usar `update` seletivo, não replace completo.

## Dependências
- `SPEC_DATABASE.md` — schema Prisma.
- `SPEC_DEPLOY_STRATEGY.md` — pipeline que aplica migrations.
- `SPEC_GAMIFICACAO_OVERVIEW.md` — regras de negócio dos dados seed.
- `SPEC_ADMIN_CONFIG.md` — tiers e níveis gerenciados via UI.

---

## Detalhes técnicos / Referência

> Estratégia de migrations Prisma, dados iniciais obrigatórios e procedimentos de backup/restore.

---

## 1. Estratégia de Migrations

### Ferramenta: Prisma Migrate

Usar `prisma migrate` para todas as alterações de schema. **Nunca editar o banco diretamente em produção.**

### Comandos por Contexto

| Situação | Comando | Quando usar |
|---------|---------|------------|
| Desenvolvimento local | `npx prisma migrate dev` | Após alterar `schema.prisma` |
| Criar migration sem aplicar | `npx prisma migrate dev --create-only` | Para revisar antes de aplicar |
| Aplicar em staging/prod | `npx prisma migrate deploy` | No pipeline CI/CD (nunca interativo) |
| Reset completo (dev only) | `npx prisma migrate reset` | Apenas local — destrói todos os dados |
| Checar status | `npx prisma migrate status` | Verificar se há migrations pendentes |
| Sincronizar schema sem migration | `npx prisma db push` | Protótipos rápidos (não gera arquivo) |

> ⚠️ **`prisma migrate reset` é DESTRUTIVO.** Nunca usar em staging ou produção.

### Fluxo de Desenvolvimento

```bash
# 1. Alterar schema.prisma
# 2. Gerar e aplicar migration
npx prisma migrate dev --name "add_campo_xyz_a_resellers"

# 3. Gerar client atualizado
npx prisma generate

# 4. Rodar seed se necessário
npx prisma db seed
```

### Convenção de Nomes de Migration

```
YYYY_MM_DD_descricao_curta
```

Exemplos:
- `20260101_initial_schema`
- `20260115_add_audit_log_table`
- `20260201_add_label_to_commission_tiers`

---

## 2. Seed de Dados Obrigatórios

### Arquivo Principal: `prisma/seed.ts`

```ts
import { PrismaClient } from '@prisma/client';
import { seedGamificacao } from './seeds/seed-gamificacao';
import { seedNiveis } from './seeds/seed-niveis';
import { seedCommissionTiers } from './seeds/seed-commission-tiers';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed...');
  await seedGamificacao(prisma);
  await seedNiveis(prisma);
  await seedCommissionTiers(prisma);
  console.log('Seed concluído com sucesso.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Configurar no `package.json`:
```json
{
  "prisma": {
    "seed": "ts-node --project tsconfig.json prisma/seed.ts"
  }
}
```

---

### 2.1 Seed — Regras de Gamificação

**Arquivo:** `prisma/seeds/seed-gamificacao.ts`

> Estes dados são **obrigatórios** — sem eles, nenhum ponto pode ser concedido.

```ts
export async function seedGamificacao(prisma: PrismaClient) {
  const regras = [
    {
      nome: 'Primer Acceso',
      descricao: 'Primera vez que la revendedora ingresa al portal.',
      acao: 'primeiro_acesso',
      pontos: 50,
      tipo: 'unico',
      icone: 'star',
      ativo: true,
      ordem: 1,
    },
    {
      nome: 'Perfil Completo',
      descricao: 'Completó foto, WhatsApp y datos bancarios.',
      acao: 'perfil_completo',
      pontos: 100,
      tipo: 'unico',
      icone: 'user-check',
      ativo: true,
      ordem: 2,
    },
    {
      nome: 'Venta Registrada',
      descricao: 'Registró una venta en la consignación.',
      acao: 'venda_maleta',
      pontos: 10,
      tipo: 'por_evento',
      icone: 'shopping-bag',
      ativo: true,
      limite_diario: 20,
      ordem: 3,
    },
    {
      nome: 'Devolución a Tiempo',
      descricao: 'Devolvió la consignación antes del plazo.',
      acao: 'devolucao_prazo',
      pontos: 50,
      tipo: 'por_evento',
      icone: 'clock',
      ativo: true,
      ordem: 4,
    },
    {
      nome: 'Consignación Completa',
      descricao: 'Vendió el 100% de los productos de la consignación.',
      acao: 'maleta_completa',
      pontos: 200,
      tipo: 'por_evento',
      icone: 'trophy',
      ativo: true,
      ordem: 5,
    },
    {
      nome: 'Catálogo Compartido',
      descricao: 'Compartió el catálogo por WhatsApp.',
      acao: 'compartilhou_catalogo',
      pontos: 5,
      tipo: 'diario',
      icone: 'share-2',
      ativo: true,
      limite_diario: 3,
      ordem: 6,
    },
    {
      nome: 'Meta Mensual',
      descricao: 'Alcanzó la meta de ventas del mes.',
      acao: 'meta_mensal',
      pontos: 500,
      tipo: 'mensal',
      icone: 'target',
      ativo: true,
      meta_valor: 3000000, // G$ 3.000.000
      ordem: 7,
    },
  ];

  for (const regra of regras) {
    await prisma.gamificacaoRegra.upsert({
      where: { acao: regra.acao },
      create: regra,
      update: regra, // Permite atualizar pontos/descricao sem recriar
    });
  }

  console.log(`✅ ${regras.length} regras de gamificação sincronizadas.`);
}
```

---

### 2.2 Seed — Níveis de Gamificação

**Arquivo:** `prisma/seeds/seed-niveis.ts`

```ts
export async function seedNiveis(prisma: PrismaClient) {
  const niveis = [
    { nome: 'Bronce',   pontos_minimos: 0,    cor: '#CD7F32', ordem: 1, ativo: true },
    { nome: 'Plata',    pontos_minimos: 500,  cor: '#C0C0C0', ordem: 2, ativo: true },
    { nome: 'Oro',      pontos_minimos: 1500, cor: '#FFD700', ordem: 3, ativo: true },
    { nome: 'Diamante', pontos_minimos: 3000, cor: '#B9F2FF', ordem: 4, ativo: true },
  ];

  for (const nivel of niveis) {
    await prisma.nivelRegra.upsert({
      where: { nome: nivel.nome },   // requer @unique no schema
      create: nivel,
      update: nivel,
    });
  }

  console.log(`✅ ${niveis.length} níveis de gamificação sincronizados.`);
}
```

> **Nota:** Adicionar `@@unique([nome])` ao modelo `NivelRegra` no schema para permitir o upsert acima.

---

### 2.3 Seed — Faixas de Comissão

**Arquivo:** `prisma/seeds/seed-commission-tiers.ts`

```ts
export async function seedCommissionTiers(prisma: PrismaClient) {
  const tiers = [
    { label: 'Base',    min_sales_value: 0,       commission_pct: 20 },
    { label: 'Plata',   min_sales_value: 1000000, commission_pct: 25 },
    { label: 'Oro',     min_sales_value: 3000000, commission_pct: 30 },
    { label: 'Platina', min_sales_value: 5000000, commission_pct: 35 },
    { label: 'Elite',   min_sales_value: 8000000, commission_pct: 40 },
  ];
  // Valores em guaranis (G$)

  for (const tier of tiers) {
    await prisma.commissionTier.upsert({
      where: { min_sales_value: tier.min_sales_value },
      create: tier,
      update: tier,
    });
  }

  console.log(`✅ ${tiers.length} faixas de comissão sincronizadas.`);
}
```

---

## 3. Ordem de Execução do Setup Inicial

```bash
# 1. Configurar .env com todas as variáveis (ver SPEC_ENVIRONMENT_VARIABLES.md)

# 2. Gerar o Prisma Client
npx prisma generate

# 3. Aplicar migrations (cria tabelas)
npx prisma migrate deploy

# 4. Popular dados obrigatórios
npx prisma db seed

# 5. Verificar
npx prisma studio  # Abrir GUI visual do banco
```

---

## 4. Schema: Correções Necessárias para o Seed

O seed acima requer ajustes pontuais no `schema.prisma`:

### 4.1 Campo `label` em `CommissionTier`

```prisma
// Adicionar campo label (já documentado em SPEC_ADMIN_CONFIG.md):
model CommissionTier {
  label           String          // ex: "Base", "Plata", "Oro"
  min_sales_value Decimal @unique // ← adicionar @unique para upsert
  // ...
}
```

### 4.2 `@unique` em `NivelRegra`

```prisma
model NivelRegra {
  nome String @unique  // ← adicionar para upsert por nome
  // ...
}
```

---

## 5. Backup e Restore

### Backup Manual (Supabase)

```bash
# Via CLI Supabase
supabase db dump -f backup_$(date +%Y%m%d).sql --linked

# Via pg_dump (conexão direta)
pg_dump "$DIRECT_URL" -F c -f backup_$(date +%Y%m%d).dump
```

### Restore

```bash
# Restore completo (destrói dados existentes)
psql "$DIRECT_URL" < backup_20260101.sql

# Restore seletivo (tabela específica)
pg_restore -d "$DIRECT_URL" -t resellers backup_20260101.dump
```

### Política de Backup

| Ambiente | Frequência | Retenção |
|---------|-----------|---------|
| Produção | Diário (Supabase automático) | 7 dias |
| Produção | Semanal (manual via script) | 30 dias |
| Staging | Não aplicável | — |

> Supabase Pro inclui Point-in-Time Recovery (PITR) até 7 dias.

---

## 6. Procedure de Reset em Desenvolvimento

```bash
# ATENÇÃO: destrói todos os dados locais
npx prisma migrate reset

# Após reset, automaticamente roda seed
# (configurado no prisma.seed do package.json)
```

---

## 7. Checklist de Validação Pós-Deploy

```bash
# Verificar migrations aplicadas
npx prisma migrate status

# Verificar dados seed
npx prisma studio  # visualizar tabelas

# Checklist manual:
# [ ] gamificacao_regras tem 7 registros
# [ ] nivel_regras tem 4 registros (Bronce, Plata, Oro, Diamante)
# [ ] commission_tiers tem pelo menos 1 registro com min_sales_value = 0
# [ ] Conectar como SUPER_ADMIN e verificar painel /admin/dashboard
```
