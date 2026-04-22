# Contexto da Sessão — Fluxo de Candidaturas + Análise Admin

> **Data:** 2026-04-16  
> **Objetivo da sessão:** Especificar o fluxo de cadastro de novas revendedoras, analisar o painel admin no Paper e consolidar decisões de arquitetura.

---

## O que foi feito nesta sessão

### 1. Specs criadas / atualizadas

| Arquivo | O que mudou |
|---------|-------------|
| `telas/SPEC_SEJA_REVENDEDORA.md` | Criada: página pública `/seja-revendedora` com formulário de 10 campos, schema `RevendedoraLead`, Server Action `submitCandidatura` |
| `telas/SPEC_ADMIN_LEADS.md` | Criada: página `/admin/leads` com tabs Pendentes/Aprovadas/Rejeitadas, modais de ação, Server Actions `aprovarLead` + `recusarLead`. **Atualizada:** passo de aprovação agora copia **todos** os campos do lead para o `Reseller` |
| `SPEC_DATABASE.md` | Adicionados 7 campos novos ao modelo `Reseller` (ver abaixo) + modelo `RevendedoraLead` + enum `LeadStatus`. Total: 19 tabelas |
| `SPEC_EMAILS.md` | Adicionados Email 5 (`candidatura-aprovada.ts`) e Email 6 (`candidatura-rechazada.ts`) |
| `admin/SPEC_ADMIN_LAYOUT.md` | Adicionada rota `/admin/leads` na árvore, item "📋 Candidaturas [badge N]" na sidebar, `/admin/leads` na lista `SUPER_ADMIN_ONLY` do middleware |

---

### 2. Decisão de arquitetura: campos do formulário → Reseller

**Decisão:** Todos os 10 campos do formulário público são salvos em `RevendedoraLead`. Na aprovação, **todos são migrados para o `Reseller`** — sem separação, sem joins, sem complexidade desnecessária.

Campos adicionados ao modelo `Reseller`:

```prisma
// Dados de Candidatura (copiados do RevendedoraLead na aprovação)
cedula       String @default("")  // Cédula de Identidad
instagram    String @default("")  // Handle sem @
edad         String @default("")
estado_civil String @default("")
hijos        String @default("")
empresa      String @default("")  // Lugar de trabalho atual
informconf   String @default("")  // Situação Informconf (campo livre)
```

**Por quê simples:** O projeto não tem escala nem regras que justifiquem manter dados separados. Uma query, zero joins, a revendedora pode atualizar seus dados futuramente pelo próprio perfil.

---

### 3. Análise das telas admin no Paper (10 artboards — 1440px)

| Artboard | Status |
|----------|--------|
| Admin Login | ✅ Completo |
| Admin Dashboard — Super Admin | ✅ Completo |
| Admin Maletas — Lista | ✅ Completo |
| Admin Maleta — Detalhe #102 | ✅ Completo |
| Admin Maleta — Conferir Recebimento | ✅ Completo |
| Admin Produtos — Lista | ✅ Completo |
| Admin Analytics | ✅ Completo |
| Admin Config — Notificações Push | ✅ Completo |
| Admin Nova Maleta — Step 2 (Produtos) | ✅ Completo |
| Admin Revendedoras — Lista | ✅ Completo |
| Admin Produtos — Novo Produto | ✅ Completo |

---

## Telas faltantes no Paper (a desenhar)

### 🔴 Alta prioridade

#### 1. Admin Leads — Candidaturas `/admin/leads`
**Spec:** `telas/SPEC_ADMIN_LEADS.md`

Tela nova do fluxo que especificamos. Precisa de:
- Sidebar com item "📋 Candidaturas" + badge numérico
- 3 tabs: Pendientes / Aprobadas / Rechazadas
- Card de candidata com: nome, cédula, WhatsApp, instagram, endereço, empresa, informconf, data
- Modal de aprovação: select consultora + campo taxa de comissão + info box
- Modal de rejeição: campo de motivo (interno) + confirmação
- Estados: normal → loading → sucesso (card some da aba)

---

### 🟡 Média prioridade

#### 2. Admin Revendedora — Perfil `/admin/revendedoras/[id]`
Tela de detalhe de uma revendedora específica, vista pelo admin/consultora.

Deve conter:
- Header: avatar, nome, cédula, nível, pontos, comissão, consultora vinculada
- Ações: "Contatar por WhatsApp", "Desativar conta", "Alterar consultora"
- Seção **Dados de Candidatura** (read-only): cedula, instagram, edad, estado_civil, hijos, empresa, informconf
- Seção **Maletas**: lista resumida das maletas ativas/atrasadas
- Seção **Documentos**: status do CI e contrato
- Seção **Dados Bancários**: alias Bancard ou conta bancária

#### 3. Admin Maleta — Acerto `/admin/maletas/[id]/acerto`
Fluxo de fechamento financeiro da maleta:
- Exibe: total enviado, total vendido, retorno, comissão calc. automaticamente
- Campo nota do acerto
- Botão "Confirmar Acerto" → congela valores + muda status para `concluida`

#### 4. Admin Nova Maleta — Steps 1, 3 e 4
Apenas o Step 2 (Produtos) está desenhado. Faltam:
- Step 1: Selecionar Revendedora
- Step 3: Definir Prazo
- Step 4: Confirmar e Enviar

#### 5. Admin Equipe — Consultoras `/admin/consultoras`
Lista de consultoras com:
- Filtros por status
- Métricas por consultora (nº revendedoras, faturamento do grupo, comissão)
- Botão "Nova Consultora"

---

### 🟢 Baixa prioridade

#### 6. Admin Gamificação `/admin/gamificacao`
CRUD de regras de pontos e níveis (Bronze/Prata/Ouro/Diamante).

#### 7. Admin Brindes `/admin/brindes`
Catálogo de brindes + lista de solicitações pendentes de entrega.

#### 8. Admin Configurações `/admin/configuracoes`
Shell com submenu: Notificações Push (já existe), Commission Tiers, Contratos.

---

## Próximos passos recomendados

1. **Desenhar** a tela `Admin Leads — Candidaturas` no Paper (mais urgente)
2. **Executar** `prisma migrate` para criar `revendedora_leads` + novos campos em `resellers`
3. **Implementar** `/seja-revendedora` seguindo `SPEC_SEJA_REVENDEDORA.md`
4. **Implementar** `/admin/leads` seguindo `SPEC_ADMIN_LEADS.md`
5. **Configurar** Brevo API Key e templates de e-mail

---

## Variáveis de ambiente necessárias (novas)

```env
# Supabase Admin (para criar users programaticamente)
SUPABASE_SERVICE_ROLE_KEY=

# Brevo (emails transacionais — já definido na SPEC_EMAILS.md)
BREVO_API_KEY=
BREVO_FROM_EMAIL=no-reply@monarca.com.py
BREVO_FROM_NAME=Monarca Semijoyas

# URL pública (para links nos e-mails)
NEXT_PUBLIC_SITE_URL=https://monarca.com.py
```
