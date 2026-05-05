// ============================================
// Monarca Semijoias — Cache Invalidation Helper
// ============================================
//
// REGRAS:
// 1. Toda invalidação de cache DEVE passar por este helper.
// 2. Ao adicionar uma nova query cacheada via unstable_cache,
//    adicione o método de invalidação correspondente aqui.
// 3. Tags devem corresponder EXATAMENTE às usadas nas chamadas
//    unstable_cache (case-sensitive).
//
// Referência: docs/sistema/SPEC_CACHING_STRATEGY.md §4 e §6
//

import { revalidateTag, revalidatePath } from "next/cache";

export const invalidateCache = {
  // Comissão de uma revendedora específica
  commission: (resellerId: string) => revalidateTag(`commission-${resellerId}`, "max"),

  // Catálogo de produtos (páginas públicas)
  catalog: () => revalidateTag("catalog", "max"),

  // Catálogo de brindes
  brindes: () => revalidateTag("brindes", "max"),

  // Regras de gamificação
  gamificacaoConfig: () => revalidateTag("gamificacao-config", "max"),

  // Vitrina pública de uma revendedora
  vitrine: (slug: string) => revalidateTag(`vitrine-${slug}`, "max"),

  // Configuração de tiers de comissão
  tiersConfig: () => revalidateTag("tiers-config", "max"),

  // Configuração de níveis de gamificação
  niveisConfig: () => revalidateTag("niveis-config", "max"),

  // Dashboard de KPIs do admin
  adminDashboard: () => revalidateTag("admin-dashboard", "max"),

  // Dashboard de desempenho da revendedora
  desempeno: (resellerId: string) => revalidateTag(`desempeno-${resellerId}`, "max"),

  // Helpers genéricos de revalidatePath
  path: {
    product: (slug: string) => revalidatePath(`/produto/${slug}`),
    catalogo: () => revalidatePath("/catalogo"),
    vitrina: (slug: string) => revalidatePath(`/vitrina/${slug}`),
    admin: (path: string) => revalidatePath(`/admin${path}`),
    app: (path: string) => revalidatePath(`/app${path}`),
  },
};
