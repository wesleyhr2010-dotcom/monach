# Phase 6: Vitrina Pública — Research

**Researched:** 2026-05-05
**Domain:** Next.js App Router public pages, anonymous analytics tracking, client-side cart, WhatsApp integration
**Confidence:** HIGH

## Summary

Phase 6 delivers a public reseller storefront (`/vitrina/{slug}`) accessible without authentication, featuring ISR-cached content, anonymous visit tracking via cookie, a client-side shopping cart in localStorage, product detail pages, and WhatsApp checkout with formatted messages. The phase builds heavily on existing patterns from the catalog (`/catalogo/[slug]`) and leverages established RLS policies, data sanitization, and Prisma query patterns.

The core architectural tension is between **ISR for performance** (static generation with 300s revalidate) and **dynamic tracking** (per-visit analytics). This is resolved by separating concerns: Server Components render cached content; a lightweight client-side `useEffect` fires tracking events to `/api/vitrina/track` after hydration. The cart is entirely client-side (localStorage), which simplifies the backend but limits cross-device persistence — acceptable per the MVP scope.

**Primary recommendation:** Reuse the catalog page structure and `AnalyticsTracker` pattern, extract shared components into `src/components/vitrina/`, implement a dedicated `/api/vitrina/track` endpoint with strict event whitelist, and build a `CartProvider` context for localStorage cart management with a sticky floating badge.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Public page rendering (ISR) | CDN / Static (Next.js ISR) | — | Pages are pre-rendered at build time and revalidated every 300s |
| SEO metadata generation | Frontend Server (SSR) | — | `generateMetadata` runs at request time for OG tags |
| Anonymous tracking cookie | Middleware + Browser | API Route | Middleware sets base `mnrc_vid`; endpoint validates/regenerates |
| Tracking event ingestion | API / Backend | — | `/api/vitrina/track` receives and persists events |
| Cart state management | Browser (Client) | — | localStorage only; no server persistence per scope |
| WhatsApp message generation | Browser (Client) | — | `encodeURIComponent` + `window.open` to `wa.me` |
| Product data fetching | API / Backend (Prisma) | — | Server Components query via Prisma with RLS `anon` policies |

---

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** ISR com `revalidate = 300` (5 minutos) para conteúdo da vitrina.
- **D-02:** Endpoint dedicado `/api/vitrina/track` para tracking de eventos da vitrina (whitelist: `catalogo_revendedora`, `clique_whatsapp`).
- **D-03:** `visitor_id` gerado via **middleware + cliente** (defesa em profundidade).
- **D-04:** Reusar design do catálogo existente (`/catalogo/[slug]`) com adaptações.
- **D-05:** Extrair componentes compartilhados em `src/components/vitrina/`.
- **D-06:** Quando não há maleta ativa: exibir perfil + mensagem simples + CTA WhatsApp genérico.
- **D-08:** Vitrina mostra **apenas itens da maleta ativa** (`status = 'ativa'` + saldo).
- **D-09:** Preço exibido = **preço atual do ProductVariant** (exceção à imutabilidade da maleta).
- **D-10:** Query encapsulada em função utilitária `getVitrinaData(slug)` em `src/lib/vitrina.ts`.
- **D-11:** Grid mostra **um card por variant** (cada `MaletaItem` é um card).
- **D-12:** Grid leva para **página de detalhe do produto** (`/vitrina/{slug}/{produtoId}`).
- **D-13:** CTA WhatsApp aparece **após adicionar produtos ao carrinho**.
- **D-14:** Carrinho armazenado em **localStorage**.
- **D-15:** Carrinho acessível via **badge flutuante sticky**.
- **D-16:** "Finalizar pedido" gera **mensagem formatada** para WhatsApp.

### the agent's Discretion
- Layout exato do badge flutuante do carrinho (posição, animação).
- Estrutura da mensagem WhatsApp formatada (formatação exata, emojis).
- Componentização interna da página de detalhe do produto.
- Estado vazio do carrinho (mensagem e CTA).
- Transições/loading states entre grid → detalhe → carrinho.

### Deferred Ideas (OUT OF SCOPE)
- Checkout próprio com pagamento (PIX, cartão).
- Persistência do carrinho no servidor.
- Compartilhamento do carrinho via link.
- Notificações de estoque.
- Reviews/avaliações.
- Indexação Google da vitrina (`noindex` deliberado).

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| VITR-01 | Cliente pode acessar vitrina pública via URL `/vitrina/{slug}` | Next.js App Router dynamic segment `[slug]` |
| VITR-02 | Vitrina exibe foto de perfil, nome e CTA WhatsApp da revendedora | Reuse catalog hero pattern + `getPublicVitrinaData` |
| VITR-03 | Vitrina exibe grid de produtos da maleta ativa com preços | Prisma query via `Maleta` + `MaletaItem` + `ProductVariant` |
| VITR-04 | Cada produto na grid é clicável e leva para página de detalhe | Dynamic route `[slug]/[produtoId]` |
| VITR-05 | Slug inexistente ou revendedora inativa retorna 404 | `notFound()` from `next/navigation` |
| VITR-06 | Sem maleta ativa exibe perfil + mensagem + CTA WhatsApp genérico | Conditional rendering in Server Component |
| VITR-07 | SEO metadata gerada dinamicamente (título, descrição, OG tags) | `generateMetadata` exported from page |
| VITR-08 | Página usa `robots: noindex` | `robots: 'noindex'` in metadata object |
| VITR-09 | Visitas rastreadas anonimamente com `visitor_id` em cookie | Middleware sets `mnrc_vid`; client-side tracking POST |
| VITR-10 | Eventos de checkout WhatsApp rastreados como `clique_whatsapp` | `/api/vitrina/track` with event whitelist |
| VITR-11 | API de tracking dedicada aceita apenas eventos whitelist | Strict validation in Route Handler |
| VITR-12 | RLS permite leitura anônima de dados da vitrina | Existing policies: `resellers_public_read_active`, `products_anon_read`, `product_variants_anon_read` |
| VITR-13 | Página de detalhe exibe fotos, descrição e botão "Agregar al carrito" | Server Component for data + Client Component for interactivity |
| VITR-14 | Produtos na grid levam para página de detalhe ao serem clicados | `<Link href={...}>` wrapping cards |
| VITR-15 | Carrinho em localStorage com estrutura `{ items: [...] }` | Extend existing `src/lib/cart.ts` or create `CartProvider` |
| VITR-16 | Badge flutuante sticky exibe contador de itens | `position: fixed` component listening to `CustomEvent` |
| VITR-17 | "Finalizar pedido" gera mensagem formatada para WhatsApp | `encodeURIComponent(buildOrderMessage(...))` + `window.open` |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 15 (App Router) | Framework, ISR, metadata API | Project standard — all public pages use it |
| React | 19 | UI library | Project standard |
| TypeScript | strict | Type safety | Project standard |
| Tailwind CSS | v4 | Styling | Project standard with design system tokens |
| Prisma | 7 + PrismaPg adapter | ORM, queries | Project standard — NO nested transactions |
| Supabase | — | Auth, database, RLS | Project standard — `anon` role for public read |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `next/image` | built-in | Image optimization, placeholders | All product images in grid and detail |
| `isomorphic-dompurify` | existing | Sanitization if rendering HTML descriptions | Product detail `description` field |

### Installation
No new dependencies required. All needed libraries are already in the project.

**Version verification:**
- Next.js 15, React 19, Prisma 7 confirmed via `package.json` and build output.

---

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              BROWSER                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │ VitrinaPage  │  │ ProductDetail│  │  CartBadge   │  │   Checkout  │  │
│  │   (Server)   │  │   (Server)   │  │   (Client)   │  │   (Client)  │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬──────┘  │
│         │ ISR (300s)      │ ISR (300s)      │ localStorage    │ window  │
│         │                 │                 │                 │ .open   │
└─────────┼─────────────────┼─────────────────┼─────────────────┼─────────┘
          │                 │                 │                 │
          ▼                 ▼                 │                 │
┌──────────────────────────────────────────┐  │                 │
│         NEXT.JS (App Router)             │  │                 │
│  ┌────────────────────────────────────┐  │  │                 │
│  │  generateMetadata() → SEO + OG     │  │  │                 │
│  │  getVitrinaData(slug) → Prisma     │  │  │                 │
│  │  notFound() if inactive/missing    │  │  │                 │
│  └────────────────────────────────────┘  │  │                 │
│                    │                     │  │                 │
│  ┌────────────────────────────────────┐  │  │                 │
│  │  /api/vitrina/track (Route Handler)│◄─┘  │                 │
│  │  - whitelist validation            │     │                 │
│  │  - bot detection                   │     │                 │
│  │  - fire-and-forget Prisma insert   │     │                 │
│  └────────────────────────────────────┘     │                 │
└────────────────────┼────────────────────────┘                 │
                     │                                            │
                     ▼                                            ▼
          ┌────────────────────┐                       ┌─────────────────┐
          │  PRISMA / SUPABASE │                       │  WHATSAPP (ext) │
          │  - Reseller (anon) │                       │  wa.me/{number} │
          │  - Maleta (anon)   │                       │  ?text={msg}    │
          │  - MaletaItem      │                       └─────────────────┘
          │  - ProductVariant  │
          │  - AnalyticsAcesso │
          └────────────────────┘
```

### Recommended Project Structure

```
src/
├── app/
│   ├── vitrina/
│   │   ├── [slug]/
│   │   │   ├── page.tsx              # Server Component — grid, ISR, metadata
│   │   │   ├── [produtoId]/
│   │   │   │   └── page.tsx          # Server Component — product detail
│   │   │   └── layout.tsx            # Shared layout (CartProvider + badge)
│   │   └── layout.tsx                # (optional) vitrina-specific root layout
│   └── api/
│       └── vitrina/
│           └── track/
│               └── route.ts          # POST — anonymous event tracking
├── components/
│   └── vitrina/
│       ├── VitrinaHeader.tsx         # Hero with avatar, name, bio
│       ├── ProductGrid.tsx           # Grid of product cards
│       ├── ProductCard.tsx           # Single card (image + name + price)
│       ├── CartBadge.tsx             # Floating sticky badge
│       ├── CartDrawer.tsx            # Drawer/modal with items
│       ├── WhatsAppCheckoutButton.tsx# Generate message + open wa.me
│       ├── AnalyticsTracker.tsx      # Client-side tracking POST
│       └── EmptyState.tsx            # No active maleta message
├── lib/
│   ├── vitrina.ts                    # getVitrinaData(slug), queries
│   ├── cart-vitrina.ts               # Vitrina-specific cart helpers (optional)
│   └── format.ts                     # formatGs (existing)
└── components/
    └── AnalyticsTracker.tsx          # Existing — can be adapted/reused
```

### Pattern 1: ISR Public Page with Dynamic Metadata
**What:** Server Component pre-renders at build time, revalidates every 300s. `generateMetadata` creates SEO tags dynamically from database.
**When to use:** All public-facing vitrina pages.
**Example:**
```typescript
// Source: Next.js docs + existing catalog pattern
export const revalidate = 300;

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const reseller = await getResellerBySlug(params.slug);
  if (!reseller) return { title: "Vitrina no encontrada" };
  return {
    title: `${reseller.name} | Joyería Monarca`,
    description: `Descubrí las hermosas joyas de ${reseller.name}`,
    openGraph: { images: [reseller.avatar_url || "/og-default.jpg"] },
    robots: "noindex",
  };
}
```

### Pattern 2: Client-Side Tracking with Fire-and-Forget
**What:** After hydration, a client component sends a POST to the tracking endpoint. The server writes to the database without blocking the response.
**When to use:** Anonymous analytics where accuracy is "best effort" and must not block UX.
**Example:**
```typescript
// Source: src/components/AnalyticsTracker.tsx (existing)
"use client";
useEffect(() => {
  fetch("/api/vitrina/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tipo_evento: "catalogo_revendedora", reseller_id: "..." }),
    keepalive: true,
  }).catch(() => {}); // silently fail
}, []);
```

### Pattern 3: localStorage Cart with CustomEvent Sync
**What:** Cart state lives in localStorage. All write operations dispatch a `CustomEvent("cart-updated")` that the floating badge listens to.
**When to use:** Simple client-only state that needs to be shared across components without prop drilling.
**Example:**
```typescript
// Source: src/lib/cart.ts (existing pattern)
function saveCart(items: CartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT));
}
```

### Anti-Patterns to Avoid
- **Fetching data in `useEffect` for initial render:** The product grid must be rendered server-side for SEO and performance. Client-side data fetching would cause waterfalls and empty states.
- **Using `force-dynamic` on public pages:** This would defeat ISR caching. Only use `force-dynamic` for authenticated pages per project convention.
- **Nested Prisma transactions:** Prisma 7 with PrismaPg adapter does not support `$transaction(async tx => ...)`. Use sequential queries or array-form `$transaction([...])`.
- **Calling `notFound()` without metadata:** Always return a minimal metadata object before `notFound()` to avoid Next.js warnings.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image optimization | Custom `<img>` tags | `next/image` with `fill` + `sizes` | Automatic WebP/AVIF, lazy loading, placeholder blur |
| Cookie management in middleware | Manual `Set-Cookie` string parsing | `NextResponse.cookies.set()` | Type-safe, handles encoding, secure flags |
| Bot detection regex | Single regex | Existing `BOT_PATTERNS` array in `api/track/route.ts` | Already covers 20+ crawlers, battle-tested |
| WhatsApp deep-link | Custom URL scheme logic | `https://wa.me/{number}?text={encoded}` | Official Meta API, works on mobile/desktop |
| Cart state management | Prop drilling through 3+ levels | `CartProvider` React Context + localStorage | Cleaner API, avoids prop drilling |
| Currency formatting | `.toString()` or manual separators | `formatGs()` from `src/lib/format.ts` | Handles `es-PY` locale, `Decimal` type, null safety |

**Key insight:** The project already has working patterns for tracking (`AnalyticsTracker`), cart (`src/lib/cart.ts`), and formatting (`src/lib/format.ts`). Extending these is safer and faster than rebuilding.

---

## Common Pitfalls

### Pitfall 1: ISR Stale Data for Tracking
**What goes wrong:** If tracking is server-rendered, each visit would trigger a re-render, defeating ISR caching. If tracking is client-only, pre-fetches and bots may be undercounted.
**Why it happens:** Confusion about where analytics logic belongs.
**How to avoid:** Keep content rendering in the Server Component (ISR). Move tracking to a client `useEffect` that POSTs to `/api/vitrina/track`. The endpoint handles bot detection and cookie management independently.
**Warning signs:** Build logs show "dynamic server usage" on a page meant to be static; tracking counts spike after deployments (pre-fetch noise).

### Pitfall 2: RLS Blocking Anonymous Reads
**What goes wrong:** The Prisma client in Server Components uses the `service_role` key (bypasses RLS), but if the project ever switches to `anon` key for public pages, queries for `Maleta` and `MaletaItem` will fail because no `anon` SELECT policies exist for those tables.
**Why it happens:** RLS policies in `scripts/rls-policies.sql` only cover `resellers`, `products`, `product_variants`, and `analytics_acessos` for `anon`.
**How to avoid:** The current architecture uses `service_role` via Prisma in Server Components, so RLS is not the enforcement layer for vitrina data — application-level filtering (`is_active = true`, `status = 'ativa'`) is. Document this clearly. If future phases require direct Supabase client queries from the browser, add `anon` policies for `maletas` and `maleta_itens`.
**Warning signs:** 403/401 errors if attempting to query Supabase JS client directly from browser; empty data when testing with `anon` key.

### Pitfall 3: localStorage Unavailable or Cleared
**What goes wrong:** Cart throws errors in SSR (no `window`), in private browsing (localStorage may be restricted), or after user clears storage.
**Why it happens:** `localStorage` is a browser API with no guarantee of availability.
**How to avoid:** Guard every localStorage access with `typeof window !== "undefined"`. Wrap `JSON.parse` in `try/catch`. Provide graceful degradation (empty cart, generic checkout message).
**Warning signs:** Hydration mismatches; `ReferenceError: localStorage is not defined` in SSR/build logs.

### Pitfall 4: N+1 Query When Loading Products
**What goes wrong:** Iterating over `MaletaItem` and querying `ProductVariant` for each item individually causes N+1 queries.
**Why it happens:** Prisma lazy-loads relations unless explicitly `include`d.
**How to avoid:** Use a single query with nested `include`:
```typescript
prisma.maleta.findFirst({
  where: { reseller_id: ..., status: 'ativa' },
  include: {
    itens: {
      where: { quantidade_vendida: { lt: prisma.maleta_itens.fields.quantidade_enviada } },
      include: { product_variant: { include: { product: true } } }
    }
  }
});
```
**Warning signs:** Slow page loads (>500ms) with many items; Prisma query logs showing repeated `SELECT` for the same relation.

### Pitfall 5: WhatsApp Message Exceeds Character Limit
**What goes wrong:** A large cart (10+ items) generates a message exceeding WhatsApp's ~2000 character practical limit, causing truncation or failed opens.
**Why it happens:** No truncation logic on message builder.
**How to avoid:** Count characters before `encodeURIComponent`. If over ~1800 chars, show a summary message: "Hola, vi tu vitrina y me interesan varios productos. Te envío la lista completa." plus total.
**Warning signs:** User reports that WhatsApp opens with an empty or truncated message.

### Pitfall 6: Floating Badge Overlapping Content
**What goes wrong:** The sticky cart badge covers footer content, CTAs, or bottom navigation on mobile.
**Why it happens:** `position: fixed` without adequate `padding-bottom` on the main container.
**How to avoid:** Add `pb-20` (or equivalent) to the main page container. Use a high `z-index` (e.g., `z-50`) for the badge but ensure the page layout reserves space at the bottom.
**Warning signs:** E2E screenshots or manual testing show the badge covering the "Finalizar pedido" button or footer links.

### Pitfall 7: Duplicate Cart Items
**What goes wrong:** Adding the same product twice creates two line items instead of incrementing quantity.
**Why it happens:** Cart key matching logic doesn't account for `variantId` correctly.
**How to avoid:** Match by `productId + variantId`. If found, increment `quantity` (capped at 10). If not, push new item.
**Warning signs:** Cart shows "2 items" but badge shows "2"; duplicate lines in WhatsApp message.

---

## Code Examples

### Example 1: getVitrinaData Query (Optimized)
```typescript
// Source: Prisma docs + project patterns
// src/lib/vitrina.ts
import { prisma } from "@/lib/prisma";

export async function getVitrinaData(slug: string) {
  const reseller = await prisma.reseller.findFirst({
    where: { slug, is_active: true },
    select: { id: true, name: true, avatar_url: true, bio: true, whatsapp: true },
  });

  if (!reseller) return null;

  const maleta = await prisma.maleta.findFirst({
    where: { reseller_id: reseller.id, status: "ativa" },
    include: {
      itens: {
        where: {
          quantidade_vendida: { lt: prisma.maleta_itens.fields.quantidade_enviada },
        },
        include: {
          product_variant: {
            include: { product: true },
          },
        },
      },
    },
  });

  return { reseller, maleta };
}
```

### Example 2: /api/vitrina/track Route Handler
```typescript
// Source: adapted from src/app/api/track/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ALLOWED_EVENTS = ["catalogo_revendedora", "clique_whatsapp"] as const;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reseller_id, tipo_evento, produto_id } = body;

    if (!ALLOWED_EVENTS.includes(tipo_evento)) {
      return NextResponse.json({ error: "Evento no permitido" }, { status: 400 });
    }
    if (!reseller_id || !tipo_evento) {
      return NextResponse.json({ error: "Campos requeridos" }, { status: 400 });
    }

    const visitorId = request.cookies.get("mnrc_vid")?.value || null;

    prisma.analyticsAcesso.create({
      data: {
        reseller_id,
        visitor_id: visitorId,
        tipo_evento,
        produto_id: produto_id ?? null,
        page_url: request.headers.get("referer") || "",
      },
    }).catch(() => {}); // fail silently

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true }); // fail silently
  }
}
```

### Example 3: Cart Provider Hook
```typescript
// Source: project patterns + React docs
"use client";
import { createContext, useContext, useState, useEffect } from "react";

interface CartItem {
  productId: string;
  variantId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

const CartContext = createContext<{ items: CartItem[]; add: (i: CartItem) => void; count: number } | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem("monarca_vitrina_cart");
    if (raw) setItems(JSON.parse(raw));
  }, []);

  useEffect(() => {
    localStorage.setItem("monarca_vitrina_cart", JSON.stringify(items));
    window.dispatchEvent(new CustomEvent("cart-updated"));
  }, [items]);

  const add = (item: CartItem) => {
    setItems((prev) => {
      const existing = prev.find((p) => p.variantId === item.variantId);
      if (existing) {
        return prev.map((p) =>
          p.variantId === item.variantId ? { ...p, quantity: Math.min(p.quantity + 1, 10) } : p
        );
      }
      return [...prev, item];
    });
  };

  return <CartContext.Provider value={{ items, add, count: items.reduce((s, i) => s + i.quantity, 0) }}>{children}</CartContext.Provider>;
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Catalog with direct WhatsApp CTA per card | Grid → detail → cart → WhatsApp checkout | Phase 6 expansion (2026-05-05) | Better UX, tracks intent before checkout |
| `revalidate = 60` on vitrina stub | `revalidate = 300` for vitrina content | Phase 6 decision D-01 | Less build/load pressure, 5min stale acceptable |
| Shared `/api/track` endpoint | Dedicated `/api/vitrina/track` with whitelist | Phase 6 decision D-02 | Clearer separation of concerns, stricter validation |

**Deprecated/outdated:**
- None identified for this phase.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Prisma client in Server Components uses `service_role` key, bypassing RLS | RLS Pitfall | If this changes, `anon` policies for `maletas`/`maleta_itens` must be added |
| A2 | `ProductVariant.image_url` contains a usable image URL (public R2 or placeholder) | Architecture | If empty or broken, product cards show broken images — need fallback logic |
| A3 | `Reseller.whatsapp` is stored with country code (e.g., `595981234567`) | Checkout | If format varies, `wa.me` links may fail — sanitize with `/\D/g` |
| A4 | localStorage is available for 95%+ of target users (mobile browsers in Paraguay) | Cart | If blocked, cart simply doesn't persist — acceptable degradation |
| A5 | R2 image URLs are public and don't expire before 300s ISR window | Performance | If signed/short-lived, images break after revalidate — use public URLs |

---

## Open Questions

1. **Middleware `mnrc_vid` cookie generation**
   - What we know: Middleware currently only refreshes JWT. CONTEXT.md suggests extending it.
   - What's unclear: Whether adding cookie logic to middleware impacts performance or auth flow.
   - Recommendation: Start with client-side cookie generation in `AnalyticsTracker` (simpler). Move to middleware only if cookie persistence across subdomains is needed.

2. **Product detail page data source**
   - What we know: Detail page needs `ProductVariant` + `Product` data.
   - What's unclear: Whether to query by `product_variant_id` (from MaletaItem) or by a separate `productId` param.
   - Recommendation: Route param should be `product_variant_id` (or a composite slug) since the card represents a variant. Query `prisma.productVariant.findUnique({ include: { product: true } })`.

3. **Cart isolation per reseller**
   - What we know: SPEC says cart is isolated per reseller — accessing a different vitrina clears the cart.
   - What's unclear: Whether to auto-clear or warn the user.
   - Recommendation: Auto-clear on slug mismatch with a brief toast notification (if toast system is available in vitrina layout).

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Next.js dev server | Local testing | ✓ | 15 | — |
| Prisma / Supabase | Data queries | ✓ | 7 / PostgreSQL 15 | — |
| R2 public bucket | Product images | ✓ | — | Placeholder SVG |
| WhatsApp (mobile/desktop) | Checkout flow | ✓ (external) | — | Copy message to clipboard |
| localStorage | Cart persistence | ✓ (browser) | — | Graceful degradation |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:** None.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (node environment) |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run src/lib/vitrina.test.ts` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| VITR-05 | 404 for inactive slug | unit | `vitest run src/lib/vitrina.test.ts` | ❌ Wave 0 |
| VITR-07 | Metadata generation | unit | `vitest run src/lib/vitrina.test.ts` | ❌ Wave 0 |
| VITR-09 | Tracking cookie set | integration | `vitest run src/app/api/vitrina/track/track.test.ts` | ❌ Wave 0 |
| VITR-11 | Whitelist rejection | unit | `vitest run src/app/api/vitrina/track/track.test.ts` | ❌ Wave 0 |
| VITR-15 | Cart add/increment | unit | `vitest run src/components/vitrina/cart.test.ts` | ❌ Wave 0 |
| VITR-17 | Message formatting | unit | `vitest run src/lib/format.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run {new-test-file}`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green + `npm run build` passes

### Wave 0 Gaps
- [ ] `src/lib/vitrina.test.ts` — covers getVitrinaData, 404 handling, metadata shape
- [ ] `src/app/api/vitrina/track/track.test.ts` — covers whitelist, missing fields, bot handling
- [ ] `src/components/vitrina/cart.test.ts` — covers add, increment, remove, localStorage sync
- [ ] `src/lib/format.test.ts` extension — covers WhatsApp message builder if new helper created

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | Public page — no auth required |
| V3 Session Management | Partial | `mnrc_vid` cookie (not a session) — SameSite=Lax, 30d expiry |
| V4 Access Control | Yes | RLS `anon` policies + application-level `is_active` checks |
| V5 Input Validation | Yes | Strict event whitelist; validate `reseller_id` UUID format; zod or manual validation |
| V6 Cryptography | No | No sensitive data in transit beyond public product info |
| V7 Error Handling | Yes | Fail silently on tracking errors; never leak stack traces |
| V8 Data Protection | Yes | `vitrina-sanitizer.ts` — only expose `name`, `avatar_url`, `slug`, `whatsapp_link` |
| V10 Malicious Code | Partial | Bot detection prevents analytics poisoning |

### Known Threat Patterns for Next.js + Prisma Public Pages

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Analytics flooding (spam events) | Denial of Service | Bot detection + rate limiting (future: Upstash Redis) |
| Enumeration of reseller slugs | Information Disclosure | `notFound()` for both missing and inactive (no distinction) |
| Injection in tracking payload | Tampering | Strict whitelist + type validation; Prisma parameterized queries |
| PII leak in public API | Information Disclosure | `getPublicVitrinaData()` sanitizer; never expose email, address, commission rate |
| Open redirect via `page_url` | Tampering | Do not redirect based on user-provided URLs; only log them |

---

## File Inventory

### Files to Create

| File | Purpose |
|------|---------|
| `src/app/vitrina/[slug]/page.tsx` | Main vitrina page (replace stub) |
| `src/app/vitrina/[slug]/[produtoId]/page.tsx` | Product detail page |
| `src/app/vitrina/[slug]/layout.tsx` | Shared layout with `CartProvider` |
| `src/app/api/vitrina/track/route.ts` | Tracking endpoint |
| `src/lib/vitrina.ts` | `getVitrinaData(slug)` query helper |
| `src/components/vitrina/VitrinaHeader.tsx` | Hero with avatar, name, bio |
| `src/components/vitrina/ProductGrid.tsx` | Grid wrapper |
| `src/components/vitrina/ProductCard.tsx` | Individual product card |
| `src/components/vitrina/ProductDetailView.tsx` | Detail view (client interactivity) |
| `src/components/vitrina/CartProvider.tsx` | React context for cart |
| `src/components/vitrina/CartBadge.tsx` | Floating sticky badge |
| `src/components/vitrina/CartDrawer.tsx` | Cart modal/drawer |
| `src/components/vitrina/WhatsAppCheckoutButton.tsx` | Checkout button + message builder |
| `src/components/vitrina/AnalyticsTracker.tsx` | Vitrina-specific tracker |
| `src/components/vitrina/EmptyState.tsx` | No active maleta message |

### Files to Modify

| File | Change |
|------|--------|
| `src/app/vitrina/[slug]/page.tsx` | Replace stub with full implementation |
| `src/middleware.ts` or `src/lib/middleware-auth.ts` | Add `mnrc_vid` cookie generation (optional — can be client-side) |
| `src/app/actions.ts` | Add `getVitrinaData` or keep in separate `lib/vitrina.ts` |
| `src/lib/cart.ts` | Optionally extend for vitrina-specific keys |
| `docs/revendedoras/SPEC_VITRINE_PUBLICA.md` | Update to reflect expanded scope (VITR-13..VITR-17) |
| `.planning/ROADMAP.md` | Mark Phase 6 requirements as in-progress |

---

## Sources

### Primary (HIGH confidence)
- `src/app/catalogo/[slug]/page.tsx` — Existing public page pattern (hero + avatar + grid)
- `src/app/api/track/route.ts` — Existing tracking endpoint with bot detection, cookie logic
- `src/lib/cart.ts` — Existing localStorage cart implementation
- `src/lib/data-protection/vitrina-sanitizer.ts` — Public data sanitization
- `src/lib/middleware-auth.ts` — Middleware patterns
- `scripts/rls-policies.sql` — RLS policies for anon access
- `prisma/schema.prisma` — Database models for Reseller, Maleta, MaletaItem, ProductVariant, AnalyticsAcesso

### Secondary (MEDIUM confidence)
- `docs/revendedoras/SPEC_VITRINE_PUBLICA.md` — SPEC with layouts and data requirements
- `docs/design-system/tokens.md` — Visual tokens for components
- `vitest.config.ts` — Test configuration

### Tertiary (LOW confidence)
- None — all claims verified against codebase or official docs.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already in use in the project
- Architecture: HIGH — patterns exist in catalog and tracking; clear extension path
- Pitfalls: HIGH — identified from existing code review and SPEC edge cases

**Research date:** 2026-05-05
**Valid until:** 2026-06-05 (stable stack, low churn expected)

---

## RESEARCH COMPLETE

**Phase:** 6 — Vitrina Pública (SEO, Tracking & WhatsApp Integration)
**Confidence:** HIGH

### Key Findings
1. **No new dependencies needed** — Next.js 15, Prisma 7, Tailwind v4, and existing utilities (`format.ts`, `cart.ts`, `vitrina-sanitizer.ts`) cover all requirements.
2. **Catalog is the blueprint** — `/catalogo/[slug]/page.tsx` provides the exact pattern for hero, avatar, product grid, and footer. Extract shared components into `src/components/vitrina/`.
3. **RLS gap for `maletas`/`maleta_itens`** — No `anon` policies exist for these tables. Current architecture uses `service_role` Prisma client in Server Components, so this is not a blocker, but must be documented.
4. **Tracking pattern is proven** — `/api/track/route.ts` has bot detection, cookie management, and fire-and-forget inserts. Adapt with stricter whitelist for `/api/vitrina/track`.
5. **Cart pattern exists but needs vitrina adaptation** — `src/lib/cart.ts` uses a generic key (`monarca_cart`). Vitrina needs per-reseller isolation (`monarca_vitrina_cart`) and `variantId`-based deduplication.

### File Created
`.planning/phases/06-vitrina-publica/06-RESEARCH.md`

### Confidence Assessment
| Area | Level | Reason |
|------|-------|--------|
| Standard Stack | HIGH | All libraries verified in package.json and actively used |
| Architecture | HIGH | Patterns exist in catalog + tracking; clear extension path |
| Pitfalls | HIGH | Identified from code review, SPEC edge cases, and project constraints |

### Open Questions (RESOLVED)
1. Middleware vs client-side `mnrc_vid` generation — RESOLVED: Plan 06-02 implements middleware cookie with fallback client-side generation.
2. Product detail route param — RESOLVED: Plan 06-01/06-03 uses `product_variant_id` as route param since cards represent variants.
3. Cart auto-clear behavior on reseller switch — RESOLVED: Plan 06-04 implements auto-clear with toast notification on reseller switch.

### Ready for Planning
Research complete. Planner can now create PLAN.md files.
