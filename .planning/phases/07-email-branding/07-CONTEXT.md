# Phase 7: Email Branding - Context

**Gathered:** 2026-05-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Esta fase padroniza a identidade visual de todos os emails transacionais com layout consistente, copy em espanhol paraguaio e wrapper visual unificado.

**In scope:**
- Criar `renderEmailBase()` e utilitários híbridos (`emailButton`, `emailTable`, `emailAlert`) que geram HTML + text
- Refatorar 7 templates existentes em `src/lib/email-templates/` para usar a nova arquitetura
- Implementar header com banner de logo Monarca (imagem R2) e footer completo padronizado
- Adicionar suporte a dark mode com `@media (prefers-color-scheme: dark)`
- Garantir compatibilidade com Gmail, Apple Mail e Outlook moderno
- Criar script de sync para templates Supabase Auth (reset/invite) via Management API
- Documentar regras de tom de voz, paleta de emojis e estrutura de saudação/fechamento
- Manter endpoint `/api/test-email` para preview local durante desenvolvimento

**Out of scope:**
- Suporte a Outlook 2016/2013 antigo (degradação graciosa aceita)
- Migração de fluxo de onboarding de Brevo para Supabase (ambos coexistem)
- Criação de novos templates transacionais (apenas refactor dos 7 existentes)
- Testes de renderização em serviços pagos (Litmus, Email on Acid)

**Dependencies:**
- `src/lib/emails.ts` (cliente Brevo) já existente
- 7 templates em `src/lib/email-templates/` já existentes
- Variáveis de ambiente Brevo já configuradas
- Imagem do logo disponível no R2 (URL pública)

</domain>

<decisions>
## Implementation Decisions

### Wrapper Architecture & Template Engine
- **D-01:** Template engine híbrida — funções utilitárias (`emailButton`, `emailTable`, `emailAlert`) geram HTML/text padronizado; templates montam a estrutura final chamando esses utilitários
- **D-02:** Header com banner de logo Monarca (imagem hospedada no R2, URL pública) em todos os emails transacionais
- **D-03:** Footer completo em todos os emails: marca + link para site + disclaimer de seguridad + dados de contato
- **D-04:** Cada utilitário retorna `{ html: string, text: string }` — controle total sobre ambas as versões. Templates combinam ambas para envio dual

### Email Client Compatibility
- **D-05:** Must-support: Gmail + Apple Mail + Outlook moderno (2019+, Outlook Web, Outlook Mac). Outlook antigo (2016/2013) aceita degradação graciosa (botões viram links, tabelas perdem bordas)
- **D-06:** Dark mode: adaptar cores ativamente com `@media (prefers-color-scheme: dark)` no CSS inline. Adaptar fundo, texto e elementos primários
- **D-07:** Botões CTA: usar `<a>` estilizado nativo (padding, background-color, border-radius). Suficiente para Outlook moderno; não precisa de bulletproof tables + comentários MSO
- **D-08:** Testes: usar endpoint de preview local existente (`/api/test-email`) para validação rápida durante desenvolvimento. Enviar para contas de teste no Gmail/Apple Mail/Outlook Web como sanity check manual

### Supabase Auth Templates
- **D-09:** Criar script de sync via Supabase Management API para atualizar templates de reset e invite no dashboard automaticamente
- **D-10:** Templates Supabase Auth usam o MESMO branding completo dos emails transacionais (logo banner, cores do design system, footer completo)
- **D-11:** Manter ambos com propósitos distintos: `emailConviteUsuario` (Brevo) é o fluxo PADRÃO de onboarding; template de invite do Supabase Auth é para criação DIRETA de usuários/emergências. Documentar quando usar cada um
- **D-12:** CI/CD auto-sync no push para `main` — GitHub Actions workflow executa o script de sync automaticamente após merge, garantindo que o dashboard nunca fique desatualizado

### Tone of Voice & Emojis
- **D-13:** Tom premium e acolhedor em todos os emails. Usar 'tú' (informal, paraguaio). Linguagem valorizadora: 'Tu consignación', 'Tu comisión'
- **D-14:** Paleta fixa de emojis aprovados: 💎🦋 (marca), ✅ (confirmação), ❌ (rejeição), 📄 (documento), 🎉 (celebração). Máximo 2 emojis por email
- **D-15:** Estrutura flexível por tipo — saudação e fechamento variam por contexto emocional:
  - Aprovação/cadastro: entusiasmado ('¡Hola {nombre}!')
  - Documentos/acertos: neutro ('Hola {nombre},')
  - Rejeição: respeitoso, sem exclamação ('Hola {nombre},')
- **D-16:** Documentar regras de copy no presente 07-CONTEXT.md + adicionar comentários JSDoc nas funções utilitárias. Não criar documento separado de guia de estilo

### Claude's Discretion
- Estrutura exata das assinaturas das funções utilitárias (parâmetros, tipos, nomes)
- CSS inline específico para dark mode (quais cores exatas adaptar para o tema escuro)
- Implementação do script de sync (linguagem, biblioteca HTTP, tratamento de erro)
- Formato exato do fechamento por tipo de email (texto específico de cada variação)
- Estrutura interna do email de acerto com tabela de breakdown (como compor usando `emailTable`)
- Se `sendEmail()` precisa de overload ou modificação para aceitar `{ html, text }`

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Roadmap
- `.planning/ROADMAP.md` — Phase 7 goal, success criteria, pitfalls
- `.planning/REQUIREMENTS.md` — EMAIL-01..EMAIL-08 requirements mapped to Phase 7
- `.planning/PROJECT.md` — Stack, constraints, established patterns, key decisions
- `.planning/STATE.md` — Current project state, accumulated decisions, deferred items

### Prior Phase Context
- `.planning/phases/06-vitrina-publica/06-CONTEXT.md` — Vitrina decisions, ActionResult pattern
- `.planning/phases/05-validation-hardening/05-CONTEXT.md` — DOMPurify sanitization, test patterns
- `.planning/phases/02-core-business-notifications-leads-config/02-CONTEXT.md` — Notification templates, lead pipeline

### Security & Data Protection
- `docs/sistema/SPEC_SECURITY_DATA_PROTECTION.md` — PII handling, zero PII in plaintext emails
- `docs/sistema/SPEC_SECURITY_RBAC.md` — RBAC rules (relevant para emails de admin)

### Design System
- `docs/design-system/tokens.md` — Design system colors (`#35605a` primary, `#C9A84C` gold, `#F5F2EF` background)

### Existing Email Code
- `src/lib/emails.ts` — Brevo email client (`sendEmail()`)
- `src/lib/email-templates/` — 7 existing templates to refactor
- `src/lib/notifications-server.ts` — DOMPurify sanitization, `htmlToPlainText` helper
- `src/app/api/test-email/` — Existing email preview endpoint

### Codebase Maps
- `.planning/codebase/CONVENTIONS.md` — Server Action patterns, naming conventions, language split
- `.planning/codebase/STRUCTURE.md` — Directory layout, file locations

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`src/lib/emails.ts`** — `sendEmail()` function with Brevo client. Reuse as-is; may need modification to accept `{ html, text }` instead of just `htmlContent`
- **`src/lib/notifications-server.ts`** — DOMPurify sanitization already implemented for server-side HTML. `htmlToPlainText` helper exists and can inform text generation
- **`src/app/api/test-email/`** — Existing dev-only endpoint for email preview. Can be extended to render both HTML and text versions

### Established Patterns
- **Template as async function:** Each template exports an async function that calls `sendEmail({ to, subject, htmlContent })`
- **Inline CSS only:** All styling is inline — no external stylesheets (email client requirement)
- **Spanish (Paraguayan) for UI strings:** All user-facing copy in emails must be Spanish Paraguayan, never Portuguese or neutral Spanish
- **Environment-based config:** Brevo credentials from `BREVO_API_KEY`, `BREVO_FROM_EMAIL`, `BREVO_FROM_NAME`

### Integration Points
- **7 templates to refactor:** `convite-usuario`, `candidatura-aprovada`, `candidatura-rechazada`, `acerto-confirmado`, `documento-aprovado`, `documento-rejeitado`, `documento-pendente`
- **Supabase dashboard:** Auth templates (reset password, invite user) live outside codebase — sync via Management API
- **GitHub Actions:** Add sync step to existing CI workflow or create new workflow for Supabase template sync

</code_context>

<specifics>
## Specific Ideas

- **Logo image:** Usar URL pública do R2 (não base64). Clientes de email bloqueiam base64. Garantir que a imagem seja leve (< 100KB)
- **Dark mode colors:** Adaptar `#F5F2EF` (bg) → `#1A1A1A`, `#1A1A1A` (text) → `#F5F2EF`, `#35605a` (primary) → versão mais clara para contraste em fundo escuro
- **Supabase Management API:** Requer `SUPABASE_MANAGEMENT_API_KEY` (novo env var). Endpoint: `POST /v1/projects/{ref}/config/auth`
- **emailTable utility:** Deve suportar cabeçalho, linhas de dados, e estilização condicional (ex: linha destacada para comissão no email de acerto)
- **Text version do acerto:** Tabela vira lista formatada em texto: `Total vendido: G$ 1.250\nTu comisión (15%): G$ 187`
- **emailAlert utility:** Para caixas de destaque (ex: caixa amarela com senha temporária no email de convite). Variantes: info (azul), success (verde), warning (amarelo)
- **Footer link:** Link para `NEXT_PUBLIC_SITE_URL` (site público), não para `/app` ou `/admin`

</specifics>

<deferred>
## Deferred Ideas

None — all gray areas for Phase 7 were discussed and decided.

### Reviewed Todos (not folded)
None — no todos were cross-referenced into this phase's scope.

</deferred>

---

*Phase: 07-Email Branding*
*Context gathered: 2026-05-06*
