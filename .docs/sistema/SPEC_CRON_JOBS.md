# SPEC — Cron Jobs (Supabase Edge Functions con Schedule)

**Implementación:** Supabase Edge Functions con `pg_cron`  
**Archivo de referencia:** `supabase/functions/`

---

## Jobs Definidos

| Job | Schedule | Descripción |
|-----|----------|-------------|
| `check-maleta-prazo-d3` | `0 12 * * *` (08:00 PY) | Notifica revendedoras com maleta vencendo em 3 dias |
| `check-maleta-prazo-d1` | `0 12 * * *` (08:00 PY) | Notifica revendedoras com maleta vencendo amanhã (D-1) |
| `marcar-maletas-atrasadas` | `0 5 * * *` (01:00 PY) | Cambia status a `atrasada` si venció + notifica admin |
| `agrega-analytics-diario` | `0 7 * * *` (03:00 PY) | Agrega eventos del día anterior en `AnalyticsDiario` |

> **Nota D-1:** O cron D-1 usa a mesma Edge Function que D-3, mas com janela de `24h + 1h`
> e template diferente (`prazo_proximo_d1`). Verificar `notificacao_templates` no banco.

> **Nota Admin:** O push para o admin ao receber devolução é disparado pela **Server Action**
> `sinalizarDevolucao` — não por cron. Ver `SPEC_ADMIN_ANALYTICS_NOTIFICATIONS.md § 3.4`.

---

## Job 1 — `check-maleta-prazo`

**Schedule:** Todos los días a las 08:00 (Paraguay = UTC-4)  
**Objetivo:** Enviar push notification a revendedoras cuya maleta vence en exactamente 2 días.

### Lógica

```sql
-- Maletas activas que vencen ENTRE ahora y dentro de 48h
SELECT m.id, m.reseller_id, m.data_limite, r.name
FROM maletas m
JOIN resellers r ON r.id = m.reseller_id
WHERE m.status = 'ativa'
  AND m.data_limite >= NOW()
  AND m.data_limite < NOW() + INTERVAL '2 days 1 hour'
  -- La ventana de 1h extra evita que la notificación se pierda por milisegundos
```

### Código Edge Function

```ts
// supabase/functions/check-maleta-prazo/index.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

Deno.serve(async (_req) => {
  const { data: maletas, error } = await supabase
    .from('maletas')
    .select('id, reseller_id, data_limite, resellers(name)')
    .eq('status', 'ativa')
    .gte('data_limite', new Date().toISOString())
    .lt('data_limite', new Date(Date.now() + 49 * 60 * 60 * 1000).toISOString());

  if (error) throw error;
  if (!maletas?.length) return new Response('Sin maletas próximas a vencer');

  for (const maleta of maletas) {
    // Verificar preferencia de notificación
    const { data: prefs } = await supabase
      .from('notificacao_preferencias')
      .select('prazo_proximo')
      .eq('reseller_id', maleta.reseller_id)
      .single();

    if (prefs?.prazo_proximo === false) continue; // revendedora desactivó este tipo

    // Enviar push via OneSignal
    await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Deno.env.get('ONESIGNAL_REST_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        app_id: Deno.env.get('ONESIGNAL_APP_ID'),
        include_aliases: { external_id: [maleta.reseller_id] },
        target_channel: 'push',
        contents: {
          es: `⚠️ Tu consignación vence en 2 días. ¡No olvides devolver!`,
        },
        data: { maleta_id: maleta.id, tipo: 'prazo_proximo' },
      }),
    });
  }

  return new Response(`Notificadas: ${maletas.length} revendedoras`);
});
```

### Deduplicación

El cron corre una vez al día. La ventana de 48h + 1h garantiza que cada maleta sea
notificada **una sola vez**. Si por algún error el job corre dos veces el mismo día,
la segunda ejecución puede duplicar la notificación.

**Solución:** Agregar `notificacoes_enviadas` tabla o usar `data` de OneSignal con
idempotency key (recomendado para v2).

---

## Job 2 — `marcar-maletas-atrasadas`

**Schedule:** Todos los días a la 01:00 hs  
**Objetivo:** Cambiar status de `ativa` → `atrasada` para maletas vencidas.

### Lógica

```ts
// supabase/functions/marcar-maletas-atrasadas/index.ts
Deno.serve(async (_req) => {
  const { data, error } = await supabase
    .from('maletas')
    .update({ status: 'atrasada', updated_at: new Date().toISOString() })
    .eq('status', 'ativa')
    .lt('data_limite', new Date().toISOString())
    .select('id, reseller_id');

  if (error) throw error;
  if (!data?.length) return new Response('Sin maletas para marcar');

  // Notificar cada revendedora con maleta atrasada
  for (const maleta of data) {
    const { data: prefs } = await supabase
      .from('notificacao_preferencias')
      .select('maleta_atrasada')
      .eq('reseller_id', maleta.reseller_id)
      .single();

    if (prefs?.maleta_atrasada === false) continue;

    await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Deno.env.get('ONESIGNAL_REST_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        app_id: Deno.env.get('ONESIGNAL_APP_ID'),
        include_aliases: { external_id: [maleta.reseller_id] },
        target_channel: 'push',
        contents: {
          es: `🔴 Tu consignación está atrasada. Comunícate con tu consultora.`,
        },
        data: { maleta_id: maleta.id, tipo: 'maleta_atrasada' },
      }),
    });
  }

  return new Response(`Atrasadas marcadas: ${data.length}`);
});
```

---

## Job 3 — `agrega-analytics-diario`

**Schedule:** Todos los días a las 03:00 hs  
**Objetivo:** Agregar los eventos de `AnalyticsAcesso` del día anterior en `AnalyticsDiario`.

### Lógica SQL (ejecutada en la Edge Function)

```sql
-- Inserta/actualiza el agregado del día anterior
INSERT INTO analytics_diario (reseller_id, data, visitas, visitantes_unicos, cliques_whatsapp)
SELECT
  reseller_id,
  DATE(created_at AT TIME ZONE 'America/Asuncion') AS data,
  COUNT(*) FILTER (WHERE tipo_evento = 'catalogo_revendedora') AS visitas,
  COUNT(DISTINCT visitor_id) FILTER (WHERE tipo_evento = 'catalogo_revendedora') AS visitantes_unicos,
  COUNT(*) FILTER (WHERE tipo_evento = 'clique_whatsapp') AS cliques_whatsapp
FROM analytics_acessos
WHERE created_at >= (NOW() AT TIME ZONE 'America/Asuncion')::date - INTERVAL '1 day'
  AND created_at < (NOW() AT TIME ZONE 'America/Asuncion')::date
GROUP BY reseller_id, DATE(created_at AT TIME ZONE 'America/Asuncion')
ON CONFLICT (reseller_id, data) DO UPDATE SET
  visitas = EXCLUDED.visitas,
  visitantes_unicos = EXCLUDED.visitantes_unicos,
  cliques_whatsapp = EXCLUDED.cliques_whatsapp;
```

---

## Configuración de Schedule en Supabase

Usando `pg_cron` (debe estar habilitado en el proyecto Supabase):

```sql
-- Ejecutar en SQL Editor del proyecto Supabase:

-- Job 1: Notificar maletas próximas a vencer
SELECT cron.schedule(
  'check-maleta-prazo',
  '0 12 * * *',             -- 08:00 Paraguay = 12:00 UTC
  $$ SELECT net.http_post(
    url := 'https://{project_ref}.supabase.co/functions/v1/check-maleta-prazo',
    headers := '{"Authorization": "Bearer {SUPABASE_SERVICE_ROLE_KEY}"}'::jsonb
  ) $$
);

-- Job 2: Marcar maletas atrasadas
SELECT cron.schedule(
  'marcar-maletas-atrasadas',
  '0 5 * * *',              -- 01:00 Paraguay = 05:00 UTC
  $$ SELECT net.http_post(
    url := 'https://{project_ref}.supabase.co/functions/v1/marcar-maletas-atrasadas',
    headers := '{"Authorization": "Bearer {SUPABASE_SERVICE_ROLE_KEY}"}'::jsonb
  ) $$
);

-- Job 3: Agregar analytics
SELECT cron.schedule(
  'agrega-analytics-diario',
  '0 7 * * *',              -- 03:00 Paraguay = 07:00 UTC
  $$ SELECT net.http_post(
    url := 'https://{project_ref}.supabase.co/functions/v1/agrega-analytics-diario',
    headers := '{"Authorization": "Bearer {SUPABASE_SERVICE_ROLE_KEY}"}'::jsonb
  ) $$
);
```

> **Huso Horario:** Paraguay usa UTC-4 (verano) / UTC-3 (invierno). Todos los schedules
> están definidos en UTC. Ajustar si el horario de verano cambia.

---

## Variables de Entorno para las Edge Functions

```env
SUPABASE_URL=https://{project_ref}.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
ONESIGNAL_REST_API_KEY=...
ONESIGNAL_APP_ID=...
```

---

## Estructura de Archivos

```
supabase/
└── functions/
    ├── check-maleta-prazo/
    │   └── index.ts
    ├── marcar-maletas-atrasadas/
    │   └── index.ts
    └── agrega-analytics-diario/
        └── index.ts
```

---

## Monitoreo y Alertas

- Ver logs: Supabase Dashboard → Edge Functions → Logs
- En caso de fallo: Supabase envía error a la Supabase Dashboard
- **Recomendado v2:** Integrar con Sentry o similar para alertas por email en fallos del cron
