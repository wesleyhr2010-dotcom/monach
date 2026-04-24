# SPEC — Migração para o domínio oficial de produção

> Checklist canônico para cortar o sistema de `https://monarca-six.vercel.app` (preview Vercel) para o domínio oficial `https://monarcasemijoyas.com.py`. Este documento é a **fonte única de verdade** da migração; qualquer item esquecido quebra emails, auth, uploads ou push.

**Quando executar:** no dia/janela da virada para produção.
**Responsável:** `@devops` + pessoa com acesso ao Supabase, Vercel, Brevo, Cloudflare R2 e OneSignal Dashboards.
**Tempo estimado:** 1–2 horas + propagação DNS (até 24h).

---

## 1. Objetivo

Garantir que ao trocar o domínio público, **todos** os serviços externos apontem para `monarcasemijoyas.com.py` e que nenhum link de email, upload de imagem, push notification ou redirect OAuth continue usando o domínio preview antigo.

---

## 2. Pré-requisitos

1. Domínio `monarcasemijoyas.com.py` registrado e com acesso ao painel DNS.
2. Acesso de admin em: Vercel, Supabase, Brevo, Cloudflare R2, OneSignal.
3. Aplicação em estado estável na branch `main` (sem regressões abertas).
4. Backup lógico do banco Supabase do dia (manual ou via Supabase Point-in-Time).

---

## 3. Checklist de migração

### 3.1 DNS e Vercel

- [ ] Adicionar o domínio `monarcasemijoyas.com.py` (e `www.monarcasemijoyas.com.py` se for usado) no Vercel → `Project → Settings → Domains`.
- [ ] Configurar os registros DNS conforme instrução do Vercel (A/CNAME para `cname.vercel-dns.com`).
- [ ] Aguardar emissão automática do certificado TLS pelo Vercel.
- [ ] Validar redirecionamento: `www` → apex (ou vice-versa) conforme escolha.
- [ ] Confirmar que o `main` está promovido a **Production** e o domínio oficial aponta para ele (não para preview).

### 3.2 Variáveis de ambiente (Vercel)

Ambiente: **Production** (se houver staging, replicar com o domínio dele).

- [ ] `NEXT_PUBLIC_SITE_URL=https://monarcasemijoyas.com.py`
- [ ] `BREVO_FROM_EMAIL=no-reply@monarcasemijoyas.com.py`
- [ ] `BREVO_FROM_NAME=Monarca Semijoyas`
- [ ] `R2_PUBLIC_URL=https://assets.monarcasemijoyas.com.py` (se for usar subdomínio custom R2; ver §3.5)
- [ ] Redeploy a partir do `main` após salvar variáveis (variáveis de build exigem rebuild).

Ref.: [`SPEC_ENVIRONMENT_VARIABLES.md`](./SPEC_ENVIRONMENT_VARIABLES.md).

### 3.3 Supabase Auth

Supabase Dashboard → **Authentication → URL Configuration**:

- [ ] **Site URL**: `https://monarcasemijoyas.com.py`
- [ ] **Redirect URLs** (adicionar, manter o preview enquanto paralelo se necessário):
  - `https://monarcasemijoyas.com.py/auth/callback`
  - `https://monarcasemijoyas.com.py/app/nueva-contrasena` (fallback PKCE)
  - `https://monarcasemijoyas.com.py/admin/login/reset-password` (fallback PKCE)

Supabase Dashboard → **Authentication → Email Templates**:

- [ ] **Reset Password** — confirmar que usa fluxo OTP:
  ```html
  <a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery">
    Restablecer contraseña
  </a>
  ```
- [ ] **Invite** — confirmar que usa `{{ .ConfirmationURL }}` ou `{{ .TokenHash }}` com o mesmo padrão de callback.
- [ ] **Magic Link** — idem.

Ref.: [`revendedoras/SPEC_RECUPERAR_CONTRASENA.md`](../revendedoras/SPEC_RECUPERAR_CONTRASENA.md), `src/app/auth/callback/route.ts`.

### 3.4 Brevo (email transacional e SMTP)

Brevo Dashboard:

- [ ] Domínio `monarcasemijoyas.com.py` **verificado** (verde) em `Senders, Domains & Dedicated IPs → Domains`.
- [ ] Registros DNS configurados:
  - SPF: `v=spf1 include:spf.brevo.com mx ~all`
  - DKIM: chave CNAME fornecida pelo Brevo
  - DMARC: `v=DMARC1; p=none; rua=mailto:admin@monarcasemijoyas.com.py` (ou mais estrito)
- [ ] Remetente `no-reply@monarcasemijoyas.com.py` configurado.
- [ ] SMTP do Brevo continuar ativo no Supabase (configuração já feita em 2026-04-23).

Ref.: [`SPEC_EMAILS.md`](./SPEC_EMAILS.md) §Envio e autenticação.

### 3.5 Cloudflare R2

- [ ] Criar subdomínio `assets.monarcasemijoyas.com.py` com CNAME apontando para o bucket R2 (ou usar Custom Domain do R2 Dashboard).
- [ ] Atualizar `R2_PUBLIC_URL` no Vercel para o novo subdomínio.
- [ ] **Rodar migração de URLs antigas no banco** — objetos já enviados têm `*.r2.cloudflarestorage.com` ou o domínio antigo armazenado. Usar o script `update-r2-urls.ts` (ou criar query) para reescrever `products.images[]`, `resellers.avatar_url`, `reseller_documents.url`, `vendas_maleta.comprovante_url`, etc.
- [ ] Validar que o CORS do bucket R2 permite o novo domínio (para uploads diretos via signed URL).

Ref.: [`SPEC_API_UPLOAD_R2.md`](./SPEC_API_UPLOAD_R2.md).

### 3.6 OneSignal (Push Notifications)

OneSignal Dashboard → **Settings → Platforms → Web Push**:

- [ ] **Site URL**: `https://monarcasemijoyas.com.py`
- [ ] **Default Notification Icon URL**: atualizar para o novo domínio se hardcoded.
- [ ] **Safari Web ID** recriado/atualizado (Safari não aceita mudança de domínio — pode exigir re-opt-in dos usuários).
- [ ] Testar opt-in e recebimento de push em navegador limpo após a virada.

Ref.: [`revendedoras/SPEC_NOTIFICACOES.md`](../revendedoras/SPEC_NOTIFICACOES.md), [`prd/PRD_OneSignal_PWA.md`](../prd/PRD_OneSignal_PWA.md).

### 3.7 OAuth providers (se ativados)

Se login via Google/Apple estiver ativo em produção:

- [ ] **Google Cloud Console** → OAuth 2.0 Client IDs → Authorized redirect URIs: adicionar `https://<supabase-project>.supabase.co/auth/v1/callback` e `https://monarcasemijoyas.com.py/api/auth/callback`.
- [ ] **Apple Developer** → Sign in with Apple → Return URLs: mesma lista.

Hoje `loginWithProvider` em `src/lib/actions/auth.ts` redireciona para `${SITE_URL}/api/auth/callback`.

### 3.8 PWA / Service Worker

- [ ] Confirmar que `manifest.json` usa paths relativos (`/`), não absolutos com domínio antigo.
- [ ] Se `sw.js` foi servido do domínio preview para algum usuário, o novo SW do domínio oficial será instalado limpo — sem ação extra.
- [ ] Testar install prompt do PWA no novo domínio (Chrome/Android e Safari/iOS).

### 3.9 Ajustes em documentação

- [ ] Corrigir `docs/sistema/SPEC_DEPLOY_STRATEGY.md` — substituir `monarca.com.py` por `monarcasemijoyas.com.py` (linhas 16 e 55).
- [ ] Atualizar `docs/project_overview.md` se houver menção ao domínio preview como referência.
- [ ] Marcar este SPEC como executado em `CHANGELOG.md` com a data do corte.

---

## 4. Validação pós-migração

Executar imediatamente após a virada (e antes de dormir tranquilo):

- [ ] `https://monarcasemijoyas.com.py` carrega com certificado válido.
- [ ] Login admin funciona (`/admin/login`).
- [ ] Login revendedora funciona (`/app/login`).
- [ ] **Recuperação de senha end-to-end** — seguir [`TESTE_EMAILS.md`](../TESTE_EMAILS.md). Confirmar que o link no email aponta para `https://monarcasemijoyas.com.py/auth/callback?token_hash=...&type=recovery` e que o fluxo completa a troca de senha.
- [ ] **Convite de consultora/revendedora** — criar uma conta de teste e validar email + link.
- [ ] Upload de imagem admin → R2 → exibida corretamente no frontend com novo `R2_PUBLIC_URL`.
- [ ] Push notification de teste chega em dispositivo inscrito.
- [ ] Se houver tracking (GA/Meta Pixel) — validar que eventos chegam com novo domínio.
- [ ] Sentry (quando ativo) — verificar que novas errors vêm com `release` correto.

---

## 5. Rollback

Se algo crítico quebrar:

1. **Vercel** — reverter para o deployment anterior via `Deployments → ...` ou `vercel rollback`.
2. **Supabase URL Configuration** — voltar Site URL para `https://monarca-six.vercel.app`. As Redirect URLs podem permanecer ambas.
3. **DNS** — se o problema for DNS, propagação pode levar até 24h para reverter; manter o preview Vercel como backup acessível.
4. **R2** — o subdomínio antigo continua válido enquanto o CNAME não for removido; reverter `R2_PUBLIC_URL` se necessário.

Ref.: [`SPEC_DEPLOY_STRATEGY.md`](./SPEC_DEPLOY_STRATEGY.md) §Rollback.

---

## 6. Edge cases conhecidos

- **Usuários com sessão ativa no domínio antigo** — cookies do domínio preview não viajam para o novo domínio. Usuários que estavam logados precisam fazer login novamente. Aceitável.
- **Emails já enviados com links para preview** — links antigos continuam funcionando enquanto o domínio preview existir no Vercel. Não remover o preview imediatamente; esperar janela de 7 dias para expirar tokens de recovery/invite pendentes.
- **Cache de Service Worker no domínio antigo** — usuários que instalaram o PWA em `monarca-six.vercel.app` seguem com o PWA antigo até abrirem manualmente o novo domínio. Não há migração automática.
- **Tokens de PKCE em trânsito** — reset de senha usa OTP (`token_hash`) e não depende de verifier local; cross-device funciona. Emails antigos em PKCE só funcionam se o usuário usar o mesmo browser.

---

## 7. Dependências

- [`SPEC_ENVIRONMENT_VARIABLES.md`](./SPEC_ENVIRONMENT_VARIABLES.md) — tabela de env vars por ambiente.
- [`SPEC_DEPLOY_STRATEGY.md`](./SPEC_DEPLOY_STRATEGY.md) — CI/CD e rollback.
- [`SPEC_EMAILS.md`](./SPEC_EMAILS.md) — templates e domínio remetente.
- [`SPEC_API_UPLOAD_R2.md`](./SPEC_API_UPLOAD_R2.md) — uploads e domínio público R2.
- [`TESTE_EMAILS.md`](../TESTE_EMAILS.md) — roteiro de testes em produção.
- `src/app/auth/callback/route.ts` — callback unificado (OTP + PKCE).
- `src/lib/middleware-auth.ts` — interceptação de `?code=` / `?token_hash=` na raiz.
