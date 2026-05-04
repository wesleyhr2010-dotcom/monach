# Technology Stack

**Analysis Date:** 2026-05-04

## Languages

**Primary:**
- TypeScript 5.x (strict mode) — all application code under `src/`
- TypeScript (tsconfig.scripts.json) — utility scripts in `scripts/`

**Secondary:**
- TypeScript/Deno — Supabase Edge Functions under `supabase/functions/`
- CSS (Tailwind v4 utility classes) — component styling

## Runtime

**Environment:**
- Node.js 20+ (types: `@types/node ^20`)

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- Next.js 16.1.6 (App Router) — full-stack framework; routes under `src/app/`
- React 19.2.3 — UI library
- React DOM 19.2.3 — DOM renderer

**Data & State:**
- Prisma 7.4.2 — ORM for PostgreSQL; schema at `prisma/schema.prisma`, client generated to `src/generated/prisma/`
- TanStack React Query 5.x — client-side data fetching; used exclusively in admin/dashboard area via `src/lib/query-provider.tsx`
- Zod 4.x — runtime schema validation and input validation

**Styling:**
- Tailwind CSS v4 — utility-first CSS framework
- `@tailwindcss/postcss` — PostCSS integration; config at `postcss.config.mjs`
- `class-variance-authority` — component variant management
- `clsx` + `tailwind-merge` — conditional class merging
- Radix UI (`@radix-ui/react-slot`, `radix-ui`) — headless UI primitives
- Lucide React 0.576.0 — icon library

**PWA:**
- Serwist 9.5.6 (`@serwist/next`) — Service Worker management; registration at `src/components/ServiceWorkerRegistration.tsx`, SW at `src/app/sw.ts`, manifest at `src/app/manifest.ts`

**PDF & Document Generation:**
- `@react-pdf/renderer` 4.x — PDF generation (React-based)
- `jspdf` 4.x + `jspdf-autotable` — imperative PDF generation
- `xlsx` 0.18.5 — Excel export
- `papaparse` + `csv-parser` — CSV parsing

**Image Processing:**
- `sharp` 0.34.5 — server-side image compression and WebP conversion (used in `src/lib/upload.ts`)

**Testing:**
- Vitest 4.x — test runner; config at `vitest.config.ts`
- `@vitejs/plugin-react` — React support in Vitest
- Environment: `node`
- Test files: `src/**/*.test.ts`, `src/**/*.test.tsx`

**Build/Dev:**
- Next.js built-in Turbopack (enabled via `turbopack: {}` in `next.config.ts`)
- ESLint 9 — linting; config at `eslint.config.mjs` (extends `eslint-config-next/core-web-vitals` + `eslint-config-next/typescript`)
- `tsx` — TypeScript script runner for utility scripts
- `dotenv` — `.env` loading for scripts and `prisma.config.ts`

## Key Dependencies

**Critical:**
- `@prisma/adapter-pg` 7.4.2 + `pg` 8.x — Prisma's driver-based adapter for PostgreSQL via `pg.Pool`; required for Prisma 7 serverless. Configured in `src/lib/prisma.ts` with pool limits (`max: 10`, `idleTimeoutMillis: 30000`, `connectionTimeoutMillis: 5000`).
- `@supabase/supabase-js` 2.98.0 — Supabase JS client for auth and direct queries
- `@supabase/ssr` 0.9.0 — cookie-based SSR auth adapter; used in `src/lib/supabase-ssr.ts` and `src/lib/middleware-auth.ts`
- `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` — AWS S3-compatible client for Cloudflare R2; instantiated in `src/lib/r2.ts`
- `@getbrevo/brevo` 5.x — Brevo (Sendinblue) SDK for transactional email; used in `src/lib/emails.ts`
- `react-onesignal` 3.x — OneSignal push notification client; server-side push in `src/lib/onesignal-server.ts`

**Infrastructure:**
- `@react-pdf/renderer` — PDF document generation for reports
- `sharp` — image pipeline (resize, WebP conversion) before R2 upload
- `zod` — input validation in server actions and API routes

## Configuration

**Environment:**
- `.env.local` for development (gitignored); `.env.example` committed as reference
- Validated via `@t3-oss/env-nextjs` + Zod (defined in `SPEC_ENVIRONMENT_VARIABLES.md`; implementation in `src/env.ts`)
- Loaded in `prisma.config.ts` via `dotenv`: first `.env.local`, then `.env`
- Required variables: `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`, `NEXT_PUBLIC_ONESIGNAL_APP_ID`, `ONESIGNAL_REST_API_KEY`, `BREVO_API_KEY`, `BREVO_FROM_EMAIL`, `ENCRYPTION_KEY`, `NEXT_PUBLIC_SITE_URL`
- Optional: `SENTRY_DSN`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`

**Build:**
- `next.config.ts` — Next.js config: Turbopack enabled, remote image patterns for R2 CDN domains, Server Actions body limit 10MB
- `prisma.config.ts` — Prisma 7 datasource config; uses `DIRECT_URL` for migrations, `DATABASE_URL` (PgBouncer) for runtime
- `tsconfig.json` — strict TypeScript; path alias `@/*` → `./src/*`; target ES2017
- `postcss.config.mjs` — PostCSS with `@tailwindcss/postcss` only

**Prisma Schema Version Tracking:**
- `SCHEMA_VERSION` constant in `src/lib/prisma.ts` triggers singleton invalidation on deploy when version string changes

## Platform Requirements

**Development:**
- Node.js 20+
- npm
- Supabase CLI (for Edge Functions and local dev)
- `.env.local` with all required variables

**Production:**
- Vercel (confirmed by CLAUDE.md, `SPEC_DOMAIN_MIGRATION.md`, and `docs/next_steps.md`)
- Domain: `https://monarcasemijoyas.com.py`
- Supabase Edge Functions deployed to Supabase project `amlwwakxpungeqpiyxwr`
- Vercel environment variables must include `DATABASE_URL` at build scope to avoid `force-dynamic` workaround

---

*Stack analysis: 2026-05-04*
