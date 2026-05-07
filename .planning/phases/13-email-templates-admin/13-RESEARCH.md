# Phase 13: Email Templates Admin - Research

**Researched:** 2026-05-07
**Domain:** Email Template Management & Dynamic Rendering
**Confidence:** HIGH

## Summary

This phase enables administrators to override hardcoded email templates (Subject, Body, Preview, Greeting) via a database-backed system. This eliminates the need for deployments to change transactional email copy.

**Primary recommendation:** Implement a lazy-loading override pattern in `src/lib/emails.ts` that checks the `EmailTemplate` model first, caches the result for the request, and falls back to existing TypeScript templates if no active override is found.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01: Sincronização Lazy (Sob Demanda)** — O banco de dados não será pré-populado. O registro de override será criado apenas no primeiro salvamento pelo administrador.
- **D-02: Reset via Exclusão** — Ao clicar em "Resetar para Padrão", o registro do banco de dados é excluído, fazendo o sistema voltar instantaneamente para o template TypeScript correspondente.
- **D-03: Auditoria Simples** — O versionamento será baseado apenas no campo `updated_at` do Prisma.
- **D-04: Toggle de Estado** — O administrador terá um interruptor visual (Toggle) para ativar/desativar o override sem precisar excluir os dados salvos.
- **D-05: Bloqueio Estrito no Salvamento** — O editor impedirá o salvamento se detectar variáveis (placeholders) não autorizadas.
- **D-06: Definição Centralizada** — A lista de variáveis permitidas por template será definida em `src/lib/emails-shared.ts`.
- **D-07: Variáveis Globais** — `{site_url}`, `{email_suporte}`, `{nome_revendedora}` disponíveis em todos os templates.
- **D-08: Validação de Sintaxe** — O editor validará se todas as chaves de variáveis foram fechadas corretamente.
- **D-09: Campos Editáveis** — Assunto (Subject), Corpo HTML (Body) e Texto de Pré-visualização (Preview Text).
- **D-10: Saudação Customizada** — O campo de saudação (Greeting) será editável e suportará variáveis.
- **D-11: Texto Puro Automático** — A versão em texto puro será gerada automaticamente via `htmlToPlainText`, mas permitindo override manual opcional.
- **D-12: Variáveis no Assunto** — O campo de Assunto suportará o mesmo conjunto de variáveis permitidas no corpo.
- **D-13: Wrapper Centralizado** — Lógica de override injetada via `getEmailContent` helper.
- **D-14: Cache por Request** — Consultas ao banco cacheadas via `React.cache`.
- **D-15: Isolamento de Dev** — Localmente usa templates TS por padrão, a menos que configurado o contrário.
- **D-16: Tratamento de Erros Rigoroso** — Falhas críticas lançam erro em vez de fallback silencioso (para evitar confusão).

### the agent's Discretion
- Editor UI: Standard textarea with chips (following Push Editor pattern).
- Status Indicator: Use badges for "Padrão (Código)" and "Personalizado (DB)".

### Deferred Ideas (OUT OF SCOPE)
- WYSIWYG Editor: Use raw HTML textarea instead.
- Test-send in Editor: Deferred to v1.4.
- Real-time Preview: Deferred.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ETML-01 | Admin visualiza lista de 7 templates com status | Model `EmailTemplate` + `TIPO_LABELS` mapping |
| ETML-02 | Admin edita assunto do template | `subject` field in model |
| ETML-03 | Admin edita corpo HTML com chips | Adapted `TemplateEditor` from Push Notifications |
| ETML-04 | Admin edita corpo em texto plano | `body_text` field in model |
| ETML-05 | Editor exibe chips clicáveis | `VARIAVEIS_POR_TIPO` in `emails-shared.ts` |
| ETML-06 | Apenas inner HTML é salvo | `renderEmailBase` used in send logic |
| ETML-07 | Send logic consulta DB primeiro | `getEmailContent` wrapper in `src/lib/emails.ts` |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Template Management | API / Backend | Browser / Client | CRUD operations via Server Actions |
| Override Logic | API / Backend | — | Decides between DB content or TS fallback |
| Variable Replacement | API / Backend | — | Dynamic interpolation using `substituirVariaveis` |
| Sanitization | API / Backend | — | Security gate using `sanitize-html` before sending |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `sanitize-html` | ^2.17.3 | HTML Sanitization | [VERIFIED: package.json] Required for SEC-04 |
| `prisma` | (current) | Database ORM | [VERIFIED: project standard] |
| `brevo` | (current) | Email Provider | [VERIFIED: src/lib/emails.ts] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|--------------|
| `lucide-react` | (current) | Icons | UI indicators (check, alert, etc.) |

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   ├── emails-shared.ts     # Variable whitelists and labels (new)
│   ├── email-sanitizer.ts   # Sanitization logic (to be updated)
│   └── email-logic.ts       # getEmailContent helper (new)
└── app/admin/config/emails/
    ├── page.tsx             # List of templates
    └── TemplateEditor.tsx   # Email-specific editor
```

### Pattern 1: Lazy Override Resolver
Use `React.cache` to ensure multiple emails sent in the same request (e.g., batch status updates) don't trigger redundant DB hits.

```typescript
// Proposed pattern for src/lib/email-logic.ts
export const getEmailOverride = React.cache(async (tipo: string) => {
  return await prisma.emailTemplate.findUnique({
    where: { tipo, ativo: true }
  });
});
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTML Sanitization | Regex replacement | `sanitize-html` | Security (regex bypasses are common) |
| Variable Interpolation | Simple `.replace()` | `substituirVariaveis` | Handles nested objects (`user.name`) |
| Plain Text Conversion | Manual typing | `htmlToPlainText` | Maintains consistency, reduces admin effort |

## Common Pitfalls

### Pitfall 1: Sanitizer Table Exclusion
**What goes wrong:** `sanitize-html` configuration in `src/lib/email-sanitizer.ts` currently excludes `table`, `tr`, `td` tags.
**Why it happens:** Phase 12 default config was too restrictive.
**How to avoid:** Explicitly add `table`, `thead`, `tbody`, `tr`, `th`, `td` to `EMAIL_ALLOWED_TAGS`. [VERIFIED: src/lib/email-sanitizer.ts audit]

### Pitfall 2: Context Variable Mismatch
**What goes wrong:** Admin inserts `{maleta_id}` but the calling function provides `id_maleta`.
**Why it happens:** Inconsistent naming between DB fields and UI chips.
**How to avoid:** Centralize variable definitions in `emails-shared.ts` and use them as the source of truth for both the UI chips and the template context.

## Code Examples

### Variable Whitelist (`src/lib/emails-shared.ts`)
```typescript
export const EMAIL_VARIAVEIS_POR_TIPO: Record<string, string[]> = {
  acerto_confirmado: ["nome_revendedora", "maleta_numero", "valor_vendido", "comissao", "pct_comissao", "portal_url"],
  documento_rejeitado: ["nome_revendedora", "tipo_documento", "motivo", "docs_url"],
  // ... others
};
```

### Integration in Template Function
```typescript
// src/lib/email-templates/acerto-confirmado.ts
export async function emailAcertoConfirmado(...) {
  const context = { ... };
  const override = await getEmailContent("acerto_confirmado", context);
  
  if (override) {
    await sendEmail({ 
      to: ..., 
      subject: override.subject, 
      htmlContent: override.html,
      textContent: override.text 
    });
    return;
  }
  
  // Fallback to TS hardcoded template...
}
```

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Prisma | DB Overrides | ✓ | - | TS Templates |
| Brevo API | Email Sending | ✓ | - | — |
| sanitize-html | Security | ✓ | 2.17.3 | — |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest |
| Config file | `vitest.config.ts` |
| Quick run command | `npm test src/lib/email-templates` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command |
|--------|----------|-----------|-------------------|
| ETML-07 | Uses DB if active override exists | integration | `npm test tests/integration/email-override.test.ts` |
| ETML-07 | Falls back to TS if no DB record | unit | `npm test src/lib/email-templates/template-refactor.test.ts` |

## Security Domain

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V5 Input Validation | yes | `sanitize-html` with strict allowlist |
| V12 Communications | yes | TLS (Brevo) + Content Sanitization |

### Known Threat Patterns
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via Email Body | Tampering | `sanitize-html` removes `<script>` and `on*` events |
| HTML Injection | Tampering | Strict allowlist of tags and attributes (no `class`, `id`) |

## Sources

### Primary (HIGH confidence)
- `prisma/schema.prisma` - Existing notification model
- `src/lib/email-sanitizer.ts` - Current sanitization rules
- `src/lib/email-templates/` - Existing hardcoded templates
- `src/app/admin/config/notif-push/TemplateEditor.tsx` - UI reference

### Metadata
**Research date:** 2026-05-07
**Valid until:** 2026-06-07
