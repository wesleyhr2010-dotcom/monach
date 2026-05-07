# Estratégia de Rate Limiting — Monarca

> Documento operacional dos limites de requisição. Atualizar quando novos endpoints forem protegidos.

## Stack

- **Provider:** Upstash Redis (serverless, REST API)
- **SDK:** `@upstash/ratelimit` + `@upstash/redis`
- **Algoritmo:** Sliding window (padrão) / Fixed window (password reset)

## Endpoints Protegidos

| Endpoint | Tipo de limite | Chave | Limite | Janela |
|----------|---------------|-------|--------|--------|
| `POST /api/track` | IP | `ip:{xff}` | 100 | 60s |
| `POST /api/vitrina/track` | IP | `ip:{xff}` | 100 | 60s |
| `POST /api/upload-r2` | userId | `user:{authUserId}` | 10 | 60s |
| `POST /app/login/recuperar-contrasena` | — | — | — | Supabase controla |

## Bypass por Role

| Role | Upload (`/api/upload-r2`) | Tracking |
|------|---------------------------|----------|
| `ADMIN` | Sem limite | Sem limite |
| `COLABORADORA` | Sem limite | Sem limite |
| `REVENDEDORA` | 10 req/min | 100 req/min |
| Anônimo | 401 | 100 req/min |

## Headers de Resposta

Toda resposta de endpoint rate-limited inclui:

| Header | Valor (sucesso) | Valor (bloqueado) |
|--------|----------------|-------------------|
| `X-RateLimit-Limit` | `{limite}` | `0` |
| `X-RateLimit-Remaining` | `{restante}` | `0` |
| `Retry-After` | — | `{segundos}` |

## Resposta 429

```json
{
  "error": "Demasiadas solicitudes. Por favor, esperá un momento y probá de nuevo.",
  "retry_after": 45
}
```

## Fallback quando Redis está indisponível

Se `UPSTASH_REDIS_REST_URL` ou `UPSTASH_REDIS_REST_TOKEN` não estiverem configurados, o sistema **não bloqueia requisições**. O `checkRateLimit` retorna `success: true` com `limit: Infinity`. Isso evita que um problema de infraestrutura (Redis down ou env vars ausentes) derrube a aplicação.

Em produção, a ausência de env vars é logada como warning (não implementado nesta fase — depende do sistema de logs estruturados da Phase 10).

## Burst e Estratégia de Recuperação

- **Sliding window** suaviza bursts melhor que fixed window — 100 req/min significa ~1.6 req/s sustentado, mas permite picos curtos dentro da janela.
- **Upload** usa limite mais agressivo (10/min) porque cada upload consome bandwidth de R2 e CPU para validação.
- Se um usuário legítimo estourar o limite acidentalmente (ex.: refresh rápido), ele precisa esperar **no máximo 60 segundos**.

## Configuração de Ambiente

```bash
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-upstash-token
```

## Como Adicionar um Novo Endpoint

1. Adicionar limiter em `src/lib/rate-limit.ts`:
   ```typescript
   meuEndpoint: redis ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(N, "60 s"), prefix: "meu_endpoint" }) : null
   ```
2. Chamar `checkRateLimit(limiter, key)` no início do handler.
3. Retornar `createRateLimitResponse(retryAfter, message)` se `success === false`.
4. Adicionar headers `X-RateLimit-*` na resposta de sucesso.
5. Documentar neste arquivo.
6. Escrever teste em `src/__tests__/api/`.

---
*Criado: 2026-05-06 (Phase 11)*
*Última atualização: 2026-05-06*
