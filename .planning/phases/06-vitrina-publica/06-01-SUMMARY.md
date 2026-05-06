# Plan 06-01 Summary: Vitrina Base

**Phase:** 06-vitrina-publica  
**Plan:** 01  
**Status:** Complete  
**Completed:** 2026-05-05

## What Was Built

Foundation of the public reseller storefront (`/vitrina/{slug}`):

1. **Data layer** (`src/lib/vitrina.ts`)
   - `getVitrinaData(slug)` — queries active reseller + active maleta items with nested `include` to avoid N+1
   - Exports `VitrinaItem` and `VitrinaData` types
   - Maps Prisma `Decimal` prices to `number` for UI consumption

2. **Shared components** (`src/components/vitrina/`)
   - `VitrinaHeader.tsx` — hero with avatar, name, bio, WhatsApp CTA, and link back to Monarca
   - `ProductCard.tsx` — image + name + price card linking to detail page (`/vitrina/{slug}/{variantId}`)
   - `ProductGrid.tsx` — responsive grid (2/3/4 cols) with item count label
   - `EmptyState.tsx` — centered message + WhatsApp CTA when no active maleta

3. **Page** (`src/app/vitrina/[slug]/page.tsx`)
   - ISR with `revalidate = 300`
   - `generateMetadata` with dynamic OG tags and `robots: 'noindex'`
   - `notFound()` for missing/inactive slugs
   - Conditional rendering: `EmptyState` when no items, `ProductGrid` otherwise

4. **Layout** (`src/app/vitrina/[slug]/layout.tsx`)
   - Shared layout wrapper for vitrina pages

5. **RLS policies** (`scripts/rls-policies.sql`)
   - `maletas_anon_read_active` — allows anon SELECT on active maletas
   - `maleta_itens_anon_read_active` — allows anon SELECT on items belonging to active maletas

## Key Decisions

- Reused visual patterns from existing catalog page (`/catalogo/[slug]/page.tsx`) for consistency
- Used `prisma.maletaItem.fields.quantidade_enviada` for field-reference comparison in the `where` clause (Prisma 7 pattern)
- Price displayed = current `ProductVariant.price` (exception to maleta immutability rule for public vitrina per decision D-09)

## Verification

- `npm run build` passes with zero errors
- All acceptance criteria from 06-01-PLAN.md satisfied

## Files Created/Modified

- `src/lib/vitrina.ts` (created)
- `src/components/vitrina/VitrinaHeader.tsx` (created)
- `src/components/vitrina/ProductCard.tsx` (created)
- `src/components/vitrina/ProductGrid.tsx` (created)
- `src/components/vitrina/EmptyState.tsx` (created)
- `src/app/vitrina/[slug]/page.tsx` (modified — replaced stub)
- `src/app/vitrina/[slug]/layout.tsx` (created)
- `scripts/rls-policies.sql` (modified — added policies 24-25)
