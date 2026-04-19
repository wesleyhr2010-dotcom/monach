# SPEC — Segurança: RBAC, Autorização e Prevenção de IDOR

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
[ ] Chamada requireAuth() no início da função
[ ] Role check se necessário (allowedRoles)
[ ] Owner check no WHERE das queries (nunca buscar só por id)
[ ] COLABORADORA verificada com assertIsInGroup() quando aplicável
[ ] Retorno usando ActionResult (nunca throw direto para o cliente)
[ ] Dados sensíveis NÃO incluídos no select (ex: não retornar senha hash)
[ ] Input validado com Zod antes de qualquer operação
```
