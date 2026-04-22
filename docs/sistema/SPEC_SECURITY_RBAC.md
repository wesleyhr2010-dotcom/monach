# SPEC — RBAC, Autorização e Prevenção de IDOR

## Objetivo
Definir a matriz de permissões por role (`REVENDEDORA`, `COLABORADORA`, `ADMIN`), o guard obrigatório de Server Actions e as RLS policies do Supabase como camada defensiva.

## Atores
- **Middleware Next.js** — verifica sessão e role antes de rotas `/admin/*` e `/app/*`.
- **Server Actions** — usam `requireAuth([roles])` + owner check.
- **Supabase RLS** — segunda camada caso service_role seja bypassado.
- **Admin/Consultora/Revendedora** — usuários finais com escopo distinto.

## Fluxo
1. Request chega → middleware consulta sessão Supabase.
2. Se rota `/admin`, valida role no banco (não apenas token).
3. Action executa `requireAuth([...roles])` → throw `BUSINESS: ...` em caso de falha.
4. Queries usam `getResellerScope(caller)` e ownership check no `WHERE`.
5. RLS bloqueia leituras diretas via `anon_key` quando service_role não é usado.

## Regras de negócio
- Roles válidos: `REVENDEDORA`, `COLABORADORA`, `ADMIN` — nunca "SUPER_ADMIN".
- `COLABORADORA` só vê revendedoras com `manager_id = caller.id`.
- Nunca buscar recurso por `id` sem incluir `reseller_id`/`manager_id` no WHERE (prevenir IDOR).
- `requireAuth` recusa usuário inativo (`ativo=false`).
- Server Actions usam `SUPABASE_SERVICE_ROLE_KEY` (bypassa RLS); browser usa `anon_key` (protegido por RLS).

## Edge cases
- Usuário ADMIN faz login e acessa `/app` → permitido (visibilidade total).
- `COLABORADORA` tenta criar maleta para revendedora fora do grupo → `assertIsInGroup` bloqueia.
- Revendedora inativa com sessão ativa → middleware redireciona; Action lança BUSINESS.
- RLS policy quebra Supabase Studio → policies devem permitir service_role automaticamente.

## Dependências
- `SPEC_BACKEND.md` — padrão de Server Actions.
- `SPEC_DATABASE.md` — campos `role`, `manager_id`, `ativo`.
- `SPEC_ERROR_HANDLING.md` — códigos `UNAUTHORIZED`, `FORBIDDEN`.
- `SPEC_SECURITY_API_ENDPOINTS.md` — rate limiting complementar.
- `SPEC_SECURITY_DATA_PROTECTION.md` — PII/documentos com ownership.

---

## Detalhes técnicos / Referência

> Define a matriz de permissões por role, o padrão de guard em Server Actions e as RLS policies do Supabase.

---

## 1. Roles do Sistema

| Role | Nome UI | Descrição |
|------|---------|-----------|
| `REVENDEDORA` | Revendedora | Acesso somente aos próprios dados |
| `COLABORADORA` | Consultora | Acesso ao próprio perfil + suas revendedoras |
| `ADMIN` | Administrador | Acesso irrestrito a tudo |

> **Padronização:** O campo `role` no schema usa EXATAMENTE estes valores em maiúsculas.
> Remover qualquer referência a "SUPER_ADMIN" — o sistema usa apenas "ADMIN".

---

## 2. Matriz de Permissões por Rota

### Portal da Revendedora (`/app/*`)

| Rota | REVENDEDORA | COLABORADORA | ADMIN |
|------|-------------|--------------|-------|
| `/app` | ✅ (apenas dados próprios) | ✅ | ✅ |
| `/app/maleta` | ✅ (apenas suas maletas) | ✅ (suas maletas como revendedora) | ✅ |
| `/app/maleta/[id]` | ✅ (se owner) | ✅ (se owner) | ✅ |
| `/app/catalogo` | ✅ | ✅ | ✅ |
| `/app/progreso` | ✅ (apenas seus pontos) | ✅ | ✅ |
| `/app/perfil` | ✅ (apenas seu perfil) | ✅ | ✅ |
| `/app/notificaciones` | ✅ | ✅ | ✅ |
| `/app/desempenho` | ✅ (apenas seus analytics) | ✅ | ✅ |
| `/app/bienvenida` | ✅ | ✅ | ✅ |

### Painel Admin (`/admin/*`)

| Rota | REVENDEDORA | COLABORADORA | ADMIN |
|------|-------------|--------------|-------|
| `/admin/*` (qualquer) | ❌ Redirect `/app` | ✅ (com restrições) | ✅ |
| `/admin/dashboard` | ❌ | ✅ (apenas seu grupo) | ✅ (global) |
| `/admin/maletas` | ❌ | ✅ (apenas seu grupo) | ✅ (global) |
| `/admin/maletas/nueva` | ❌ | ✅ (para suas revendedoras) | ✅ |
| `/admin/equipo` | ❌ | ✅ (apenas suas revendedoras) | ✅ (global) |
| `/admin/equipo/consultoras` | ❌ | ❌ | ✅ (exclusivo ADMIN) |
| `/admin/productos` | ❌ | ❌ | ✅ |
| `/admin/gamificacion` | ❌ | ❌ | ✅ |
| `/admin/brindes` | ❌ | ❌ | ✅ |
| `/admin/commission-tiers` | ❌ | ❌ | ✅ |
| `/admin/contratos` | ❌ | ❌ | ✅ |
| `/admin/documentos` | ❌ | ✅ (apenas suas revendedoras) | ✅ |
| `/admin/perfil` | ❌ | ✅ (apenas seu perfil consultora) | ✅ |

---

## 3. Middleware de Autenticação

```ts
// src/middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const supabase = createServerClient(/* ... */);
  const { data: { session } } = await supabase.auth.getSession();

  // Rotas protegidas que requerem login
  if (pathname.startsWith('/app') || pathname.startsWith('/admin')) {
    if (!session) {
      return NextResponse.redirect(new URL('/app/login', request.url));
    }
  }

  // Admin: verificar role no banco (não confiar só no token)
  if (pathname.startsWith('/admin')) {
    const reseller = await getResellerByAuthId(session.user.id);
    if (!reseller || !['ADMIN', 'COLABORADORA'].includes(reseller.role)) {
      return NextResponse.redirect(new URL('/app', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/app/:path*', '/admin/:path*'],
};
```

---

## 4. Guard de Server Actions — Padrão Obrigatório

**TODA Server Action que acessa dados de usuário DEVE usar o guard:**

```ts
// src/lib/auth/action-guard.ts
import { getServerSession } from '@/lib/auth/get-server-session';
import type { Reseller } from '@prisma/client';

type AllowedRole = 'REVENDEDORA' | 'COLABORADORA' | 'ADMIN';

export async function requireAuth(allowedRoles?: AllowedRole[]): Promise<Reseller> {
  const session = await getServerSession();
  if (!session) throw new Error('BUSINESS: Sesión no válida. Inicia sesión nuevamente.');

  const reseller = await prisma.reseller.findUnique({
    where: { auth_user_id: session.user.id },
  });

  if (!reseller || !reseller.ativo) {
    throw new Error('BUSINESS: Tu cuenta no está activa. Contacta a tu consultora.');
  }

  if (allowedRoles && !allowedRoles.includes(reseller.role as AllowedRole)) {
    throw new Error('BUSINESS: No tienes permiso para realizar esta acción.');
  }

  return reseller;
}
```

### Uso em Server Actions

```ts
// Qualquer revendedora logada pode chamar
export async function getMyMaletas() {
  const reseller = await requireAuth();
  return prisma.maleta.findMany({ where: { reseller_id: reseller.id } });
}

// Apenas ADMIN e COLABORADORA
export async function createMaleta(input: CreateMaletaInput) {
  const caller = await requireAuth(['ADMIN', 'COLABORADORA']);
  // Verificar se COLABORADORA só cria para suas revendedoras
  if (caller.role === 'COLABORADORA') {
    await assertIsInGroup(input.reseller_id, caller.id);
  }
  // ...
}

// Apenas ADMIN
export async function deleteProduct(productId: string) {
  await requireAuth(['ADMIN']);
  // ...
}
```

---

## 5. Prevenção de IDOR

**Regra:** NUNCA buscar um recurso pelo `id` passado no input sem verificar ownership.

```ts
// VULNERÁVEL ❌ — qualquer revendedora pode ler maleta de outra
export async function getMaleta(maletaId: string) {
  const session = await requireAuth();
  return prisma.maleta.findUnique({ where: { id: maletaId } });  // ← IDOR!
}

// CORRETO ✅ — owner check no WHERE
export async function getMaleta(maletaId: string) {
  const reseller = await requireAuth();
  const maleta = await prisma.maleta.findFirst({
    where: {
      id: maletaId,
      reseller_id: reseller.id,  // ← só retorna se for desta revendedora
    },
  });
  if (!maleta) throw new Error('BUSINESS: Consignación no encontrada.');
  return maleta;
}
```

### Helper: Verificar Grupo da COLABORADORA

```ts
// src/lib/auth/assert-in-group.ts
export async function assertIsInGroup(resellerId: string, colaboradoraId: string) {
  const reseller = await prisma.reseller.findFirst({
    where: {
      id: resellerId,
      manager_id: colaboradoraId,  // deve pertencer ao grupo da colaboradora
    },
  });
  if (!reseller) {
    throw new Error('BUSINESS: Esta revendedora no pertenece a tu equipo.');
  }
}
```

### Helper: Admin Scope (GET com filtro por grupo)

```ts
// src/lib/auth/get-reseller-scope.ts
export function getResellerScope(caller: Reseller) {
  if (caller.role === 'ADMIN') {
    return {};  // Sem filtro — vê tudo
  }
  if (caller.role === 'COLABORADORA') {
    return { manager_id: caller.id };  // Apenas suas revendedoras
  }
  return { id: caller.id };  // Apenas ela mesma
}

// Uso:
const scope = getResellerScope(caller);
const maletas = await prisma.maleta.findMany({
  where: {
    ...scope,  // Aplica filtro automaticamente
    status: 'ativa',
  },
});
```

---

## 6. Row-Level Security (RLS) — Supabase

RLS como segunda camada de defesa (caso o middleware seja bypassado):

```sql
-- Habilitar RLS em todas as tabelas sensíveis
ALTER TABLE resellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE maletas ENABLE ROW LEVEL SECURITY;
ALTER TABLE maleta_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pontos_extrato ENABLE ROW LEVEL SECURITY;
ALTER TABLE reseller_documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE dados_bancarios ENABLE ROW LEVEL SECURITY;

-- POLICY: Revendedora vê apenas seu próprio perfil
CREATE POLICY "reseller_vê_proprio_perfil"
ON resellers FOR SELECT
USING (auth.uid() = auth_user_id);

-- POLICY: Colaboradora vê suas revendedoras + si mesma
CREATE POLICY "colaboradora_ve_grupo"
ON resellers FOR SELECT
USING (
  auth.uid() = auth_user_id
  OR EXISTS (
    SELECT 1 FROM resellers r2
    WHERE r2.auth_user_id = auth.uid()
    AND resellers.manager_id = r2.id
  )
);

-- POLICY: Revendedora vê apenas suas maletas
CREATE POLICY "reseller_ve_proprias_maletas"
ON maletas FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM resellers r
    WHERE r.id = maletas.reseller_id
    AND r.auth_user_id = auth.uid()
  )
);

-- POLICY: Service role bypassa todas as RLS (para Server Actions)
-- (Supabase service_role automaticamente bypassa RLS)
```

> **Nota:** Server Actions usam o `SUPABASE_SERVICE_ROLE_KEY` que bypassa RLS.
> RLS protege acesso direto via `anon_key` (browser) e Supabase Studio.

---

## 7. Checklist de Segurança por Feature

Ao implementar qualquer nova Server Action:

```
[ ] Chamada requireAuth() no início da função — OBRIGATÓRIA, sem exceções
[ ] Role check se necessário (allowedRoles)
[ ] Owner check no WHERE das queries (nunca buscar só por id)
[ ] COLABORADORA verificada com assertIsInGroup() quando aplicável — inclui actions de /app
[ ] Quando operação recebe ID de recurso filho (ex: maleta_item_id), verificar pertinência ao recurso pai (maleta_id) na mesma query
[ ] Valores financeiros NUNCA vêm do input do cliente — sempre do banco (preco_fixado, taxa_comissao, etc.)
[ ] Retorno usando ActionResult (nunca throw direto para o cliente)
[ ] Dados sensíveis NÃO incluídos no select (whatsapp, email, dados_bancarios, documentos) a menos que requeridos e autorizados
[ ] Input validado com Zod antes de qualquer operação
[ ] Mutation actions usam operações incrementais (increment/decrement) em vez de SET absoluto quando representam contadores/somas
```

---

## 8. Padrões Obrigatórios — Anti-Patterns Proibidos

Seção defensiva gerada a partir da auditoria de 2026-04-22. Qualquer código que contenha um destes padrões deve ser rejeitado em review.

### 8.1 Server Action sem `requireAuth` — PROIBIDO

```ts
// ❌ PROIBIDO — qualquer caller não autenticado executa
"use server";
export async function devolverMaleta(id: string, comprovanteUrl: string) {
    await prisma.maleta.update({ where: { id }, data: { status: "aguardando_revisao", comprovante_devolucao_url: comprovanteUrl } });
    return { success: true };
}

// ✅ OBRIGATÓRIO — guard + ownership
export async function devolverMaleta(id: string, comprovanteUrl: string) {
    const user = await requireAuth(["REVENDEDORA"]);
    const maleta = await prisma.maleta.findFirst({
        where: { id, reseller_id: user.profileId! },
    });
    if (!maleta) return { success: false, error: "Consignación no encontrada." };
    await prisma.maleta.update({ where: { id: maleta.id }, data: { ... } });
    return { success: true };
}
```

**Regra:** Toda função exportada em um arquivo com `"use server"` é um endpoint HTTP. Não existe "helper interno" em arquivo de action — se precisar de helper privado, crie um arquivo separado sem `"use server"`.

### 8.2 Update de filho por ID sem verificar pai — PROIBIDO

```ts
// ❌ PROIBIDO — atacante passa maleta_item_id de outra maleta
for (const item of itensVendidos) {
    await prisma.maletaItem.update({
        where: { id: item.maleta_item_id },
        data: { quantidade_vendida: item.quantidade_vendida },
    });
}

// ✅ OBRIGATÓRIO — verificar pertinência
const items = await prisma.maletaItem.findMany({
    where: { id: { in: itensVendidos.map(i => i.maleta_item_id) }, maleta_id: maleta.id },
});
if (items.length !== itensVendidos.length) throw new Error("BUSINESS: Ítem no pertenece a esta consignación.");
```

### 8.3 SET absoluto em contadores vindos do cliente — PROIBIDO

```ts
// ❌ PROIBIDO — atacante inflaciona quantidade vendida
data: { quantidade_vendida: input.quantidade_vendida }

// ✅ OBRIGATÓRIO — incremento atômico com lock pessimista
await tx.$executeRaw`SELECT id FROM maleta_itens WHERE id = ${item.id}::uuid FOR UPDATE`;
data: { quantidade_vendida: { increment: input.quantidade } }
```

### 8.4 Valor financeiro vindo do cliente — PROIBIDO

```ts
// ❌ PROIBIDO — revendedora define preço da venda
await tx.vendaMaleta.create({
    data: { preco_unitario: input.preco_unitario, ... }
});

// ✅ OBRIGATÓRIO — usar snapshot imutável do banco
const item = await tx.maletaItem.findFirstOrThrow({ where: { id, maleta: { reseller_id } } });
await tx.vendaMaleta.create({
    data: { preco_unitario: item.preco_fixado!, ... }
});
```

### 8.5 Middleware fail-open — PROIBIDO

```ts
// ❌ PROIBIDO — null role passa pelo middleware
if (userRole === 'REVENDEDORA') {
    return redirect('/app');
}
// resto da função passa adiante com userRole === null

// ✅ OBRIGATÓRIO — fail-closed
const isAdminLike = userRole === 'ADMIN' || userRole === 'COLABORADORA';
if (isAdminRoute && !isAdminLike) {
    return redirect('/app');
}
```

### 8.6 Auto-link de `auth_user_id` por email para roles elevadas — PROIBIDO

```ts
// ❌ PROIBIDO — auto-link sem restrição de role permite takeover
profile = await prisma.reseller.findFirst({ where: { email: user.email, auth_user_id: null } });
if (profile) await prisma.reseller.update({ where: { id: profile.id }, data: { auth_user_id: user.id } });

// ✅ OBRIGATÓRIO — auto-link só para REVENDEDORA; ADMIN/COLABORADORA exigem processo manual
profile = await prisma.reseller.findFirst({
    where: { email: user.email, auth_user_id: null, role: "REVENDEDORA" },
});
if (profile) await prisma.reseller.update({ where: { id: profile.id }, data: { auth_user_id: user.id } });
```

### 8.7 COLABORADORA sem `assertIsInGroup` em actions de `/app` — PROIBIDO

```ts
// ❌ PROIBIDO — COLABORADORA passa resellerId de qualquer grupo
if (user.role === "REVENDEDORA" && user.profileId !== resellerId) throw ...;
// passa direto para COLABORADORA

// ✅ OBRIGATÓRIO — verificar pertinência ao grupo
if (user.role === "REVENDEDORA" && user.profileId !== resellerId) {
    throw new Error("BUSINESS: No tienes permiso.");
}
if (user.role === "COLABORADORA") {
    await assertIsInGroup(resellerId, user.profileId!);
}
```

### 8.8 Default `isActive=true` para perfil ausente — PROIBIDO

```ts
// ❌ PROIBIDO — usuário Supabase sem perfil vira REVENDEDORA ativa
return {
    role: (profile?.role as Role) || "REVENDEDORA",
    isActive: profile !== null ? profile.is_active : true,
    ...
};

// ✅ OBRIGATÓRIO — retornar null quando perfil não existe
if (!profile) return null;
return { role: profile.role as Role, isActive: profile.is_active, ... };
```

---

## 9. Cron Jobs e Actions Automáticas

Actions que são disparadas por cron (ex: `checkOverdueMaletas`) NÃO devem ser exportadas como Server Actions públicas. Padrão obrigatório:

- Mover lógica para um Route Handler (`src/app/api/cron/*/route.ts`) autenticado por header `Authorization: Bearer ${CRON_SECRET}`.
- Ou para uma Supabase Edge Function com verificação do `service_role` token.
- Se precisar permanecer como Server Action (trigger manual por ADMIN), envolver com `requireAuth(["ADMIN"])`.

Ref.: [`SPEC_CRON_JOBS.md`](./SPEC_CRON_JOBS.md), [`SPEC_SECURITY_API_ENDPOINTS.md`](./SPEC_SECURITY_API_ENDPOINTS.md).

---

## 10. Testes de Regressão de Segurança

Cada Server Action DEVE ter ao menos os seguintes casos de teste em `src/__tests__/security/`:

1. **Sem sessão** — chamada sem cookie de sessão retorna `BUSINESS: Sesión no válida.`
2. **Role errada** — chamada com role não listada em `allowedRoles` retorna `BUSINESS: No tienes permiso.`
3. **Inativo** — caller com `is_active=false` retorna `BUSINESS: Tu cuenta no está activa.`
4. **IDOR cross-user** — REVENDEDORA tentando acessar recurso de outra REVENDEDORA recebe erro ou `null`.
5. **IDOR cross-group** (quando aplicável) — COLABORADORA tentando acessar recurso fora do seu grupo recebe erro.
6. **Valor financeiro manipulado** (quando aplicável) — input com `preco_unitario` diferente do `preco_fixado` no banco é ignorado; registro usa valor do banco.
7. **Cross-parent ID** (quando aplicável) — passar `maleta_item_id` de outra maleta retorna erro.

Ref.: [`SPEC_TESTING_STRATEGY.md`](./SPEC_TESTING_STRATEGY.md).
