# SPEC — Logging e Monitoramento

## Objetivo
Garantir observabilidade ponta a ponta do sistema usando Sentry (erros), logs estruturados (cron jobs), Vercel Analytics (performance) e UptimeRobot (health), com regras claras para alertas e sanitização de PII.

## Atores
- **Sentry** — coleta erros client e server, envia alertas.
- **Supabase Edge Functions** — logam execuções de cron jobs em JSON estruturado.
- **Vercel Analytics** — mede Core Web Vitals e latência.
- **UptimeRobot** — monitora `/api/health` externamente.
- **Dev / Admin** — revisa dashboards semanalmente.

## Fluxo
1. Erro ocorre → `@sentry/nextjs` captura no client/server com contexto sem PII.
2. Cron jobs logam `started/completed/failed` com métricas em JSON.
3. Alertas críticos disparam email imediato; demais ficam para revisão diária/semanal.
4. Endpoint `/api/health` é consultado a cada 5 min por UptimeRobot.
5. Checklist semanal revisa Sentry, cron logs, quotas e uptime.

## Regras de negócio
- Logs nunca contêm PII (nome, email, CI, dados bancários, endereço).
- Breadcrumbs de negócio usam `category: 'business'` e IDs apenas.
- Triggers críticos: cron silencioso >25h, falha `closeMaleta`, lock timeout >3/h, erro R2 >5%, Supabase down.
- Metas: LCP <2.5s; INP <100ms; CLS <0.1; `/app` <500ms; `/admin` <800ms.
- Health endpoint retorna 503 se `prisma.$queryRaw\`SELECT 1\`` falhar.

## Edge cases
- Uso do plano Free Sentry excedido → avisos são descartados; upgrade para Team quando > 5k erros/mês.
- Cron job falha silenciosamente (sem crash mas sem efeito) → monitorar métricas de contagem.
- Erro capturado contém PII involuntário → `sanitizeForLog` antes de `console.error`.
- UptimeRobot gera falsos positivos em deploy → aceitar janela de 60s durante promoção Vercel.

## Dependências
- `SPEC_ERROR_HANDLING.md` — `mapError` envia ao Sentry.
- `SPEC_CRON_JOBS.md` — logs estruturados por job.
- `SPEC_SECURITY_DATA_PROTECTION.md` — regras de PII.
- `SPEC_DEPLOY_STRATEGY.md` — smoke tests e health check.

---

## Detalhes técnicos / Referência

> Define o que logar, com qual ferramenta, e como alertar para falhas críticas.

---

## 1. Ferramenta: Sentry

**Escolha:** Sentry (integrado com Next.js via `@sentry/nextjs`)

| Plano | Eventos/mês | Custo |
|-------|-------------|-------|
| Free | 5.000 erros | $0 |
| Team | 50.000 erros | ~$26/mês |

> Para o volume inicial do projeto, o plano Free é suficiente.

### Configuração Básica

```ts
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,  // 10% de traces para performance
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,  // Replay completo em erros
});
```

---

## 2. O Que Logar

### 2.1 Erros Críticos (alertar imediatamente)

| Evento | Nível | Contexto Obrigatório |
|--------|-------|---------------------|
| Falha em `closeMaleta` | `error` | `maletaId`, `resellerId`, stack trace |
| Falha em `createMaleta` (lock timeout) | `error` | `resellerId`, `variantIds`, tempo de espera |
| Falha no cron job de prazos | `error` | nome do job, timestamp, número de registros |
| Falha de upload para R2 | `error` | path tentado, tamanho, tipo |
| Falha de envio de email (Brevo) | `warning` | destinatário (sem corpo), tipo de email |
| Falha de envio de push (OneSignal) | `warning` | `resellerId`, tipo de notificação |
| Erro de autenticação em Server Action admin | `warning` | IP, rota tentada, role do usuário |

### 2.2 Eventos de Negócio (informativo — não alertar)

Logar usando `Sentry.addBreadcrumb()` para contexto em erros futuros:

```ts
Sentry.addBreadcrumb({
  category: 'business',
  message: `Maleta criada: ${maletaId} para revendedora ${resellerId}`,
  level: 'info',
});
```

| Evento | Breadcrumb |
|--------|-----------|
| Maleta criada | `maleta.created` |
| Maleta fechada | `maleta.closed` |
| Pontos concedidos | `gamificacao.points_awarded` |
| Brinde resgatado | `gamificacao.brinde_redeemed` |
| Documento aprovado | `documents.approved` |

---

## 3. Cron Jobs — Log Estruturado

Cada Edge Function (Supabase) deve logar usando `console.log` estruturado:

```ts
// Padrão de log para cron jobs
console.log(JSON.stringify({
  job: 'prazo-notification',
  timestamp: new Date().toISOString(),
  status: 'started',
}));

// Ao finalizar
console.log(JSON.stringify({
  job: 'prazo-notification',
  timestamp: new Date().toISOString(),
  status: 'completed',
  metrics: {
    maletas_processadas: 42,
    notificacoes_enviadas: 38,
    erros: 0,
    duracao_ms: 1240,
  },
}));

// Em caso de erro
console.error(JSON.stringify({
  job: 'prazo-notification',
  timestamp: new Date().toISOString(),
  status: 'failed',
  error: error.message,
  // NUNCA incluir dados pessoais (nome, email, CI) nos logs
}));
```

### Acessar logs
- Supabase Dashboard → Edge Functions → Logs → Filtrar por função

---

## 4. PII em Logs — Regras de Sanitização

**NUNCA logar:**
- Nomes de revendedoras
- Emails
- Números de CI/RUC/CPF
- Dados bancários (número de conta, alias)
- Endereços
- WhatsApp

**SEMPRE usar IDs para contexto:**

```ts
// ERRADO ❌
console.error('Falha ao enviar notificação para Ana Silva (ana@email.com)');

// CORRETO ✅
console.error('Falha ao enviar notificação', { resellerId: 'uuid-xxx', tipo: 'prazo_proximo' });
```

---

## 5. Alertas por Severidade

| Severidade | Canal | Tempo de Resposta |
|-----------|-------|------------------|
| `critical` | Email imediato + Sentry | < 30 min |
| `error` | Sentry (revisar diariamente) | < 24h |
| `warning` | Sentry (revisar semanalmente) | < 1 semana |
| `info` | Apenas logs — sem alerta | — |

### Triggers para Alerta Imediato

Configurar no Sentry → Alerts → Issue Alerts:

1. **Cron silencioso:** Se nenhum log do cron em > 25h → `critical`
2. **Falha em `closeMaleta`:** Qualquer ocorrência → `error`
3. **Lock de estoque timeout:** > 3 ocorrências em 1h → `error`
4. **R2 upload error rate > 5%:** → `error`
5. **Supabase connection error:** Qualquer ocorrência → `critical`

---

## 6. Performance Monitoring

Usar Vercel Analytics (incluído no plano) para:
- Core Web Vitals por rota
- Latência de Server Components
- Taxa de erro por rota

### Metas de Performance

| Métrica | Meta | Alerta se |
|---------|------|----------|
| LCP (Largest Contentful Paint) | < 2.5s | > 4s |
| FID / INP | < 100ms | > 300ms |
| CLS | < 0.1 | > 0.25 |
| Server Response Time (`/app`) | < 500ms | > 2s |
| Server Response Time (`/admin`) | < 800ms | > 3s |

---

## 7. Health Check Endpoint

```ts
// src/app/api/health/route.ts
export async function GET() {
  const checks = {
    database: false,
    timestamp: new Date().toISOString(),
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = true;
  } catch {
    // database permanece false
  }

  const allHealthy = checks.database;

  return Response.json(checks, {
    status: allHealthy ? 200 : 503,
  });
}
```

> Usado pelo monitoramento externo (UptimeRobot gratuito) para verificar disponibilidade a cada 5 minutos.

---

## 8. Checklist Semanal de Monitoramento

```
[ ] Verificar Sentry: novos erros não resolvidos
[ ] Verificar logs dos cron jobs (últimos 7 dias)
[ ] Verificar Vercel Analytics: rotas lentas
[ ] Verificar status UptimeRobot: uptime > 99.5%?
[ ] Verificar quota OneSignal (notificações enviadas)
[ ] Verificar quota Brevo (emails enviados)
[ ] Verificar uso R2 (storage e bandwidth)
```
