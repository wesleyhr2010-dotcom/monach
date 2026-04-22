# SPEC — Página Pública: Seja Revendedora

## Objetivo
Exibir landing page pública com formulário de inscrição para candidatas a revendedora, gravando cada candidatura como `RevendedoraLead` com status `pendente` para posterior revisão do admin.

## Atores
- **Candidata** — preenche o formulário.
- **Admin** — revisa leads em `/admin/leads` (`SPEC_ADMIN_LEADS.md`).
- **Sistema de e-mails** — notifica admin ao receber nova candidatura (opcional).

## Fluxo
1. Candidata acessa `/seja-revendedora`.
2. Vê hero com proposta + formulário com 10 campos espelhados do Google Form original.
3. Submete → Server Action valida e cria `RevendedoraLead` com status `pendente`.
4. Tela de confirmação agradece e explica próximos passos.
5. Admin revisa lead → aprova (cria `Reseller`) ou reprova.

## Regras de negócio
- Página é pública, sem autenticação.
- Campos obrigatórios: nome, cédula, idade (≥18), endereço, estado civil, filhos, Instagram, WhatsApp, trabalho atual, status Informconf.
- WhatsApp em formato paraguaio `+595 9XX XXX XXX`.
- Idade mínima: 18 anos.
- Cada lead é único por cédula (validação server-side).
- Conteúdo da página em espanhol paraguaio.

## Edge cases
- Cédula já cadastrada → mensagem "Ya existe una solicitud con este documento".
- Idade < 18 → bloqueia submit.
- WhatsApp inválido → validação de máscara.
- Candidata reenvia formulário → substitui lead anterior se ainda `pendente`; bloqueia se já `aprovada`.
- Spam / duplicatas → rate limit por IP.

## Dependências
- `SPEC_ADMIN_LEADS.md` — gestão do lead aprovar/reprovar.
- `SPEC_DATABASE.md` — modelo `RevendedoraLead`.
- `SPEC_EMAILS.md` — notificação ao admin (opcional).

---

## Detalhes técnicos / Referência

**Rota:** `/seja-revendedora`  
**Tipo:** Server Component (página) + Client Component (formulário) + Server Action (submit)  
**Idioma:** Español (espanha o idioma do sistema)

---

## Contexto Original

Exibir uma landing page pública com o formulário de inscrição de candidatas a revendedora da Monarca Semijoyas. Ao enviar o formulário, a candidatura é salva no banco como `RevendedoraLead` com status `pendente` e aguarda revisão do admin.

---

## Campos do Formulário

> Campos espelhados exatamente do Google Form original do processo seletivo.

| # | Campo (label em ES) | Tipo | Obrigatório | Notas |
|---|---------------------|------|-------------|-------|
| 1 | **Nombre completo** | `text` | Sim | Nome completo da candidata |
| 2 | **Número de cédula** | `text` | Sim | CI (Cédula de Identidad paraguaia) |
| 3 | **Edad** | `number` | Sim | Idade (mín. 18) |
| 4 | **Dirección completa** | `text` | Sim | Ciudad, barrio, departamento |
| 5 | **¿Estado civil?** | `text` | Sim | Campo livre: soltera, casada, etc. |
| 6 | **¿Cuántos hijos tienes?** | `text` | Sim | Campo livre: número ou "ninguno" |
| 7 | **¿Cuál es el @ de tu Instagram?** | `text` | Sim | Handle sem o @ |
| 8 | **Número de WhatsApp** | `tel` | Sim | Formato: +595 9XX XXX XXX |
| 9 | **¿Dónde trabajas actualmente?** | `text` | Sim | Nome da empresa ou "No trabajo" |
| 10 | **¿Estás en Informconf?** | `textarea` | Sim | Se sim, explicar o motivo |

---

## Layout da Página

```
┌─────────────────────────────────────────────────────────┐
│              [Header com logo Monarca]                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ── HERO ──────────────────────────────────────────────  │
│                                                          │
│         🦋 ¡Únete a Monarca Semijoyas!                  │
│                                                          │
│  Sé parte de una red de revendedoras exitosas.          │
│  Vende joyas de alta calidad y gana comisiones          │
│  trabajando desde casa a tu propio ritmo.               │
│                                                          │
│  [Icono] Comisión desde el primer mes                   │
│  [Icono] Capacitación y apoyo de tu consultora          │
│  [Icono] Catálogo exclusivo de semijoyas                │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ── FORMULARIO ─────────────────────────────────────── │
│                                                          │
│  📋 Formulario de Inscripción                           │
│  Completa los datos y nos pondremos en contacto.        │
│                                                          │
│  Nombre completo *                                       │
│  [___________________________________]                   │
│                                                          │
│  Número de cédula *                                      │
│  [___________________________________]                   │
│                                                          │
│  Edad *                                                  │
│  [___________________________________]                   │
│                                                          │
│  Dirección completa (ciudad, barrio, departamento) *     │
│  [___________________________________]                   │
│                                                          │
│  ¿Estado civil? *                                        │
│  [___________________________________]                   │
│                                                          │
│  ¿Cuántos hijos tienes? *                               │
│  [___________________________________]                   │
│                                                          │
│  ¿Cuál es el @ de tu Instagram? *                       │
│  [___________________________________]                   │
│                                                          │
│  Número de WhatsApp *                                    │
│  [___________________________________]                   │
│                                                          │
│  ¿Dónde trabajas actualmente? *                         │
│  [___________________________________]                   │
│                                                          │
│  ¿Estás en Informconf? Si estás, cuéntanos la razón. * │
│  [                                   ]                   │
│  [                                   ]                   │
│  [                                   ]                   │
│                                                          │
│  ☑ Acepto los términos y condiciones                    │
│                                                          │
│  [       Enviar candidatura       ]  ← botão primário   │
│                                                          │
├─────────────────────────────────────────────────────────┤
│              [Footer simples com contato]                │
└─────────────────────────────────────────────────────────┘
```

---

## Regras de Negócio

1. Todo campo marcado com `*` é obrigatório — validação client-side + server-side
2. Ao submeter com sucesso → redireciona para `/seja-revendedora/obrigado`
3. Duplicatas de e-mail ou cédula não são bloqueadas na inscrição (admin decide)
4. O formulário NÃO cria usuário Supabase Auth — apenas `RevendedoraLead` no banco
5. Status inicial do lead: `pendente`
6. Admin recebe nota visual no painel `/admin/leads` (badge de contagem)

---

## Página de Confirmação `/seja-revendedora/obrigado`

```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│         ✅  ¡Gracias por tu inscripción!                 │
│                                                          │
│  Recibimos tu solicitud para unirte a Monarca.          │
│  Revisaremos tu candidatura en los próximos             │
│  días hábiles y nos pondremos en contacto por           │
│  WhatsApp.                                              │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  📱 ¿Tienes dudas? Escríbenos:                  │   │
│  │  [  Contactar por WhatsApp  ]                   │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  [  Volver al inicio  ]                                  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Server Action: `submitCandidatura`

```ts
// src/app/seja-revendedora/actions.ts
'use server';

import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const CandidaturaSchema = z.object({
  nome: z.string().min(3),
  cedula: z.string().min(5),
  edad: z.string().min(1),
  direccion: z.string().min(5),
  estado_civil: z.string().min(1),
  hijos: z.string().min(1),
  instagram: z.string().min(1),
  whatsapp: z.string().min(8),
  empresa: z.string().min(1),
  informconf: z.string().min(1),
});

export async function submitCandidatura(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = CandidaturaSchema.safeParse(raw);

  if (!parsed.success) {
    return { success: false, error: 'Verifica los campos obligatorios.' };
  }

  const data = parsed.data;

  await prisma.revendedoraLead.create({
    data: {
      nome: data.nome,
      cedula: data.cedula,
      edad: data.edad,
      direccion: data.direccion,
      estado_civil: data.estado_civil,
      hijos: data.hijos,
      instagram: data.instagram,
      whatsapp: data.whatsapp,
      empresa: data.empresa,
      informconf: data.informconf,
      status: 'pendente',
    },
  });

  redirect('/seja-revendedora/obrigado');
}
```

---

## Schema Prisma — Tabela `RevendedoraLead`

> Tabela nova a ser adicionada ao `prisma/schema.prisma`.

```prisma
enum LeadStatus {
  pendente
  aprovado
  rejeitado

  @@map("lead_status")
}

model RevendedoraLead {
  id           String     @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  nome         String
  cedula       String
  edad         String
  direccion    String
  estado_civil String     @default("")
  hijos        String     @default("")
  instagram    String     @default("")
  whatsapp     String
  empresa      String     @default("")
  informconf   String     @default("")    // campo textarea: situação no Informconf
  status       LeadStatus @default(pendente)

  // Preenchido pelo admin na aprovação
  taxa_comissao   Decimal? @db.Decimal(5, 2)
  colaboradora_id String?  @db.Uuid
  observacao_admin String  @default("") // motivo de rejeição ou notas

  created_at DateTime @default(now()) @db.Timestamptz()
  updated_at DateTime @default(now()) @updatedAt @db.Timestamptz()

  colaboradora Reseller? @relation("LeadsAtribuidos", fields: [colaboradora_id], references: [id])

  @@index([status])
  @@index([created_at])
  @@map("revendedora_leads")
}
```

> **Nota:** Adicionar relação inversa no model `Reseller`:
> ```prisma
> leads_atribuidos RevendedoraLead[] @relation("LeadsAtribuidos")
> ```

---

## Design

- **Paleta:** dourado (`#C9A84C`) + branco + preto — cores da marca Monarca
- **Tipografia:** Playfair Display para títulos, Inter para campos
- **Mobile-first:** formulário ocupa 100% da largura em telas < 640px
- **Sem barra lateral** (página pública, fora do portal)
- **Animação:** shimmer sutil no botão de envio durante loading

---

## Componentes

| Componente | Tipo | Responsabilidade |
|-----------|------|-----------------|
| `SejaRevendedoraPage` | **Server** | Página wrapper com metadata SEO |
| `CandidaturaForm` | **Client** | Formulário com state de loading/erro |
| `HeroBenefits` | Server | Seção de benefícios da marca |
| `ObrigadoPage` | **Server** | Página de confirmação pós-envio |

---

## SEO

```ts
export const metadata = {
  title: 'Sé Revendedora | Monarca Semijoyas',
  description: 'Únete a la red de revendedoras de Monarca Semijoyas. Vende joyas de alta calidad y gana comisiones trabajando desde casa.',
  openGraph: {
    title: 'Únete a Monarca Semijoyas como Revendedora',
    description: 'Formulario de inscripción para revendedoras.',
  },
};
```
