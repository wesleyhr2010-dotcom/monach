# Research: Architecture for v1.1

## Integration Map

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           EXISTING ARCHITECTURE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  App Router                    Prisma/Supabase              External APIs   │
│  ┌─────────────┐              ┌─────────────────┐          ┌─────────────┐  │
│  │ /app/*      │◄────────────►│ Reseller        │          │ Brevo       │  │
│  │ /admin/*    │   RLS        │ Maleta/MaletaItem│         │ OneSignal   │  │
│  │ /catalogo   │   Guards     │ AnalyticsAcesso │          │ R2          │  │
│  │ /produto/*  │              │ AnalyticsDiario │          └─────────────┘  │
│  └─────────────┘              └─────────────────┘                           │
│        ▲                                                                      │
│        │ Middleware (JWT refresh + path guards)                              │
│        └────────────────────────────────────────────────────────────────────  │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                           v1.1 NEW FEATURES                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. VITRINA PÚBLICA                    2. EMAIL BRANDING                     │
│  ───────────────────                   ───────────────                       │
│  /vitrina/[slug] (NEW)                 src/lib/email-templates/* (MODIFY)    │
│    ├─ Server Component                 src/lib/email-layout.ts (NEW)         │
│    ├─ generateMetadata                 Copy espanhol paraguaio (MODIFY)      │
│    ├─ cookie visitor_id (middleware)   Tokens visuais DS (MODIFY)            │
│    └─ /api/track-evento (NEW)                                                │
│                                                                              │
│  3. ADMIN ANALYTICS EXTENSION                                                │
│  ─────────────────────────────                                               │
│  /admin/analytics (EXTEND)                                                   │
│    ├─ + queries AnalyticsAcesso (MODIFY actions-analytics.ts)                │
│    ├─ + seção Vitrina Metrics (MODIFY page.tsx)                              │
│    └─ + export CSV (NEW)                                                     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATA FLOW — Vitrina                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Cliente final ──► /vitrina/[slug]                                           │
│                        │                                                     │
│                        ├─► Middleware: set cookie monarca_visitor_id         │
│                        ├─► SC: fetch Reseller by slug + Maleta ativa         │
│                        ├─► SC: write AnalyticsAcesso (fire-and-forget)       │
│                        └─► Render: VitrinaView                               │
│                                 │                                            │
│                                 └─► CC: WhatsAppConsultarButton              │
│                                        │                                     │
│                                        └─► POST /api/track-evento            │
│                                               │                              │
│                                               └─► Prisma.analyticsAcesso     │
│                                                                              │
│  Admin ──► /admin/analytics ──► actions-analytics.ts                         │
│                                    │                                         │
│                                    └─► + read AnalyticsAcesso aggregations   │
│                                        (visitas, cliques WhatsApp por        │
│                                         revendedora/período)                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATA FLOW — Email                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Trigger (Server Action) ──► src/lib/email-templates/{template}.ts           │
│                                    │                                         │
│                                    └─► import { wrapEmail } from             │
│                                        "../email-layout"                     │
│                                              │                               │
│                                              └─► Header logo Monarca         │
│                                                  Body customizado            │
│                                                  Footer consistente          │
│                                                        │                     │
│                                                        ▼                     │
│                                              src/lib/emails.ts (Brevo SDK)   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## New Components

### Vitrina Pública

| Component | Type | Responsibility |
|-----------|------|----------------|
| `src/app/vitrina/[slug]/page.tsx` | Server Component | Fetch reseller + maleta ativa + itens; generateMetadata; fire tracking write |
| `src/app/vitrina/[slug]/VitrinaHeader.tsx` | Server Component | Avatar, nome revendedora, CTA WhatsApp flutuante |
| `src/app/vitrina/[slug]/ArticuloCard.tsx` | Server Component | Imagem (R2), nome, preço, CTA "Consultar" |
| `src/app/vitrina/[slug]/WhatsAppConsultarButton.tsx` | Client Component | Tracking `clique_whatsapp` + abrir WhatsApp com mensagem preenchida |
| `src/app/api/track-evento/route.ts` | Route Handler (public) | Recebe eventos anônimos; valida tipo_evento whitelist; grava em `AnalyticsAcesso` |
| `src/lib/tracking.ts` | Lib | `trackearAcceso()` — helper fire-and-forget para Server Components |

### Email Branding

| Component | Type | Responsibility |
|-----------|------|----------------|
| `src/lib/email-layout.ts` | Lib | Wrapper base HTML com header logo Monarca, footer consistente, tokens de cor/tipografia (`#35605a`, Raleway) |
| `src/lib/email-templates/*.ts` (7 arquivos) | Lib (refactored) | Cada template passa a usar `wrapEmail()` + copy revisada em espanhol paraguaio |

### Admin Analytics Extension

| Component | Type | Responsibility |
|-----------|------|----------------|
| `src/app/admin/analytics/_components/VitrinaMetrics.tsx` | Server Component | Cards de visitas únicas, cliques WhatsApp, taxa de conversão da vitrina |
| `src/app/admin/analytics/_components/ExportCsvButton.tsx` | Client Component | Download CSV dos dados brutos do período filtrado |
| `src/app/admin/actions-analytics.ts` (extend) | Server Actions | Novas queries: `getAnalyticsVitrina()` agregando `AnalyticsAcesso` por reseller/período |

## Modified Components

### Existing code that changes

| File | Change Type | What Changes |
|------|-------------|--------------|
| `src/app/vitrina/[slug]/page.tsx` | **Rewrite** | Substituir placeholder por implementação completa (SEO, data fetch, tracking) |
| `src/middleware.ts` | **Extend** | Adicionar lógica de cookie `monarca_visitor_id` (UUID v4, 30 dias, SameSite=Lax, HttpOnly=false) |
| `src/lib/email-templates/documento-pendente.ts` | **Refactor** | Usar `wrapEmail()` + revisar copy es-PY |
| `src/lib/email-templates/documento-aprovado.ts` | **Refactor** | Usar `wrapEmail()` + revisar copy es-PY |
| `src/lib/email-templates/documento-rejeitado.ts` | **Refactor** | Usar `wrapEmail()` + revisar copy es-PY |
| `src/lib/email-templates/acerto-confirmado.ts` | **Refactor** | Usar `wrapEmail()` + revisar copy es-PY |
| `src/lib/email-templates/candidatura-aprovada.ts` | **Refactor** | Usar `wrapEmail()` + revisar copy es-PY |
| `src/lib/email-templates/candidatura-rechazada.ts` | **Refactor** | Usar `wrapEmail()` + revisar copy es-PY |
| `src/lib/email-templates/convite-usuario.ts` | **Refactor** | Usar `wrapEmail()` + revisar copy es-PY |
| `src/app/admin/actions-analytics.ts` | **Extend** | Adicionar `getAnalyticsVitrina(periodDays)` com agregações de `AnalyticsAcesso` |
| `src/app/admin/analytics/page.tsx` | **Extend** | Inserir seção "Vitrina Pública" com métricas de visitas + cliques WhatsApp |
| `src/app/admin/analytics/AnalyticsKpiCards.tsx` | **Extend** | Adicionar cards de vitrina (visitas, CTR WhatsApp) quando aplicável |

### Notes on "noindex"

A SPEC define `robots: 'noindex'` para vitrinas. Como a rota `/vitrina/[slug]` é pública mas usa ISR (`revalidate = 60`), o `generateMetadata` deve retornar `robots: { index: false }`. Isso não requer middleware — é metadata dinâmica no Server Component.

### Notes on cookie strategy

A SPEC sugere cookie em middleware. Isso é o padrão correto porque:
1. Server Components Next.js 15 não podem setar response headers/cookies diretamente
2. O middleware intercepta todo request antes do routing
3. O cookie é não-sensível (UUID anônimo), portanto `HttpOnly: false` é aceitável para tracking client-side

## Data Flow Changes

### New data paths

1. **Visitor Identification**
   ```
   Request ──► Middleware ──► Check cookie monarca_visitor_id
                                │
                                ├─ exists → passa adiante
                                └─ missing → gera UUID → Set-Cookie
   ```

2. **Vitrina Page Load**
   ```
   /vitrina/[slug] ──► SC: ler cookie visitor_id
                     ├──► Prisma: findUnique Reseller (slug + ativo=true)
                     ├──► Prisma: findMany MaletaItem (maleta ativa)
                     ├──► Fire-and-forget: trackearAcceso(tipo='catalogo_revendedora')
                     └──► Render + passa visitorId para CC
   ```

3. **WhatsApp Click**
   ```
   WhatsAppConsultarButton (CC) ──► fetch /api/track-evento (tipo='clique_whatsapp')
                                  ├──► API Route: valida whitelist → Prisma.analyticsAcesso.create
                                  └──► window.open(whatsapplink)
   ```

4. **Admin Analytics Read**
   ```
   /admin/analytics ──► SC: requireAuth
                      ├──► Existing: KPIs maletas (prisma.maleta)
                      ├──► Existing: Fluxo, Distribuição, Top Revendedoras
                      ├──► NEW: Vitrina metrics (prisma.analyticsAcesso aggregate)
                      │           COUNT visitas, COUNT DISTINCT visitor_id,
                      │           COUNT cliques_whatsapp, CTR %
                      └──► Render
   ```

5. **Email Send**
   ```
   Server Action trigger ──► template function
                           ├──► wrapEmail(htmlBody) → HTML completo com branding
                           └──► sendEmail() → Brevo API
   ```

### Prisma queries — new vs existing

| Query | Location | Status |
|-------|----------|--------|
| `Reseller.findUnique({ slug, ativo: true })` | vitrina page | **New** (slug filter) |
| `AnalyticsAcesso.create({ tipo: 'catalogo_revendedora' })` | vitrina page / track-evento | **New** |
| `AnalyticsAcesso.create({ tipo: 'clique_whatsapp' })` | track-evento API | **New** |
| `AnalyticsAcesso.aggregate({ _count, _groupBy })` | actions-analytics | **New** |
| `Maleta/MaletaItem queries` | vitrina page | **Existing pattern** (reused from `/app/maleta`) |
| `maleta.aggregate / groupBy / $queryRaw` | actions-analytics | **Existing** (v1.0) |

## Suggested Build Order

### Phase 1: Vitrina Pública (data source)
**Goal:** Página funcional gerando eventos de analytics.
**Depends on:** Nothing new (schema já tem `Reseller.slug` e `AnalyticsAcesso`).

1. **Middleware cookie** — adicionar `monarca_visitor_id` em `src/middleware.ts` (UUID, 30d, Lax)
2. **API Route** — `src/app/api/track-evento/route.ts` (whitelist `['catalogo_revendedora', 'clique_whatsapp']`)
3. **Server Component** — reescrever `src/app/vitrina/[slug]/page.tsx`:
   - `generateMetadata` com `noindex`
   - Fetch reseller por slug (404 se inativo/inexistente)
   - Fetch itens da maleta ativa
   - Fire tracking via helper `trackearAcceso()`
4. **UI Components** — `VitrinaHeader`, `ArticuloCard`, `WhatsAppConsultarButton` (client)
5. **Placeholder state** — "Próximamente artículos disponibles" quando sem maleta ativa

### Phase 2: Email Branding (independent)
**Goal:** Todos os emails transacionais com identidade visual unificada e copy es-PY.
**Depends on:** Nothing (pode rodar em paralelo com Phase 1).

1. **Base wrapper** — criar `src/lib/email-layout.ts` com:
   - Header: logo Monarca (texto ou img hosted)
   - CSS inline com tokens do design system (`#35605a`, `#C9A84C`, Raleway)
   - Footer: endereço/site/disclaimer padrão
2. **Refactor templates** — atualizar 7 arquivos em `src/lib/email-templates/` para usar `wrapEmail()`
3. **Copy review** — garantir espanhol paraguaio em todos os textos (ej: "Consignación", "Revendedora", "Consultora")
4. **Test send** — validar render em clientes de email (Gmail, mobile)

### Phase 3: Admin Analytics Extension (consumer)
**Goal:** Dashboard admin exibindo métricas da vitrina pública.
**Depends on:** Phase 1 (dados em `AnalyticsAcesso`).

1. **Extend actions-analytics.ts** — adicionar:
   - `getAnalyticsVitrina(periodDays)` — agregações de visitas e cliques
   - `getAnalyticsVitrinaPorRevendedora(periodDays, limit)` — ranking de revendedoras por visitas
2. **Extend page.tsx** — adicionar seção "Vitrina Pública" com:
   - Card: total visitas no período
   - Card: visitantes únicos
   - Card: cliques WhatsApp
   - Card: taxa de conversão (cliques / visitas)
   - Tabela: top revendedoras por visitas à vitrina
3. **Export CSV** — `ExportCsvButton` que consolida dados do período (maletas + vitrina)
4. **Integration test** — verificar que eventos da vitrina aparecem no dashboard em tempo real (dentro do revalidate)

### Dependency Graph

```
Phase 1 (Vitrina) ───────────────► Phase 3 (Analytics Extension)
      │                                    ▲
      │ (gera dados em                    │ (consome dados)
      │  AnalyticsAcesso)                 │
      │                                    │
Phase 2 (Email Branding) ────────────────┘ (independente)
```

### Risk: Schema mismatch

O schema atual já possui:
- `Reseller.slug` ✓
- `Reseller.avatar_url` ✓
- `Reseller.whatsapp` ✓
- `AnalyticsAcesso` com `reseller_id`, `visitor_id`, `tipo_evento`, `produto_id` ✓
- `AnalyticsDiario` para agregações diárias ✓

**No migrations necessários** para v1.1. Todos os campos requeridos já existem.

### Risk: ISR + dynamic metadata

A vitrina usa ISR (`revalidate = 60`). `generateMetadata` em páginas ISR é suportado pelo Next.js 15 — o metadata é gerado no build e revalidado junto com a página. Como cada slug é diferente, a primeira visita a um slug novo causa um MISS (SSR), e subsequentes são servidas do cache.

**Mitigação:** garantir que `generateMetadata` não faça queries adicionais além do `findUnique` do reseller (compartilhar o mesmo fetch da página principal).
