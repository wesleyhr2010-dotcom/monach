# SPEC — Pantalla: Notificaciones y Preferencias

**Rutas:**
- `/app/notificaciones` — Centro de notificaciones
- `/app/perfil/notificaciones` — Configurar preferencias

---

## Pantalla 1: Centro de Notificaciones `/app/notificaciones`

Muestra el historial de notificaciones recibidas (desde el sistema, no el sistema operativo).

### Layout

```
┌─────────────────────────────────────┐
│  ← Notificaciones                   │
│                                     │
│  ● HOY                              │
│  ┌──────────────────────────────┐   │
│  │ 📦 Nueva Consignación        │   │
│  │ Consig. #103 asignada.       │   │
│  │ [Ver Consignación →]         │   │
│  │ 09:41                        │   │
│  └──────────────────────────────┘   │
│                                     │
│  ● AYER                             │
│  ┌──────────────────────────────┐   │
│  │ ⚠️  ¡Plazo proche!           │   │
│  │ Tu consig. vence en 2 días.  │   │
│  │ [Ver Consignación →]         │   │
│  │ 08:00                        │   │
│  └──────────────────────────────┘   │
│  ┌──────────────────────────────┐   │
│  │ ✅ Acerto Confirmado         │   │
│  │ Consig. #101 fue cerrada.    │   │
│  │ [Ver Detalles →]             │   │
│  │ 14:20                        │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
```

### Tipos de Notificaciones (OneSignal)

| Clave (tipo OneSignal) | Ícono | Texto ES | CTA |
|-----------------------|-------|----------|-----|
| `nova_maleta` | 📦 | "Nueva consignación asignada. #XXX lista para retirar." | `/app/maleta/{id}` |
| `prazo_proximo` | ⚠️ | "Tu consignación vence en 2 días. ¡No olvides devolver!" | `/app/maleta/{id}/devolver` |
| `maleta_atrasada` | 🔴 | "Tu consignación está atrasada. Comunícate con tu consultora." | `/app/maleta/{id}` |
| `acerto_confirmado` | ✅ | "¡Listo! Tu consig. #{numero} fue confirmada. Comisión: G$ {valor}." | `/app/maleta/{id}` |
| `brinde_entregue` | 🎁 | "¡Tu regalo llegó! {nombre_regalo} fue entregado. ¡Disfrútalo!" | `/app/progreso/regalos` |
| `pontos_ganhos` | ⭐ | "¡Ganaste {pontos} puntos! {motivo}" | `/app/progreso` |
| `documento_reprovado` | ❌ | "Tu documento fue rechazado. {observacion}" | `/app/perfil/documentos` |
| `documento_aprovado` | ✅ | "¡Tu documento fue aprobado! ✅" | `/app/perfil/documentos` |

---

## Integración OneSignal (Push)

### Inicialización

```ts
// src/app/app/OneSignalProvider.tsx — Client Component
'use client';

import OneSignal from 'react-onesignal';

export function OneSignalProvider({ userId }: { userId: string }) {
  useEffect(() => {
    OneSignal.init({
      appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!,
      notifyButton: { enable: false },
      serviceWorkerPath: '/sw.js',
    });

    OneSignal.login(userId); // vincula dispositivo al user ID de Supabase
  }, [userId]);

  return null;
}
```

### Solicitud de Permiso (PWA Soft Prompt)

```ts
// Mostrar prompt con delay de 3 segundos — solo en modo standalone (PWA instalado)
useEffect(() => {
  const isPWA = window.matchMedia('(display-mode: standalone)').matches;

  if (isPWA) {
    const timer = setTimeout(async () => {
      const permission = await Notification.permission;
      if (permission === 'default') {
        await OneSignal.showSlidedownPrompt();
      }
    }, 3000);
    return () => clearTimeout(timer);
  }
}, []);
```

> El soft prompt **solo aparece en la PWA instalada** (no en el navegador normal).
> Esto evita perturbar al usuario al navegar en el browser.

### Envío de Push (desde el backend)

```ts
// src/lib/notifications.ts
export async function enviarPushParaRevendedora(
  resellerUserId: string,
  texto: string,
  data?: Record<string, string>
) {
  const res = await fetch('https://onesignal.com/api/v1/notifications', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${process.env.ONESIGNAL_REST_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      app_id: process.env.ONESIGNAL_APP_ID,
      include_aliases: { external_id: [resellerUserId] },
      target_channel: 'push',
      contents: { es: texto },
      data: data ?? {},
    }),
  });

  if (!res.ok) {
    console.error('Error OneSignal:', await res.text());
  }
}
```

---

## Email Transaccional para Documentos

Cuando la revendedora sube un documento y presiona "Enviar para Revisión",
el sistema notifica a todos los admins por **email transaccional**:

### Implementación

```ts
// src/lib/emails.ts — usando Supabase Edge Function o Resend.com
export async function emailDocumentoPendente(resellerId: string, tipo: string) {
  const admins = await prisma.reseller.findMany({ where: { role: 'ADMIN' } });

  for (const admin of admins) {
    const adminEmail = await getAuthEmail(admin.auth_user_id!);
    if (!adminEmail) continue;

    // Usar Resend.com (recomendado) o Supabase SMTP
    await resend.emails.send({
      from: 'no-reply@monarca.com.py',
      to: adminEmail,
      subject: `Nuevo documento para revisar — ${resellerId}`,
      html: `
        <h2>Documento pendiente de revisión</h2>
        <p>Un nuevo documento del tipo <strong>${tipo}</strong> fue enviado por la revendedora.</p>
        <a href="${ADMIN_URL}/admin/revendedoras/${resellerId}/documentos">
          Revisar en el panel admin
        </a>
      `,
    });
  }
}
```

**Servicio de email recomendado:** [Resend.com](https://resend.com) — integración simple con Next.js y SMTP nativo.

**Variable de entorno necesaria:**
```env
RESEND_API_KEY=re_...
```

---

## Pantalla 2: Configurar Preferencias `/app/perfil/notificaciones`

### Layout

```
┌─────────────────────────────────────┐
│  ← Notificaciones Push              │
│                                     │
│  Controla qué notificaciones        │
│  recibirás en tu teléfono.          │
│                                     │
│  🔔 Nueva Consignación              │
│     Cuando recibas nueva consig.    │
│         [━━━━━━●─] ON              │
│                                     │
│  ⚠️  Plazo Próximo                  │
│     2 días antes del vencimiento    │
│         [━━━━━━●─] ON              │
│                                     │
│  🔴 Consignación Atrasada           │
│     Cuando la consig. está vencida  │
│         [━━━━━━●─] ON              │
│                                     │
│  ✅ Acerto Confirmado               │
│     Cuando la consultora confirme   │
│         [━━━━━━●─] ON              │
│                                     │
│  🎁 Entrega de Regalo               │
│     Cuando tu regalo sea entregado  │
│         [━━━━━━●─] ON              │
│                                     │
│  ⭐ Puntos Ganados                  │
│     Cada vez que ganes puntos       │
│         [─●──────] OFF ← default   │
│                                     │
│  [Guardar Preferencias]             │
└─────────────────────────────────────┘
```

### Datos

- Schema: `NotificacaoPreferencia` (ver `SPEC_DATABASE_FINAL.md`)
- `pontos_ganhos` está **OFF por defecto** — puede ser muy frecuente
- Al guardar → `upsert NotificacaoPreferencia WHERE reseller_id`

### Server Action: `actualizarPreferencias(resellerId, prefs)`

```ts
await prisma.notificacaoPreferencia.upsert({
  where: { reseller_id: resellerId },
  create: { reseller_id: resellerId, ...prefs },
  update: prefs,
});
```

### Componentes
- `NotificacionesPrefsPage` — **Client Component** (toggles interactivos)
- `PreferenciasForm` — **Client Component** (form con `useOptimistic`)

### Componentes del Centro
- `NotificacionesPage` — Server Component (historial paginado)
- `NotificacionItem` — Server Component (ícono + texto + CTA)
