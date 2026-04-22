# SPEC — Gamificação & Gestão de Revendedoras (Overview)

## Objetivo
Descrever a arquitetura global que separa área admin/consultora (`/admin/*`) do portal da revendedora (`/app/*`), detalhando o motor de maletas em consignação, o ledger de pontos e as faixas de comissão.

## Atores
- **Super Admin / Consultora** — opera backoffice desktop.
- **Revendedora** — consome portal mobile-first.
- **Motor de Gamificação** — concede pontos em triggers (maleta no prazo, compartilhamento, etc.).
- **Motor de Comissão** — cruza vendas com `CommissionTier` para calcular percentual vigente.

## Fluxo
1. Consultora abre maleta para revendedora → `createMaleta` reserva estoque em transação.
2. Revendedora opera catálogo/vitrina → registra vendas na sua maleta.
3. Revendedora fecha maleta → `closeMaleta` recebe itens vendidos, devolve o resto e aciona `awardPoints`.
4. `calculateCurrentCommission` consolida vendas do período e cruza com tiers.
5. Compartilhamentos via Web Share API disparam pontos via action dedicada.

## Regras de negócio
- RBAC: `SUPER_ADMIN`, `CONSULTORA`, `REVENDEDORA`, `CLIENTE`; consultora só vê revendedoras sob `managerId`.
- Falta de estoque em `createMaleta` aborta a transação inteira (sem maleta fantasma).
- Prazo estourado em `closeMaleta` bloqueia bônus de pontualidade (anti-fraude).
- `GamificationLedger` é append-only; saldo vem da soma do ledger.
- Comissão é calculada em período base (mês corrente) e aplicada a vendas seguintes.

## Edge cases
- Maleta com itens vendidos parcialmente → devolver quantidade não vendida ao estoque.
- Revendedora sem consultora (`managerId = null`) → permitido apenas para super admin criar maleta.
- Ledger negativo (troca de brinde) excede saldo → bloquear com `INSUFFICIENT_POINTS`.
- Web Share API indisponível → fallback para link `whatsapp://send?text=...`.

## Dependências
- `SPEC_DATABASE.md` — schema completo (Maleta, MaletaItem, GamificationLedger, CommissionTier).
- `SPEC_BACKEND.md` — `actions-maleta.ts`, `actions-gamificacao.ts`.
- `SPEC_SECURITY_RBAC.md` — regras por role.
- `SPEC_ADMIN_GAMIFICACAO.md` — UI admin de regras.
- `SPEC_PROGRESSO.md`, `SPEC_MALETA.md` — UI revendedora.

---

## Detalhes técnicos / Referência

## 1. Visão Arquitetural
A nova versão do `next-monarca` manterá a stack de Next.js 15 (App Router) e Supabase, mas com uma arquitetura separada em dois grandes módulos de acesso:
- **Área Admin/Consultora**: Em `/src/app/admin/*`, focada em features de backoffice, utilizando Server Actions pesadas e layouts para desktop.
- **Área Portal da Revendedora**: Em `/src/app/app/*`, focada 100% em Mobile-First (pensando em PWA), utilizando Server Components com forte persistência de cache para catálogo de imagens.

## 2. Modelagem de Banco de Dados (Prisma Schema)

O esquema do banco de dados será expandido para agregar as regras do PRD, focando no RBAC (Role-Based Access Control) e na nova lógica de maletas.

```prisma
// Adição ao enum existente (ou tabela de roles)
enum Role {
  SUPER_ADMIN
  CONSULTORA
  REVENDEDORA
  CLIENTE
}

// Extensão do modelo de Usuário
model User {
  id              String   @id @default(uuid())
  role            Role     @default(CLIENTE)
  
  // Hierarquia: Uma consultora tem "N" revendedoras
  managerId       String?           // Aponta para o ID de uma Consultora
  manager         User?             @relation("UserHierarchy", fields: [managerId], references: [id])
  teamMembers     User[]            @relation("UserHierarchy")
  
  // Relacionamentos
  maletasGeradas  Maleta[]          @relation("ConsultoraMaleta")
  maletasRecebidas Maleta[]         @relation("RevendedoraMaleta")
  pontuacaoPoints GamificationLedger[]
}

// Tabela de Controle de Maleta em Consignação
model Maleta {
  id              String      @id @default(uuid())
  consultoraId    String
  revendedoraId   String
  status          MaletaStatus @default(ATIVA) // ATIVA, DEVOLVIDA, CANCELADA
  startsAt        DateTime    @default(now())
  endsAt          DateTime
  returnedAt      DateTime?
  
  consultora      User        @relation("ConsultoraMaleta", fields: [consultoraId], references: [id])
  revendedora     User        @relation("RevendedoraMaleta", fields: [revendedoraId], references: [id])
  itens           MaletaItem[]
}

enum MaletaStatus {
  ATIVA
  DEVOLVIDA
  CANCELADA
}

model MaletaItem {
  id            String   @id @default(uuid())
  maletaId      String
  productId     String   // Relacionamento com o seu Product atual
  quantidade    Int
  precoUnitario Float    // Snapshot do preço no momento do giro
  isSold        Boolean  @default(false)
  
  maleta        Maleta   @relation(fields: [maletaId], references: [id], onDelete: Cascade)
  // product relation omitida...
}

// ----------------------------------------------------
// MOTOR DE GAMIFICAÇÃO
// ----------------------------------------------------

// 1. Controle de Pontos Base (Economy)
model GamificationLedger {
  id          String   @id @default(uuid())
  userId      String
  amount      Int      // Positivo (ganho) ou Negativo (troca)
  reason      String   // Ex: "MALETA_PRAZO", "COMPARTILHOU_CATALOGO", "TROCA_BRINDE"
  createdAt   DateTime @default(now())
  
  user        User     @relation(fields: [userId], references: [id])
}

// 2. Controle de Tiers de Comissão
model CommissionTier {
  id            String @id @default(uuid())
  minSalesValue Float  // Ex: A partir de 2.000.000 Gs
  commissionPct Float  // Ex: 35.0 (35%)
}
```

## 3. Server Actions e Lógica de Negócios

### 3.1. `actions-maleta.ts`
- `createMaleta(data: CreateMaletaDTO): Promise<Result>`: 
  Função transacional que irá iterar sobre os produtos selecionados e remover da tabela base do e-commerce (reservando este estoque físico) e atrelando à tabela `MaletaItem`.
- `closeMaleta(maletaId: String, itemsVendidos: String[]): Promise<Result>`: 
  Dado que as faturas são em efetivo, o script recebe quais IDs de `MaletaItem` foram tidos como VENDIDOS, reverte os estoques não vendidos, e chama a função de avaliar se essa devolução gerará pontos no ledger.

### 3.2. `actions-gamificacao.ts`
- `awardPoints(userId: string, triggers: GamificationTrigger): Promise<void>`:
  Injetada dentro do fechamento da maleta ou via API exposta se o front-end registrar um compartilhamento do link no WhatsApp.
- `calculateCurrentCommission(userId: string): Promise<number>`:
  Uma ação que soma todas as vendas fechadas contidas em maletas daquela revendedora em um Período Base (Ex: mês corrido) e cruza com a tabela `CommissionTier` para retornar quantos % ela fará de lucro nas próximas vendas.

## 4. Segurança e Row Level Security (RLS)

1. Como não usaremos RLS nativo do Supabase direto do Client, todas as consultas ao DB (`prisma.maleta.findMany(...)`) deverão passar por verificação prévia de Auth JWT (Server Component ou Server Action validation).
2. Regra Mandatória no Data-Access: 
   - Se o `AuthRole === CONSULTORA`, então deverá ser injetada a cláusula `where: { revendedora: { managerId: myUserId } }`. **Nenhuma consultora** poderá requisitar dados de maletas ou leads de sub-redes pertencentes a outra consultora.

## 5. Tratamento de Erros de Regra de Negócio

- **Falta de Estoque**: Se na emissão de uma maleta, o sistema acionar `createMaleta` e um dos SKUs não tiver a quantidade em estoque na matriz, a Server Action deve abortar toda a operação revertendo a transação (usando `$transaction` nativa do Prisma) para evitar maletas comissionadas vazias.
- **Prazo Estourado**: Se na chamada manual de `closeMaleta`, o `$now` for maior que `Maleta.endsAt`, o hook que dispara bonificação no ledger de Gamificação não deve adicionar pontos de "maleta no prazo" para tentar evitar fraudes.

## 6. Front-End: Tratamento do Compartilhamento Nativo

Na UI do `/app/catalogo-share`, vamos usar a funcionalidade Nativa PWA de "Web Share API".
```javascript
// Exemplo em Component "Compartilhar Whatsapp"
if (navigator.share) {
  navigator.share({
    title: 'Catálogo de Novidades - Monarca',
    text: 'Olha que linda essa peça!',
    url: productUrl, // A gamificação pode atrelar um ref=userId nessa URL
  });
}
```
Caso dê falha (fallback), será renderizado o link `<a href="whatsapp://send?text=...">`.
