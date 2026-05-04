# CONVENTIONS.md
# Code Conventions — NEXT-MONARCA
# Mapped: 2026-05-04

## Paper-First UI Convention (MANDATORY)

**Every UI change requires a Paper artboard check before writing code.** This is the most important frontend convention in the project (CLAUDE.md §3.1).

### Workflow
1. Before writing any JSX/CSS, open the relevant artboard via `mcp__plugin_paper-desktop_paper__*` tools
2. Call `get_screenshot` to see the design, `get_jsx` for markup, `get_computed_styles` for exact values
3. Extract colors/spacing → convert to design system tokens (never hard-code)
4. If the screen doesn't exist in Paper yet → **stop and ask** before inventing layout

### Design System Token Sources

Two physical sources (both must be in sync):

| Source | Path | Use |
|--------|------|-----|
| Token spec | `docs/design-system/tokens.md` | Documentation reference |
| CSS variables | `design-system/css/design-system.css` | `--ds-color-*`, `--ds-radius-*`, etc. |
| Token JSON | `design-system/tokens.json` | Programmatic use |

App namespace: `--app-*` (PWA revendedora) | Admin namespace: `--admin-*`

### Modularidade obrigatória
- Antes de criar componente → buscar em `src/components/app/` e `src/components/admin/`
- Átomos genéricos (badge, pill, card) devem servir ≥ 2 telas antes de virar componente
- Novos padrões visuais vindos do Paper → registrar em `docs/sistema/SPEC_DESIGN_MODULES.md`

### Checklist obrigatório antes de commitar UI
1. Artboard correspondente conferido no Paper via MCP
2. Componentes existentes reaproveitados (ou justificativa no PR)
3. Zero hex/px mágicos no JSX — apenas tokens
4. SPEC da feature referencia o artboard Paper e lista componentes tocados

---

## Language Split

| Layer | Language | Reason |
|-------|---------|--------|
| UI strings | Spanish (Paraguayan) | End-user facing — revendedoras/admin speak Spanish |
| Code identifiers | English/Portuguese mixed | Historical — newer code tends toward English |
| Comments | Portuguese | Developer communication language |
| Documentation | Portuguese | docs/ folder |
| Route paths | Spanish/English mix | `/app/maleta`, `/app/nueva-contrasena`, `/admin/leads` |
| Error messages (BUSINESS:) | Spanish | User-facing error strings |

## TypeScript Patterns

**Strict mode** enabled. Key patterns:

```typescript
// ✓ Preferred: explicit return types on server actions
export async function registrarVenda(input: RegistrarVendaInput): Promise<ActionResult<Venda>> {}

// ✓ Preferred: imported Prisma types, not hand-written
import type { Reseller } from "@/generated/prisma/client";

// ✓ Preferred: Role type from user.ts (single source of truth)
import type { Role, CurrentUser } from "@/lib/user";

// ✓ Preferred: absolute imports via @/ alias
import { requireAuth } from "@/lib/user";
import { prisma } from "@/lib/prisma";
```

## Server Action Pattern

Every Server Action follows this guard sequence:

```typescript
"use server";

export async function someAction(input: SomeInput): Promise<ActionResult<SomeOutput>> {
    // 1. Auth guard — always first
    const user = await requireAuth(["ADMIN", "COLABORADORA"]);

    // 2. Input validation (Zod)
    const parsed = someSchema.safeParse(input);
    if (!parsed.success) {
        return { error: "BUSINESS: Datos inválidos." };
    }

    // 3. Ownership/scope check (when COLABORADORA accesses reseller data)
    await assertIsInGroup(resellerId, user.colaboradoraId!);
    // OR
    const scope = getResellerScope(user); // { resellerId } | null (ADMIN sees all)

    // 4. Business logic + Prisma
    const result = await prisma.someModel.create({ data: { ... } });

    // 5. Side effects (push, email, gamification) — after main operation
    await notificarRevendedora(resellerId, { ... });

    return { data: result };
}
```

## Error Handling

**BUSINESS: prefix** distinguishes user-facing errors from system errors:

```typescript
// User-facing error — shown in UI
throw new Error("BUSINESS: No tienes permiso para realizar esta acción.");

// System error — logged, generic message shown to user
throw new Error("Database connection failed"); // Not shown to user
```

Action utilities in `src/lib/action-utils.ts` handle the `ActionResult<T>` pattern:

```typescript
type ActionResult<T> = { data: T; error?: never } | { error: string; data?: never };
```

Client components check for `BUSINESS:` prefix to display the message directly:

```typescript
if (result.error?.startsWith("BUSINESS:")) {
    toast.error(result.error.replace("BUSINESS: ", ""));
}
```

## React Component Patterns

**Server-first**: pages are Server Components; interactive parts use `"use client"`.

```typescript
// Server Component (default)
export default async function MaletaPage({ params }: { params: { id: string } }) {
    const user = await requireAuth(["REVENDEDORA"]);
    const maleta = await getMaletaById(params.id);
    return <MaletaDetail maleta={maleta} />;
}

// Client Component — only when needed
"use client";
export function MaletaDetail({ maleta }: { maleta: Maleta }) {
    const [optimistic, setOptimistic] = useOptimistic(maleta);
    // ...
}
```

**Optimistic updates** used in push preferences and notification read status.

## CSS / Styling

Tailwind v4 with design system tokens. Key rules:

```typescript
// ✓ Always use design tokens
className="text-[var(--app-text-primary)] bg-[var(--app-surface)]"

// ✗ Never hard-code hex/px
className="text-[#1a1a2e] bg-[#f5f5f5]"

// ✓ cn() helper for conditional classes
import { cn } from "@/lib/utils";
className={cn("base-class", condition && "conditional-class")}
```

Token namespaces:
- `--app-*` — Revendedora PWA tokens
- `--admin-*` — Admin panel tokens

## Prisma Usage

**No nested transactions** (Prisma 7 + PrismaPg constraint):

```typescript
// ✓ Sequential with compensation
const maleta = await prisma.maleta.create({ data: { ... } });
try {
    await prisma.estoque.update({ ... });
} catch (e) {
    await prisma.maleta.delete({ where: { id: maleta.id } }); // compensate
    throw e;
}

// ✓ Batch transaction (array form)
await prisma.$transaction([
    prisma.maleta.update({ ... }),
    prisma.estoque.update({ ... }),
]);

// ✗ Never use nested async transaction (breaks with PrismaPg)
await prisma.$transaction(async (tx) => {
    await tx.maleta.update({ ... }); // DO NOT USE
});
```

**Encryption extension**: `prisma.ts` wraps the client with `withEncryptionExtension()` for AES-256-GCM at-rest encryption of sensitive fields (bank data, CPF/cédula).

## Immutable Business Rule

**Maleta snapshot values are immutable after creation**. `preco_fixado` on `MaletaItem` records the price at consignment creation and must NEVER be recalculated or overwritten after the maleta is created.

```typescript
// ✓ Always read price from DB snapshot
const item = await prisma.maletaItem.findFirst({ where: { id } });
const price = item.preco_fixado; // immutable snapshot

// ✗ Never recalculate from product price
const product = await prisma.product.findFirst({ ... });
const price = product.price; // could have changed
```

## Naming Conventions

| Item | Pattern | Example |
|------|---------|---------|
| Server Actions | verb + noun (camelCase) | `registrarVenda`, `criarMaleta` |
| React components | PascalCase | `AdminStatCard`, `MaletaItemRow` |
| Hooks | `use` prefix | `useTransitionRouter` |
| Lib utilities | camelCase noun | `maleta-helpers.ts` |
| DB operations | use Prisma model name | `prisma.maleta.findFirst` |
| Zod schemas | model name + `Schema` | `registrarVendaSchema` |
| Types | PascalCase | `CurrentUser`, `MaletaStatus` |

## Import Order

```typescript
// 1. React/Next.js
import { cache } from "react";
import { NextResponse } from "next/server";

// 2. External packages
import { createServerClient } from "@supabase/ssr";
import { z } from "zod";

// 3. Internal absolute imports (@/)
import { requireAuth } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import type { Maleta } from "@/generated/prisma/client";

// 4. Relative imports (rare)
import { formatCurrency } from "./format";
```

## Logging

PII must never appear in logs. Use sanitization helpers from `src/lib/data-protection/`:

```typescript
// ✓ Sanitize before logging
console.log("[Action] Processing reseller:", sanitize(user.email));

// ✗ Never log PII raw
console.log("[Action] User:", user.email, user.cpf);
```

---
*Mapped: 2026-05-04*
