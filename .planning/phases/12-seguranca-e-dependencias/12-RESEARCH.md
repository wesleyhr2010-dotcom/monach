# Phase 12: Segurança e Dependências - Research

**Researched:** 2026-05-07
**Domain:** Segurança de aplicação Next.js — autenticação de rotas, sanitização HTML, correção de timezone, atualização de dependências com CVEs
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**SEC-04: HTML Allowlist para sanitize-html**
- D-01: Tags permitidas: `p`, `br`, `strong`, `em`, `ul`, `ol`, `li`, `a`, `h1`, `h2`, `h3`, `span`, `div`
- D-02: Atributo `style` permitido em TODAS as tags (obrigatório: email clients exigem CSS inline)
- D-03: Atributo `href` permitido apenas em `<a>`, protocolos `http` e `https` únicos
- D-04: Todos os demais atributos removidos — allowlist explícita, não blocklist
- D-05: Esta allowlist é a definição canônica para o editor de email da Fase 13

**SEC-05: Correção de Timezone em getSinceDate**
- D-06: Abordagem offset manual com constante `PY_OFFSET_HOURS = 3` (UTC-3). Sem nova dependência
- D-07: Paraguay não usa horário de verão desde 2024 — offset fixo de 3h é correto e estável
- D-08: Fix aplicado na função central `getSinceDate` em `src/app/admin/actions-analytics.ts` — todos os 7 call sites corrigidos automaticamente
- D-09: Lógica correta: converter `new Date()` para Paraguay subtraindo 3h, fazer aritmética de dias no horário do Paraguay, retornar UTC equivalente ao midnight paraguaio

**Cobertura de Testes de Regressão**
- D-10: Adicionar testes de autenticação para SEC-01: requisição sem sessão em `/api/export` e `/api/export/pdf` deve retornar 401
- D-11: Adicionar unit test para helper de sanitização (SEC-04): verificar que `<script>`, event handlers, `javascript:` em href e tags não-permitidas são removidos

### Claude's Discretion
- Local exato onde documentar o risco aceito de `xlsx`/`jspdf` (SEC-06)
- Implementação interna do helper `sanitizeEmailHtml()`
- Nome do arquivo do helper de sanitização (sugerido: `src/lib/email-sanitizer.ts`)
- Ordem de execução (recomendado: SEC-01 primeiro por ser vulnerabilidade crítica ativa)

### Deferred Ideas (OUT OF SCOPE)
- CVEs de vite/vitest (só dev tooling, não afeta produção) — deferred v1.4
- Gamificação security (GAM-SEC-01..05) — deferred v1.4
- `mailto:` em allowlist de email — pode ser adicionado via config na Fase 13
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SEC-01 | `requireAuth(["ADMIN","COLABORADORA"])` em `/api/export/route.ts` e `/api/export/pdf/route.ts` | Padrão `requireAuth` verificado em `src/lib/user.ts`; pattern de retorno 401 mapeado no código existente |
| SEC-02 | Next.js atualizado 16.1.6 → 16.2.5 (fecha 6 CVEs confirmados pelo npm audit) | npm audit verificou CVEs; 16.2.5 confirma versão no registro |
| SEC-03 | `@serwist/next` e `serwist` atualizados 9.5.6 → 9.5.11 (brace-expansion CVSS) | Versões verificadas no npm registry; peer deps confirmadas compatíveis |
| SEC-04 | Instalar `sanitize-html`, criar helper com allowlist D-01..D-04, aplicar em `emails.ts` | API do `sanitize-html` verificada via Context7; integração com emails.ts mapeada |
| SEC-05 | Corrigir `getSinceDate` para usar timezone do Paraguai (UTC-3) | Função localizada em linha 72; 7 call sites identificados; lógica correta confirmada |
| SEC-06 | Documentar risco aceito de `xlsx` e `jspdf` | CVEs confirmados pelo npm audit; ausência de fix upstream verificada para xlsx; jspdf tem 4.2.1 |
</phase_requirements>

---

## Summary

Esta fase é 100% técnica: não há novas telas ou funcionalidades para usuário final. O objetivo é fechar todas as vulnerabilidades conhecidas antes de iniciar as features das fases 13-15.

A vulnerabilidade mais crítica é a **SEC-01**: as duas rotas de export (`/api/export` e `/api/export/pdf`) expõem dados de PII (nomes, WhatsApp, email, comissão de revendedoras e colaboradoras) sem qualquer verificação de autenticação. Qualquer cliente HTTP sem sessão pode baixar os dados. O padrão de correção já existe no codebase — `requireAuth(["ADMIN","COLABORADORA"])` de `@/lib/user` — e precisa apenas ser aplicado.

A pesquisa confirmou via `npm audit` que o projeto tem **6 CVEs em Next.js** (range `>=16.0.0-beta.0 <16.1.7` e `>=16.0.0-beta.0 <16.2.3`), todos resolvidos em 16.2.5. O serwist/brace-expansion CVE está na árvore de dependência via `glob@10.5.0` → `minimatch@9.0.9` em `@serwist/next@9.5.6`; `@serwist/next@9.5.11` usa `glob@13.0.6` → `minimatch@10.x` → `brace-expansion@5.x` (≥1.1.13, CVE mitigado). Para `xlsx` e `jspdf`, a pesquisa revelou uma **discrepância com o CONTEXT.md**: o npm audit indica `jspdf` tem fix disponível em 4.2.1 (range CVE é `<=4.2.0`), mas o risco de introdução da feature de HTML inject ainda existe. Esta discrepância é documentada nas Open Questions.

**Recomendação principal:** Executar na ordem SEC-01 (vulnerabilidade ativa) → SEC-02 → SEC-03 → SEC-04 → SEC-05 → SEC-06.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Autenticação de rotas API (SEC-01) | API / Backend (Route Handler) | — | Route handlers do Next.js App Router são server-side; auth deve ocorrer no handler antes de qualquer query ao banco |
| Atualização de dependências (SEC-02/03) | Build / Infra | — | Mudança de package.json; sem impacto de tier de aplicação |
| Sanitização HTML de email (SEC-04) | API / Backend (lib) | — | Sanitização ocorre server-side antes do envio via Brevo; `emails.ts` é a camada de orquestração |
| Correção de timezone em analytics (SEC-05) | API / Backend (Server Action) | Database | `getSinceDate` alimenta queries ao banco; fix é JS server-side que gera parâmetro de data correto |
| Documentação de risco aceito (SEC-06) | N/A (docs/SPEC) | — | Decisão arquitetural documentada, sem mudança de código de produção |

---

## Standard Stack

### Core (esta fase)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `sanitize-html` | 2.17.3 | Sanitização HTML com allowlist | Biblioteca dominante do ecossistema Node.js para limpeza de HTML; mantida pelo time Apostrophe; allowlist por tag e por atributo |
| `next` | 16.2.5 | Framework | Versão mais recente que fecha todos os 6 CVEs confirmados |
| `@serwist/next` | 9.5.11 | PWA/Service Worker | Fecha brace-expansion CVE via atualização da cadeia de glob |
| `serwist` | 9.5.11 | PWA core | Peer dependency de `@serwist/next` |

**Versões verificadas via npm registry em 2026-05-07:**
- `sanitize-html@2.17.3` — publicado, latest [VERIFIED: npm registry]
- `next@16.2.5` — publicado 2026-05-06 [VERIFIED: npm registry]
- `@serwist/next@9.5.11` — publicado 2026-05-03 [VERIFIED: npm registry]
- `serwist@9.5.11` — publicado 2026-05-03 [VERIFIED: npm registry]

### Packages já presentes (sem instalação necessária)

| Library | Version atual | Uso nesta fase |
|---------|--------------|----------------|
| `next` (pinned) | 16.1.6 | Atualizar para 16.2.5 |
| `@serwist/next` | 9.5.6 | Atualizar para 9.5.11 |
| `serwist` | 9.5.6 (devDep) | Atualizar para 9.5.11 |
| `jspdf` | 4.2.0 | Investigar upgrade para 4.2.1 (ver Open Questions) |

### Instalação

```bash
# Instalar sanitize-html com types
npm install sanitize-html
npm install --save-dev @types/sanitize-html

# Atualizar Next.js (pinned sem caret — precisa especificar versão explícita)
npm install next@16.2.5 eslint-config-next@16.2.5

# Atualizar serwist
npm install @serwist/next@9.5.11
npm install --save-dev serwist@9.5.11
```

**Nota de pinning:** `package.json` tem `"next": "16.1.6"` sem caret. `npm audit fix` confirmou que instalará `next@16.2.5`. `eslint-config-next` deve ser atualizado junto para evitar incompatibilidade de peer deps. [VERIFIED: npm audit dry-run]

---

## Architecture Patterns

### Padrão SEC-01: Auth em Route Handler

O projeto usa **dois padrões** para auth em routes API — o padrão canônico recomendado e um legado:

**Padrão canônico (`requireAuth` — usar para SEC-01):**
```typescript
// Fonte: src/lib/user.ts (verificado no codebase)
// requireAuth lança BusinessError se não autenticado ou role incorreta.
// Em route handler, capturar e retornar 401.
import { requireAuth } from "@/lib/user";
import { NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    await requireAuth(["ADMIN", "COLABORADORA"]);
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  // ... resto do handler
}
```

**Padrão alternativo legado (getCurrentUser — usado em `/api/admin/alertas/maletas/route.ts`):**
```typescript
// Fonte: src/app/api/admin/alertas/maletas/route.ts (verificado no codebase)
const user = await getCurrentUser();
if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
if (!user.isActive) return NextResponse.json({ error: "Inactive" }, { status: 403 });
if (user.role === "REVENDEDORA") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
```

**Para SEC-01, usar o padrão canônico com `requireAuth`.** O padrão legado existe mas é menos robusto (não verifica `isActive` via `requireAuth` e exige lógica manual de role).

**Posição do guard:** Deve ser a **primeira operação** do handler, antes de qualquer query ao banco ou processamento de parâmetros.

### Padrão SEC-04: sanitize-html com allowlist canônica

A API do `sanitize-html` usa um objeto de opções. A allowlist decidida em CONTEXT.md (D-01..D-04) mapeia assim:

```typescript
// Fonte: Context7 /apostrophecms/sanitize-html (verificado)
import sanitizeHtml from "sanitize-html";

const EMAIL_ALLOWED_TAGS = [
  "p", "br", "strong", "em", "ul", "ol", "li", "a",
  "h1", "h2", "h3", "span", "div"
];

const EMAIL_ALLOWED_ATTRS: sanitizeHtml.IOptions["allowedAttributes"] = {
  "*": ["style"],    // D-02: style em todas as tags
  "a": ["href"],     // D-03: href apenas em <a>
};

const EMAIL_ALLOWED_SCHEMES = ["http", "https"]; // D-03: sem javascript:, data:, file:

export function sanitizeEmailHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: EMAIL_ALLOWED_TAGS,
    allowedAttributes: EMAIL_ALLOWED_ATTRS,
    allowedSchemes: EMAIL_ALLOWED_SCHEMES,
    allowProtocolRelative: false, // bloqueia //evil.com
  });
}
```

**Ponto de integração em `emails.ts`:** A função `sendEmail` recebe `htmlContent`. O sanitize deve ocorrer antes de passar para `sendEmail`, no ponto de orquestração. Como os templates TypeScript hardcoded já são HTML seguro produzido internamente, o sanitize é necessário apenas para `htmlContent` que vier de fontes externas (Fase 13: overrides do banco). Para esta fase, a recomendação é aplicar o `sanitizeEmailHtml` como wrapper defensivo no `sendEmail` para garantir que nenhum conteúdo não-sanitizado entre pela API.

**Nota sobre `email-base.ts`:** O arquivo já usa `escapeHtml()` em strings de texto simples (title, greeting, previewText, text de botões). Isso é distinto da sanitização: `escapeHtml` é para texto puro que não deve ter nenhuma tag; `sanitizeEmailHtml` é para HTML que deve ter algumas tags mas não scripts/eventos. Os dois mecanismos coexistem sem conflito.

### Padrão SEC-05: getSinceDate com timezone do Paraguai

```typescript
// Fonte: CONTEXT.md D-09 (lógica a implementar)
// Verificado: UTC-3 fixo desde abolição do horário de verão no Paraguai em 2024 [ASSUMED]
const PY_OFFSET_MS = 3 * 60 * 60 * 1000; // UTC-3, sem DST desde 2024

function getSinceDate(days: number): Date {
  const nowPy = new Date(Date.now() - PY_OFFSET_MS); // "agora" em horário paraguaio
  nowPy.setUTCDate(nowPy.getUTCDate() - days);       // subtrair dias
  nowPy.setUTCHours(0, 0, 0, 0);                     // midnight em horário paraguaio
  return new Date(nowPy.getTime() + PY_OFFSET_MS);   // converter de volta para UTC
}
```

**Consistência com SQL:** O código de `getAnalyticsFluxoMaletas` já usa `AT TIME ZONE 'America/Asuncion'` em SQL. A função `getSinceDate` corrigida produz um UTC timestamp que corresponde ao midnight de Asunción, mantendo consistência entre o filtro JS e os groupings SQL.

**Call sites identificados (verificados no codebase):**
1. `getAnalyticsKPIs` (linha ~91) — parâmetro `periodDays`
2. `getAnalyticsFluxoMaletas` (linha ~144)
3. `getAnalyticsTopRevendedoras` (linha ~217)
4. `getAnalyticsProdutosMaisVendidos` (linha ~346)
5. `getVitrinaKPIs` (linha ~421)
6. `getVitrinaVisitasSeries` (linha ~506)
7. `exportVitrinaAnalyticsCSV` (linha ~624)

Todos os 7 call sites recebem `since = getSinceDate(periodDays)` e passam para queries ao banco. Fix na função central propaga automaticamente.

### Anti-Patterns a Evitar

- **Middleware auth:** O CLAUDE.md proíbe explicitamente queries ao banco no middleware. `requireAuth` não pode ser chamado no middleware — apenas nos route handlers.
- **Sanitizar após envio:** Sanitizar ANTES de passar para `sendEmail`, não dentro de `renderEmailBase`. `renderEmailBase` usa `escapeHtml` em strings de texto, não em HTML — chamar `escapeHtml` em HTML já sanitizado quebraria a marcação.
- **Recalcular offset dinamicamente:** Não usar `new Date().getTimezoneOffset()` — em ambiente serverless (Vercel), o timezone do servidor pode ser UTC, e essa abordagem daria 0. Usar constante fixa `PY_OFFSET_MS`.

---

## Don't Hand-Roll

| Problema | Não Construir | Usar | Por quê |
|----------|--------------|------|---------|
| Sanitização HTML | Parser regex manual | `sanitize-html` | Regex com bypass confirmado (mencionado em REQUIREMENTS.md SEC-04); casos de edge como encoding, nested tags, atributos codificados são tratados pela biblioteca |
| Validação de protocolo em href | Regex `^(http\|https):` | `allowedSchemes` do sanitize-html | Regex não cobre `HTTP:` (case), `%68ttp:` (encoded), `javascript%3A` |
| Auth em route handler | Lógica manual de sessão | `requireAuth()` de `@/lib/user` | Já testado, lida com `isActive`, `role`, e `BusinessError` de forma padronizada |

---

## Runtime State Inventory

> Esta fase é de segurança/dependências — sem rename ou refactor de identificadores. Nenhuma migração de dados de runtime é necessária.

| Categoria | Itens Encontrados | Ação Necessária |
|-----------|------------------|-----------------|
| Stored data | Nenhum — sem renomeação de keys ou campos | Nenhuma |
| Live service config | Nenhum — sem mudanças de identificadores de serviço | Nenhuma |
| OS-registered state | Nenhum | Nenhuma |
| Secrets/env vars | Nenhum — sem mudança de nomes de variáveis de ambiente | Nenhuma |
| Build artifacts | `node_modules` será atualizado; `.next/` pode precisar de rebuild | `npm run build` após atualizações |

---

## Common Pitfalls

### Pitfall 1: `next` está pinned sem caret em package.json

**O que falha:** `npm install next@16.2.5` deve ser executado explicitamente; simplesmente `npm install` não atualizará porque `"next": "16.1.6"` é uma versão exata.

**Como evitar:** Executar `npm install next@16.2.5 eslint-config-next@16.2.5` explicitamente. Verificar com `npm ls next`.

**Sinal de alerta:** `npm ls next | grep 16.1.6` ainda retornar resultado após instalação.

### Pitfall 2: eslint-config-next versão desatualizada

**O que falha:** `eslint-config-next` em `devDependencies` é `16.1.6`. Se não for atualizado junto com `next`, pode ocorrer peer dep warning ou erro no build.

**Como evitar:** Sempre atualizar `eslint-config-next` na mesma versão que `next`.

### Pitfall 3: requireAuth lança exceção — route handler deve capturar

**O que falha:** `requireAuth` lança `BusinessError` (não retorna). Se o route handler não tiver `try/catch`, a exceção sobe e o Next.js retorna 500, não 401.

**Como evitar:** Envolver `requireAuth` em `try/catch` e retornar `NextResponse.json({ error: "No autorizado" }, { status: 401 })`.

**Verificado no codebase:** O padrão em `/api/admin/alertas/maletas/route.ts` usa `getCurrentUser()` (que retorna null) em vez de `requireAuth` (que lança). Para SEC-01, usar `requireAuth` com try/catch explícito.

### Pitfall 4: sanitize-html com `allowedAttributes: false` permite tudo

**O que falha:** Se `allowedAttributes` for omitido ou `false`, todos os atributos são removidos. Se for `false` como valor global, tudo é permitido. A allowlist deve ser um objeto explícito.

**Como evitar:** Passar sempre um objeto `allowedAttributes: { "*": ["style"], "a": ["href"] }` — nunca `false` nem omitir.

**Verificado via Context7:** O comportamento de `allowedAttributes: false` é documentado como "permite todos os atributos". [VERIFIED: Context7 /apostrophecms/sanitize-html]

### Pitfall 5: brace-expansion CVE está na árvore do serwist, não diretamente

**O que falha:** A auditoria mostra `brace-expansion` com três nós: `@typescript-eslint/typescript-estree`, `brace-expansion` (direto), e `glob`. O nó relacionado a serwist é o terceiro (`node_modules/glob/node_modules/brace-expansion` via `@serwist/next@9.5.6` → `glob@10.5.0` → `minimatch@9.0.9` → `brace-expansion@1.x`). Atualizar só `serwist` sem `@serwist/next` não resolve.

**Como evitar:** Atualizar `@serwist/next@9.5.11` (que usa `glob@13.x` → `minimatch@10.x` → `brace-expansion@5.x`). Verificar com `npm audit` após atualização.

### Pitfall 6: jspdf 4.2.1 existe mas CONTEXT.md diz "sem fix"

**O que falha:** O CONTEXT.md afirma que `jspdf` não tem fix disponível. O `npm audit` retorna `fixAvailable: true` e indica range `<=4.2.0`. A versão 4.2.1 foi publicada em data posterior à análise original.

**Como evitar:** Verificar se `jspdf@4.2.1` realmente fecha os CVEs (GHSA-7x6v-j9x4-qf24 e GHSA-wfv2-pwc8-crg5) antes de decidir. Ver Open Questions.

---

## Code Examples

### SEC-01: Route handler com requireAuth

```typescript
// Padrão a aplicar em /api/export/route.ts e /api/export/pdf/route.ts
// Fonte: padrão estabelecido no codebase (src/lib/user.ts verificado)
import { requireAuth } from "@/lib/user";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    await requireAuth(["ADMIN", "COLABORADORA"]);
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // ... lógica existente sem alteração
}
```

### SEC-04: Helper de sanitização

```typescript
// src/lib/email-sanitizer.ts (arquivo novo)
// Fonte: CONTEXT.md D-01..D-04 + Context7 /apostrophecms/sanitize-html
import sanitizeHtml from "sanitize-html";

const EMAIL_ALLOWED_TAGS: string[] = [
  "p", "br", "strong", "em", "ul", "ol", "li", "a",
  "h1", "h2", "h3", "span", "div",
];

const EMAIL_ALLOWED_ATTRS: sanitizeHtml.IOptions["allowedAttributes"] = {
  "*": ["style"],
  "a": ["href"],
};

/**
 * Sanitiza HTML para uso em emails transacionais.
 * Allowlist canônica para Fase 13 (editor de templates).
 * Remove scripts, event handlers, protocolo javascript: e tags não-permitidas.
 */
export function sanitizeEmailHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: EMAIL_ALLOWED_TAGS,
    allowedAttributes: EMAIL_ALLOWED_ATTRS,
    allowedSchemes: ["http", "https"],
    allowProtocolRelative: false,
  });
}
```

### SEC-05: getSinceDate corrigida

```typescript
// Substituição direta na linha 72 de src/app/admin/actions-analytics.ts
// Fonte: CONTEXT.md D-06..D-09
const PY_OFFSET_MS = 3 * 60 * 60 * 1000; // UTC-3, sem DST desde 2024

function getSinceDate(days: number): Date {
  const nowPy = new Date(Date.now() - PY_OFFSET_MS);
  nowPy.setUTCDate(nowPy.getUTCDate() - days);
  nowPy.setUTCHours(0, 0, 0, 0);
  return new Date(nowPy.getTime() + PY_OFFSET_MS);
}
```

### SEC-01: Teste de regressão (padrão para novos testes)

```typescript
// Padrão a seguir: src/__tests__/security/rbac-regression.test.ts (verificado no codebase)
import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/user", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/user")>();
  return { ...mod, requireAuth: vi.fn() };
});

import { requireAuth } from "@/lib/user";
import { GET } from "@/app/api/export/route";

it("retorna 401 sem sessão", async () => {
  vi.mocked(requireAuth).mockRejectedValue(new Error("Sesión no válida"));
  const req = new Request("http://localhost/api/export?type=produtos&format=csv");
  const res = await GET(req as NextRequest);
  expect(res.status).toBe(401);
});
```

---

## State of the Art

| Old Approach | Current Approach | Quando Mudou | Impacto |
|--------------|-----------------|--------------|---------|
| `sanitizeTemplateVars` custom (regex) | `sanitize-html` com allowlist | Esta fase | Bypass confirmado na abordagem regex é fechado |
| Next.js 16.1.6 | Next.js 16.2.5 | 2026-05-06 | 6 CVEs fechados (HTTP smuggling, CSRF, DoS, unbounded cache) |
| `getSinceDate` usando `setHours(0,0,0,0)` (local TZ) | Offset manual UTC-3 com `setUTCHours` | Esta fase | Analytics mostra dias corretos do Paraguai, não dias UTC |

**Deprecated/outdated:**
- `getSinceDate` atual com `d.setHours(0,0,0,0)`: Em ambiente serverless Vercel (UTC), `setHours` equivale a `setUTCHours`. O resultado é midnight UTC, que corresponde a 21:00 do dia anterior em Asunción, causando desalinhamento de ~3h nos períodos.

---

## Assumptions Log

| # | Claim | Section | Risco se Errado |
|---|-------|---------|-----------------|
| A1 | Paraguay aboliu horário de verão em 2024 permanentemente — UTC-3 fixo para sempre | SEC-05 Pattern | Se reinstituído, PY_OFFSET_MS precisaria ser dinâmico; baixo risco — evento político raro |
| A2 | `jspdf@4.2.1` fecha os CVEs GHSA-7x6v-j9x4-qf24 e GHSA-wfv2-pwc8-crg5 | Open Questions | Se não fechar, SEC-06 continua sendo "risco aceito" para jspdf |

---

## Open Questions

1. **jspdf@4.2.1 — upgrade ou risco aceito?**
   - O que sabemos: `npm audit` indica `fixAvailable: true` para jspdf, com range CVE `<=4.2.0`. Versão 4.2.1 existe no registry (publicada ~2026-02-19). O CONTEXT.md diz "sem fix disponível upstream".
   - O que está incerto: Se 4.2.1 realmente fecha os dois CVEs ou apenas o GHSA-7x6v-j9x4-qf24.
   - Recomendação: O planner deve incluir uma tarefa de investigação: `npm install jspdf@4.2.1` + `npm audit` para verificar se os CVEs somem. Se sim, atualizar é seguro (upgrade de patch). Se não, manter o risco aceito conforme SEC-06.

2. **Escopo de aplicação do sanitizeEmailHtml em `emails.ts`**
   - O que sabemos: `emails.ts` é simples — recebe `htmlContent` e passa para Brevo. Os templates TypeScript produzem HTML seguro internamente.
   - O que está incerto: Aplicar sanitize em TODO `htmlContent` (inclusive templates hardcoded) ou apenas quando vier de overrides do banco (Fase 13)?
   - Recomendação: Aplicar como wrapper defensivo em `sendEmail` imediatamente — protege contra futuros overrides sem exigir mudança em Fase 13 e tem custo computacional desprezível.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `npm` | Todas as atualizações de pacotes | Yes | bundled com node | — |
| `sanitize-html` | SEC-04 | No (não instalada) | — | Nenhum — deve ser instalada |
| `@types/sanitize-html` | SEC-04 TypeScript | No | — | Nenhum — deve ser instalada |
| `vitest` | Testes de regressão | Yes | `^4.0.18` | — |

**Dependências faltantes sem fallback:**
- `sanitize-html` e `@types/sanitize-html` — devem ser instaladas na Wave de setup

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | Yes (SEC-01) | `requireAuth()` de `@/lib/user` |
| V3 Session Management | Não — sessions já estão ok | Supabase SSR |
| V4 Access Control | Yes (SEC-01) | Role check `["ADMIN","COLABORADORA"]` |
| V5 Input Validation | Yes (SEC-04) | `sanitize-html` com allowlist explícita |
| V6 Cryptography | Não — sem mudança de crypto | — |

### Known Threat Patterns for Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Unauthenticated data export (PII leak) | Information Disclosure | `requireAuth` no início do route handler |
| HTML injection em email (XSS via template) | Tampering | `sanitize-html` com allowlist + `allowProtocolRelative: false` |
| CSRF via null origin em Server Actions | Tampering | Next.js 16.2.5 fecha GHSA-mq59-m269-xvcx |
| HTTP request smuggling em rewrites | Tampering | Next.js 16.2.5 fecha GHSA-ggv3-7p47-pfv8 |
| DoS via Server Components | Denial of Service | Next.js 16.2.5 fecha GHSA-q4gf-8mx6-v5v3 |
| ReDoS via brace-expansion | Denial of Service | serwist 9.5.11 resolve via glob@13 |
| Prototype Pollution via xlsx | Tampering | Risco aceito — sem fix upstream; uso restrito a write/export |

---

## Sources

### Primary (HIGH confidence)
- Codebase inspecionado: `src/lib/user.ts`, `src/app/api/export/route.ts`, `src/app/api/export/pdf/route.ts`, `src/app/admin/actions-analytics.ts`, `src/lib/emails.ts`, `src/lib/email-base.ts`, `package.json` — leitura direta via ferramenta Read
- Context7 `/apostrophecms/sanitize-html` — documentação de `allowedTags`, `allowedAttributes`, `allowedSchemes`, `allowProtocolRelative`
- npm registry: versões verificadas de `next@16.2.5`, `@serwist/next@9.5.11`, `serwist@9.5.11`, `sanitize-html@2.17.3`

### Secondary (MEDIUM confidence)
- `npm audit --json` executado no projeto — CVEs verificados com severidade, ranges e fixAvailable exatos
- `npm audit fix --dry-run` — confirmou que `next@16.2.5` é o target automático de upgrade

### Tertiary (LOW confidence)
- Abolição do horário de verão do Paraguai em 2024 [ASSUMED] — não verificado nesta sessão; baseado em conhecimento de treinamento

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versões verificadas no registry; APIs verificadas via Context7 e codebase
- Architecture: HIGH — padrões verificados diretamente no código existente
- CVEs: HIGH — verificados via `npm audit --json` nesta sessão
- Pitfalls: HIGH — identificados via inspeção direta do código (pinning, requireAuth vs getCurrentUser, etc.)
- Timezone UTC-3 fixo: LOW — baseado em conhecimento de treinamento não verificado nesta sessão

**Research date:** 2026-05-07
**Valid until:** 2026-06-07 (dependências se movem rapidamente — reverificar versões antes de implementar se houver delay)
