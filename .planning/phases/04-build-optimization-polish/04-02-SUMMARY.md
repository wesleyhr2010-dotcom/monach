# 04-02 — Cache Invalidation Wiring

## What was built

- Criado helper centralizado `src/lib/cache/invalidate.ts` com `invalidateCache` exportando métodos tipados para invalidação de todas as tags de cache do projeto.
- Adicionadas chamadas de `invalidateCache` (via `revalidateTag`/`revalidatePath`) em **14 arquivos de Server Actions** após cada mutação Prisma bem-sucedida.

## invalidateCache API

```ts
invalidateCache.commission(resellerId)
invalidateCache.catalog()
invalidateCache.brindes()
invalidateCache.gamificacaoConfig()
invalidateCache.vitrine(slug)
invalidateCache.tiersConfig()
invalidateCache.niveisConfig()
invalidateCache.adminDashboard()
invalidateCache.desempeno(resellerId)
invalidateCache.path.product(slug)
invalidateCache.path.catalogo()
invalidateCache.path.vitrine(slug)
invalidateCache.path.admin(path)
invalidateCache.path.app(path)
```

## Files changed

- `src/lib/cache/invalidate.ts` (criado)
- `src/app/admin/actions-products.ts`
- `src/app/admin/actions-categories.ts`
- `src/app/admin/actions-maletas.ts`
- `src/app/admin/actions-config.ts`
- `src/app/admin/actions-equipe.ts`
- `src/app/admin/actions-gamificacao.ts`
- `src/app/admin/actions-leads.ts`
- `src/app/admin/brindes/actions.ts`
- `src/app/admin/config/notif-push/actions.ts`
- `src/app/admin/revendedoras/[id]/documentos/actions.ts`
- `src/app/app/actions-revendedora.ts`
- `src/app/app/perfil/actions.ts`
- `src/app/app/notificaciones/actions.ts`
- `src/app/app/bienvenida/actions.ts`

## Decisions

- `revalidateTag` no Next.js 15 requer segundo argumento (`profile`). Usamos `"max"` como padrão conforme recomendação da mensagem de depreciação.
- `brindes/actions.ts` já usava `revalidatePath` — mantido e complementado com `invalidateCache.brindes()`.
- `actions.ts` na raiz de `src/app/` não possui mutações — não foi modificado.

## Verification

- ✅ `npm run build` passa sem erros
- ✅ `npx tsc --noEmit` sem erros em código de produção
- ✅ `invalidateCache` importado e usado em 14 arquivos de mutation actions
- ✅ Gap audit: nenhum arquivo de mutation action sem invalidação

## Notable deviations

- Nenhuma.
