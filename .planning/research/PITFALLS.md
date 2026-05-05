# Research: Pitfalls for v1.1

> Generated for milestone **v1.1 — Visibilidade e Polimento**  
> Focus: adding public vitrina pages, email branding, and admin analytics to an existing Next.js 15 + Prisma + Supabase system.

---

## Vitrina Pública

### Pitfall 1: RLS Blocking Unauthenticated Reads
**Risk:** Supabase RLS defaults to `DENY` for unauthenticated roles. If `Reseller`, `Maleta`, `MaletaItem`, or `Product` tables have RLS policies that only allow `auth.uid()` matches, the public `/vitrina/[slug]` page (which has no session) will return empty results or 404s even for valid slugs.
**Prevention:** Create explicit RLS policies for `anon` role on tables read by the vitrina: `Reseller` (SELECT where `ativo = true`), `Maleta`/`MaletaItem`/`Product` (SELECT where maleta is public-facing). Test with `supabase.auth.getSession()` returning null.
**Phase to address:** Database migration + RLS policy setup (Phase 1).

### Pitfall 2: Conflicting Cache Strategy Between ISR and Dynamic Tracking
**Risk:** The project uses `revalidate = 60` for public pages, but the vitrina spec requires dynamic `generateMetadata` (reseller-specific title/description) and server-side visit logging on every request. ISR + dynamic per-request data = stale metadata or missed analytics hits. If `force-dynamic` is used instead, the public page loses CDN caching and becomes a direct database hit on every share/link click.
**Prevention:** Separate concerns: keep the page ISR with `revalidate = 60` for the catalog grid, but fire tracking via a client-side `useEffect` ping to `/api/track-evento` after hydration. Metadata can be generated at build time for known slugs via `generateStaticParams`, with `fallback: true` for new slugs.
**Phase to address:** Architecture decision before route implementation (Phase 1).

### Pitfall 3: Open Graph Images Breaking on Social Shares
**Risk:** `reseller.avatar_url` points to a Cloudflare R2 signed URL with expiration. When WhatsApp/Instagram/Twitter unfurls the link, the image request may happen hours later with an expired signature, showing a broken image in the preview.
**Prevention:** Use R2 public URLs (not signed) for avatars and product images intended for OG tags, or implement an `/api/og-image` route that proxies/redirects to a fresh signed URL on demand. Ensure `og:image` is an absolute URL, not relative.
**Phase to address:** Image delivery layer (Phase 2).

### Pitfall 4: N+1 Query Loading Maleta Items + Products + Variants
**Risk:** The spec queries `MaletaItem JOIN ProductVariant WHERE maleta.reseller_id ...`. If implemented with nested Prisma `include` without care, each maleta item triggers a separate product lookup. With 30+ items in a maleta, this becomes 30+ queries per page load.
**Prevention:** Use a single Prisma query with `include: { produto: { include: { categoria: true } } }` or raw SQL with `JOIN`s. Add `@@index([reseller_id, status])` on `Maleta` and `@@index([maleta_id])` on `MaletaItem` if not present.
**Phase to address:** Data layer / query optimization (Phase 2).

### Pitfall 5: `noindex` Robots Tag Preventing All Discoverability
**Risk:** The spec sets `robots: 'noindex'` to avoid duplicate content, but this also blocks WhatsApp/Telegram link previews from caching the page summary. Some platforms treat `noindex` as a signal to skip unfurling entirely.
**Prevention:** Use `noindex, follow` instead of blanket `noindex`, and ensure `og:title`, `og:description`, and `og:image` are present. Add a canonical self-referencing tag. If the concern is duplicate content, block `/vitrina/*` in `robots.txt` rather than per-page `noindex`, or use `noindex` but keep `max-snippet:-1` for rich previews.
**Phase to address:** SEO/Metadata setup (Phase 2).

### Pitfall 6: `visitor_id` Cookie Violating Privacy Regulations
**Risk:** Setting a persistent UUID cookie (`monarca_visitor_id`, 30 days, `HttpOnly: false`) on a public page without consent may violate Paraguayan data protection law (Law 1969/02) and GDPR for EU visitors. The spec treats this as "anonymous," but a persistent identifier is considered personal data under most modern privacy frameworks.
**Prevention:** Make the cookie session-only (`Max-Age` omitted) and explain in privacy policy. Alternatively, derive a daily fingerprint from `user-agent + IP + date` hash (salted) instead of a persistent UUID — this avoids cookies entirely while still allowing same-day unique counts. If a cookie is required, add a lightweight consent banner for non-logged-in users.
**Phase to address:** Tracking implementation (Phase 2).

### Pitfall 7: Prefetch/Spider Traffic Inflating Analytics
**Risk:** Next.js prefetches visible links, WhatsApp preview crawlers, and bot traffic will all hit `/vitrina/[slug]` and trigger `trackearAcceso`. The spec mentions filtering by referer, but this is unreliable (bots spoof referers, prefetch has no referer).
**Prevention:** Do server-side tracking only when `req.headers.get('purpose') !== 'prefetch'` AND user-agent does not match known bot patterns (simple regex for `bot|crawl|spider|whatsapp|facebookexternalhit`). Log raw hits separately from "human visits."
**Phase to address:** Tracking route implementation (Phase 2).

### Pitfall 8: Slug Collision or Predictable Slug Enumeration
**Risk:** Slug format `{nombre-slug}-{random-3}` has only 46,656 combinations (36^3). With hundreds of resellers, collisions are possible. Additionally, sequential enumeration (`aaa`, `aab`, ...) allows scraping all vitrinas.
**Prevention:** Use 4-5 alphanumeric characters (60M+ combinations) or a CUID. Ensure unique constraint on `slug` with Prisma `@unique` and handle collision in creation logic with a retry loop.
**Phase to address:** Reseller creation / slug generation (Phase 1).

---

## Email Branding

### Pitfall 1: Supabase Auth Templates Diverging from Brevo Transactional Layout
**Risk:** The project has two email paths: Supabase Auth (reset/invite) uses templates inside Supabase Dashboard, while transactional emails use `@getbrevo/brevo` SDK. If only the SDK emails are rebranded, users receive inconsistent styling — a green `#35605a` branded Brevo email for "document approved" but a plain Supabase default for "reset password."
**Prevention:** Treat Supabase Auth templates as part of the branding scope. Update them in Supabase Dashboard with the same header color, font stack, logo, and footer as the Brevo templates. Document the exact hex values and logo URL in `docs/design-system/tokens.md` under an "Email" section.
**Phase to address:** Branding standardization (Phase 1).

### Pitfall 2: Missing Plaintext Fallback
**Risk:** All templates in SPEC_EMAILS are HTML-only. Brevo and most SMTP relays auto-generate plaintext from HTML, but the result is often poor (raw URLs, broken tables, visible CSS). Watch users and some corporate filters heavily weight plaintext quality.
**Prevention:** Add a `textContent` field to `sendEmail()` and generate a plaintext version for each template (strip tags, preserve line breaks, write full URLs). Brevo SDK supports both `htmlContent` and `textContent` in the same payload.
**Phase to address:** Email template refactoring (Phase 2).

### Pitfall 3: Brevo Free Tier Burst During Batch Operations
**Risk:** Brevo free tier = 300 emails/day. A single admin action (e.g., approving 50 leads, sending 200 maleta reminders) can exhaust the daily quota and silently drop subsequent emails. The spec mentions monitoring but has no hard limiter.
**Prevention:** Add a rate-limiting wrapper around `sendEmail()` that queries a daily counter (Redis or a `email_quota` table) before sending. If near limit, queue to a `EmailQueue` table with a retry timestamp. Log every send and failure.
**Phase to address:** Email infrastructure / quota guard (Phase 1).

### Pitfall 4: Hardcoded Inline Styles Scattered Across Files
**Risk:** Each email template file (`documento-pendente.ts`, `acerto-confirmado.ts`, etc.) contains duplicated inline CSS. Changing the brand primary color from `#35605a` to a new shade requires touching 6+ files, with high risk of inconsistency.
**Prevention:** Create a centralized `email-layout.ts` that exports a `renderEmail({ title, body, cta })` wrapper producing the full HTML shell. Templates only provide the variable content. This mirrors the design system token approach.
**Phase to address:** Template refactoring (Phase 1).

### Pitfall 5: Email Clients Rendering Tables and Buttons Poorly
**Risk:** The spec uses `<table>` for layout and `<a>` styled as buttons. Outlook (desktop and mobile) strips padding on `<a>` tags and ignores `border-radius`, making CTA buttons appear as plain underlined text. Dark mode inverts `#35605a` to an ugly shade.
**Prevention:** Use `mso-conditional` comments for Outlook, wrap buttons in `<table>` cells with `bgcolor`, and add `color-scheme: light dark` meta tags. Test with a service like Litmus or Email on Acid before shipping. At minimum, ensure the CTA link is repeated as plain text below the button.
**Phase to address:** Template QA (Phase 3).

### Pitfall 6: PII in Email Logs or Brevo Dashboard
**Risk:** The `sendEmail()` helper logs errors with `console.error('[Email Error]', subject, err)`. If `subject` contains a reseller name or document type, PII leaks to Vercel logs. Brevo also retains email content in their dashboard.
**Prevention:** Sanitize logs: log only template type and recipient domain, never name or email address. Use the existing `sanitizeForLog` helper. Ensure Brevo account access is restricted to essential personnel.
**Phase to address:** Security review (Phase 3).

---

## Admin Analytics

### Pitfall 1: Unindexed Raw SQL Aggregates Timing Out
**Risk:** The spec uses `prisma.$queryRaw` with `GROUP BY DATE(created_at AT TIME ZONE ...)` on `maletas` and `maleta_itens`. If the `created_at` column is not indexed, or if the query scans `maleta_itens` (which can have 10K+ rows per month), the analytics page will timeout on Vercel's 10s serverless limit.
**Prevention:** Verify composite indexes exist: `maletas(created_at, status, colaboradora_id)` and `maleta_itens(maleta_id, produto_id)`. For the "Produtos Mais Vendidos" query, consider a materialized view or a daily aggregation table (populated by the existing cron `agrega-analytics-diario`) instead of real-time `SUM` over all history.
**Phase to address:** Database optimization (Phase 1).

### Pitfall 2: N+1 in "Top 10 Revendedoras" After GroupBy
**Risk:** `prisma.maleta.groupBy({ by: ['reseller_id'], ... })` returns only `reseller_id` and aggregates. To display names, the code will likely loop and query `prisma.reseller.findUnique()` 10 times — an N+1.
**Prevention:** Use a raw SQL query joining `maletas` with `resellers` in one shot, or use Prisma's `include` with a subquery pattern. If keeping `groupBy`, fetch all needed resellers in a single `findMany({ where: { id: { in: ids } } })` after the group.
**Phase to address:** Data layer (Phase 2).

### Pitfall 3: RBAC Scope Leak in Raw SQL Queries
**Risk:** The spec's raw SQL snippets use `${scope.colaboradora_id ? Prisma.sql`AND colaboradora_id = ...` : Prisma.empty}`. If `scope.colaboradora_id` is undefined or null due to a session parsing bug, `Prisma.empty` renders nothing and the query returns global data to a COLABORADORA.
**Prevention:** Never rely on ternary template injection for security boundaries. Build the `where` clause in a typed helper that validates `scope` before SQL generation. Prefer Prisma's query builder (which is type-safe) over raw SQL for RBAC-scoped queries whenever possible. If raw SQL is required, use parameterized `AND colaboradora_id = ${scope.colaboradora_id ?? 'IMPOSSIBLE_VALUE'}` or validate `scope` with Zod before query execution.
**Phase to address:** Server-side query implementation (Phase 2).

### Pitfall 4: Loading All KPIs Synchronously Blocking Render
**Risk:** The spec's `getAnalyticsData` awaits `Promise.all([maletas, kpis, topRevendedoras, alertasPrazo, produtosMaisVendidos])`. Even with `Promise.all`, if one query is slow (e.g., the `maleta_itens` SUM over 12 months), the entire page is blocked. Vercel's 10s limit applies to the total response.
**Prevention:** Stream data: render the page shell and KPI cards first, then use React `Suspense` boundaries with separate async components for each chart/table. Alternatively, load the heavy "Produtos Mais Vendidos" and "Top Revendedoras" via client-side fetch after initial paint.
**Phase to address:** Frontend architecture (Phase 2).

### Pitfall 5: CSV Export Causing Memory Exhaustion
**Risk:** The spec mentions "Exportar CSV" generating a report with all maletas in the period. If an admin selects "12m" and there are 5,000 maletas, building a CSV string in memory and returning it from a Serverless function can exceed 150MB RAM or timeout.
**Prevention:** Stream the CSV response using Node.js streams or a generator. If using Vercel, keep CSV generation under 50MB; for larger datasets, trigger a background job (Edge Function or Server Action that writes to R2) and email the download link.
**Phase to address:** Export feature implementation (Phase 3).

### Pitfall 6: Realtime Channel Leak in Alert Bell
**Risk:** The `AdminAlertBell` opens a Supabase Realtime channel on every admin page. If 20 admins have the panel open, that's 20 persistent WebSocket connections. Supabase free tier has limits on concurrent connections and may throttle or drop channels.
**Prevention:** Use a polling approach (`setInterval` every 30s) instead of Realtime for the alert bell, or implement Realtime with a single shared channel per browser tab and debounce re-fetching. Document the chosen strategy in the SPEC.
**Phase to address:** Alert bell implementation (Phase 2).

### Pitfall 7: Timezone Bugs in Date Aggregation
**Risk:** The spec uses `DATE(created_at AT TIME ZONE 'America/Asuncion')`. PostgreSQL's `AT TIME ZONE` behavior changes depending on whether `created_at` is `timestamp` or `timestamptz`. If `created_at` is `timestamptz` (which it is in the schema), `AT TIME ZONE` converts to local time and returns `timestamp without time zone`. If done incorrectly, grouping by day may shift dates at midnight boundaries.
**Prevention:** Use `created_at::timestamptz AT TIME ZONE 'America/Asuncion'` consistently, and write a unit test that verifies a `created_at = '2026-04-15 23:30:00-04'` (Asuncion) groups into `2026-04-15`, not `2026-04-16`. Better yet, store a pre-computed `created_at_date` column populated by trigger for fast grouping.
**Phase to address:** Data layer / testing (Phase 2).

---

## Cross-Cutting Pitfalls

### Pitfall 1: Middleware Path Collisions
**Risk:** The middleware currently handles `/app/*` and `/admin/*` as authenticated zones. Adding `/vitrina/[slug]` as a public route requires updating the matcher; if the regex is too broad (e.g., `/vitrina/*` matches `/vitrina/admin`), or if the existing middleware assumes all non-API routes need auth, public vitrina requests may be incorrectly redirected to login.
**Prevention:** Explicitly list public path prefixes in `middleware.ts` with early return: `if (pathname.startsWith('/vitrina/')) return NextResponse.next()`. Add a test case for `/vitrina/test-slug` returning 200 without auth cookies.
**Phase to address:** Middleware update (Phase 1).

### Pitfall 2: New Tables Missing RLS Policies
**Risk:** The spec introduces `AnalyticsAcesso`, `NotificacaoTemplate`, and `NotificacaoLog`. If these are created via Prisma migration without RLS policies, unauthenticated requests to `/api/track-evento` could theoretically `SELECT` or `UPDATE` these tables if the Supabase service role key leaks, or if a malicious client finds an exposed endpoint.
**Prevention:** Every new table must have RLS enabled by default. `AnalyticsAcesso`: `anon` can INSERT only (no SELECT/UPDATE). `NotificacaoTemplate`/`NotificacaoLog`: only authenticated `ADMIN`/`COLABORADORA` can SELECT; only `ADMIN` can UPDATE. Document policies in `SPEC_DATABASE.md`.
**Phase to address:** Database migration (Phase 1).

### Pitfall 3: Analytics Table Growth Without Retention
**Risk:** `AnalyticsAcesso` will receive one row per page view and per WhatsApp click. With 100 resellers x 50 visits/day x 30 days = 150K rows/month. Without a retention policy or partitioning, this table will bloat query performance and storage costs within a year.
**Prevention:** Add a `retention_date` column or use PostgreSQL partitioning by month. Implement a cron job (monthly) that aggregates old data into `AnalyticsAcessoAgg` (daily counts per reseller) and deletes raw rows older than 90 days. Document retention in `SPEC_SECURITY_DATA_PROTECTION.md`.
**Phase to address:** Database design + cron jobs (Phase 1).

### Pitfall 4: Missing `generateStaticParams` for Known Vitrina Slugs
**Risk:** Without `generateStaticParams`, every `/vitrina/[slug]` request hits the server at render time. If a popular reseller shares her link on Instagram Stories, a traffic spike will hit Prisma directly.
**Prevention:** Implement `generateStaticParams` that fetches all active reseller slugs at build time. New slugs created after build will use ISR fallback (`fallback: true`). Pair with `revalidate = 60` so new slugs appear within a minute.
**Phase to address:** Route implementation (Phase 2).

### Pitfall 5: Environment Variables for OneSignal Admin Push Not Set in Production
**Risk:** The spec adds admin notifications via OneSignal (`ONESIGNAL_REST_API_KEY`, `NEXT_PUBLIC_ONESIGNAL_APP_ID`). If these are missing or misconfigured in Vercel production, the `sinalizarDevolucao` Server Action will throw an unhandled error and potentially fail to update the maleta status (if the notification call is not wrapped in `try/catch` and placed after the Prisma update).
**Prevention:** Fire-and-forget notifications: always `await prisma.maleta.update(...)` first, then `try { await sendPush(...) } catch { log }`. Never let external API failures block the core transaction. Add `ONESIGNAL_REST_API_KEY` to the deployment checklist.
**Phase to address:** Server Action implementation (Phase 2).

### Pitfall 6: Cache Invalidation Gap Between Public Vitrina and Admin Changes
**Risk:** An admin updates a product price or image, but the public vitrina (ISR, 60s TTL) still shows the old data. A reseller shares the link and customers see stale prices, causing confusion and lost trust.
**Prevention:** When admin mutations update products, calling `revalidatePath('/vitrina/[slug]')` is not possible for all slugs. Instead, use `revalidateTag('vitrina-catalog')` and have the vitrina page use `unstable_cache` with that tag. Alternatively, reduce `revalidate` to 10s for vitrina pages, or trigger on-demand revalidation from the product update Server Action by fetching all active reseller slugs and calling `revalidatePath` for each (acceptable if <500 resellers).
**Phase to address:** Cache strategy update (Phase 2).

### Pitfall 7: OneSignal Template Editor XSS via Variable Injection
**Risk:** The spec allows admins to edit push templates with variables like `{maleta_id}`. If the template body is rendered into HTML/JSX without escaping, and a variable contains malicious input (e.g., a reseller name with `<script>`), it becomes a stored XSS vector in the admin panel.
**Prevention:** Sanitize template output with the existing `DOMPurify` + `isomorphic-dompurify` stack. Validate variable names against a strict whitelist (`maleta_id`, `dias_restantes`, `nome_revendedora`) and reject unknown placeholders. Never render template content directly into the DOM via `dangerouslySetInnerHTML`.
**Phase to address:** Admin template editor (Phase 2).

### Pitfall 8: `/api/track-evento` Becomes a Write Amplification Vector
**Risk:** The public tracking endpoint accepts `POST` with `reseller_id`, `tipo_evento`, `visitor_id`, and `produto_id`. Without rate limiting, a malicious actor can flood this endpoint with fake events, inflating analytics and filling the `AnalyticsAcesso` table.
**Prevention:** Add simple rate limiting per IP: max 30 requests/minute to `/api/track-evento`. Validate `tipo_evento` against a strict enum (`catalogo_revendedora`, `clique_whatsapp`). Reject requests with missing `visitor_id` or invalid UUID format. Consider a CAPTCHA for high-volume anomalies.
**Phase to address:** API route hardening (Phase 2).
