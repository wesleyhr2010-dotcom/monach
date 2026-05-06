# Plan 06-02 Summary: Tracking & Analytics

**Phase:** 06-vitrina-publica  
**Plan:** 02  
**Status:** Complete  
**Completed:** 2026-05-05

## What Was Built

Anonymous tracking pipeline for the public vitrina:

1. **Tracking endpoint** (`src/app/api/vitrina/track/route.ts`)
   - Dedicated POST endpoint with strict event whitelist: `catalogo_revendedora`, `clique_whatsapp`
   - Rejects non-whitelist events with 400 and message "Evento no permitido"
   - Bot detection via `BOT_PATTERNS` array (copied from existing `/api/track`)
   - Fire-and-forget Prisma insert to `analytics_acessos` — never blocks response
   - Reads `mnrc_vid` cookie from request; does not set it (middleware owns cookie)

2. **Middleware cookie** (`src/lib/middleware-auth.ts`)
   - Generates `mnrc_vid` cookie on all requests if absent
   - Cookie config: 30 days, `SameSite=Lax`, `path=/`, `secure` in production
   - Not HttpOnly — readable by client JS for tracking payload

3. **Client tracker** (`src/components/vitrina/VitrinaAnalyticsTracker.tsx`)
   - `"use client"` component that fires once after hydration via `useEffect`
   - POSTs to `/api/vitrina/track` with `keepalive: true`
   - Props: `resellerId`, `tipoEvento`, optional `produtoId`

4. **Page integration** (`src/app/vitrina/[slug]/page.tsx`)
   - Added `<VitrinaAnalyticsTracker tipoEvento="catalogo_revendedora" />` before footer
   - Fires visit tracking on every vitrina page load

## Key Decisions

- Endpoint dedicated to vitrina events (D-02) rather than reusing generic `/api/track`
- Middleware owns cookie generation (D-03) for defense in depth; endpoint only reads it
- Fail-silently on tracking errors to never block UX

## Verification

- `npm run build` passes with zero errors
- All acceptance criteria from 06-02-PLAN.md satisfied

## Files Created/Modified

- `src/app/api/vitrina/track/route.ts` (created)
- `src/components/vitrina/VitrinaAnalyticsTracker.tsx` (created)
- `src/lib/middleware-auth.ts` (modified — added mnrc_vid cookie)
- `src/app/vitrina/[slug]/page.tsx` (modified — added tracker component)
