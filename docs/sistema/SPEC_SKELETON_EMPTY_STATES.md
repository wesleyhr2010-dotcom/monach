# SPEC — Skeletons, Empty States e Error States

## Objetivo
Padronizar o comportamento visual de todas as telas durante carregamento assíncrono, estado vazio e erro, com componentes reutilizáveis (`SkeletonCard`, `EmptyState`, `ErrorState`).

## Atores
- **Server Components** — envolvem queries em `<Suspense fallback={<Skeleton...>}>`.
- **Client Components** — usam `useTransition` para loading em ações.
- **Dev (Dex)** — reutiliza os componentes, nunca duplica markup de loading.
- **UX (Uma)** — aprova copy de cada empty/error state.

## Fluxo
1. Rota/componente entra em Suspense → mostra Skeleton adequado.
2. Dados chegam vazios → `EmptyState` com copy em espanhol + CTA quando cabível.
3. Fetch falha → `ErrorState` com mensagem e botão "Reintentar".
4. Mutação assíncrona → botão com `Spinner` e `aria-disabled`.

## Regras de negócio
- Toda listagem/dado async mostra skeleton — nunca tela branca.
- Empty state sempre sugere próximo passo quando há ação possível.
- Error state sempre oferece "Reintentar" ou "Volver".
- Nunca exibir empty state antes do skeleton terminar (evita flash).
- Acessibilidade: skeleton `role="status" aria-busy="true"`; evitar `aria-live` em skeleton.
- Copy em espanhol paraguaio, alinhado com `SPEC_ERROR_HANDLING.md`.

## Edge cases
- Lista com um único item → usar skeleton com 1 card, não 5.
- Erro recuperável (rede offline) → retry funciona; erro permanente → exibir `ErrorState` com `backHref`.
- Rota 404 em detalhe (`/app/maleta/[id]`) → redirect, não empty state.
- Dados seed garantidos (níveis, regras) → não precisam empty state.

## Dependências
- `SPEC_FRONTEND.md` — layouts por rota.
- `SPEC_ERROR_HANDLING.md` — mensagens de erro.
- `SPEC_DESIGN_MODULES.md` — tokens de cor e radius para skeletons.

---

## Detalhes técnicos / Referência

> Define o comportamento visual de todas as telas durante carregamento, estado vazio e erro.

---

## 1. Princípios

1. **Skeleton antes de dados** — Toda listagem/dado async exibe skeleton enquanto carrega
2. **Empty state com ação** — Estado vazio sempre sugere próximo passo
3. **Error state com retry** — Erro sempre oferece botão "Reintentar"
4. **Sem "flash" de vazio** — Nunca mostrar empty state antes do skeleton terminar

---

## 2. Componentes de Skeleton

### `SkeletonCard` — Card genérico

```tsx
// src/components/ui/skeleton-card.tsx
export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="rounded-lg border p-4 space-y-3 animate-pulse" role="status" aria-busy="true">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      {Array.from({ length: lines - 1 }).map((_, i) => (
        <div key={i} className="h-3 bg-gray-200 rounded w-full" />
      ))}
    </div>
  );
}
```

### `SkeletonList` — Lista de items

```tsx
export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Cargando...">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} lines={2} />
      ))}
    </div>
  );
}
```

### `SkeletonMetricDashboard` — Para `/app` (home)

```tsx
export function SkeletonMetricDashboard() {
  return (
    <div className="grid grid-cols-2 gap-3 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="rounded-xl bg-gray-100 p-4 h-24">
          <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
          <div className="h-6 bg-gray-300 rounded w-3/4" />
        </div>
      ))}
    </div>
  );
}
```

---

## 3. Tabela de Estados por Tela

### Portal da Revendedora

| Tela | Loading Skeleton | Empty State | Error State |
|------|-----------------|-------------|------------|
| `/app` (Home) | `SkeletonMetricDashboard` + 2x `SkeletonCard` | "Aún sin actividad. Tu primera consignación llegará pronto." (ícone 📦) | "Error al cargar tu resumen. [Reintentar]" |
| `/app/maleta` | `SkeletonList` (3 items) | "No tienes consignaciones activas en este momento." (ícone 📋, sem botão) | "Error al cargar tus consignaciones. [Reintentar]" |
| `/app/maleta/[id]` | `SkeletonCard` (header) + `SkeletonList` (itens) | N/A (404 se não encontrado) | "Error al cargar los detalles. [Volver]" |
| `/app/catalogo` | Grid 6x `SkeletonCard` | "El catálogo está vacío por el momento." (ícone 🛍️) | "Error al cargar el catálogo. [Reintentar]" |
| `/app/progreso` | `SkeletonCard` (nivel) + `SkeletonList` (tarefas) | N/A (regras sempre existem) | "Error al cargar tu progreso. [Reintentar]" |
| `/app/progreso/extrato` | `SkeletonList` (8 items) | "Aún no tienes movimientos de puntos." (ícone ⭐) | "Error al cargar el historial. [Reintentar]" |
| `/app/progreso/regalos` | Grid 4x `SkeletonCard` | "No hay regalos disponibles por el momento." (ícone 🎁) | "Error al cargar los regalos. [Reintentar]" |
| `/app/notificaciones` | `SkeletonList` (5 items) | "No tienes notificaciones nuevas." (ícone 🔔) | "Error al cargar notificaciones. [Reintentar]" |
| `/app/desempenho` | `SkeletonCard` (gráfico) + 3x `SkeletonCard` métricas | "Aún no hay datos de visitas en este período." | "Error al cargar estadísticas. [Reintentar]" |
| `/vitrina/[slug]` | Grid de produtos (skeleton) | "Esta vendedora aún no tiene productos activos." | "Error al cargar la vitrina. [Recargar página]" |

### Painel Admin

| Tela | Loading Skeleton | Empty State | Error State |
|------|-----------------|-------------|------------|
| `/admin/dashboard` | 6x `SkeletonCard` KPI + `SkeletonList` top 5 | N/A | "Error al cargar el dashboard." |
| `/admin/maletas` | Tabela com 5x `SkeletonCard` row | "No hay consignaciones para mostrar con los filtros actuales." | "Error al cargar las consignaciones. [Reintentar]" |
| `/admin/equipo` | `SkeletonList` (5) | "No hay revendedoras registradas aún." (ícone 👥, botão "Invitar revendedora") | "Error al cargar el equipo. [Reintentar]" |
| `/admin/productos` | Grid 6x `SkeletonCard` | "No hay productos registrados. [+ Agregar producto]" | "Error al cargar productos. [Reintentar]" |
| `/admin/gamificacion` | `SkeletonList` | N/A (seed garantido) | "Error al cargar las reglas." |
| `/admin/brindes` | `SkeletonList` | "No hay regalos en el catálogo. [+ Agregar regalo]" | "Error al cargar regalos." |

---

## 4. Componente `EmptyState` — Reutilizável

```tsx
// src/components/ui/empty-state.tsx
interface EmptyStateProps {
  icon: string;       // Emoji ou ícone Lucide
  title: string;
  description?: string;
  action?: { label: string; href?: string; onClick?: () => void };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-6">
      <span className="text-5xl mb-4" aria-hidden="true">{icon}</span>
      <h3 className="text-base font-semibold text-gray-900 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 max-w-xs">{description}</p>
      )}
      {action && (
        <div className="mt-4">
          {action.href ? (
            <Link href={action.href} className="btn-primary">{action.label}</Link>
          ) : (
            <button onClick={action.onClick} className="btn-primary">{action.label}</button>
          )}
        </div>
      )}
    </div>
  );
}
```

---

## 5. Componente `ErrorState` — Com Retry

```tsx
// src/components/ui/error-state.tsx
interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  backHref?: string;
}

export function ErrorState({
  message = 'Ocurrió un error inesperado.',
  onRetry,
  backHref,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center px-6">
      <span className="text-4xl mb-3" aria-hidden="true">⚠️</span>
      <p className="text-sm text-gray-600 mb-4">{message}</p>
      <div className="flex gap-3">
        {onRetry && (
          <button onClick={onRetry} className="btn-secondary">
            Reintentar
          </button>
        )}
        {backHref && (
          <Link href={backHref} className="btn-ghost">
            Volver
          </Link>
        )}
      </div>
    </div>
  );
}
```

---

## 6. Padrão de Uso em Server Components

```tsx
// src/app/app/maleta/page.tsx
import { Suspense } from 'react';
import { SkeletonList } from '@/components/ui/skeleton-list';
import { MaletaList } from './maleta-list';

export default function MaletaPage() {
  return (
    <div>
      <h1>Mis Consignaciones</h1>
      <Suspense fallback={<SkeletonList count={3} />}>
        <MaletaList />   {/* Server Component com fetch de dados */}
      </Suspense>
    </div>
  );
}
```

---

## 7. Acessibilidade

- Skeletons: `role="status"` + `aria-busy="true"` + `aria-label="Cargando..."`
- Empty states: `role="status"` + texto descritivo
- Quando dados carregam: remover `aria-busy` ou substituir pelo conteúdo real
- Não usar `aria-live` em skeletons (gera spam para screen readers)

---

## 8. Exemplo de Loading em Client Component (com `useTransition`)

```tsx
'use client';

export function RegistrarVentaButton({ maletaItemId }: { maletaItemId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => registrarVenda(maletaItemId))}
      disabled={isPending}
      aria-disabled={isPending}
    >
      {isPending ? (
        <span className="flex items-center gap-2">
          <Spinner className="h-4 w-4" aria-hidden="true" />
          Registrando...
        </span>
      ) : 'Registrar Venta'}
    </button>
  );
}
```
