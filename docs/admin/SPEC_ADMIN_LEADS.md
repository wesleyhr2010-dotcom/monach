# SPEC — Admin: Candidaturas (Leads)

## Objetivo
Permitir ao SUPER_ADMIN revisar candidaturas submetidas em `/seja-revendedora`, aprovar (vinculando consultora e definindo taxa) ou rejeitar, disparando automaticamente a criação do usuário no Supabase e os e-mails correspondentes.

## Atores
- **SUPER_ADMIN** — único com acesso.
- **Candidata** — submeteu formulário em `/seja-revendedora`.
- **Supabase Auth** — cria usuário na aprovação.
- **Sistema de e-mails** — envia aprovação (com link de senha) ou rejeição.

## Fluxo
1. Sidebar admin mostra badge com número de leads `pendente`.
2. Admin acessa `/admin/leads` com tabs: Pendientes / Aprobadas / Rechazadas.
3. Revisa candidatura, clica "Aprobar" → modal pede consultora e taxa → confirma.
4. Sistema cria `Reseller`, cria user Supabase com role `REVENDEDORA`, envia e-mail de boas-vindas.
5. Clica "Rechazar" → modal pede motivo → envia e-mail de recusa.
6. Lead muda de status e aparece na tab correspondente.

## Regras de negócio
- Somente `SUPER_ADMIN` tem acesso.
- Aprovação exige seleção de consultora (ou "sem consultora").
- Taxa de comissão inicial definida na aprovação.
- Rejeição exige motivo (usado no e-mail).
- Cada lead tem um `status` final imutável; reverter exige novo cadastro.
- Badge do nav é atualizado após ação.

## Edge cases
- E-mail/cédula já em `Reseller` → bloqueia aprovação.
- Falha na criação do Supabase user → rollback do `Reseller`; lead volta a `pendente`.
- Tentativa de reaprovar lead já `aprovada` → bloqueada.
- Lead muito antigo → mantém visível na tab rejeitados/aprovados para histórico.
- Envio de e-mail falha → admin é informado, lead já aprovado, e-mail pode ser reenviado manualmente.

## Dependências
- `SPEC_SEJA_REVENDEDORA.md` — origem.
- `SPEC_ADMIN_EQUIPE.md` — `Reseller` criado.
- `SPEC_EMAILS.md` — templates aprovação/rejeição.
- `SPEC_ADMIN_LAYOUT.md` — badge no sidebar.
- `SPEC_DATABASE.md` — `RevendedoraLead`.

---

## Detalhes técnicos / Referência

**Rota:** `/admin/leads`  
**Tipo:** Server Component (lista) + Client Component (modais de ação)  
**Acesso:** Somente `role = ADMIN`

---

## Contexto Original

Permitir ao administrador revisar as candidaturas de novas revendedoras submetidas via `/seja-revendedora`, aprovar ou rejeitar cada uma, e — na aprovação — vincular uma consultora e definir a taxa de comissão. O sistema executa automaticamente a criação do usuário Supabase Auth, a criação do `Reseller` no banco e o envio de e-mails.

---

## Link no Nav Admin

- Adicionar item **"Candidaturas"** com ícone `ClipboardList` ao `navItems` do `AdminLayout`
- Badge numérico vermelho com contagem de leads `pendente` visível ao lado do item
- Badge some quando `pendente === 0`

```tsx
// Exemplo de badge no nav
<Link href="/admin/leads" className={`admin-nav-link ${isActive ? 'active' : ''}`}>
  <ClipboardList className="w-5 h-5 flex-shrink-0" />
  Candidaturas
  {pendingCount > 0 && (
    <span className="badge-count">{pendingCount}</span>
  )}
</Link>
```

---

## Layout da Página `/admin/leads`

```
┌─────────────────────────────────────────────────────────┐
│  Candidaturas a Revendedora                             │
│                                                          │
│  [Pendientes  12] [Aprobadas  45] [Rechazadas  8]       │
│   ^^^^^^^^ tab ativo                                     │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Ana García     📱 09XXXXXXX  📧 ana@gmail.com     │   │
│  │ Asunción · Barrio San Pablo  · 12/04/2025        │   │
│  │                                [Aprobar] [Rechazar]│  │
│  ├──────────────────────────────────────────────────┤   │
│  │ María López    📱 09XXXXXXX  📧 maria@gmail.com   │   │
│  │ Fernando de la Mora · 10/04/2025                 │   │
│  │                                [Aprobar] [Rechazar]│  │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  [← Anterior]   Página 1 de 3   [Siguiente →]           │
└─────────────────────────────────────────────────────────┘
```

### Tabs

| Tab | Filtro | Cor do badge |
|-----|--------|--------------|
| Pendientes | `status = pendente` | Amarelo/laranja |
| Aprobadas | `status = aprovado` | Verde |
| Rechazadas | `status = rejeitado` | Vermelho |

### Colunas do Card de Lead

| Campo | Origem |
|-------|--------|
| Nome completo | `RevendedoraLead.nome` |
| Cédula | `RevendedoraLead.cedula` |
| Telefone (WhatsApp) | `RevendedoraLead.whatsapp` |
| Instagram | `RevendedoraLead.instagram` |
| Endereço | `RevendedoraLead.direccion` |
| Data de inscrição | `RevendedoraLead.created_at` |
| Empresa atual | `RevendedoraLead.empresa` |
| Situação Informconf | `RevendedoraLead.informconf` |
| Estado civil / Filhos | `estado_civil` · `hijos` |

---

## Modal: Aprovar Candidatura

```
┌─────────────────────────────────────────────────────────┐
│  ✅ Aprobar Candidatura                           [×]   │
│                                                          │
│  Revendedora: Ana García                                 │
│  Correo: ana@gmail.com                                   │
│                                                          │
│  Asignar consultora *                                    │
│  [─ Selecciona una consultora ──────────────────▼]       │
│                                                          │
│  Tasa de comisión (%) *                                  │
│  [___25___]                                              │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  ℹ Al aprobar:                                   │   │
│  │  • Se crea cuenta de acceso al portal            │   │
│  │  • Se envía email con login y contraseña         │   │
│  │  • Queda vinculada a la consultora elegida       │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  [Cancelar]              [Aprobar y enviar acceso →]     │
└─────────────────────────────────────────────────────────┘
```

### Campos do modal de aprovação

| Campo | Tipo | Obrigatório | Notas |
|-------|------|-------------|-------|
| Consultora | `select` | Sim | Lista todas Resellers com `role = COLABORADORA` |
| Taxa de comissão | `number` | Sim | Entre 0 e 100, padrão 25 |

---

## Modal: Rejeitar Candidatura

```
┌─────────────────────────────────────────────────────────┐
│  ✗ Rechazar Candidatura                           [×]   │
│                                                          │
│  Revendedora: María López                                │
│  Correo: maria@gmail.com                                 │
│                                                          │
│  Motivo (opcional — não enviado à candidata)             │
│  [___________________________________]                   │
│                                                          │
│  ─────────────────────────────────────────────────────  │
│  ℹ Se enviará un email de rechazo a maria@gmail.com     │
│                                                          │
│  [Cancelar]                       [Rechazar ×]           │
└─────────────────────────────────────────────────────────┘
```

---

## Server Actions

### `getLeads(status?: LeadStatus)`

```ts
// src/app/admin/actions-leads.ts
'use server';

export async function getLeads(status?: LeadStatus): Promise<LeadItem[]> {
  return await prisma.revendedoraLead.findMany({
    where: status ? { status } : undefined,
    orderBy: { created_at: 'desc' },
    include: {
      colaboradora: { select: { id: true, name: true } },
    },
  });
}
```

---

### `aprovarLead(leadId, { colaboradoraId, taxaComissao })`

**Fluxo:**

```
1. Busca lead pelo ID
2. Valida que colaboradoraId é válida
3. Gera senha temporária (12 chars alfanumérico)
4. Cria usuário em Supabase Auth:
   supabaseAdmin.auth.admin.createUser({
     email: lead.email,
     password: senhaTemp,
     email_confirm: true,   // pular verificação de e-mail
   })
5. Cria Reseller no banco com TODOS os campos do lead:
   prisma.reseller.create({
     data: {
       // Identidade
       name:         lead.nome,
       email:        lead.email,
       slug:         generateSlug(lead.nome),
       whatsapp:     lead.whatsapp,
       role:         'REVENDEDORA',
       auth_user_id: supabaseUser.id,
       manager_id:   colaboradoraId,
       taxa_comissao: taxaComissao,

       // Endereço (a partir de lead.direccion — campo livre)
       endereco_cidade: extrairCidade(lead.direccion),

       // Dados de Candidatura (copiados integralmente)
       cedula:       lead.cedula,
       instagram:    lead.instagram,
       edad:         lead.edad,
       estado_civil: lead.estado_civil,
       hijos:        lead.hijos,
       empresa:      lead.empresa,
       informconf:   lead.informconf,
     }
   })
6. Atualiza lead:
   status = 'aprovado'
   colaboradora_id = colaboradoraId
   taxa_comissao = taxaComissao
7. Envia e-mail de boas-vindas com credenciais
8. Retorna { success: true }
```

```ts
export async function aprovarLead(
  leadId: string,
  params: { colaboradoraId: string; taxaComissao: number }
): Promise<{ success: boolean; error?: string }>
```


---

### `recusarLead(leadId, observacao?)`

**Fluxo:**

```
1. Busca lead pelo ID
2. Atualiza: status = 'rejeitado', observacao_admin = observacao
3. Envia e-mail de rejeição para lead.email
4. Retorna { success: true }
```

```ts
export async function recusarLead(
  leadId: string,
  observacao?: string
): Promise<{ success: boolean; error?: string }>
```

---

## E-mails Transacionais

> Implementados em `src/lib/email.ts` utilizando a **Supabase Admin API**.
> Não requer provedor externo adicional.

### E-mail de Aprovação

```
Para: {email}
Assunto: ¡Bienvenida a Monarca Semijoyas! 🦋

Olá, {nome}!

Tu solicitud para ser Revendedora Monarca fue APROBADA. 🎉

Aquí están tus datos de acceso al portal:

  🌐 Portal: https://monarcasemijoyas.com.py/app/login
  📧 Correo: {email}
  🔑 Contraseña temporal: {senhaTemp}

Por seguridad, te recomendamos cambiar tu contraseña
en el primer inicio de sesión.

Tu consultora asignada te contactará pronto para 
explicarte cómo funciona tu primera consignación.

¡Mucho éxito! 💎
— Equipo Monarca
```

### E-mail de Rejeição

```
Para: {email}
Assunto: Sobre tu solicitud en Monarca Semijoyas

Olá, {nome}!

Gracias por tu interés en unirte a Monarca Semijoyas.

Lamentablemente, en esta oportunidad no podemos 
continuar con tu candidatura.

Si tienes dudas, puedes contactarnos directamente
en nuestras redes sociales o por WhatsApp.

Gracias por tu comprensión.
— Equipo Monarca
```

---

## Utilitário `src/lib/email.ts`

```ts
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function sendWelcomeEmail(params: {
  email: string;
  nome: string;
  senhaTemp: string;
}): Promise<void> {
  // Opção A: usar Resend (recomendado para produção)
  // Opção B: usar Supabase Email Templates (limitado mas funciona)
  // Implementar conforme provedor acordado
}

export async function sendRejectionEmail(params: {
  email: string;
  nome: string;
}): Promise<void> {
  // Idem acima
}
```

> **Nota de implementação:** O projeto ainda não tem um provedor de e-mail transacional definido.
> Recomendação: **Resend** (`npm install resend`) — gratuito até 3.000 emails/mês,
> integração TypeScript nativa. Configurar `RESEND_API_KEY` no `.env.local`.

---

## Geração de Senha Temporária

```ts
function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
```

> 12 caracteres, exclui caracteres ambíguos (0, O, 1, l, I).

---

## Componentes

| Componente | Tipo | Responsabilidade |
|-----------|------|-----------------|
| `LeadsPage` | **Server Component** | Busca leads + tabs por status |
| `LeadsTabsList` | **Client Component** | Troca de tab com URL params |
| `LeadCard` | Server | Exibição do card de candidata |
| `AprovarModal` | **Client Component** | Modal com select de consultora + taxa |
| `RecusarModal` | **Client Component** | Modal com campo de motivo |

---

## Estados do Botão de Aprovação

| Estado | Visual |
|--------|--------|
| Normal | Verde `#35605a` |
| Carregando | Spinner + "Aprobando..." (desabilitado) |
| Sucesso | ✅ "¡Aprobada!" — card some da aba Pendientes |
| Erro | Toast vermelho com mensagem de erro |

---

## Considerações de Segurança

- `SUPABASE_SERVICE_ROLE_KEY` nunca exposta ao client — usada apenas em Server Actions
- `generateTempPassword()` usa `Math.random()` (suficiente para uso temporário; substituir por `crypto.getRandomValues` em produção)
- A ação de aprovação é idempotente: verificar se já existe `Reseller` com `email` antes de criar
- Rate limit: não aprovar o mesmo lead duas vezes (checar `status !== 'pendente'` antes de executar)
