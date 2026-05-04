# TESTING.md
# Testing Patterns — NEXT-MONARCA
# Mapped: 2026-05-04

## Framework

**Vitest** — configured for Next.js/TypeScript environment.

Config: inferred from `package.json` (check `vitest.config.ts` if present).

Run tests:
```bash
npm test
# or
npx vitest run
```

## Test Structure

```
src/__tests__/
├── app/
│   ├── maleta-actions.test.ts         # Server Action unit tests (maleta flow)
│   ├── notificacoes-preferences.test.ts # Push preferences actions
│   └── transitions/                   # View transition utility tests
│       ├── setVtPattern.test.ts
│       ├── startViewTransition.test.ts
│       ├── useTransitionRouter.test.ts
│       └── isModalRoute.test.ts
├── security/
│   └── rbac-regression.test.ts        # Security regression suite (11 tests)
├── validators/
│   ├── product.schema.test.ts
│   ├── equipe.schema.test.ts
│   └── maleta.schema.test.ts
└── api/
    # API route tests
```

## Mocking Strategy

Tests mock external dependencies at module boundaries:

```typescript
// Mock auth layer
vi.mock("@/lib/user", async (importOriginal) => {
    const mod = await importOriginal<typeof import("@/lib/user")>();
    return {
        ...mod,
        getCurrentUser: vi.fn(),
        requireAuth: vi.fn(),
    };
});

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
    prisma: {
        maleta: {
            findFirst: vi.fn(),
            update: vi.fn(),
        },
        reseller: {
            findMany: vi.fn(),
        },
    },
}));

// In test: set up specific behavior
const mockedRequireAuth = vi.mocked(requireAuth);
mockedRequireAuth.mockResolvedValue({ role: "REVENDEDORA", ... } as CurrentUser);
```

## Security Regression Tests

`src/__tests__/security/rbac-regression.test.ts` — 11 tests, always must pass.

Covers:
- Server Actions throw BUSINESS error when no session
- COLABORADORA cannot access resellers outside her group
- `getCurrentUser()` returns null when no profile in DB
- Ownership checks on maleta operations

These tests are non-negotiable. If any fail, stop and fix before merging.

## Validator Tests

Zod schema tests use property-based approach:

```typescript
// Valid input passes
expect(registrarVendaSchema.safeParse(validInput).success).toBe(true);

// Invalid input fails with specific message
const result = registrarVendaSchema.safeParse({ quantidade: -1 });
expect(result.success).toBe(false);
expect(result.error?.issues[0].message).toContain("mínimo");
```

## Transition Tests

View transition utilities in `src/__tests__/app/transitions/` test pure functions:
- `setVtPattern()` — pattern matching for route transitions
- `isModalRoute()` — modal route detection
- `startViewTransition()` — animation trigger wrapper
- `useTransitionRouter()` — hook behavior

## Coverage Gaps

Current test coverage is **minimal** — most pages and components lack tests.

Priority areas to add:
1. Server Actions (especially mutating actions — `registrarVenda`, `criarMaleta`)
2. E2E golden paths (Playwright — planned, not yet implemented)
3. Component tests for complex UI (maleta wizard, gamification UI)
4. API route tests (auth callback, proxy-image, admin alertas)

## Planned Testing

From `docs/next_steps.md` (pending):
- **Testes E2E com Playwright** — golden paths: login → maleta → venda → devolução
- Tests for cron integration with `NotificacaoTemplate`

## Running Lint + Types

Always run before marking work complete:

```bash
npm run lint      # ESLint with Next.js + TypeScript config
npm run typecheck # tsc --noEmit (or equivalent)
npm test          # Vitest
```

---
*Mapped: 2026-05-04*
