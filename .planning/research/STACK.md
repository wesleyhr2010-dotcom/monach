# Research: Stack for v1.1

> **Scope:** Identificar adições de biblioteca/padrão estritamente necessárias para as 3 features do milestone v1.1 (Vitrina pública, Email branding, Admin analytics).  
> **Baseline:** Next.js 16.1.6 + React 19 + Tailwind v4 + Prisma 7 + Supabase Auth/RLS + Brevo + OneSignal + Recharts 3.8.1 + Serwist PWA.

---

## Existing Stack (Baseline)

| Capability | Library / Pattern | Status |
|-----------|-------------------|--------|
| Framework | `next` 16.1.6 + `react` 19.2.3 | ✓ |
| Styling | `tailwindcss` v4 + design tokens (`--app-*`, `--admin-*`) | ✓ |
| Charts | `recharts` 3.8.1 | ✓ |
| Database | `prisma` 7.4.2 + `@prisma/adapter-pg` | ✓ |
| Auth / Realtime | `@supabase/ssr` 0.9.0 + `@supabase/supabase-js` 2.98.0 | ✓ |
| Email delivery | `@getbrevo/brevo` 5.0.4 | ✓ |
| Push | `react-onesignal` 3.5.1 | ✓ |
| Validation | `zod` 4.3.6 | ✓ |
| Testing | `vitest` 4.0.18 | ✓ |
| PDF / CSV | `jspdf` 4.2.0 + `papaparse` 5.5.3 | ✓ |
| Images / Storage | `@aws-sdk/client-s3` 3.997.0 + `sharp` 0.34.5 | ✓ |

---

## New Stack Needs

### For Vitrina Pública (SEO + Tracking)

**Nenhuma biblioteca nova é necessária.** Todas as capacidades são nativas do Next.js 15+ e do runtime Node.js.

| Pattern | Nativo de | Onde se integra | Rationale |
|---------|-----------|-----------------|-----------|
| `generateMetadata` | `next` | `/vitrina/[slug]/page.tsx` | SEO dinâmico (título, descrição, OG, `robots: noindex`) é API oficial do App Router. Não adicionar `next-seo` — seria duplicidade. |
| `cookies()` / `headers()` | `next/headers` | Server Component da vitrina | Leitura e escrita de cookie `monarca_visitor_id` server-side. |
| `crypto.randomUUID()` | Node.js 19+ / Edge Runtime | Server Component / Middleware | Geração de UUID v4 para `visitor_id` sem instalar `uuid`. |
| Route Handler `POST` | `next` | `/api/track-evento/route.ts` | Endpoint público de tracking fire-and-forget. Nativo do App Router. |
| OG Images dinâmicas | `next/og` (`ImageResponse`) | `/vitrina/[slug]/opengraph-image.tsx` (opcional) | Geração de imagens OG on-the-fly é nativa desde Next.js 13. Não instalar `@vercel/og`. |

> **Nota sobre cookie em Server Component:** Next.js Server Components podem ler cookies via `cookies()`, mas **não podem setar headers de resposta**. Se for necessário criar o `visitor_id` no primeiro acesso, a estratégia é: (a) Middleware que injeta o cookie antes do hit da página, ou (b) Client Component que detecta ausência do cookie e grava via `document.cookie`. Ambas usam APIs nativas.

---

### For Email Branding

**Recomendação principal: zero bibliotecas novas.** A padronização de layout é um problema de **template wrapper**, não de dependência.

| Abordagem | O que é | Quando usar |
|-----------|---------|-------------|
| **Recomendada:** `EmailLayout` base + template literals | Função wrapper que injeta header (logo, cores Monarca) e footer (unsubscribe, endereço) em HTML string. | 7 templates existentes, volume baixo, copy estável. |
| **Alternativa DX:** `@react-email` | `@react-email/components` 1.0.12 + `@react-email/render` 2.0.8 + `@react-email/tailwind` 2.0.7 | Se o time precisar de preview local de emails, testes visuais, ou escalar para 20+ templates. |

**Integração da abordagem zero-lib:**

```ts
// src/lib/email-layout.ts
export function renderEmailBase(contentHtml: string, opts: { previewText?: string }) {
  return `
    <!doctype html>
    <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
      <body style="margin:0;padding:0;background:#f6f6f6;font-family:Arial,sans-serif;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr><td align="center" style="padding:24px 0;">
            <table width="600" cellspacing="0" cellpadding="0" style="background:#fff;border-radius:8px;overflow:hidden;">
              <!-- Header Monarca -->
              <tr><td style="background:#35605a;padding:24px;text-align:center;">
                <img src="${process.env.NEXT_PUBLIC_SITE_URL}/logo-email.png" alt="Monarca" width="140" />
              </td></tr>
              <!-- Content -->
              <tr><td style="padding:32px 24px;">${contentHtml}</td></tr>
              <!-- Footer -->
              <tr><td style="background:#fafafa;padding:24px;text-align:center;color:#888;font-size:12px;">
                Monarca Semijoyas · monarcasemijoyas.com.py
              </td></tr>
            </table>
          </td></tr>
        </table>
      </body>
    </html>
  `;
}
```

Todos os templates existentes (`src/lib/email-templates/*.ts`) passam seu HTML interno por `renderEmailBase()` antes de chamar `sendEmail()`. O ponto de integração é único: `src/lib/emails.ts` (já existe).

**Por que NÃO adicionar `@react-email` agora:**
- 7 templates transacionais, copy estável, baixa frequência de mudança.
- Templates atuais são strings HTML simples; migrar para JSX é churn sem ganho operacional imediato.
- `@react-email/tailwind` 2.0.7 tem peer deps que podem conflitar com Tailwind v4 do projeto (ainda não totalmente validado na v4).
- Se no futuro o volume de templates ultrapassar 15–20, reavaliar `@react-email`.

---

### For Admin Analytics

**Nenhuma biblioteca nova é necessária.** Todas as capacidades visuais e de dados já existem na codebase.

| Capability | O que já existe | Onde se integra |
|------------|-----------------|-----------------|
| Gráficos de linha / donut / barras | `recharts` 3.8.1 | `/admin/analytics/page.tsx` e componentes filhos. Reutilizar padrão já estabelecido em `/app/desempeno` (revendedora). |
| Realtime badge (sininho) | `@supabase/supabase-js` 2.98.0 | `AdminAlertBell` — canal `postgres_changes` na tabela `maletas` com filtro `status=eq.aguardando_revisao`. |
| Queries agregadas / raw SQL | `prisma` 7.4.2 + `$queryRaw` | `getAnalyticsData()` — series temporais, top produtos, KPIs. Já usado em outras partes do admin. |
| Export CSV | Nativo (template string + `Blob`) | Botão "Exportar CSV" — construir string com `\n` separador e fazer download via `URL.createObjectURL`. Não instalar lib de CSV apenas para export simples. |
| Date math (períodos 7d/30d/3m/12m) | Nativo `Date` | `new Date(Date.now() - N * 24*60*60*1000)` é suficiente. Não adicionar `date-fns` ou `dayjs`. |

> **Nota sobre CSV:** `papaparse` 5.5.3 já está em `dependencies`, mas é **parser** (leitura), não writer. Para escrita, uma função utilitária de 10 linhas é suficiente e evita adicionar `csv-writer` ou `csv-stringify`.

---

## Integration Points

1. **Vitrina → Analytics DB**
   - Server Component `/vitrina/[slug]/page.tsx` chama `trackearAcceso()` (Server Action ou helper Prisma) passando `visitor_id` do cookie.
   - Client Component `WhatsAppConsultarButton` chama `fetch('/api/track-evento', ...)` antes de abrir `wa.me`.

2. **Email Templates → Brevo**
   - Todos os `src/lib/email-templates/*.ts` são atualizados para usar `renderEmailBase()`.
   - `src/lib/emails.ts` (Brevo client) permanece inalterado — continua recebendo `htmlContent: string`.

3. **Admin Analytics → Recharts**
   - Componentes de gráfico reutilizam o mesmo padrão de `/app/desempeno` (composable chart components: `<LineChart />`, `<ResponsiveContainer />`, etc.).
   - Filtro de período (7d/30d/3m/12m) é estado client-side que refetch via Server Action ou query string + `router.refresh()`.

4. **Alert Bell → Supabase Realtime**
   - `AdminAlertBell` (Client Component) abre canal Realtime no mount.
   - `fetchCount()` e `fetchMaletas()` batem em API Routes (`/api/admin/alertas/*`) que usam `getAdminSession()` + `getResellerScope()` + Prisma.

---

## What NOT to Add

| Library / Pattern | Por que evitar |
|-------------------|----------------|
| `next-seo` | `generateMetadata` nativo do Next.js 15 cobre 100% dos casos (título, descrição, OG, robots, alternates). |
| `js-cookie` / `react-cookie` | `next/headers` server-side e `document.cookie` client-side são suficientes para um único cookie anônimo. |
| `uuid` | `crypto.randomUUID()` é nativo em todos os runtimes que o projeto usa (Node.js 20+, Edge, Browser moderno). |
| `@vercel/og` | `ImageResponse` de `next/og` é nativo desde Next.js 13. |
| `date-fns` / `dayjs` | Cálculos de período (7d, 30d, 3m, 12m) são subtrações simples de timestamp. Não justifica bundle extra. |
| `@tanstack/react-table` | Tabelas do analytics são simples (top 10, lista de alertas). HTML `<table>` + Tailwind já usado no admin. |
| `csv-writer` / `csv-stringify` | Export CSV de relatório admin é string template + download nativo. |
| Chart library extra (chart.js, victory, nivo) | `recharts` 3.8.1 já instalado e usado em produção. |
| Analytics SaaS (Plausible, Google Analytics, Mixpanel) | A SPEC define analytics próprio (`AnalyticsAcesso` no Postgres). Não adicionar tracker de terceiro sem decisão de produto explícita. |
| `@react-email` (agora) | Ver seção "Email Branding" — overkill para 7 templates estáveis. Reavaliar se passar de 20 templates. |

---

## Recommendation

**v1.1 não requer instalação de nenhuma biblioteca nova.**

Todas as 3 features são implementáveis com o stack existente, usando APIs nativas do Next.js 15+ e padrões já estabelecidos na codebase:

1. **Vitrina pública:** `generateMetadata`, `cookies()`, Route Handler, `crypto.randomUUID()`.
2. **Email branding:** função `renderEmailBase()` wrapper (nova, ~30 linhas) aplicada nos 7 templates existentes.
3. **Admin analytics:** `recharts` (já usado), `@supabase/supabase-js` Realtime (já usado), Prisma `$queryRaw` (já usado), CSV nativo.

**Se o time decidir priorizar DX de email no futuro**, a stack candidata é `@react-email/components` 1.0.12 + `@react-email/render` 2.0.8, mas isso deve ser tratado como um spike separado (fora do escopo v1.1) devido ao potencial de conflito com Tailwind v4.

**Ação imediata:** nenhum `npm install` necessário. Começar implementação diretamente nas camadas de aplicação (pages, components, templates).

---

*Research produced: 2026-05-05*  
*Verifier: npm registry (versions checked via `npm view`)*
