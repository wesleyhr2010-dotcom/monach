# SPEC — Notificações e Preferências

## Objetivo
Centralizar o histórico de notificações recebidas pela revendedora e permitir configurar quais tipos ela deseja receber via push (OneSignal).

## Atores
- **Revendedora** — visualiza histórico e ajusta preferências.
- **OneSignal** — provedor de push notifications (web/PWA).
- **Sistema** — dispara eventos por ações (maleta nova, prazo, acerto, brinde etc.).

## Fluxo
1. Revendedora acessa `/app/notificaciones` e vê lista agrupada por dia (Hoy, Ayer, Anteriores).
2. Cada notificação tem ícone, título, texto, timestamp e CTA para a tela relevante.
3. Em `/app/perfil/notificaciones`, ativa/desativa tipos de push.
4. No login, `OneSignal.login(user.id)` vincula device.
5. Servidor envia push via API OneSignal ao disparar eventos qualificados.

## Regras de negócio
- Tipos suportados (chaves): `nova_maleta`, `prazo_proximo`, `maleta_atrasada`, `acerto_confirmado`, `brinde_entregue`, `pontos_ganhos`, `documento_reprovado`, `documento_aprovado`.
- Push só é enviado se o tipo estiver ativo em `NotificacaoPreferencia`.
- Histórico persiste mesmo se usuário desligar push.
- Textos em espanhol paraguaio.
- Cada notificação pode ter CTA (deep link) para a tela de destino.

## Edge cases
- Usuário recusou permissão do navegador → push silenciosamente ignorado; histórico continua gravado.
- Device sem suporte (ex.: iOS Safari fora de PWA) → informa limitação.
- Notificação clicada após expirar ação (ex.: maleta já devolvida) → destino mostra estado atualizado.
- Preferência desligada depois do envio → histórico continua visível.

## Dependências
- `SPEC_ADMIN_ANALYTICS_NOTIFICATIONS.md` — analytics de envio.
- `SPEC_LOGIN.md` — vinculação OneSignal pós-login.
- `SPEC_DATABASE.md` — `NotificacaoPreferencia`.
- PRD `PRD_OneSignal_PWA.md` — requisitos do PWA.

---

## Detalhes técnicos / Referência

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

### Estado del push en el dispositivo

A tela combina o estado do permission do navegador (`Notification.permission`) com o `OneSignal.User.PushSubscription.optedIn` em 5 estados visíveis. Cada estado tem CTA dentro do app — nunca apenas "vai em ajustes" como dead-end:

| Estado | Permission | optedIn | UI | Ação |
|---|---|---|---|---|
| `granted-on` | granted | true | "Activo" + descrição | Botão "Desactivar en este dispositivo" → `OneSignal.User.PushSubscription.optOut()` |
| `granted-off` | granted | false | "Inactivo" + "Permiso concedido, pero los avisos están pausados." | Botão "Activar notificaciones" → `optIn()` |
| `default` | default | — | "Inactivo" + "Aún no decidiste sobre los avisos en este dispositivo." | Botão "Activar notificaciones" → `OneSignal.Notifications.requestPermission()` (dispara prompt nativa do iOS/Android) |
| `denied` | denied | — | "Bloqueado" + caixa explicativa | Sem botão. Texto: "Ajustes → Notificaciones → Monarca; si no aparece, eliminá la PWA y volvé a instalarla." |
| `unsupported` | — (sem `Notification`) | — | "N/A" + "Solo disponible en la app instalada (PWA)." | Sem botão. Instrução para "Compartir → Añadir a pantalla de inicio". |

**Por que tem botão dentro do app (regra iOS):** após o usuário tocar "No permitir" na prompt nativa, `requestPermission()` resolve direto como `denied` e a única reativação é via Ajustes do iOS. Mas se o usuário **nunca decidiu** (estado `default`, comum quando fechou o app antes da prompt) ou **revogou só no OneSignal** (estado `granted-off`, comum após logout/login), o app reativa sem precisar de Ajustes. Sem este botão, o usuário fica preso achando que a única saída é Ajustes — onde a entrada da app pode nem aparecer ainda.

**Componente:** `PreferenciasNotificacionesForm.tsx` — `refreshPushState()` lê os dois sinais ao montar e após cada ação; `handleEnablePush` é idempotente (chama `requestPermission` se `default`, `optIn` se `granted`).

### Componentes del Centro
- `NotificacionesPage` — Server Component (historial paginado)
- `NotificacionItem` — Server Component (ícono + texto + CTA)
