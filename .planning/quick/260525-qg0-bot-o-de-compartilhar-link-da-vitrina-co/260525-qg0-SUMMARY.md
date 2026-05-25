---
phase: quick-260525-qg0
plan: "01"
subsystem: app/catalogo
tags: [gamificacao, share, vitrina, pwa, web-share-api]
dependency_graph:
  requires: []
  provides: [compartilhou_link_vitrina gamification action, vitrina share button in catalog]
  affects: [src/app/app/catalogo/page.tsx, src/app/app/actions-revendedora.ts]
tech_stack:
  added: []
  patterns: [Web Share API with AbortError guard, clipboard fallback, safeAction + requireAuth pattern]
key_files:
  created: []
  modified:
    - src/app/app/actions-revendedora.ts
    - src/app/app/catalogo/page.tsx
decisions:
  - "Used var(--app-accent, #35605A) CSS variable for vitrina button background — no hardcoded hex"
  - "Fetch slug in same useEffect after catalog loads, not a separate effect — avoids extra render"
  - "AbortError guard: user cancelling Web Share sheet does not award points or show feedback"
  - "Clipboard fallback also awards points — share intent was fulfilled even without native share"
metrics:
  duration: "~8 minutes"
  completed: "2026-05-25T22:11:26Z"
  tasks_completed: 2
  files_changed: 2
---

# Quick Task 260525-qg0: Botao de Compartilhar Link da Vitrina Summary

## One-liner

Web Share API button in catalog sticky bar that shares the revendedora's personal vitrina URL and awards `compartilhou_link_vitrina` gamification points, with clipboard fallback for unsupported browsers.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add server actions for slug retrieval and vitrina point registration | 257a4b0 | src/app/app/actions-revendedora.ts |
| 2 | Add "Compartir mi vitrina" button with Web Share + clipboard fallback | cf1edba | src/app/app/catalogo/page.tsx |

## What Was Built

### Task 1 — Server Actions (actions-revendedora.ts)

Two new server actions appended after `registrarPuntosCompartirCatalogo`:

- `getSlugRevendedora()`: Calls `requireAuth(["REVENDEDORA"])`, queries `prisma.reseller.findUnique({ select: { slug } })`, returns `{ slug: string }`. Wrapped in `safeAction`.
- `registrarPuntosCompartirLinkVitrina()`: Mirrors the catalog pattern, calls `awardPoints(resellerId, "compartilhou_link_vitrina")`.

### Task 2 — Catalog Page UI (catalogo/page.tsx)

- Imports: added `registrarPuntosCompartirLinkVitrina`, `getSlugRevendedora` from actions, and `Link2` icon from lucide-react.
- State: `vitrinaSlug: string | null` and `shareMsg: string | null`.
- useEffect: after successful catalog fetch, calls `getSlugRevendedora()` and sets `vitrinaSlug`.
- `handleShareVitrina`: builds URL as `${NEXT_PUBLIC_SITE_URL}/vitrina/${vitrinaSlug}`, tries `navigator.share`. On success or non-AbortError: awards points + shows feedback toast. On AbortError: silently returns. Clipboard fallback when Web Share unavailable — also awards points.
- Sticky bar: new `flex flex-col gap-2` wrapper. Vitrina button (renders only when `vitrinaSlug` non-null) uses `var(--app-accent, #35605A)`. Existing dark photo-share button unchanged below it.
- Feedback toast: `¡Puntos ganados!` or `¡Link copiado!`, clears after 3 seconds.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

None — no new network endpoints, auth paths, or trust boundary changes introduced. The new server actions use the same `requireAuth + safeAction` pattern as all other gamification actions.

## Self-Check: PASSED

- `src/app/app/actions-revendedora.ts`: modified, verified `compartilhou_link_vitrina` and `getSlugRevendedora` present.
- `src/app/app/catalogo/page.tsx`: modified, verified `Compartir mi vitrina` text and `Link2` import present.
- Commit 257a4b0: verified in git log.
- Commit cf1edba: verified in git log.
- TypeScript: no errors in modified files (`npx tsc --noEmit --skipLibCheck` returned no catalogo/actions-revendedora errors).
- Lint: only pre-existing `<img>` warning in catalogo/page.tsx, no new errors.
