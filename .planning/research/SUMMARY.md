# Research Summary — v1.3 Polimento, Segurança e UX Admin

**Synthesized:** 2026-05-07
**Sources:** STACK.md · FEATURES.md · ARCHITECTURE.md · PITFALLS.md

---

## Stack Additions

| Package | Ação | Versão | Motivo |
|---------|------|--------|--------|
| `next` + `eslint-config-next` | Upgrade | `16.2.5` | Fecha GHSA-q4gf-8mx6-v5v3 + postcss CVE (16.2.3 não é suficiente) |
| `@serwist/next` + `serwist` | Upgrade | `9.5.11` | Corrige chain `brace-expansion@2.0.2` (CVSS 8.7) via `glob@13` |
| `react-day-picker` | Add | `9.14.0` | Range mode para analytics date picker; já é dep transitiva do shadcn/ui |
| `sanitize-html` | Add | latest | Substitui regex de sanitização para corpo HTML de email (bypass confirmado em aspas simples) |

**O que NÃO adicionar:** WYSIWYG editors (TipTap, Quill) — admin edita HTML raw num textarea, igual aos push templates.

**Vulnerabilidades sem fix disponível:**
- `xlsx@0.18.5` — CVE no parse path; projeto usa apenas write path (export). Aceitar risco + documentar.
- `jspdf` — verificar `4.2.1+` antes de desistir.
- `vite` (via `vitest@4`) — 3 CVEs high. Fora do escopo v1.3, triagem para v1.4.

---

## Achados Críticos de Segurança (Phase 12 — obrigatório)

### 🚨 Export routes sem auth — PII leak ativo
- `src/app/api/export/route.ts` (xlsx) e `src/app/api/export/pdf/route.ts` — **sem `requireAuth()`**
- Retornam nomes reais, WhatsApp e dados de maleta sem autenticação
- **Fix:** `requireAuth(["ADMIN", "COLABORADORA"])` em ambas as routes antes de qualquer outra coisa

### ⚠️ Sanitização HTML com bypass confirmado
- `sanitizeTemplateVars()` em `notifications-server.ts` tem bypass via `href` com aspas simples
- Para email bodies: usar `sanitize-html` com allowlist de tags de email (`table`, `tr`, `td`, `p`, `b`, `i`, `a`, `br`)

### ⚠️ Timezone bug nos analytics — fix deve ser atômico
- `getSinceDate` usa `setHours(0,0,0,0)` → UTC midnight = ~21h do dia anterior em Assunção (UTC-3)
- Afeta todos os 7 call sites em `actions-analytics.ts`
- Fix deve ser aplicado a todos os sites simultaneamente — fix parcial cria inconsistência entre presets e range picker

---

## Decisões por Feature

### Email Templates Admin (`/admin/config/emails`)
- Padrão idêntico ao push template editor em `/admin/config/notif-push`
- **DB-override, não DB-replace:** 7 TypeScript template functions ficam como fallback. Send logic consulta DB primeiro, cai para hardcoded se não encontrar override.
- `corpo_html` armazena apenas o inner HTML (dentro de `renderEmailBase()`), nunca o email completo
- `{senhaTemp}` permanece hardcoded — não editável pelo admin
- Variable chips reutilizam `substituirVariaveis()` de `notifications-server.ts`
- Rate limit no test-send: máx. 5 emails de teste/hora/admin — Brevo tem limite de 300/dia e 429 é silenciado atualmente

### Analytics Período Personalizado
- `react-day-picker@9.14.0` em modo `range`, estilizado com tokens `--admin-*`
- URL: manter `?period=7|30|90|365` (backward compat) + adicionar `?from=YYYY-MM-DD&to=YYYY-MM-DD`
- Refatorar signature: `getSinceDate(days: number)` → `getDateRange(from: Date, to: Date)` nos 8 métodos de `actions-analytics.ts`
- Guard de máx. 366 dias entre from e to
- UX: presets existentes + botão "Personalizado" que abre o calendar picker

### Admin UI Consistency
- Auditoria primeiro (lista de desvios por rota), implementação depois
- Consultar artboards do Paper MCP antes de qualquer mudança de layout
- Desvios confirmados em `analytics/page.tsx`: 9+ hex hardcoded (`bg-[#35605A]`, `#4ADE80`, `#E05C5C`, etc.)
- **NÃO** mudar escopo das vars `--admin-*` de `:root` para `.admin-layout` — Radix UI Dialog, DropdownMenu e Popover renderizam via React portal e perderiam os tokens

---

## Ordem de Build Recomendada

| Phase | Nome | Conteúdo | Dependências |
|-------|------|----------|--------------|
| 12 | Segurança | Next.js 16.2.5, serwist 9.5.11, export route auth, sanitize-html, timezone fix | Nenhuma |
| 13 | Email Templates | Prisma model `EmailTemplate`, CRUD `/admin/config/emails`, textarea editor, variable chips | Phase 12 (`sanitize-html`) |
| 14 | Analytics Date Range | `react-day-picker`, refactor actions, URL params, max guard | Phase 12 (timezone fix) |
| 15 | Admin UI | Auditoria Paper, substituir hex por tokens, componentes admin | Phase 12 (base estável) |

---

## Watch Out For

1. **Serwist é sensível a versões** — houve crash anterior (`isomorphic-dompurify` SSR). Verificar SW registration no Chrome DevTools após upgrade antes de mergear.
2. **Email migration trap** — padrão `NotificacaoTemplate` já existe no DB mas o send logic o ignorava. O mesmo erro ocorre se `EmailTemplate` for populado sem o send logic lê-lo. Implementar os dois juntos.
3. **Brevo rate limit silenciado** — implementar feedback de 429 no test-send antes de lançar o editor.
4. **Timezone fix deve ser atômico** — fix parcial em `getSinceDate` cria inconsistência visível entre modos.
5. **vite CVEs (3 high)** — out of scope v1.3, triagem para v1.4.

---

*Research synthesized: 2026-05-07*
