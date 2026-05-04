# STRUCTURE.md
# Directory Layout — NEXT-MONARCA
# Mapped: 2026-05-04

## Root Layout

```
next-monarca/
├── src/                    # All application source code
├── prisma/                 # Prisma schema + migrations
│   └── schema.prisma       # Source of truth for data model
├── docs/                   # Project documentation and SPECs
│   ├── project_overview.md
│   ├── next_steps.md
│   ├── CHANGELOG.md
│   ├── design-system/      # Design tokens, colors, typography
│   ├── admin/              # Admin panel SPECs
│   ├── revendedoras/       # Revendedora PWA SPECs
│   ├── sistema/            # System SPECs (security, caching, etc.)
│   └── prd/                # Product requirements
├── scripts/                # SQL scripts (RLS policies, cron setup, seeds)
├── design-system/          # Design system assets (non-docs)
├── public/                 # Static assets (images, icons, PWA manifest)
├── env/                    # Environment variable examples
├── next.config.ts          # Next.js configuration (Serwist PWA, R2 images)
├── prisma.config.ts        # Prisma configuration
├── components.json         # shadcn/ui config
├── tailwind.config.*       # Tailwind v4 config
└── CLAUDE.md               # Project AI assistant rules
```

## src/ Layout

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Public home/catalog
│   ├── app/                # Revendedora PWA routes
│   │   ├── layout.tsx      # Auth guard + PWA bottom nav
│   │   ├── login/          # Auth entry point
│   │   ├── bienvenida/     # Onboarding
│   │   ├── maleta/         # Consignment management
│   │   │   └── [id]/       # Maleta detail + venda/devolução
│   │   ├── catalogo/       # Product catalog + share
│   │   ├── vendas/         # Sales history
│   │   ├── progreso/       # Gamification progress
│   │   ├── notificaciones/ # Notification center
│   │   ├── perfil/         # Profile + push preferences
│   │   ├── mais/           # Hub menu
│   │   └── nueva-contrasena/ # Password reset
│   ├── admin/              # Admin panel routes
│   │   ├── layout.tsx      # Auth guard + sidebar + admin nav
│   │   ├── login/          # Admin auth entry
│   │   ├── maleta/         # Maleta list + detail + edit
│   │   ├── revendedoras/   # Reseller list + profile + docs
│   │   ├── consultoras/    # Colaboradora list + profile
│   │   ├── equipe/         # Team management
│   │   ├── produtos/       # Product catalog management
│   │   ├── categorias/     # Category management
│   │   ├── brindes/        # Rewards catalog
│   │   ├── gamificacao/    # Gamification admin
│   │   ├── analytics/      # Analytics dashboard
│   │   ├── leads/          # Lead pipeline
│   │   ├── relatorios/     # Reports
│   │   ├── config/         # Global settings + push templates
│   │   └── minha-conta/    # Colaboradora profile + commissions
│   ├── auth/
│   │   └── callback/       # Supabase auth callback handler
│   ├── catalogo/           # Public product catalog
│   │   └── [slug]/         # Product detail page
│   ├── produto/            # Product pages
│   ├── carrinho/           # Shopping cart
│   ├── seja-revendedora/   # Reseller recruitment landing
│   └── api/
│       ├── proxy-image/    # CORS proxy for R2 images (share feature)
│       ├── track/          # Analytics tracking
│       ├── auth/           # Auth API routes
│       ├── admin/          # Admin API (AlertBell count + alertas)
│       └── test-email/     # Email testing endpoint
├── components/
│   ├── ui/                 # shadcn/ui atoms + custom atoms
│   │   ├── button.tsx
│   │   ├── skeleton.tsx
│   │   ├── badge.tsx
│   │   ├── dialog.tsx
│   │   ├── FormField.tsx   # Custom labeled input wrapper
│   │   ├── PasswordField.tsx
│   │   └── PrimaryButton.tsx
│   ├── app/                # PWA-specific molecules/organisms
│   │   ├── AppBottomNav.tsx
│   │   ├── AppPageHeader.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── MaletaList.tsx
│   │   └── ... (revendedora UI components)
│   ├── admin/              # Admin-specific molecules/organisms
│   │   ├── AdminPageHeader.tsx
│   │   ├── AdminStatCard.tsx
│   │   ├── AdminStatusBadge.tsx
│   │   ├── AdminStepIndicator.tsx
│   │   ├── AdminFilterBar.tsx
│   │   ├── AdminEmptyState.tsx
│   │   ├── AdminFinancialSummary.tsx
│   │   ├── AdminAvatar.tsx
│   │   └── AdminAlertBell.tsx
│   ├── auth/               # Shared auth components
│   ├── onesignal/          # OneSignal initialization client component
│   └── *.tsx               # Public/shared components (ProductCard, Header, etc.)
├── lib/
│   ├── user.ts             # getCurrentUser() + requireAuth() — CRITICAL
│   ├── prisma.ts           # Prisma singleton + PrismaPg adapter
│   ├── supabase.ts         # Supabase browser client
│   ├── supabase-ssr.ts     # Supabase SSR client (server-side)
│   ├── middleware-auth.ts  # JWT refresh + redirect logic
│   ├── notifications.ts    # Push + DB notification helper
│   ├── gamificacao.ts      # Points/levels engine
│   ├── maleta-helpers.ts   # Maleta business logic
│   ├── emails.ts           # Brevo email client
│   ├── r2.ts               # Cloudflare R2 client
│   ├── onesignal-server.ts # OneSignal REST API client
│   ├── upload.ts           # File upload utilities
│   ├── action-utils.ts     # ActionResult type + error helpers
│   ├── types.ts            # Shared TypeScript types
│   ├── format.ts           # Date/currency formatters
│   ├── utils.ts            # Generic utilities (cn, etc.)
│   ├── config.ts           # App configuration constants
│   ├── cart.ts             # Shopping cart state
│   ├── share-images.ts     # Image download for Web Share API
│   ├── compress-image.ts   # Client-side image compression
│   ├── auth/
│   │   ├── assert-in-group.ts  # IDOR guard for COLABORADORA
│   │   └── get-reseller-scope.ts # Query scope by role
│   ├── validators/         # Zod schemas
│   │   ├── maleta.schema.ts
│   │   ├── product.schema.ts
│   │   └── equipe.schema.ts
│   ├── mappers/            # Data transformation functions
│   ├── errors/             # Error types and handlers
│   ├── data-protection/    # PII sanitization helpers
│   ├── email-templates/    # Brevo HTML email templates (6 templates)
│   │   ├── candidatura-aprovada.ts
│   │   ├── candidatura-rechazada.ts
│   │   ├── convite-usuario.ts
│   │   ├── acerto-confirmado.ts
│   │   ├── documento-aprovado.ts
│   │   ├── documento-rejeitado.ts
│   │   └── documento-pendente.ts
│   └── prisma/
│       └── encrypt-middleware.ts  # AES-256-GCM encryption Prisma extension
├── __tests__/
│   ├── app/                # App-level action tests
│   │   ├── maleta-actions.test.ts
│   │   ├── notificacoes-preferences.test.ts
│   │   └── transitions/    # View transition tests
│   ├── security/
│   │   └── rbac-regression.test.ts  # Security regression suite (11 tests)
│   ├── validators/         # Zod schema tests
│   │   ├── product.schema.test.ts
│   │   ├── equipe.schema.test.ts
│   │   └── maleta.schema.test.ts
│   └── api/                # API route tests
└── generated/
    └── prisma/             # Auto-generated Prisma client (DO NOT EDIT)
        ├── client/
        ├── internal/
        └── models/
```

## Server Actions Location

Server Actions live alongside their pages, not in a central folder:

| Feature | Actions File |
|---------|-------------|
| Admin maletas | `src/app/admin/actions-maletas.ts` |
| Admin products | `src/app/admin/actions-products.ts` |
| Admin categories | `src/app/admin/actions-categories.ts` |
| Admin team | `src/app/admin/actions-equipe.ts` |
| Admin gamification | `src/app/admin/actions-gamificacao.ts` |
| Admin analytics | `src/app/admin/actions-analytics.ts` |
| Admin leads | `src/app/admin/actions-leads.ts` |
| Revendedora PWA | `src/app/app/actions-revendedora.ts` |

## Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Pages | `page.tsx` | `src/app/admin/maleta/page.tsx` |
| Layouts | `layout.tsx` | `src/app/app/layout.tsx` |
| Server Actions | `actions-{feature}.ts` | `actions-maletas.ts` |
| React Components | PascalCase `.tsx` | `AdminStatCard.tsx` |
| Utilities | camelCase `.ts` | `maleta-helpers.ts` |
| Prisma models | PascalCase | `Maleta`, `Reseller` |
| DB columns | snake_case | `preco_fixado`, `auth_user_id` |
| Route segments | kebab-case Spanish | `/app/maleta`, `/app/nueva-contrasena` |
| UI text | Spanish (Paraguayan) | "Registrar Venta", "Cerrar Maleta" |
| Docs/code comments | Portuguese | "Fonte de verdade" |

## Key File Locations Quick Reference

| What | Where |
|------|-------|
| Auth guard | `src/lib/user.ts` |
| Middleware | `src/lib/middleware-auth.ts` |
| DB client | `src/lib/prisma.ts` |
| Push notifications | `src/lib/notifications.ts` |
| Data schema | `prisma/schema.prisma` |
| Security SPECs | `docs/sistema/SPEC_SECURITY_*.md` |
| Design tokens | `docs/design-system/tokens.md` |
| RLS policies | `scripts/rls-policies.sql` |
| Cron setup | `scripts/setup-cron-jobs.sql` |

---
*Mapped: 2026-05-04*
