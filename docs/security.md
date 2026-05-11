# Segurança — Monarca Platform

> Última auditoria: 2026-05-11
> Próxima revisão recomendada: ao adicionar novos serviços externos ou antes de cada milestone de produção.

---

## 1. Security Headers HTTP

**Status: ✅ Implementado** (desde 2026-05-11, `next.config.ts`)

Aplicados em **todas as rotas** via bloco `headers()` do Next.js:

| Header | Valor | Proteção |
|---|---|---|
| `X-Frame-Options` | `SAMEORIGIN` | Clickjacking — impede embed em iframes externos |
| `X-Content-Type-Options` | `nosniff` | MIME-type sniffing |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Força HTTPS por 2 anos |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Vazamento de URL em requisições cross-origin |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=()` | Desabilita APIs de hardware |
| `Content-Security-Policy` | Ver detalhes abaixo | XSS, injeção de scripts/estilos |

### CSP — Diretivas

```
default-src 'self'
script-src  'self' 'unsafe-inline' https://cdn.onesignal.com https://onesignal.com
style-src   'self' 'unsafe-inline' https://fonts.googleapis.com
font-src    'self' https://fonts.gstatic.com
img-src     'self' data: blob: [cdn hosts] https://amlwwakxpungeqpiyxwr.supabase.co
connect-src 'self' https://amlwwakxpungeqpiyxwr.supabase.co
            wss://amlwwakxpungeqpiyxwr.supabase.co
            https://*.sentry.io https://onesignal.com
worker-src  'self' blob:
frame-src   'self'
manifest-src 'self'
```

### Notas sobre concessões

- **`unsafe-inline` em `script-src`**: Necessário para o Service Worker e scripts inline do Next.js. Para remover, seria necessário implementar nonces — escopo de uma fase futura.
- **`unsafe-inline` em `style-src`**: Necessário para estilos inline gerados pelo Next.js/Tailwind em runtime. Não há alternativa viável sem refatoração de CSS.
- **`unsafe-eval` está bloqueado**: O Sentry SDK funciona sem ele em produção.

### Como atualizar a CSP ao adicionar um novo serviço

1. Abrir `next.config.ts`
2. Identificar qual diretiva o serviço precisa (`connect-src` para APIs, `script-src` para scripts, etc.)
3. Adicionar o hostname ao array correspondente
4. Atualizar a data de "Última revisão" no comentário do arquivo
5. Atualizar esta documentação

---

## 2. CORS

**Status: 🟡 Coberto implicitamente**

Não há configuração explícita de CORS porque o projeto não expõe APIs públicas consumidas por domínios terceiros.

### Como funciona

- **Next.js API routes**: Por padrão, não enviam `Access-Control-Allow-Origin`. Somente requests do mesmo domínio são aceitos.
- **Server Actions**: Protegidas por CSRF implícito do framework (mesmo domínio, mesmo session cookie).
- **Middleware**: Rejeita todas as rotas `/admin` e `/app` sem sessão Supabase válida.

### Proxy de imagens R2

`src/app/api/proxy-image/route.ts` existe especificamente para contornar CORS do R2 no PWA — correto por design.

### Se futuramente precisar de CORS explícito

Ao criar uma API pública (ex: webhook de parceiro), adicionar no `route.ts`:

```ts
import { NextResponse } from "next/server";

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      "Access-Control-Allow-Origin": "https://parceiro.com",
      "Access-Control-Allow-Methods": "POST",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
```

---

## 3. RLS — Row Level Security

**Status: ⚪ Não aplicado — por design**

### Por que não temos RLS

O projeto usa **Prisma com service role** para acessar o banco. O cliente nunca faz queries diretamente ao Supabase DB — toda consulta passa por:

1. Server Actions (`src/app/admin/actions-*.ts`, `src/app/app/actions-*.ts`)
2. API Routes (`src/app/api/**`)

Todas protegidas por:
- `requireAuth(["ADMIN" | "COLABORADORA" | "REVENDEDORA"])` — verifica role
- `getResellerScope(user)` — aplica filtro de escopo (REVENDEDORA só vê seus próprios dados)

### Quando RLS seria necessário

Se o frontend passar a fazer queries diretas via `supabase.from(...)` no cliente (sem passar por Server Actions), seria necessário ativar RLS em todas as tabelas e criar políticas por role.

**Hoje, o `NEXT_PUBLIC_SUPABASE_ANON_KEY` é usado apenas para autenticação (Supabase Auth), não para queries de dados.**

### Checklist para ativar RLS (caso necessário no futuro)

```sql
-- Para cada tabela sensível:
ALTER TABLE "NomeDaTabela" ENABLE ROW LEVEL SECURITY;

-- Política de leitura para ADMIN:
CREATE POLICY "admin_select" ON "NomeDaTabela"
  FOR SELECT USING (auth.jwt() ->> 'role' = 'ADMIN');

-- Política de leitura para REVENDEDORA (escopo próprio):
CREATE POLICY "revendedora_select" ON "NomeDaTabela"
  FOR SELECT USING (reseller_id = auth.uid());
```

---

## 4. Autenticação e Sessão

**Status: ✅ Implementado**

- **Provider**: Supabase Auth (JWT com refresh token)
- **Middleware** (`src/lib/middleware-auth.ts`): Refresca token em toda requisição, redireciona não-autenticados para login
- **Role check**: Feito via `getCurrentUser()` (com `React.cache` por request) nos layouts e Server Actions
- **Cookie**: `sameSite: "lax"`, `secure: true` em produção

---

## 5. Rate Limiting

**Status: ✅ Implementado**

`src/lib/rate-limit.ts` — Rate limiting em Server Actions críticas.

---

## Histórico de Revisões

| Data | O que mudou | Responsável |
|---|---|---|
| 2026-05-11 | Adição dos security headers HTTP (X-Frame-Options, HSTS, CSP, etc.) | Agente |
| 2026-05-09 | Polling do AdminAlertBell reduzido de 30s→180s com visibilityState guard | Agente |
