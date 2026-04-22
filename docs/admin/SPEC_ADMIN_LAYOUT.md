# SPEC — Admin/Consultora: Layout, Navegação e RBAC

## Objetivo
Definir a estrutura de rotas, shell visual (sidebar, alert bell, topbar) e a matriz de permissões RBAC do portal `/admin/*`, diferenciando escopos entre SUPER_ADMIN e CONSULTORA.

## Atores
- **SUPER_ADMIN** — acesso total ao backoffice.
- **CONSULTORA** — acesso restrito ao seu grupo de revendedoras (scoped).
- **Middleware `/admin/*`** — valida sessão e `role IN ('SUPER_ADMIN', 'CONSULTORA')`.

## Fluxo
1. Usuário faz login em `/admin/login`.
2. Middleware valida sessão e role; bloqueia revendedoras e usuários sem permissão.
3. `layout.tsx` renderiza shell desktop (sidebar + topbar + AlertBell).
4. Sidebar mostra somente itens permitidos pelo role.
5. Rotas sensíveis (produtos, categorias, leads, consultoras, configurações críticas) ficam restritas a SUPER_ADMIN.
6. Consultora acessa apenas rotas cujos dados são do seu grupo.

## Regras de negócio
- Portal admin e portal revendedora são **excludentes**: admin não pode entrar em `/app`, revendedora não pode entrar em `/admin`.
- Rotas SUPER_ADMIN-only: `/admin/produtos`, `/admin/categorias`, `/admin/leads`, `/admin/consultoras`, `/admin/configuracoes/*`.
- Rotas compartilhadas com escopo: `/admin/maletas`, `/admin/revendedoras`, `/admin/analytics`.
- Consultora sempre vê apenas seu grupo automaticamente (query filtrada).
- AlertBell centraliza: maletas atrasadas, documentos pendentes, solicitações de brindes, leads pendentes.

## Edge cases
- Consultora tenta acessar URL SUPER_ADMIN → 403/redireciona.
- Usuário com role removido no meio da sessão → middleware detecta no próximo request.
- Revendedora com token manipulado tentando `/admin` → bloqueada.
- Empty state em cada listagem quando consultora não tem dados.

## Dependências
- `SPEC_LOGIN.md` — middleware complementar para `/app/*`.
- `SPEC_SECURITY_RBAC.md` — definição de roles e políticas.
- `SPEC_ADMIN_ANALYTICS_NOTIFICATIONS.md` — AlertBell.
- Todas as demais SPECs `admin/*`.

---

## Detalhes técnicos / Referência

**Rota base:** `/admin/*`  
**Acesso:** SUPER_ADMIN e CONSULTORA (com escopos diferentes)

---

## Estrutura de Rotas do Admin

```
src/app/admin/
├── layout.tsx                          ← Shell desktop + Sidebar + AlertBell
├── page.tsx                            ← Dashboard
│
├── analytics/                          ← SUPER_ADMIN + CONSULTORA (scoped)
│   └── page.tsx                        ← Dashboard de performance operacional
│
├── produtos/                           ← 🔒 SUPER_ADMIN only
│   ├── page.tsx                        ← Lista de produtos + alertas de estoque
│   ├── novo/page.tsx                   ← Cadastrar produto + variantes
│   └── [id]/page.tsx                   ← Editar produto + aba Estoque
│
├── categorias/                         ← 🔒 SUPER_ADMIN only
│   └── page.tsx                        ← CRUD hierárquico de categorias
│
├── maletas/
│   ├── page.tsx                        ← Lista de maletas
│   ├── nova/page.tsx                   ← Criar maleta (multi-step)
│   └── [id]/
│       ├── page.tsx                    ← Detalhe da maleta
│       └── conferir/page.tsx           ← Confirmar recebimento físico
│
├── revendedoras/
│   ├── page.tsx                        ← Lista de revendedoras
│   ├── nova/page.tsx                   ← Cadastrar revendedora
│   └── [id]/
│       ├── page.tsx                    ← Perfil da revendedora
│       └── documentos/page.tsx         ← Aprovar CI
│
├── leads/                              ← 🔒 SUPER_ADMIN only
│   └── page.tsx                        ← Candidaturas de /seja-revendedora
│                                         Tabs: Pendientes / Aprobadas / Rechazadas
│                                         Aprovação: cria Reseller + Supabase user + email
│                                         Rejeição: envia email de recusa
│
├── consultoras/                        ← 🔒 SUPER_ADMIN only
│   ├── page.tsx                        ← Lista de consultoras
│   ├── nova/page.tsx                   ← Cadastrar consultora
│   └── [id]/page.tsx                   ← Perfil da consultora
│
├── configuracoes/                      ← Agrupa todas as configs
│   ├── notificacoes/page.tsx           ← 🔒 Config OneSignal + templates push
│   ├── commission-tiers/page.tsx       ← Faixas de comissão (movido)
│   └── contratos/page.tsx             ← Upload de contratos PDF (movido)
│
├── gamificacao/page.tsx                ← Módulos de pontos + níveis
└── brindes/page.tsx                    ← Catálogo + solicitações pendentes
```


> ⚠️ **Migração:** `/admin/commission-tiers` e `/admin/contratos` foram movidos para `/admin/configuracoes/*`.
> Adicionar redirecionamentos 308 em `next.config.ts` para não quebrar bookmarks.

---

## Sidebar — Layout Desktop

```
┌──────────────────────────────────────────────────────────────┐
│ [Logo]                                                        │
│  Monarca Admin                                               │
├────────────────┬─────────────────────────────────────────────┤
│                │                                             │
│  🏠 Dashboard  │  (conteúdo da rota ativa)                  │
│                │                                             │
│  ─ CATÁLOGO ──│  ← Só aparece para SUPER_ADMIN             │
│  📦 Produtos   │                                             │
│  🏷️ Categorias  │                                             │
│                │                                             │
│  ─ OPERACIONAL│                                             │
│  👜 Maletas    │                                             │
│  👥 Revendedoras│                                            │
│  👤 Consultoras│  ← Só aparece para SUPER_ADMIN             │
│  📋 Candidaturas│ ← Só aparece para SUPER_ADMIN             │
│     [Badge N]  │   N = leads com status pendente            │
│                │                                             │
│  ─ CONFIG ────│                                             │
│  ⭐ Gamificação│                                             │
│  💰 Comissões  │                                             │
│  📄 Contratos  │                                             │
│  🎁 Brindes    │                                             │
│                │                                             │
└────────────────┴─────────────────────────────────────────────┘
```

---

## RBAC — Regras de Acesso por Papel

### SUPER_ADMIN
- Acesso irrestrito a todas as rotas do `/admin`
- Vê dados de **todas** as consultoras e revendedoras
- Pode criar, editar e excluir qualquer entidade
- Único papel com acesso a `/admin/produtos`, `/admin/categorias`, `/admin/consultoras` e `/admin/leads`

### CONSULTORA
- Acesso apenas ao seu próprio escopo de dados
- **Não** vê as rotas `/admin/consultoras`, `/admin/produtos`, `/admin/categorias`, `/admin/leads`
- Todas as queries incluem `WHERE colaboradora_id = session.colaboradoraId`
- Pode criar maletas apenas para **suas** revendedoras
- Pode aprovar acertos apenas das **suas** revendedoras

### Middleware de RBAC

```ts
// src/middleware.ts
const SUPER_ADMIN_ONLY = [
  '/admin/consultoras',
  '/admin/leads',          // ← NOVO: gestão de candidaturas
  '/admin/produtos',
  '/admin/categorias',
  '/admin/configuracoes/notificacoes',
];

if (pathname.startsWith('/admin')) {
  const session = await getAdminSession(request);

  if (!session) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  // Rotas exclusivas do Super Admin
  const isSuperAdminRoute = SUPER_ADMIN_ONLY.some(r => pathname.startsWith(r));
  if (isSuperAdminRoute && session.role !== 'SUPER_ADMIN') {
    return NextResponse.redirect(new URL('/admin', request.url));
  }
}
```

### Helper de Escopo (Software RLS)

```ts
// src/lib/admin-scope.ts
export function getResellerScope(session: AdminSession) {
  if (session.role === 'SUPER_ADMIN') return {}; // sem filtro
  return { colaboradora_id: session.colaboradoraId }; // filtra pelo colaboradoraId
}

// Uso em qualquer query:
const maletas = await prisma.maleta.findMany({
  where: {
    ...getResellerScope(session),
    // + outros filtros
  }
});
```

---

## Layout Shell Desktop

```tsx
// src/app/admin/layout.tsx
export default async function AdminLayout({ children }) {
  const session = await getAdminSession();

  return (
    <div className="flex h-screen">
      <Sidebar role={session.role} />
      <main className="flex-1 overflow-auto p-8 bg-gray-50">
        <AdminHeader session={session} />
        {children}
      </main>
    </div>
  );
}
```

### Admin Header (barra superior)

```
┌───────────────────────────────────────────────────────────────┐
│  [Breadcrumb: Admin / Maletas]     [🔔 3]  [👤 Maria Santos ▼]│
└───────────────────────────────────────────────────────────────┘
```

- **Breadcrumb** dinâmico baseado na rota
- **[🔔 N]** — `AdminAlertBell`: sino com badge numérico de maletas em `aguardando_revisao`
  - Ao clicar → Drawer lateral com lista de maletas pendentes + botão "Conferir →"
  - Usa Supabase Realtime para atualização em tempo real sem refresh
  - Contagem inicial via SSR no layout (sem flash)
  - Ver estratégia completa em `SPEC_ADMIN_ANALYTICS_NOTIFICATIONS.md § 3`
- **Dropdown de usuário**: nome + papel + [Sair]

---

## Pantallas de Autenticación Admin

### Pantalla 1: Login `/admin/login`

```
┌─────────────────────────────────────┐
│  [Logo Monarca]                     │
│                                     │
│  Panel Administrativo               │
│                                     │
│  Correo electrónico                 │
│  [____________________________]     │
│                                     │
│  Contraseña                         │
│  [________________________] [👁]    │
│                                     │
│  [¿Olvidé mi contraseña?]           │
│                                     │
│  [         Ingresar         ]       │
└─────────────────────────────────────┘
```

**Reglas:**
- Valida `role IN ('ADMIN', 'COLABORADORA')` — bloquea si es `REVENDEDORA`
- Redirige a `/admin` tras login exitoso
- Errores en español (misma lógica que `SPEC_LOGIN.md`)

```ts
// src/app/admin/login/login-form.tsx
async function handleLogin(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) { setError(traducirError(error.message)); return; }

  // Verificar role — REVENDEDORA no tiene acceso al admin
  const reseller = await getResellerByUserId(data.user.id);
  if (!reseller || !['ADMIN', 'COLABORADORA'].includes(reseller.role)) {
    await supabase.auth.signOut();
    setError('Esta cuenta no tiene acceso al panel administrativo.');
    return;
  }

  router.push('/admin');
}
```

---

### Pantalla 2: Recuperar Contraseña `/admin/login/recuperar-contrasena`

```
┌─────────────────────────────────────┐
│  ← Recuperar Contraseña             │
│                                     │
│  Ingresa tu correo institucional y  │
│  te enviaremos un enlace de acceso. │
│                                     │
│  Correo electrónico                 │
│  [____________________________]     │
│                                     │
│  [  Enviar Enlace de Recuperación ] │
│                                     │
│  ─── Después de hacer clic ───      │
│  El enlace llegará a tu correo.     │
│  Expira en 1 hora.                  │
└─────────────────────────────────────┘

── Tras el envío exitoso ─────────────

┌─────────────────────────────────────┐
│        ✅ ¡Correo enviado!           │
│                                     │
│  Revisa tu bandeja: admin@mon.com.py│
│                                     │
│  [   Volver al Login Admin   ]      │
└─────────────────────────────────────┘
```

**Implementación:**
```ts
// Redirect apunta /admin/nueva-contrasena (no /app/nueva-contrasena)
await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/admin/nueva-contrasena`,
});
```

> ⚠️ **Separación de redirects:** El `redirectTo` del admin apunta a `/admin/nueva-contrasena`
> y el de la revendedora apunta a `/app/nueva-contrasena`. Supabase usa la URL de redirect
> para saber a qué pantalla enviar al usuario tras hacer clic en el email.

---

### Pantalla 3: Nueva Contraseña `/admin/nueva-contrasena`

> Misma lógica que `/app/nueva-contrasena` — la ruta está EXCLUIDA del middleware de admin.

```
┌─────────────────────────────────────┐
│  [Logo Monarca]                     │
│                                     │
│  🔐 Crear Nueva Contraseña          │
│                                     │
│  Nueva contraseña                   │
│  [________________________] [👁]    │
│                                     │
│  Confirmar contraseña               │
│  [________________________] [👁]    │
│                                     │
│  [    Guardar Nueva Contraseña    ] │
└─────────────────────────────────────┘

── Tras guardar ──────────────────────

┌─────────────────────────────────────┐
│     ✅ ¡Contraseña actualizada!     │
│                                     │
│  [   Ir al Panel Admin   ]          │
└─────────────────────────────────────┘
```

```ts
// src/app/admin/nueva-contrasena/page.tsx
// Misma implementación que NuevaContrasenaForm (ver SPEC_LOGIN.md)
// Diferencia: redirect final → '/admin' en lugar de '/app'
async function handleGuardar(password: string, confirm: string) {
  // ... mismas validaciones ...
  const { error } = await supabase.auth.updateUser({ password });
  if (!error) setTimeout(() => router.push('/admin'), 2000);
}
```

---

### Mapa Completo de Rutas de Auth

| Ruta | Usuario | Descripción |
|------|---------|-------------|
| `/app/login` | Revendedora | Login portal revendedora |
| `/app/login/recuperar-contrasena` | Revendedora | Solicitar link de recuperación |
| `/app/nueva-contrasena` | Revendedora | Definir nueva contraseña |
| `/admin/login` | Admin / Colaboradora | Login panel admin |
| `/admin/login/recuperar-contrasena` | Admin / Colaboradora | Solicitar link de recuperación |
| `/admin/nueva-contrasena` | Admin / Colaboradora | Definir nueva contraseña |

> **Regla de oro:** Las rutas `/*/nueva-contrasena` siempre están **excluidas** del
> middleware de protección de roles, ya que requieren acceso sin sesión activa.

### Exclusiones en el Middleware Admin

```ts
// src/middleware.ts — matcher del admin
if (
  pathname.startsWith('/admin') &&
  !pathname.startsWith('/admin/login') &&
  !pathname.startsWith('/admin/nueva-contrasena')  // ← EXCLUIR
) {
  // verificar sesión + role = ADMIN | COLABORADORA
}
```

---

## Ciclo de Vida das Maletas — Lógica de Gestão

### Estados (status field)

| Status | Cor UI | Significado |
|--------|--------|-------------|
| `criada` | Cinza | Maleta montada, ainda não entregue à revendedora |
| `ativa` | 🟢 Verde | Entregue e dentro do prazo de devolução |
| `atrasada` | 🔴 Vermelho | Prazo de devolução vencido |
| `aguardando_revisao` | 🟡 Amarelo | Revendedora sinalizou retorno; aguarda conferência física admin |
| `concluida` | Azul/cinza | Conferida, estoque restaurado, comissão calculada |
| `cancelada` | Cinza escuro | Encerrada manualmente sem processamento de comissão |

### Fluxo de Transições

```
                 ┌──────────────┐
                 │    criada    │ ← Admin cria maleta e seleciona produtos
                 └──────┬───────┘
                        │ "Enviar maleta" (admin confirma envio físico)
                 ┌──────▼───────┐
                 │    ativa     │ ← Produtos reservados no estoque
                 └──────┬───────┘
                        │ cron diário: prazo_devolucao < hoje
                 ┌──────▼───────┐
                 │   atrasada   │ ← WhatsApp automático para revendedora
                 └──────┬───────┘
                        │ Revendedora clica "Devolver" no app
           ┌────────────▼──────────────┐
           │    aguardando_revisao     │ ← Admin vê fila de conferência
           └────────────┬──────────────┘
                        │ Admin faz conferência física (/conferir)
              ┌─────────▼──────────┐
              │      concluida     │ ← Estoque restaurado + comissão calculada
              └────────────────────┘
                        │ (ou)
              ┌─────────▼──────────┐
              │      cancelada     │ ← Admin cancela manualmente
              └────────────────────┘
```

### Automações (Cron Jobs / Triggers)

| Evento | Trigger | Ação |
|--------|---------|------|
| **Auto-atraso** | Cron diário 00:00 | Maletas `ativa` com `prazo_devolucao < today` → `atrasada` |
| **Alerta de atraso** | Ao mudar → `atrasada` | Envia WhatsApp para revendedora (template aprovado) |
| **Lembrete D-3** | Cron diário | 3 dias antes do prazo → push notification + WhatsApp |
| **Lembrete D-1** | Cron diário | 1 dia antes do prazo → WhatsApp de urgência |

### Estratégia de Organização Visual (UX)

**Padrão adotado: Tabela densa como visão principal + Kanban-lite de alertas no Dashboard**

Baseado em boas práticas de sistemas de consignação B2B:

- **Tabela** (`/admin/maletas`): visão de alto volume, filtros avançados, operações bulk — ideal para gestão do dia a dia
- **Kanban-lite no Dashboard**: 3 colunas de atenção urgente — Atrasadas / Ag. Conferência / Prazo hoje
- **View toggle** (futuro nice-to-have): botão para alternar entre Tabela e Kanban completo

```
Dashboard
├── KPI Cards: Total ativas / Atrasadas / Ag. Conferência / Concluídas no mês
├── Kanban-lite de atenção (3 colunas compactas)
│   ├── 🔴 Atrasadas     → lista das mais urgentes com botão "Contatar"
│   ├── 🟡 Ag. Conferência → botão "Conferir" direto por maleta
│   └── ⚠️  Prazo hoje    → alertas do dia
└── Ranking de desempenho por consultora
```

### Regras de Estoque nas Transições

| Transição | Efeito no Estoque |
|-----------|------------------|
| `criada` → `ativa` | `stock_quantity -= quantidade_enviada` para cada variante (reserva) |
| `aguardando_revisao` → `concluida` | `stock_quantity += quantidade_conferida_recebida` (devolução real) |
| `*` → `cancelada` | `stock_quantity += quantidade_enviada` (restaura tudo, sem processar vendas) |

Todas as movimentações são registradas em `EstoqueMovimento` com `tipo = 'reserva_maleta'` ou `'devolucao_maleta'` para audit trail completo.
