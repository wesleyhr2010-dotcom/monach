# SPEC — Recuperar Contraseña (Revendedora)

## Objetivo
Permitir que a revendedora solicite um link por e-mail para redefinir sua senha quando a esquecer, usando Supabase Auth + SMTP Brevo.

## Atores
- **Revendedora** — solicita recuperação.
- **Supabase Auth** — emite o token.
- **Brevo (SMTP)** — entrega o e-mail.

## Fluxo
1. Em `/app/login`, revendedora toca "Olvidé mi contraseña".
2. Em `/app/login/recuperar-contrasena` informa o e-mail.
3. Sistema chama `supabase.auth.resetPasswordForEmail(email, { redirectTo: '/app/nueva-contrasena' })`.
4. Tela mostra confirmação "¡Correo enviado!".
5. Revendedora recebe e-mail, clica no link → `/app/nueva-contrasena` (ver `SPEC_LOGIN.md`).

## Regras de negócio
- Rota excluída da verificação de role no middleware.
- E-mail é trimado e validado antes do envio.
- Por segurança, mesma mensagem de sucesso é exibida mesmo se o e-mail não existir (evita enumeração).
- Rate limiting do Supabase Auth previne abuso.

## Edge cases
- E-mail não cadastrado → ainda retorna "Correo enviado" (sem dar pista ao atacante).
- Falha de SMTP → mensagem genérica "Intenta nuevamente en unos minutos".
- Múltiplas solicitações → última sobrescreve token anterior (Supabase default).
- Link expirado → usuário vê erro ao entrar em `/app/nueva-contrasena` e é orientado a solicitar novo.

## Dependências
- `SPEC_LOGIN.md` — ponto de entrada e fluxo de nova senha.
- `SPEC_EMAILS.md` — template do e-mail.
- Supabase Auth + Brevo SMTP.

---

## Detalhes técnicos / Referência

**Ruta:** `/app/login/recuperar-contrasena`  
**Tipo:** Client Component (formulario) + Server Action (auth)  
**Acceso:** Público — excluida de verificación de role en middleware  
**Trigger:** Revendedora hace clic en "Olvidé mi contraseña" en `/app/login`

---

## 1. Contexto

La revendedora olvidó su contraseña. Hace clic en el link "Olvidé mi contraseña" en la pantalla de login y llega a esta pantalla. Ingresa su correo, recibe un email con enlace de restablecimiento (vía Supabase Auth + Brevo SMTP), y es redirigida a `/app/nueva-contrasena` para definir la nueva contraseña.

---

## 2. Layout

### Estado inicial (formulario)

```
┌────────────────────────────────────────┐
│  background: #F5F2EF                   │
│  padding: 20px (--space-screen-x)      │
│  min-height: 100dvh                    │
│                                        │
│  ←  (ícono Lucide ChevronLeft 20px)    │
│                                        │
│  ┌────────────────────────────────┐    │
│  │  [Logo Monarca SVG]            │    │
│  │  altura mínima: 32px           │    │
│  │  centrado horizontal           │    │
│  └────────────────────────────────┘    │
│                                        │
│  Recuperar contraseña       ← H2       │
│  (Playfair Display Bold 20px #1A1A1A)  │
│                                        │
│  Ingresa tu correo y te enviaremos     │
│  un enlace para restablecer tu         │  ← body label
│  contraseña.                           │
│  (Raleway Regular 13px #777777)        │
│                                        │
│  Correo electrónico           ← label  │
│  (Raleway Medium 14px #1A1A1A)         │
│  ┌──────────────────────────────────┐  │
│  │  tu@correo.com                   │  │
│  └──────────────────────────────────┘  │
│  (border: 1px #D9D6D2, radius: 12px)   │
│  (height: 48px, bg: #EBEBEB)           │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │   Enviar enlace de recuperación  │  │  ← CTA primario
│  └──────────────────────────────────┘  │
│  (bg: #35605A, text: #FFF, h: 48px)    │
│  (radius: 12px, Raleway SemiBold 14px) │
│                                        │
│  ← Volver al inicio de sesión  ← link  │
│  (Raleway Regular 13px #917961)        │
│  centrado, margin-top: 16px            │
└────────────────────────────────────────┘
```

### Estado de carga (botón enviando)

```
  ┌──────────────────────────────────┐
  │  ◌  Enviando...                  │  ← spinner Lucide Loader2 animado
  └──────────────────────────────────┘
  (bg: #35605A/70, cursor: not-allowed, deshabilitado)
```

### Estado de éxito (después del envío)

```
┌────────────────────────────────────────┐
│  background: #F5F2EF                   │
│  padding: 20px                         │
│  min-height: 100dvh                    │
│                                        │
│  [Logo Monarca SVG] — centrado         │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │  surface card — bg: #EBEBEB      │  │
│  │  border-radius: 16px             │  │
│  │  padding: 24px                   │  │
│  │                                  │  │
│  │         ✅                        │  │
│  │  (CheckCircle Lucide 48px        │  │
│  │   color: #35605A, centrado)      │  │
│  │                                  │  │
│  │  ¡Correo enviado!                │  │
│  │  (Playfair Display Bold 20px)    │  │
│  │                                  │  │
│  │  Revisá tu bandeja de entrada.   │  │
│  │  Enviamos el enlace a:           │  │
│  │  ana@gmail.com                   │  │  ← email en bold
│  │  (Raleway Regular 13px #777777)  │  │
│  │                                  │  │
│  │  Si no lo ves, revisá la         │  │
│  │  carpeta de Spam o Correo no     │  │
│  │  deseado.                        │  │
│  │  (Raleway Regular 12px #777777)  │  │
│  │                                  │  │
│  │  ┌────────────────────────────┐  │  │
│  │  │  Volver al inicio de sesión│  │  │  ← botón secundario
│  │  └────────────────────────────┘  │  │
│  │  (border: 1px #35605A,           │  │
│  │   text: #35605A, radius: 12px,   │  │
│  │   h: 48px, bg: transparent)      │  │
│  └──────────────────────────────────┘  │
└────────────────────────────────────────┘
```

### Estado de error (inline, bajo el campo)

```
  Correo electrónico
  ┌──────────────────────────────────┐
  │  invalid@correo.com              │
  └──────────────────────────────────┘
  ⚠ No existe una cuenta con este correo electrónico.
  (Raleway Regular 12px #C0392B, margin-top: 4px)
```

---

## 3. Tokens de Diseño

| Elemento | Token / Valor |
|----------|---------------|
| Background de pantalla | `--app-bg` → `#F5F2EF` |
| Surface del card éxito | `--app-surface` → `#EBEBEB` |
| Color primario (botón, ícono) | `--app-primary` → `#35605A` |
| Texto principal | `--app-text` → `#1A1A1A` |
| Texto secundario / placeholder | `--app-text-secondary` → `#777777` |
| Link "Volver" | `--app-text-accent` → `#917961` |
| Borde del input | `--app-border` → `#D9D6D2` |
| Padding horizontal | `--space-screen-x` → `20px` |
| Padding interno card | `--space-card-pad` → `20px` / `24px` |
| Radio del card | `--radius-card` → `16px` |
| Radio del input / botón | `12px` |
| Título sección | Playfair Display Bold 20px, letter-spacing: -0.3px |
| Body label | Raleway Regular 13px |
| Body medium | Raleway Medium 14px |
| Botón CTA | Raleway SemiBold 14px |
| Caption | Raleway Regular 12px |

---

## 4. Reglas de Negocio

1. El campo de correo es **obligatorio** — no puede enviarse vacío.
2. Validar formato de email antes de enviar al servidor (`type="email"` + validación client-side).
3. El correo es **trimado** antes del envío (remover espacios accidentales).
4. Siempre mostrar el estado de éxito **aunque el email no exista** en la base de datos — por seguridad, no revelar si un correo está registrado o no.
5. El enlace de recuperación **expira en 1 hora** (configurado en Supabase Auth).
6. La ruta de redirección del enlace es `/app/nueva-contrasena`.
7. El botón queda **deshabilitado** mientras el request está en curso.
8. Solo se permite **un envío por vez** (no doble submit).

> **Nota de seguridad:** La regla 4 es intencional. Aunque Supabase retorne error por email inexistente, la UI muestra siempre el estado de éxito. Esto previene enumeración de usuarios.

---

## 5. Flujo de Estados

```
[IDLE]
  → usuario ingresa email y hace clic en "Enviar"
  → validación client-side pasa
  ↓
[LOADING]
  → botón spinner, deshabilitado
  → Server Action ejecutada
  ↓
[SUCCESS]          [ERROR de validación]     [ERROR de rate limit]
  → card éxito       → mensaje inline           → mensaje inline
  → email mostrado   → campo con borde rojo      → sin borde rojo
```

---

## 6. Errores y Mensajes

| Situación | Mensaje en UI | Código | Comportamiento |
|-----------|--------------|--------|---------------|
| Email vacío | "El correo es obligatorio." | — | Validación client-side, no llama al servidor |
| Formato de email inválido | "Ingresá un correo electrónico válido." | — | Validación client-side |
| Email no existe en BD | *(mostrar éxito — no revelar)* | `NOT_FOUND` | Tratar como éxito silencioso |
| Demasiados intentos | "Demasiados intentos. Esperá 15 minutos antes de intentar nuevamente." | `RATE_LIMITED` | Mensaje inline bajo el campo |
| Error inesperado | "Ocurrió un error. Intentá nuevamente." | `UNKNOWN` | Mensaje inline bajo el campo |

> Todos los mensajes siguen el catálogo de `SPEC_ERROR_HANDLING.md`.

---

## 7. Implementación

### Estructura de Archivos

```
src/app/app/login/recuperar-contrasena/
├── page.tsx                            ← Server Component (wrapper)
└── RecuperarContrasenaForm.tsx         ← Client Component (formulario + estados)
```

> No se necesita `actions.ts` separado — la llamada a Supabase Auth se hace directamente
> desde el Client Component usando el cliente de browser (`createBrowserClient`).

### page.tsx — Server Component

```tsx
// src/app/app/login/recuperar-contrasena/page.tsx
import { RecuperarContrasenaForm } from './RecuperarContrasenaForm';

export const metadata = {
  title: 'Recuperar contraseña — Monarca',
};

export default function RecuperarContrasenaPage() {
  return <RecuperarContrasenaForm />;
}
```

### RecuperarContrasenaForm.tsx — Client Component

```tsx
// src/app/app/login/recuperar-contrasena/RecuperarContrasenaForm.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import { Loader2, CheckCircle, ChevronLeft } from 'lucide-react';
import { MonarcaLogo } from '@/components/MonarcaLogo';

type FormState = 'idle' | 'loading' | 'success' | 'error';

export function RecuperarContrasenaForm() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<FormState>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg('');

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setErrorMsg('El correo es obligatorio.');
      return;
    }

    setState('loading');

    const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/app/nueva-contrasena`,
    });

    // Siempre mostrar éxito — no revelar si el email existe o no
    if (error && error.message.toLowerCase().includes('rate')) {
      setState('error');
      setErrorMsg('Demasiados intentos. Esperá 15 minutos antes de intentar nuevamente.');
      return;
    }

    setState('success');
  }

  if (state === 'success') {
    return (
      <div className="min-h-dvh bg-[#F5F2EF] flex flex-col items-center justify-center px-5 py-10">
        <MonarcaLogo className="mb-8" />
        <div className="w-full max-w-sm bg-[#EBEBEB] rounded-2xl p-6 flex flex-col items-center gap-4">
          <CheckCircle className="w-12 h-12 text-[#35605A]" strokeWidth={1.5} />
          <h2 className="font-playfair font-bold text-xl text-[#1A1A1A] text-center">
            ¡Correo enviado!
          </h2>
          <p className="font-raleway text-[13px] text-[#777777] text-center leading-relaxed">
            Revisá tu bandeja de entrada. Enviamos el enlace a:{' '}
            <strong className="text-[#1A1A1A]">{email.trim()}</strong>
          </p>
          <p className="font-raleway text-[12px] text-[#777777] text-center leading-relaxed">
            Si no lo ves, revisá la carpeta de Spam o Correo no deseado.
          </p>
          <Link
            href="/app/login"
            className="w-full h-12 flex items-center justify-center rounded-xl border border-[#35605A] text-[#35605A] font-raleway font-semibold text-sm mt-2"
          >
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#F5F2EF] flex flex-col px-5 py-10">
      <Link href="/app/login" className="flex items-center text-[#777777] mb-6">
        <ChevronLeft className="w-5 h-5" strokeWidth={1.5} />
      </Link>

      <MonarcaLogo className="mb-8 self-center" />

      <h2 className="font-playfair font-bold text-xl text-[#1A1A1A] mb-2 tracking-[-0.3px]">
        Recuperar contraseña
      </h2>
      <p className="font-raleway text-[13px] text-[#777777] mb-6 leading-relaxed">
        Ingresá tu correo y te enviaremos un enlace para restablecer tu contraseña.
      </p>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="font-raleway font-medium text-[14px] text-[#1A1A1A]">
            Correo electrónico
          </label>
          <input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="tu@correo.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrorMsg('');
            }}
            disabled={state === 'loading'}
            className="h-12 bg-[#EBEBEB] border border-[#D9D6D2] rounded-xl px-4 font-raleway text-[14px] text-[#1A1A1A] placeholder:text-[#777777] focus:outline-none focus:border-[#35605A] disabled:opacity-60 transition-colors"
          />
          {errorMsg && (
            <span className="font-raleway text-[12px] text-[#C0392B] mt-0.5">{errorMsg}</span>
          )}
        </div>

        <button
          type="submit"
          disabled={state === 'loading'}
          className="h-12 bg-[#35605A] disabled:opacity-70 text-white font-raleway font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition-opacity"
        >
          {state === 'loading' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Enviando...
            </>
          ) : (
            'Enviar enlace de recuperación'
          )}
        </button>
      </form>

      <Link
        href="/app/login"
        className="font-raleway text-[13px] text-[#917961] text-center mt-4 self-center"
      >
        ← Volver al inicio de sesión
      </Link>
    </div>
  );
}
```

---

## 8. Email Enviado al Usuario

El email es enviado por **Supabase Auth via Brevo SMTP** — sin código adicional en Next.js.

**Template configurado en:** Supabase Dashboard → Authentication → Email Templates → Reset Password

```
Asunto: Monarca — Restablece tu contraseña

Cuerpo: Ver SPEC_EMAILS.md — Template: Reset Password
- CTA: "Restablecer contraseña" → redirecciona a /app/nueva-contrasena?token=...
- El enlace expira en 1 hora
- Remitente: no-reply@monarca.com.py (vía Brevo)
```

Ver detalle completo del HTML en `SPEC_EMAILS.md`.

---

## 9. Middleware

La ruta `/app/login/recuperar-contrasena` está **excluida** de la verificación de sesión y role en el middleware, igual que `/app/login` y `/app/nueva-contrasena`.

```ts
// src/middleware.ts — ya contemplado en SPEC_LOGIN.md
if (
  pathname.startsWith('/app') &&
  !pathname.startsWith('/app/login') &&         // ← cubre esta ruta
  !pathname.startsWith('/app/nueva-contrasena')
) { ... }
```

No se requieren cambios adicionales en el middleware.

---

## 10. Consideraciones de Seguridad

| # | Consideración |
|---|--------------|
| 1 | **No revelar existencia de email:** Siempre mostrar éxito, incluso si el email no existe en BD. |
| 2 | **Trimado de email:** Remover espacios antes de enviar (`email.trim()`). |
| 3 | **Rate limiting:** Supabase Auth limita intentos automáticamente. La UI maneja el mensaje correspondiente. |
| 4 | **No loguear el email** en logs del servidor por privacidad. |
| 5 | **Expiración del enlace:** 1 hora — configurado en Supabase Dashboard → Auth → Email OTP Expiry. |
| 6 | **Sin exposición de stack trace:** Errores de Supabase son convertidos a mensajes legibles. |

---

## 11. Componentes

| Componente | Tipo | Responsabilidad |
|-----------|------|----------------|
| `RecuperarContrasenaPage` | Server Component | Wrapper con metadata SEO |
| `RecuperarContrasenaForm` | **Client Component** | Formulario, estados idle/loading/success/error, llamada a Supabase |
| `MonarcaLogo` | Shared Component | Logo SVG de la marca |

---

## 12. Casos de Prueba

| Caso | Input | Resultado Esperado |
|------|-------|-------------------|
| Campo vacío + submit | email = "" | Error inline: "El correo es obligatorio." |
| Formato inválido | email = "noesuncorreo" | Error inline: "Ingresá un correo electrónico válido." |
| Email válido + existente | email = "ana@gmail.com" | Estado éxito, card con email mostrado |
| Email válido + no existente | email = "noexiste@test.com" | **También estado éxito** (por seguridad) |
| Rate limit alcanzado | N solicitudes seguidas | Error inline con mensaje de espera |
| Doble clic en botón | clic rápido × 2 | Solo 1 request (botón deshabilitado en loading) |
| Volver al login | clic en "← Volver" | Navega a `/app/login` |
