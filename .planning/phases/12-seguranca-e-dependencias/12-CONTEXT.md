# Phase 12: Segurança e Dependências - Context

**Gathered:** 2026-05-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Fechar vulnerabilidades conhecidas e corrigir bugs de segurança antes de iniciar novas features. Fase 100% técnica — sem novas telas nem funcionalidades para usuário final.

**In scope:**
- SEC-01: Adicionar `requireAuth(["ADMIN","COLABORADORA"])` em `/api/export/route.ts` e `/api/export/pdf/route.ts` (atualmente sem nenhuma autenticação)
- SEC-02: Atualizar Next.js de 16.1.6 → 16.2.5 (fecha 5 CVEs: recursos/limites, HTTP request smuggling, CSRF, WebSocket origin)
- SEC-03: Atualizar `@serwist/next` e `serwist` de 9.5.6 → 9.5.11 (fecha brace-expansion CVSS 8.7)
- SEC-04: Instalar `sanitize-html`, criar função helper de sanitização HTML com allowlist, aplicar nos templates de email antes de enviar
- SEC-05: Corrigir `getSinceDate` em `actions-analytics.ts` para usar timezone do Paraguai (UTC-3) em vez de UTC midnight
- SEC-06: Documentar risco aceito de `xlsx` e `jspdf` (sem CVE fix disponível upstream, uso restrito a write/export)

**Out of scope:**
- Migração de CVEs de `vite`/`vitest` (dev tooling apenas, não afeta produção — deferred v1.4)
- Novas features de segurança (rate limiting de gamificação, ownership check em awardPoints) — deferred v1.4
- Mudanças de UI ou novas rotas admin

</domain>

<decisions>
## Implementation Decisions

### SEC-04: HTML Allowlist para sanitize-html
- **D-01:** Tags permitidas: `p`, `br`, `strong`, `em`, `ul`, `ol`, `li`, `a`, `h1`, `h2`, `h3`, `span`, `div` — suficientes para emails transacionais ricos sem expor vetores de ataque.
- **D-02:** Atributo `style` permitido em TODAS as tags (obrigatório: email clients exigem CSS inline para renderização correta).
- **D-03:** Atributo `href` permitido apenas em `<a>`, protocolos `http` e `https` únicos (bloquear `javascript:`, `data:`, `file:`, `mailto:` e similares).
- **D-04:** Todos os demais atributos removidos (`class`, `id`, `target`, `data-*`, `onclick`, `onload`, etc.) — allowlist explícita de atributos, não blocklist.
- **D-05:** Esta allowlist é a definição canônica para o editor de email da Fase 13 — o helper criado aqui será reutilizado diretamente.

### SEC-05: Correção de Timezone em getSinceDate
- **D-06:** Abordagem: offset manual com constante `PY_OFFSET_HOURS = 3` (UTC-3). Sem nova dependência (`date-fns-tz` não necessário).
- **D-07:** Paraguay não usa horário de verão desde 2024 — offset fixo de 3h é correto e estável.
- **D-08:** Fix aplicado na função central `getSinceDate` em `src/app/admin/actions-analytics.ts` — todos os 7 call sites ficam corrigidos automaticamente sem tocar em cada um.
- **D-09:** Lógica correta: converter `new Date()` para Paraguay subtraindo 3h, fazer aritmética de dias no horário do Paraguay, retornar UTC equivalente ao midnight paraguaio.

### Cobertura de Testes de Regressão
- **D-10:** Adicionar testes de autenticação para SEC-01: requisição sem sessão em `/api/export` e `/api/export/pdf` deve retornar 401. Integrar no suite de segurança existente.
- **D-11:** Adicionar unit test para helper de sanitização (SEC-04): verificar que `<script>`, event handlers (`onclick=`), `javascript:` em href e tags não-permitidas são removidos. O test documenta a allowlist como código executável.

### Claude's Discretion
- Local exato onde documentar o risco aceito de `xlsx`/`jspdf` (SEC-06) — pode ser comentário no arquivo de export ou entrada em REQUIREMENTS.md §Out of Scope
- Implementação interna do helper `sanitizeEmailHtml()` (wrapper sobre `sanitize-html` com a allowlist D-01..D-04)
- Nome do arquivo do helper de sanitização (e.g., `src/lib/email-sanitizer.ts`)
- Ordem dos planos de execução (recomendado: SEC-01 primeiro por ser vulnerabilidade crítica ativa)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Roadmap & Requirements
- `.planning/ROADMAP.md` — Phase 12 goal, success criteria (4 critérios verificáveis)
- `.planning/REQUIREMENTS.md` — SEC-01 a SEC-06 com descrições completas

### Rotas de Export (SEC-01)
- `src/app/api/export/route.ts` — Rota xlsx/csv sem auth (FICHEIRO A CORRIGIR)
- `src/app/api/export/pdf/route.ts` — Rota pdf sem auth (FICHEIRO A CORRIGIR)

### Analytics / Timezone (SEC-05)
- `src/app/admin/actions-analytics.ts` — `getSinceDate` (linha 72) e 7 call sites

### Email / Sanitização (SEC-04)
- `src/lib/emails.ts` — Send logic dos emails transacionais
- `src/lib/email-base.ts` — `renderEmailBase()` wrapper
- `src/lib/email-templates/` — 7 templates TypeScript (acerto-confirmado, candidatura-aprovada, etc.)
- `src/lib/email-base.test.ts` — Testes existentes de email (padrão a seguir)

### Segurança e RBAC
- `docs/sistema/SPEC_SECURITY_RBAC.md` — Roles ADMIN, COLABORADORA, REVENDEDORA
- `docs/sistema/SPEC_SECURITY_DATA_PROTECTION.md` — PII handling, proteção de dados
- `docs/sistema/SPEC_SECURITY_API_ENDPOINTS.md` — Endpoints sensíveis e proteções

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`src/lib/user.ts`** — `requireAuth(["ADMIN","COLABORADORA"])` — importar e usar diretamente nas rotas de export (SEC-01). Padrão estabelecido em todas as server actions.
- **`src/lib/email-base.test.ts`** — Padrão de teste de email existente — seguir mesma estrutura para unit tests de sanitização.
- **`src/app/admin/actions-analytics.ts:72`** — `getSinceDate` a corrigir.

### Established Patterns
- **Auth em route handlers:** Rotas API autenticadas chamam `requireAuth` no início do handler e retornam `NextResponse.json({ error: "..." }, { status: 401 })` se não autorizado.
- **Timezone em SQL:** `AT TIME ZONE 'America/Asuncion'` já usado em queries — o fix de JS deve ser consistente com esse padrão.
- **Testes de segurança:** Suite de regressão existente em `src/` — testes de auth seguem padrão de mock de sessão.

### Integration Points
- **`/api/export/route.ts`:** Adicionar `requireAuth` logo após os imports, antes de qualquer query ao banco.
- **`getSinceDate`:** Única função, chamada em `getAnalyticsKPIs`, `getAnalyticsFluxoMaletas`, `getAnalyticsTopRevendedoras`, etc. — fix em um lugar propaga automaticamente.
- **Email templates:** Helper `sanitizeEmailHtml()` a ser chamado em `emails.ts` antes de passar o corpo para `renderEmailBase()` — sem modificar os arquivos de template individuais.

</code_context>

<specifics>
## Specific Ideas

- **Allowlist `sanitize-html` config** (pronta para implementação):
  ```ts
  const EMAIL_ALLOWED_TAGS = ['p','br','strong','em','ul','ol','li','a','h1','h2','h3','span','div'];
  const EMAIL_ALLOWED_ATTRS = {
    '*': ['style'],
    'a': ['href'],
  };
  const EMAIL_ALLOWED_SCHEMES = ['http', 'https'];
  ```
- **`getSinceDate` corrigida** (lógica alvo):
  ```ts
  const PY_OFFSET_MS = 3 * 60 * 60 * 1000; // UTC-3, sem DST desde 2024
  function getSinceDate(days: number) {
    const nowPy = new Date(Date.now() - PY_OFFSET_MS);
    nowPy.setUTCDate(nowPy.getUTCDate() - days);
    nowPy.setUTCHours(0, 0, 0, 0);
    return new Date(nowPy.getTime() + PY_OFFSET_MS);
  }
  ```
- Testes SEC-01: mockar `requireAuth` para lançar `Unauthorized` e verificar 401 na resposta da rota.
- Testes SEC-04: casos mínimos — `<script>alert(1)</script>`, `<p onclick="x">`, `<a href="javascript:">`, `<table>` — todos devem ser removidos ou sanitizados.

</specifics>

<deferred>
## Deferred Ideas

- **CVEs de vite/vitest** — 3 CVEs high mas só afetam dev tooling, não produção. Deferred para v1.4 conforme REQUIREMENTS.md §Out of Scope.
- **Gamificação security** (GAM-SEC-01..05) — ownership check, rate limiting em awardPoints. Deferred para v1.4.
- **mailto: em allowlist** — Se admin precisar de links de email no corpo, pode ser adicionado via config na Fase 13.

</deferred>

---

*Phase: 12-seguranca-e-dependencias*
*Context gathered: 2026-05-07*
