# SPEC — Error Handling & Mensagens de Erro

## Objetivo
Padronizar o formato de erros em toda a stack (Server Actions, Route Handlers e UI), garantindo que mensagens em espanhol paraguaio cheguem consistentes ao usuário final sem vazar stack traces.

## Atores
- **Server Actions / Route Handlers** — devolvem `ActionResult<T>` sempre.
- **UI (Client Components)** — exibe `toast` ou erros inline no formulário.
- **Dev (Dex)** — nunca inventa mensagens; consulta o catálogo aqui.
- **QA (Quinn)** — valida que cada cenário de erro usa a mensagem correta.

## Fluxo
1. Action executa lógica; em falha, chama `mapError(error)`.
2. `mapError` identifica erros de negócio (prefixo `BUSINESS:`), Prisma (`P2002`, `P2025`) ou desconhecidos.
3. Retorna `{ success: false, error, code }` — nunca expõe stack ao cliente.
4. UI consome `result.error` e exibe via `sonner` (toast) ou inline em campo Zod.
5. Logs detalhados ficam em Sentry (`SPEC_LOGGING_MONITORING.md`).

## Regras de negócio
- Todas as mensagens ao usuário em espanhol paraguaio.
- Nunca lançar exceção raw — encapsular em `ActionResult`.
- `ErrorCode` é enum fechado: `UNAUTHORIZED | FORBIDDEN | NOT_FOUND | CONFLICT | INSUFFICIENT_STOCK | INSUFFICIENT_POINTS | VALIDATION_ERROR | RATE_LIMITED | EXTERNAL_SERVICE_ERROR | UNKNOWN`.
- Toast de sucesso: 3s; erro de negócio: 5s; erro crítico: 7s.
- Validações Zod usam `z.setErrorMap` com mensagens em espanhol.

## Edge cases
- Erro Prisma sem mapeamento específico → cai no fallback `UNKNOWN`.
- Erro do Supabase Auth com código desconhecido → mensagem genérica e log no Sentry.
- Falha de rede durante upload → `EXTERNAL_SERVICE_ERROR`, sugerir retry.
- Lock pessimista de estoque expirado → `CONFLICT` com mensagem para tentar de novo.

## Dependências
- `SPEC_BACKEND.md` — Server Actions que consomem `ActionResult`.
- `SPEC_LOGGING_MONITORING.md` — envio de erros ao Sentry.
- `SPEC_SKELETON_EMPTY_STATES.md` — empty/error states por tela.
- `SPEC_SECURITY_API_ENDPOINTS.md` — rate limiting e códigos de erro.

---

## Detalhes técnicos / Referência

> **Escopo:** Padrão unificado de erros para Server Actions, Route Handlers e UI.
> Todos os módulos devem seguir este padrão em vez de definir mensagens ad-hoc.

---

## 1. Formato de Resposta Padrão

Todas as Server Actions retornam o tipo `ActionResult<T>`:

```ts
// src/lib/types/action-result.ts
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; code?: ErrorCode };

export type ErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'INSUFFICIENT_STOCK'
  | 'INSUFFICIENT_POINTS'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMITED'
  | 'EXTERNAL_SERVICE_ERROR'
  | 'UNKNOWN';
```

### Uso em Server Actions

```ts
// CORRETO
export async function createMaleta(input: CreateMaletaInput): Promise<ActionResult<Maleta>> {
  try {
    // ... lógica
    return { success: true, data: maleta };
  } catch (error) {
    return mapError(error);
  }
}

// ERRADO — nunca lançar exceção raw para o cliente
export async function createMaleta(input: CreateMaletaInput) {
  // throw new Error('Estoque insuficiente');  ← expõe stack trace
}
```

---

## 2. Catálogo de Erros por Módulo

### 2.1 Autenticação (`/app/login`)

| Situação | Mensagem em Espanhol | Código |
|---------|---------------------|--------|
| Email não existe | "No existe una cuenta con este correo electrónico." | `NOT_FOUND` |
| Senha incorreta | "Contraseña incorrecta. Verifica e intenta nuevamente." | `UNAUTHORIZED` |
| Email não confirmado | "Confirma tu correo electrónico para poder ingresar." | `UNAUTHORIZED` |
| Muitas tentativas | "Demasiados intentos fallidos. Espera 15 minutos." | `RATE_LIMITED` |
| Link de reset expirado | "El enlace de recuperación expiró. Solicita uno nuevo." | `UNAUTHORIZED` |
| Usuário inativo | "Tu cuenta fue desactivada. Contacta a tu consultora." | `FORBIDDEN` |

### 2.2 Maletas (`createMaleta`, `closeMaleta`, `registrarVenda`)

| Situação | Mensagem | Código |
|---------|---------|--------|
| Revendedora já tem maleta ativa | "Ya tienes una consignación activa. Ciérrala antes de abrir una nueva." | `CONFLICT` |
| Estoque insuficiente | "Stock insuficiente para {variante}. Disponible: {qtd}." | `INSUFFICIENT_STOCK` |
| Maleta não encontrada | "Consignación no encontrada o ya fue cerrada." | `NOT_FOUND` |
| Quantidade vendida > enviada | "La cantidad vendida ({qtd}) supera la enviada ({max})." | `VALIDATION_ERROR` |
| Maleta não pertence à revendedora | "No tienes permiso para acceder a esta consignación." | `FORBIDDEN` |
| Maleta já concluída | "Esta consignación ya fue cerrada y no puede modificarse." | `CONFLICT` |
| Timeout do lock de estoque | "El sistema está ocupado. Intenta nuevamente en unos segundos." | `CONFLICT` |

### 2.3 Gamificação (`awardPoints`, `resgateResgate`)

| Situação | Mensagem | Código |
|---------|---------|--------|
| Saldo insuficiente para resgate | "No tienes suficientes puntos. Necesitas {necessario}, tienes {atual}." | `INSUFFICIENT_POINTS` |
| Brinde sem estoque | "Este regalo está agotado. Elige otro." | `INSUFFICIENT_STOCK` |
| Brinde inativo | "Este regalo ya no está disponible." | `NOT_FOUND` |
| Limite diário atingido | "Ya alcanzaste el límite de puntos por este tipo de acción hoy." | `CONFLICT` |
| Regra tipo `unico` já disparada | "Este logro ya fue completado anteriormente." | `CONFLICT` |

### 2.4 Upload de Arquivos (`/api/upload-r2`)

| Situação | Mensagem | Código |
|---------|---------|--------|
| Tipo de arquivo inválido | "Solo se permiten: JPEG, PNG, WEBP, HEIC, PDF." | `VALIDATION_ERROR` |
| Arquivo muito grande | "El archivo supera el límite de {limite}MB." | `VALIDATION_ERROR` |
| Falha no upload R2 | "Error al subir el archivo. Intenta nuevamente." | `EXTERNAL_SERVICE_ERROR` |
| Conteúdo inválido (magic bytes) | "El archivo no corresponde al tipo declarado." | `VALIDATION_ERROR` |

### 2.5 Perfil e Documentos

| Situação | Mensagem | Código |
|---------|---------|--------|
| Documento já aprovado | "Este documento ya fue aprobado y no puede reemplazarse." | `CONFLICT` |
| CI/RUC duplicado | "Este número de documento ya está registrado." | `CONFLICT` |
| Dados bancários inválidos | "Verifica los datos bancarios ingresados." | `VALIDATION_ERROR` |
| Email já em uso | "Este correo ya está registrado en otra cuenta." | `CONFLICT` |

### 2.6 Brindes — Admin

| Situação | Mensagem | Código |
|---------|---------|--------|
| Brinde com solicitações pendentes | "No puedes eliminar un regalo con solicitudes pendientes." | `CONFLICT` |
| Estoque negativo | "El stock no puede ser negativo." | `VALIDATION_ERROR` |

---

## 3. Mapeamento de Erros Supabase → Espanhol

```ts
// src/lib/errors/supabase-error-map.ts
export function mapSupabaseAuthError(code: string): string {
  const map: Record<string, string> = {
    'invalid_credentials':      'Correo o contraseña incorrectos.',
    'email_not_confirmed':      'Confirma tu correo electrónico para continuar.',
    'user_not_found':           'No existe una cuenta con este correo.',
    'over_email_send_rate_limit': 'Espera un momento antes de solicitar otro correo.',
    'same_password':            'La nueva contraseña debe ser diferente a la actual.',
    'weak_password':            'La contraseña debe tener al menos 8 caracteres.',
    'user_already_exists':      'Ya existe una cuenta con este correo.',
  };
  return map[code] ?? 'Ocurrió un error inesperado. Intenta nuevamente.';
}
```

---

## 4. Função Helper: `mapError`

```ts
// src/lib/errors/map-error.ts
import type { ActionResult } from '@/lib/types/action-result';

export function mapError(error: unknown): ActionResult<never> {
  if (error instanceof Error) {
    // Erros de negócio esperados (thrown com mensagem legível)
    if (error.message.startsWith('BUSINESS:')) {
      return { success: false, error: error.message.replace('BUSINESS:', '').trim() };
    }
    // Erros Prisma
    if (error.message.includes('P2002')) {
      return { success: false, error: 'Este registro ya existe.', code: 'CONFLICT' };
    }
    if (error.message.includes('P2025')) {
      return { success: false, error: 'Registro no encontrado.', code: 'NOT_FOUND' };
    }
  }

  // Fallback: nunca expor stack trace ao cliente
  console.error('[mapError]', error);
  return { success: false, error: 'Ocurrió un error inesperado.', code: 'UNKNOWN' };
}
```

---

## 5. Toast Notifications (UI)

Usar `sonner` (já instalado no projeto) com padrão:

```ts
// Sucesso
toast.success('Consignación creada exitosamente.');

// Erro de negócio
toast.error(result.error);  // Mensagem já está em espanhol

// Erro de validação Zod
toast.error('Verifica los campos marcados en rojo.');

// Erro desconhecido
toast.error('Algo salió mal. Intenta nuevamente o contacta soporte.');
```

### Duração por Severidade

| Tipo | Duração (ms) |
|------|-------------|
| Sucesso | 3000 |
| Informativo | 4000 |
| Erro de negócio | 5000 |
| Erro crítico | 7000 |

---

## 6. Empty States e Error States por Tela

| Tela | Empty State | Error State |
|------|-------------|-------------|
| `/app` (Home) | "Aún no tienes actividad. ¡Tu primera consignación llegará pronto!" | "Error al cargar tu dashboard. [Reintentar]" |
| `/app/maleta` | "No tienes consignaciones activas." | "Error al cargar consignaciones. [Reintentar]" |
| `/app/catalogo` | "El catálogo está vacío por el momento." | "Error al cargar el catálogo. [Reintentar]" |
| `/app/progreso` | "Aún no tienes puntos. ¡Completa tu perfil para comenzar!" | "Error al cargar tu progreso." |
| `/app/progreso/extrato` | "Sin movimientos de puntos aún." | "Error al cargar el historial." |
| `/app/progreso/regalos` | "No hay regalos disponibles en este momento." | "Error al cargar regalos." |
| `/app/notificaciones` | "No tienes notificaciones nuevas." | "Error al cargar notificaciones." |
| `/admin/maletas` | "No hay consignaciones para mostrar." | "Error al cargar consignaciones." |
| `/admin/equipo` | "No hay revendedoras registradas." | "Error al cargar el equipo." |

---

## 7. Formulário: Validação Client-side com Zod + React Hook Form

Exibir erros inline sob cada campo (não só toast):

```tsx
// Padrão para mensagens de campo
{errors.email && (
  <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
)}
```

### Mensagens de Validação Padrão Zod (em espanhol)

```ts
z.setErrorMap((issue, ctx) => {
  switch (issue.code) {
    case 'too_small':
      return { message: `Mínimo ${issue.minimum} caracteres.` };
    case 'too_big':
      return { message: `Máximo ${issue.maximum} caracteres.` };
    case 'invalid_type':
      if (issue.received === 'undefined') return { message: 'Este campo es obligatorio.' };
      return { message: 'Valor inválido.' };
    case 'invalid_string':
      if (issue.validation === 'email') return { message: 'Correo electrónico inválido.' };
      if (issue.validation === 'url') return { message: 'URL inválida.' };
      return { message: 'Formato inválido.' };
    default:
      return { message: ctx.defaultError };
  }
});
```
