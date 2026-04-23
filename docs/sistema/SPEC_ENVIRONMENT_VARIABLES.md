# SPEC — Variáveis de Ambiente

## Objetivo
Ser a fonte única de verdade para todas as variáveis de ambiente usadas pelo sistema, garantindo que Supabase, Cloudflare R2, OneSignal, Brevo, criptografia e monitoramento estejam configurados corretamente por ambiente.

## Atores
- **Dev (Dex)** — configura `.env.local` e valida com `env.ts`.
- **Admin/DevOps** — configura variáveis no Vercel e no CI.
- **Build do Next.js** — valida presença das variáveis obrigatórias no startup.

## Fluxo
1. Cada nova variável é adicionada primeiro ao `.env.example` e nesta SPEC.
2. Dev copia `.env.example` para `.env.local` e preenche.
3. Variáveis são validadas em `src/env.ts` (zod) no startup; build falha se faltar obrigatória.
4. Vercel → Settings → Environment Variables recebe os valores por ambiente (Production/Preview/Development).
5. Rotação de `ENCRYPTION_KEY` e tokens segue plano definido na SPEC de segurança.

## Regras de negócio
- Variáveis com prefixo `NEXT_PUBLIC_` são expostas ao browser — nunca armazenar secrets nelas.
- Nunca commitar valores reais; apenas `.env.example` versionado.
- `ENCRYPTION_KEY` tem 32 bytes hex (64 chars) e rotaciona a cada 6 meses ou em incidente.
- Cada ambiente usa credenciais distintas (R2 bucket, Brevo from-email, Sentry DSN).
- Build quebra se `DATABASE_URL`, `DIRECT_URL`, chaves Supabase, R2, OneSignal, Brevo ou `ENCRYPTION_KEY` faltarem.

## Edge cases
- Variável marcada como obrigatória ausente no Vercel → build falha com mensagem clara via `@t3-oss/env-nextjs`.
- Uso de chave pública Supabase (`anon`) no servidor onde deveria ser `service_role` → revisar guidelines em `SPEC_SECURITY_*`.
- `ENCRYPTION_KEY` trocada sem re-criptografar dados bancários → registros antigos viram ilegíveis; seguir plano de migração.
- `BREVO_FROM_EMAIL` não verificado no provider → emails são rejeitados silenciosamente.

## Dependências
- `SPEC_DEPLOY_STRATEGY.md` — pipeline que injeta variáveis em cada ambiente.
- `SPEC_SECURITY_DATA_PROTECTION.md` — uso de `ENCRYPTION_KEY`.
- `SPEC_EMAILS.md` — credenciais Brevo.
- `SPEC_API_UPLOAD_R2.md` — credenciais R2.
- `SPEC_LOGGING_MONITORING.md` — Sentry, Upstash.

---

## Detalhes técnicos / Referência

> **Fonte única de verdade** para todas as variáveis de ambiente do projeto.
> Manter sincronizado com `.env.example` na raiz do projeto.

---

## Legenda

| Símbolo | Significado |
|---------|------------|
| 🔴 Obrigatório | Sem esta var, o app não inicia |
| 🟡 Condicional | Obrigatório se feature estiver habilitada |
| 🟢 Opcional | Tem valor padrão ou feature é opcional |
| `NEXT_PUBLIC_` | Exposta ao browser (não colocar secrets) |

---

## 1. Supabase

| Variável | Tipo | Descrição |
|---------|------|-----------|
| `DATABASE_URL` | 🔴 | Connection string Prisma via PgBouncer (pooling) |
| `DIRECT_URL` | 🔴 | Connection string direta (para `prisma migrate`) |
| `NEXT_PUBLIC_SUPABASE_URL` | 🔴 | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 🔴 | Chave pública (safe para browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | 🔴 | Chave de serviço (apenas server-side — nunca expor) |

### Como obter
- Dashboard Supabase → Settings → API
- `DATABASE_URL`: Settings → Database → Connection string → Transaction mode
- `DIRECT_URL`: Settings → Database → Connection string → Session mode

```env
DATABASE_URL="postgresql://postgres.[ref]:[pass]@[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[ref]:[pass]@[region].pooler.supabase.com:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://[ref].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."
```

---

## 2. Cloudflare R2

| Variável | Tipo | Descrição |
|---------|------|-----------|
| `R2_ACCOUNT_ID` | 🔴 | ID da conta Cloudflare |
| `R2_ACCESS_KEY_ID` | 🔴 | Chave de acesso do R2 API Token |
| `R2_SECRET_ACCESS_KEY` | 🔴 | Secret do R2 API Token |
| `R2_BUCKET_NAME` | 🔴 | Nome do bucket (ex: `monarca-assets`) |
| `R2_PUBLIC_URL` | 🔴 | URL pública do bucket (ex: `https://assets.monarcasemijoyas.com.py`) |

### Como obter
- Cloudflare Dashboard → R2 → Manage API Tokens → Create Token
- Permissões mínimas necessárias: `Object Read` + `Object Write`

```env
R2_ACCOUNT_ID="abc123def456"
R2_ACCESS_KEY_ID="your_access_key"
R2_SECRET_ACCESS_KEY="your_secret_key"
R2_BUCKET_NAME="monarca-assets"
R2_PUBLIC_URL="https://assets.monarcasemijoyas.com.py"
```

---

## 3. OneSignal (Push Notifications)

| Variável | Tipo | Descrição |
|---------|------|-----------|
| `NEXT_PUBLIC_ONESIGNAL_APP_ID` | 🔴 | App ID público (safe para browser) |
| `ONESIGNAL_REST_API_KEY` | 🔴 | REST API Key (apenas server-side) |

### Como obter
- OneSignal Dashboard → Settings → Keys & IDs

```env
NEXT_PUBLIC_ONESIGNAL_APP_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
ONESIGNAL_REST_API_KEY="os_v2_app_..."
```

---

## 4. Email (Brevo / Sendinblue)

| Variável | Tipo | Descrição |
|---------|------|-----------|
| `BREVO_API_KEY` | 🔴 | API Key do Brevo para envio de emails transacionais |
| `BREVO_FROM_EMAIL` | 🔴 | Email remetente verificado (ex: `noreply@monarcasemijoyas.com.py`) |
| `BREVO_FROM_NAME` | 🟢 | Nome remetente (default: `Monarca Semijoyas`) |

### Como obter
- Brevo Dashboard → SMTP & API → API Keys

```env
BREVO_API_KEY="xkeysib-..."
BREVO_FROM_EMAIL="noreply@monarcasemijoyas.com.py"
BREVO_FROM_NAME="Monarca Semijoyas"
```

> **Atenção:** Supabase Auth envia emails de confirmação/reset via configuração própria.
> Brevo é usado SOMENTE para emails transacionais customizados (boas-vindas, notificação de maleta, etc).
> Ver `SPEC_EMAILS.md` para detalhes.

---

## 5. App / Site

| Variável | Tipo | Descrição |
|---------|------|-----------|
| `NEXT_PUBLIC_SITE_URL` | 🔴 | URL base do site (sem trailing slash) |
| `NEXTAUTH_SECRET` | 🟢 | Não usado (Supabase Auth). Reservado para futuro. |

```env
NEXT_PUBLIC_SITE_URL="https://monarcasemijoyas.com.py"
# Em staging: NEXT_PUBLIC_SITE_URL="https://staging.monarcasemijoyas.com.py"
```

---

## 6. Criptografia (Dados Sensíveis)

| Variável | Tipo | Descrição |
|---------|------|-----------|
| `ENCRYPTION_KEY` | 🔴 | Chave AES-256 (32 bytes hex) para dados bancários |

### Como gerar
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

> ⚠️ **NUNCA commitar esta chave.** Rotacionar a cada 6 meses ou em caso de comprometimento.

```env
ENCRYPTION_KEY="a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2"
```

---

## 7. Monitoramento (Opcional)

| Variável | Tipo | Descrição |
|---------|------|-----------|
| `SENTRY_DSN` | 🟡 | DSN do Sentry para error tracking |
| `NEXT_PUBLIC_SENTRY_DSN` | 🟡 | DSN público (para erros client-side) |
| `SENTRY_AUTH_TOKEN` | 🟡 | Token para source maps upload no CI |
| `SENTRY_ORG` | 🟡 | Slug da organização no Sentry |
| `SENTRY_PROJECT` | 🟡 | Slug do projeto no Sentry |

```env
SENTRY_DSN="https://xxx@o123.ingest.sentry.io/456"
NEXT_PUBLIC_SENTRY_DSN="https://xxx@o123.ingest.sentry.io/456"
SENTRY_AUTH_TOKEN="sntrys_..."
SENTRY_ORG="monarca"
SENTRY_PROJECT="next-monarca"
```

---

## 8. Rate Limiting (Upstash Redis)

| Variável | Tipo | Descrição |
|---------|------|-----------|
| `UPSTASH_REDIS_REST_URL` | 🟡 | URL da instância Redis (Upstash) |
| `UPSTASH_REDIS_REST_TOKEN` | 🟡 | Token de autenticação |

> Obrigatório se rate limiting via Upstash for implementado. Ver `SPEC_SECURITY_API_ENDPOINTS.md`.

```env
UPSTASH_REDIS_REST_URL="https://xxx.upstash.io"
UPSTASH_REDIS_REST_TOKEN="AXxx..."
```

---

## 9. Resumo — Arquivo `.env.example`

```env
# ── SUPABASE ─────────────────────────────────────────────────────
DATABASE_URL=""
DIRECT_URL=""
NEXT_PUBLIC_SUPABASE_URL=""
NEXT_PUBLIC_SUPABASE_ANON_KEY=""
SUPABASE_SERVICE_ROLE_KEY=""

# ── CLOUDFLARE R2 ─────────────────────────────────────────────────
R2_ACCOUNT_ID=""
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET_NAME="monarca-assets"
R2_PUBLIC_URL=""

# ── ONESIGNAL ─────────────────────────────────────────────────────
NEXT_PUBLIC_ONESIGNAL_APP_ID=""
ONESIGNAL_REST_API_KEY=""

# ── EMAIL (BREVO) ─────────────────────────────────────────────────
BREVO_API_KEY=""
BREVO_FROM_EMAIL="noreply@monarcasemijoyas.com.py"
BREVO_FROM_NAME="Monarca Semijoyas"

# ── APP ───────────────────────────────────────────────────────────
NEXT_PUBLIC_SITE_URL="http://localhost:3000"

# ── CRIPTOGRAFIA ──────────────────────────────────────────────────
ENCRYPTION_KEY=""  # gerar: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# ── MONITORAMENTO (SENTRY — OPCIONAL) ────────────────────────────
SENTRY_DSN=""
NEXT_PUBLIC_SENTRY_DSN=""
SENTRY_AUTH_TOKEN=""
SENTRY_ORG="monarca"
SENTRY_PROJECT="next-monarca"

# ── RATE LIMITING (UPSTASH — OPCIONAL) ───────────────────────────
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""
```

---

## 10. Validação no Startup

Criar `src/env.ts` com `@t3-oss/env-nextjs` para validar variáveis na build:

```ts
import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    DIRECT_URL: z.string().url(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    R2_ACCOUNT_ID: z.string().min(1),
    R2_ACCESS_KEY_ID: z.string().min(1),
    R2_SECRET_ACCESS_KEY: z.string().min(1),
    R2_BUCKET_NAME: z.string().min(1),
    R2_PUBLIC_URL: z.string().url(),
    ONESIGNAL_REST_API_KEY: z.string().min(1),
    BREVO_API_KEY: z.string().min(1),
    BREVO_FROM_EMAIL: z.string().email(),
    ENCRYPTION_KEY: z.string().length(64), // 32 bytes hex
  },
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
    NEXT_PUBLIC_ONESIGNAL_APP_ID: z.string().uuid(),
    NEXT_PUBLIC_SITE_URL: z.string().url(),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    // ... demais vars
  },
});
```

> Se alguma variável obrigatória estiver ausente, a build falha com mensagem clara.

---

## 11. Diferenças por Ambiente

| Variável | Development | Staging | Production |
|---------|------------|---------|-----------|
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | `https://staging.monarcasemijoyas.com.py` | `https://monarcasemijoyas.com.py` |
| `R2_BUCKET_NAME` | `monarca-assets-dev` | `monarca-assets-staging` | `monarca-assets` |
| `BREVO_FROM_EMAIL` | `dev@monarcasemijoyas.com.py` | `staging@monarcasemijoyas.com.py` | `noreply@monarcasemijoyas.com.py` |
| `SENTRY_DSN` | (vazio — não logar em dev) | Opcional | Obrigatório |

> ⚠️ **Nunca usar credenciais de produção em ambiente de desenvolvimento.**
