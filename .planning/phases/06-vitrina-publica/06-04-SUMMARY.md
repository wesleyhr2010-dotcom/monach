# Plan 06-04 Summary: Cart & Checkout

**Phase:** 06-vitrina-publica  
**Plan:** 04  
**Status:** Complete  
**Completed:** 2026-05-05

## What Was Built

Client-side shopping cart for the public vitrina with WhatsApp checkout:

1. **Cart library** (`src/lib/cart-vitrina.ts`)
   - `VitrinaCartItem` and `VitrinaCart` interfaces
   - `getVitrinaCart`, `saveVitrinaCart`, `clearVitrinaCart`
   - `addToVitrinaCart(item, resellerSlug, quantity)` — auto-clears cart on reseller switch, increments quantity (cap 10) for duplicate variants
   - `removeFromVitrinaCart(variantId)`
   - `getVitrinaCartCount`, `getVitrinaCartTotal`
   - `buildWhatsAppMessage(cart, resellerName)` — formatted list + total, truncated to ~2000 chars

2. **CartProvider** (`src/components/vitrina/CartProvider.tsx`)
   - React Context with `useVitrinaCart` hook
   - Syncs with localStorage via `VITRINA_CART_UPDATED_EVENT` CustomEvent
   - Isolates cart per `reseller_slug`

3. **CartBadge** (`src/components/vitrina/CartBadge.tsx`)
   - Fixed bottom-right floating button with `z-50`
   - Shopping bag icon + red count badge
   - Opens drawer on click

4. **CartDrawer** (`src/components/vitrina/CartDrawer.tsx`)
   - Slide-up drawer with backdrop
   - Lists items with thumbnail, name, quantity, price, subtotal
   - Remove button per item (🗑️)
   - Empty state: "Tu carrito está vacío" + back link
   - Checkout button: opens WhatsApp with encoded message
   - Fires `clique_whatsapp` tracking event before opening WhatsApp

5. **CartShell** (`src/components/vitrina/CartShell.tsx`)
   - Client wrapper that manages `isOpen` state for badge + drawer

6. **Layout integration** (`src/app/vitrina/[slug]/layout.tsx`)
   - Server Component fetches minimal reseller data
   - Wraps all vitrina pages with `CartProvider` + `CartShell`
   - Badge visible on both `/vitrina/{slug}` and `/vitrina/{slug}/{produtoId}`

## Key Decisions

- Cart isolated per `reseller_slug` — switching resellers clears previous cart
- Duplicate variants increment quantity (max 10) instead of creating new lines
- Message truncated to ~2000 chars to stay within WhatsApp practical limits
- Checkout button fires tracking event before `window.open` to ensure it reaches the server

## Verification

- `npm run build` passes with zero errors
- All acceptance criteria from 06-04-PLAN.md satisfied

## Files Created/Modified

- `src/lib/cart-vitrina.ts` (created)
- `src/components/vitrina/CartProvider.tsx` (created)
- `src/components/vitrina/CartBadge.tsx` (created)
- `src/components/vitrina/CartDrawer.tsx` (created)
- `src/components/vitrina/CartShell.tsx` (created)
- `src/app/vitrina/[slug]/layout.tsx` (modified — added CartProvider + CartShell + data fetch)
