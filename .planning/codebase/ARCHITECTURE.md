# ARCHITECTURE.md
# Codebase Architecture — NEXT-MONARCA
# Mapped: 2026-05-04

## Pattern

**Next.js 15/16 App Router — Multi-Surface Monolith**

Single Next.js application serving three distinct audiences through flat route groups (not parenthesized route groups):

| Surface | Route Prefix | Audience | Auth |
|---------|-------------|----------|------|
| Public catalog | `/`, `/catalogo`, `/produto`, `/carrinho` | Public buyers | None |
| Revendedora PWA | `/app/*` | Resellers | Supabase JWT |
| Admin panel | `/admin/*` | Admin + Colaboradoras | Supabase JWT |
| Auth flow | `/auth/*` | All authenticated | Supabase |
| API Routes | `/api/*` | Internal + webhooks | Varies |

## Layers

```
Browser / PWA
     │
     ▼
Next.js Middleware (src/middleware.ts)
  └─ updateSession() — JWT refresh only, NO DB queries
     │
     ▼
Next.js App Router
  ├─ Layouts — getCurrentUser() cached + role guard
  ├─ Pages (Server Components) — data fetching via Server Actions or direct Prisma
  ├─ Client Components — interactive UI, optimistic updates
  └─ Server Actions — all mutations, requireAuth guard
     │
     ▼
Domain Layer (src/lib/)
  ├─ user.ts — getCurrentUser() [React.cache], requireAuth()
  ├─ auth/ — assertIsInGroup(), getResellerScope()
  ├─ prisma.ts — singleton client with PrismaPg adapter + encryption extension
  ├─ notifications.ts — push + DB notification helper
  ├─ gamificacao.ts — points/levels engine
  ├─ maleta-helpers.ts — maleta business logic helpers
  └─ emails.ts — Brevo email client
     │
     ▼
Data Layer
  ├─ Prisma ORM → PostgreSQL (Supabase)
  ├─ Supabase Auth (JWT, session cookies)
  ├─ Cloudflare R2 (file storage)
  └─ Supabase RLS (row-level security, secondary defense)
```

## Auth Architecture (Defense-in-Depth)

Three independent security layers:

1. **Middleware** (`src/middleware.ts` → `src/lib/middleware-auth.ts`)
   - Only refreshes Supabase JWT cookies
   - Redirects unauthenticated users to login
   - Zero DB queries — performance-critical

2. **Layout Guards** (e.g., `src/app/admin/layout.tsx`)
   - Calls `getCurrentUser()` (React.cache — 1 DB query per request)
   - Checks role and `is_active` flag
   - Redirects if insufficient permissions

3. **Server Action Guards** (every mutation)
   - `requireAuth(allowedRoles)` — throws `BUSINESS:` prefixed errors
   - `assertIsInGroup(resellerId, colaboradoraId)` — prevents IDOR
   - `getResellerScope(user)` — scopes queries by role (COLABORADORA sees only her group)

4. **Supabase RLS** (database-level, 23 tables)
   - `scripts/rls-policies.sql` — tertiary defense

## Data Flow — Core Business Process (Maleta)

```
Admin creates maleta
  → criarMaleta() [Server Action]
     → requireAuth(["ADMIN","COLABORADORA"])
     → Reserve stock (Prisma sequential ops — no nested TX due to Prisma 7 + PrismaPg)
     → Create Maleta record with snapshot prices (preco_fixado — IMMUTABLE)
     → notificarRevendedora() → OneSignal push + DB Notificacao record

Revendedora sees maleta in /app/maleta
  → getCatalogoRevendedora() via layout/page query
  → Records snapshot — preco_fixado never recalculated

Revendedora registers sale
  → registrarVenda() [Server Action]
  → requireAuth(["REVENDEDORA"]) + ownership check
  → Uses preco_fixado from DB (ignores client price input)
  → awardPoints() → gamification engine

Revendedora returns maleta
  → submitDevolucao() [Server Action]
  → Upload photo to Cloudflare R2
  → Status → aguardando_revisao
  → Push to admin

Admin reviews and closes
  → conferirEFecharMaleta() [Server Action]
  → Snapshot values frozen — no recalculation
  → Stock restored
```

## Key Abstractions

| Abstraction | Location | Purpose |
|-------------|----------|---------|
| `getCurrentUser()` | `src/lib/user.ts` | React.cache'd auth context per request |
| `requireAuth()` | `src/lib/user.ts` | Server Action guard, throws BUSINESS errors |
| `assertIsInGroup()` | `src/lib/auth/assert-in-group.ts` | IDOR prevention for COLABORADORA scope |
| `getResellerScope()` | `src/lib/auth/get-reseller-scope.ts` | Query scoping by role |
| `notificarRevendedora()` | `src/lib/notifications.ts` | OneSignal push + DB record in one call |
| `awardPoints()` | `src/lib/gamificacao.ts` | Gamification points engine |
| `ActionResult<T>` | `src/lib/action-utils.ts` | Typed Server Action return type |
| `prisma` singleton | `src/lib/prisma.ts` | PrismaPg adapter + AES-256-GCM encryption extension |

## Entry Points

- **PWA entry**: `src/app/app/login/page.tsx` → Supabase email/password auth
- **Admin entry**: `src/app/admin/login/page.tsx` → same auth provider, different role check
- **Public entry**: `src/app/page.tsx` — catalog landing, ISR/force-dynamic
- **Auth callback**: `src/app/auth/callback/route.ts` — handles Supabase `code` + `token_hash`
- **Cron**: Supabase Edge Functions (external) + `src/app/api/cron/` (legacy, being migrated)

## Cron Architecture

Three cron jobs as Supabase Edge Functions (pg_cron via `scripts/setup-cron-jobs.sql`):
- `check-maleta-prazo` — D-3/D-1 notifications with deduplication
- `marcar-maletas-atrasadas` — status transition `ativa → atrasada`
- `agrega-analytics-diario` — daily analytics aggregation

Legacy route handlers in `src/app/api/cron/` are being migrated to Edge Functions.

## Prisma Transaction Pattern

**Important constraint**: Prisma 7 + PrismaPg driver adapter does NOT support nested transactions (`$transaction(async tx => {})`). All transactional operations use:
- Sequential operations with manual compensation (rollback on failure)
- Batch transactions with pre-read: `$transaction([op1, op2, ...])`

## Rendering Strategy

| Route | Strategy | Reason |
|-------|---------|--------|
| `/app/*` | `force-dynamic` | Authenticated real-time data |
| `/admin/*` | `force-dynamic` | Authenticated real-time data |
| `/`, `/catalogo/*`, `/produto/*` | `force-dynamic` (workaround) | Should be ISR — blocked by missing Vercel `DATABASE_URL` in build env |
| `/vitrina/*` | Planned ISR | Not yet implemented |

---
*Mapped: 2026-05-04*
