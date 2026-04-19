# SPEC — Pantalla: Login y Autenticación

**Rutas:** `/app/login` · `/app/login/recuperar-contrasena` · `/app/nueva-contrasena`  
**Tipo:** Client Component (formulario) + Server Action (auth)

---

## Pantalla 1: Iniciar Sesión `/app/login`

### Layout

```
┌─────────────────────────────────────┐
│                                     │
│         [Logo Monarca]              │
│                                     │
│   ¡Bienvenida de vuelta! 💎         │
│   Accede al portal de revendedora   │
│                                     │
│   Correo electrónico                │
│   [____________________________]    │
│                                     │
│   Contraseña                        │
│   [__________________] [👁]         │
│                                     │
│   [Olvidé mi contraseña]            │
│                                     │
│   [     Ingresar     ]  ← primario  │
│                                     │
│   ────────────────────────────────  │
│   ¿Problemas? Habla con tu          │
│   consultora por WhatsApp           │
└─────────────────────────────────────┘
```

### Reglas de Negocio
1. Solo usuarios con `role = 'REVENDEDORA'` pueden acceder a `/app/*`
2. Si intenta acceder a `/app` sin sesión → redirige a `/app/login`
3. Tras login exitoso → redirige a `/app` (dashboard)
4. Correo y contraseña son obligatorios
5. Límite de 5 intentos fallidos → bloquear por 5 min (manejado por Supabase Auth)

### Flujo de Autenticación

```ts
// src/app/app/login/LoginForm.tsx — Client Component
'use client';

async function handleLogin(formData: FormData) {
  const email = formData.get('email') as string;
  const senha = formData.get('password') as string;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: senha,
  });

  if (error) {
    setError(traducirErrorSupabase(error.message));
    return;
  }

  // Verificar que es revendedora — crítico para seguridad RBAC
  const reseller = await getResellerByUserId(data.user.id);
  if (!reseller || reseller.role !== 'REVENDEDORA') {
    await supabase.auth.signOut();
    setError('Esta cuenta no está autorizada para este portal.');
    return;
  }

  router.push('/app');
}

// Traducción de errores de Supabase al Español
function traducirErrorSupabase(msg: string): string {
  const errores: Record<string, string> = {
    'Invalid login credentials': 'Correo o contraseña incorrectos.',
    'Email not confirmed':       'Confirma tu correo antes de ingresar.',
    'Too many requests':         'Demasiados intentos. Espera unos minutos.',
  };
  return errores[msg] ?? 'Error al ingresar. Intenta nuevamente.';
}
```

### Middleware de Protección de Rutas

```ts
// src/middleware.ts
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Proteger /app/* excepto /app/login y /app/nueva-contrasena
  if (
    pathname.startsWith('/app') &&
    !pathname.startsWith('/app/login') &&
    !pathname.startsWith('/app/nueva-contrasena')
  ) {
    const session = await getSession(request);

    if (!session) {
      return NextResponse.redirect(new URL('/app/login', request.url));
    }

    // CRITICO: verificar role — evita que admin/colaboradora acceda al portal
    const reseller = await getResellerByUserId(session.user.id);
    if (!reseller || reseller.role !== 'REVENDEDORA') {
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL('/app/login?error=unauthorized', request.url));
    }
  }

  // Redirigir /app/login si ya está logada como revendedora
  if (pathname === '/app/login') {
    const session = await getSession(request);
    if (session) {
      const reseller = await getResellerByUserId(session.user.id);
      if (reseller?.role === 'REVENDEDORA') {
        return NextResponse.redirect(new URL('/app', request.url));
      }
    }
  }
}

export const config = {
  matcher: ['/app/:path*'],
};
```

> **Separacion de middlewares:** El middleware de `/admin/*` (en `SPEC_ADMIN_LAYOUT.md`)
> verifica `role IN ('ADMIN', 'COLABORADORA')`. Ambos middlewares son excluyentes por diseño.
> Un administrador **no puede** acceder al portal de revendedoras y viceversa.

### Estados del Botón "Ingresar"
| Estado | Visual |
|--------|--------|
| Normal | Verde primario `#35605a` |
| Cargando | Spinner + "Ingresando..." (deshabilitado) |
| Error | Form permanece, mensaje en rojo debajo |

### Componentes
- `LoginPage` — Server Component (verifica si ya tiene sesión)
- `LoginForm` — **Client Component** (formulario + state de error + loading)
- `PasswordInput` — **Client Component** (campo con toggle ver/ocultar contraseña)

---

## Pantalla 2: Recuperar Contraseña `/app/login/recuperar-contrasena`

### Layout

```
┌─────────────────────────────────────┐
│  ←  Recuperar Contraseña            │
│                                     │
│   Ingresa tu correo y te enviaremos │
│   un enlace para restablecer tu     │
│   contraseña.                       │
│                                     │
│   Correo electrónico                │
│   [____________________________]    │
│                                     │
│   [  Enviar Enlace de Recuperación ]│
│                                     │
│   ── Después de hacer clic ──       │
│   Serás redirigido para crear       │
│   una nueva contraseña.             │
└─────────────────────────────────────┘

── Después del envío ──────────────────

┌─────────────────────────────────────┐
│           ✅ ¡Correo enviado!        │
│                                     │
│  Revisa tu bandeja de entrada       │
│  para: ana@gmail.com                │
│                                     │
│  [   Volver al Inicio de Sesión   ] │
└─────────────────────────────────────┘
```

### Flujo

```ts
const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/app/nueva-contrasena`,
});
```

---

## Pantalla 3: Nueva Contraseña `/app/nueva-contrasena`

> Esta pantalla recibe el token de recuperación que Supabase inserta en la URL hash.
> La ruta está EXCLUIDA de la verificación de role en el middleware.

### Layout

```
┌─────────────────────────────────────┐
│         [Logo Monarca]              │
│                                     │
│   🔐 Crear Nueva Contraseña        │
│                                     │
│   Nueva contraseña                  │
│   [________________________] [👁]   │
│                                     │
│   Confirmar contraseña              │
│   [________________________] [👁]   │
│                                     │
│   [   Guardar Nueva Contraseña   ]  │
└─────────────────────────────────────┘

── Después de guardar ────────────────

┌─────────────────────────────────────┐
│       ✅ ¡Contraseña actualizada!   │
│                                     │
│  Tu contraseña fue cambiada.        │
│                                     │
│  [   Ir al Inicio   ]               │
└─────────────────────────────────────┘
```

### Implementación

```ts
// src/app/app/nueva-contrasena/NuevaContrasenaForm.tsx
'use client';

async function handleNuevaContrasena(formData: FormData) {
  const password = formData.get('password') as string;
  const confirm  = formData.get('confirm') as string;

  if (password !== confirm) {
    setError('Las contraseñas no coinciden.');
    return;
  }
  if (password.length < 6) {
    setError('La contraseña debe tener al menos 6 caracteres.');
    return;
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    setError('Error al actualizar. El enlace puede haber vencido.');
    return;
  }

  setSuccess(true);
  // Redirigir al dashboard después de 2 segundos
  setTimeout(() => router.push('/app'), 2000);
}
```

> Supabase maneja la sesión via URL hash (`#access_token=...`).
> `supabase.auth.updateUser()` funciona automáticamente cuando el usuario accede
> desde el enlace del correo de recuperación.

### Componentes
- `NuevaContrasenaPage` — Server Component
- `NuevaContrasenaForm` — **Client Component** (formulario + validación + éxito animado)

---

## Integración con OneSignal (en el Login)

Tras login exitoso, vincular el player OneSignal al usuario:

```ts
// Ejecutado tras router.push('/app') — dentro del OneSignalProvider
OneSignal.login(session.user.id); // vincula device al ID de Supabase
```

Ver `SPEC_NOTIFICACOES.md` para detalles del OneSignal.

---

## Consideraciones de Seguridad
- Correo es **trimado** antes del envío (remover espacios accidentales)
- Contraseña nunca se loguea
- Token de sesión almacenado en `httpOnly cookie` (gestionado por Supabase SSR)
- Rate limiting de Supabase Auth garantiza protección contra brute-force
- **Verificación de role en middleware** previene acceso indebido al portal de revendedoras
