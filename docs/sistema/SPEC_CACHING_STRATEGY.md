# SPEC — Estratégia de Cache (Next.js)

## Objetivo
Definir quais dados são cacheados, por quanto tempo e como invalidar, equilibrando performance do Next.js (Data Cache, Full Route, Router Cache, React Cache) com frescor requerido por domínio.

## Atores
- **Next.js runtime** — aplica `cache()`, `unstable_cache`, `revalidate`, `force-dynamic`.
- **Server Actions** — chamam `revalidatePath` / `revalidateTag` após mutações.
- **Desenvolvedor** — escolhe estratégia por rota/função.

## Fluxo
1. Identificar se o dado é volátil (maleta ativa, saldo, estoque) ou estável (tiers, categorias).
2. Voláteis: `export const dynamic = 'force-dynamic'` ou não usar cache.
3. Estáveis: usar `unstable_cache` com TTL e tags; invalidar com `revalidateTag` nas mutações.
4. Páginas puramente estáticas ganham Full Route Cache automaticamente.
5. Client-side Router Cache é gerido pelo Next, mas cuidar com `router.refresh()` pós-mutação.

## Regras de negócio
- Dados sempre frescos: maleta ativa, estoque, saldo de pontos, solicitações de brindes, notificações.
- Dados cacheados: comissão (tier), `CommissionTier`, categorias, regras de gamificação, contratos.
- TTL padrão para dados semi-estáveis: 60s–300s conforme criticidade.
- Toda mutação relevante deve invalidar por tag/path correspondente.
- Evitar cache em `Route Handlers` sensíveis (analytics, uploads).

## Edge cases
- Revendedora vê comissão cacheada antiga após fechar maleta → revalidar tag `commission:{resellerId}` em `closeMaleta`.
- Estoque cacheado que causaria overselling → nunca cachear.
- Build statico falhando por dado dinâmico → marcar como `dynamic`.
- Admin atualiza tier e revendedoras continuam vendo valor antigo → invalidar tag global.

## Dependências
- `SPEC_BACKEND.md` — mutações que devem invalidar cache.
- `SPEC_FRONTEND.md` — páginas e estratégias por rota.
- `SPEC_CRON_JOBS.md` — jobs podem forçar revalidações noturnas.

---

## Detalhes técnicos / Referência

> Define quais dados são cacheados, por quanto tempo, e como invalidar o cache de forma precisa.

---

## 1. Camadas de Cache no Projeto

| Camada | Mecanismo | Escopo |
|--------|----------|--------|
| **React Cache** | `cache()` do React | Por request — deduplicação |
| **Next.js Data Cache** | `unstable_cache()` | Persistido entre requests/deploys |
| **Full Route Cache** | Geração estática automática | Páginas puramente estáticas |
| **Router Cache** | Client-side (Next.js router) | Navegação no cliente |

---

## 2. Dados que NÃO devem ser cacheados

Estes dados mudam com frequência e devem ser sempre frescos:

| Dado | Motivo |
|------|--------|
| Maleta ativa da revendedora | Muda ao registrar venda |
| Estoque de produtos | Muda com cada maleta criada |
| Saldo de pontos | Muda ao registrar venda ou resgatar brinde |
| Solicitações de brinde pendentes | Estado admin muda a qualquer momento |
| Notificações não lidas | Tempo real |

**Usar `export const dynamic = 'force-dynamic'`** em páginas com estes dados.

---

## 3. Dados que DEVEM ser cacheados

### 3.1 Comissão da Revendedora

```ts
// src/app/app/actions-revendedora.ts
export const getCommissionPct = unstable_cache(
  async (resellerId: string) => computeCommissionPct(resellerId),
  ['commission'],
  {
    tags: [`commission-${resellerId}`],
    revalidate: 3600, // 1h — máximo de staleness aceitável
  }
);
```

**Invalidar quando:**
- `closeMaleta()` → `revalidateTag('commission-${resellerId}')`
- Admin altera `taxa_comissao` → `revalidateTag('commission-${resellerId}')`

---

### 3.2 Catálogo de Produtos

```ts
// src/app/app/catalogo/queries.ts
export const getActiveCatalog = unstable_cache(
  async () => prisma.product.findMany({
    where: { ativo: true },
    include: { variants: { where: { ativo: true } }, category: true },
    orderBy: { name: 'asc' },
  }),
  ['catalog-active'],
  {
    tags: ['catalog'],
    revalidate: 3600, // 1h
  }
);
```

**Invalidar quando:**
- Admin cria/edita/inativa produto → `revalidateTag('catalog')`
- Admin altera estoque de variante → `revalidateTag('catalog')`

---

### 3.3 Brindes Disponíveis

```ts
export const getActiveBrindes = unstable_cache(
  async () => prisma.brinde.findMany({
    where: { ativo: true },
    orderBy: { custo_pontos: 'asc' },
  }),
  ['brindes-active'],
  {
    tags: ['brindes'],
    revalidate: 1800, // 30min
  }
);
```

**Invalidar quando:**
- Admin cria/edita/inativa brinde → `revalidateTag('brindes')`

---

### 3.4 Regras de Gamificação

```ts
export const getGamificacaoRegras = unstable_cache(
  async () => prisma.gamificacaoRegra.findMany({
    where: { ativo: true },
    orderBy: { ordem: 'asc' },
  }),
  ['gamificacao-regras'],
  {
    tags: ['gamificacao-config'],
    revalidate: 86400, // 24h — raramente muda
  }
);
```

**Invalidar quando:**
- Admin edita regra ou pontos → `revalidateTag('gamificacao-config')`

---

### 3.5 Vitrina Pública (`/vitrina/[slug]`)

```ts
// src/app/vitrina/[slug]/queries.ts
export const getVitrineData = unstable_cache(
  async (slug: string) => prisma.reseller.findUnique({
    where: { slug },
    include: { /* produtos e categoria */ },
  }),
  ['vitrine'],
  {
    tags: [`vitrine-${slug}`],
    revalidate: 3600, // 1h
  }
);
```

**Invalidar quando:**
- Revendedora atualiza foto de perfil ou nome → `revalidateTag('vitrine-${slug}')`

---

### 3.6 Níveis e Faixas de Comissão (Config Global)

```ts
export const getNiveisRegras = unstable_cache(
  async () => prisma.nivelRegra.findMany({ where: { ativo: true }, orderBy: { pontos_minimos: 'asc' } }),
  ['niveis-regras'],
  { tags: ['niveis-config'], revalidate: 86400 } // 24h
);

export const getCommissionTiers = unstable_cache(
  async () => prisma.commissionTier.findMany({ where: { ativo: true }, orderBy: { min_sales_value: 'asc' } }),
  ['commission-tiers'],
  { tags: ['tiers-config'], revalidate: 86400 } // 24h
);
```

---

## 4. Tabela de Tags de Cache

| Tag | TTL | Invalidado por |
|-----|-----|---------------|
| `commission-{resellerId}` | 1h | `closeMaleta`, admin muda taxa |
| `catalog` | 1h | Admin altera produto/variante |
| `brindes` | 30min | Admin altera brinde |
| `gamificacao-config` | 24h | Admin altera regra de gamificação |
| `vitrine-{slug}` | 1h | Revendedora atualiza perfil |
| `niveis-config` | 24h | Admin altera níveis |
| `tiers-config` | 24h | Admin altera faixas de comissão |

---

## 5. Deduplicação por Request (React `cache()`)

Para queries que aparecem em múltiplos Server Components na mesma página:

```ts
// src/lib/queries/get-reseller.ts
import { cache } from 'react';

export const getResellerProfile = cache(async (resellerId: string) => {
  return prisma.reseller.findUnique({ where: { id: resellerId } });
});
// Chamada 3x na mesma renderização → 1 única query ao banco
```

---

## 6. Invalidação Centralizada

Criar helper para não espalhar `revalidateTag` pelo código:

```ts
// src/lib/cache/invalidate.ts
export const invalidateCache = {
  commission: (resellerId: string) => revalidateTag(`commission-${resellerId}`),
  catalog: () => revalidateTag('catalog'),
  brindes: () => revalidateTag('brindes'),
  gamificacaoConfig: () => revalidateTag('gamificacao-config'),
  vitrine: (slug: string) => revalidateTag(`vitrine-${slug}`),
  niveisConfig: () => revalidateTag('niveis-config'),
  tiersConfig: () => revalidateTag('tiers-config'),
};

// Uso em Server Actions:
await invalidateCache.commission(resellerId);
await invalidateCache.catalog();
```

---

## 7. Debug de Cache em Desenvolvimento

```bash
# Forçar revalidação de tudo (desenvolvimento)
# Adicionar ?_bust=1 na URL não funciona no Data Cache — usar:

# Opção 1: Adicionar botão "Limpar cache" para admins em dev
# Opção 2: Reiniciar o servidor Next.js

# Ver logs de cache:
NEXT_PRIVATE_DEBUG_CACHE=1 npm run dev
```

---

## 8. Dados Estáticos (Full Route Cache)

Rotas que podem ser completamente estáticas (geradas em build time):

| Rota | Estratégia | Nota |
|------|-----------|------|
| `/app/login` | Estática | Sem dados dinâmicos |
| `/app/progreso` (layout) | Estática | Conteúdo explicativo fixo |

Rotas que precisam ser dinâmicas (`force-dynamic`):
- `/app` (dashboard) — dados da revendedora logada
- `/app/maleta` — maleta ativa em tempo real
- `/admin/*` — dados em tempo real para admin
