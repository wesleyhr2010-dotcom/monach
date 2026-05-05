# 04-01 — Vercel Environment & ISR Configuration

## What was built

- Removido `export const dynamic = "force-dynamic"` de `src/app/catalogo/[slug]/[productSlug]/page.tsx` e substituído por `export const revalidate = 60` (ISR).
- Criada página placeholder `src/app/vitrina/[slug]/page.tsx` com ISR (`revalidate = 60`).
- Verificado que `src/lib/prisma.ts` já possui pool limits adequados para serverless (`max: 10`, `idleTimeoutMillis: 30000`, `connectionTimeoutMillis: 5000`).
- Build local (`npm run build`) executado com sucesso — nenhum `PrismaClientInitializationError` em páginas públicas.

## Decisions

- `src/app/carrinho/page.tsx` é um Client Component ("use client") e não precisa de diretiva de cache — mantido sem alterações.
- A página `vitrina/[slug]` ainda não possui conteúdo completo (feature não iniciada), mas o arquivo foi criado para garantir que a rota pública tenha ISR desde o início.

## Files changed

- `src/app/catalogo/[slug]/[productSlug]/page.tsx`
- `src/app/vitrina/[slug]/page.tsx` (criado)

## Verification

- ✅ `npm run build` passa sem erros
- ✅ Nenhuma página pública usa `force-dynamic`
- ✅ Todas as páginas públicas têm `revalidate = 60` ou são estáticas/client-side

## Pending

- **Task 1 (human-action):** Configurar `DATABASE_URL` e `DIRECT_URL` no Vercel Dashboard (Production, Preview, Development) e triggerar um redeploy para validação em produção.
