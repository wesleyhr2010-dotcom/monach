# SPEC — Schema de Base de Dados (Fonte Única de Verdade)

## Objetivo
Servir como fonte única de verdade do schema PostgreSQL (via Prisma) do NEXT-MONARCA, agrupando modelos por módulo: identidade, produtos, maletas, gamificação, brindes, documentos, analytics e notificações.

## Atores
- **Engenharia** — usa como referência para `prisma/schema.prisma`.
- **Prisma CLI** — gera cliente tipado a partir desse schema.
- **Supabase (PostgreSQL)** — executa migrations e hospeda os dados.

## Fluxo
1. Qualquer mudança de modelo começa neste documento.
2. Sincronizar `prisma/schema.prisma` com os modelos definidos aqui.
3. Criar migration (`prisma migrate dev`) e revisar SQL.
4. Aplicar em ambientes (dev → stage → prod) conforme `SPEC_DEPLOY_STRATEGY.md`.
5. Atualizar seeds (`SPEC_MIGRATIONS_SEED.md`) se necessário.

## Regras de negócio
- IDs são UUID gerados por `uuid_generate_v4()`.
- Identificadores naturais (`slug`, `sku`, `email`) têm `@unique`.
- Valores monetários em `Decimal(12,2)`; porcentagens em `Decimal(5,2)`.
- Campos opcionais ganham default vazio/string para evitar nulls desnecessários.
- Relações cascade só quando semanticamente seguras (ex.: `MaletaItem` vs `Maleta`).
- `Reseller` é a tabela central: revendedora, colaboradora e admin via `role`.

## Edge cases
- Usuário deletado no Supabase Auth → `auth_user_id` pode ficar órfão; preservar para auditoria.
- Revendedora com `slug` duplicado → bloqueado pelo `@unique`.
- Dados legados sem `whatsapp`/`endereco` → defaults vazios evitam quebra.
- Migration destrutiva (drop column) → exige backup prévio e plano documentado.

## Dependências
- `SPEC_MIGRATIONS_SEED.md` — seeds e processo de migrations.
- `SPEC_ENVIRONMENT_VARIABLES.md` — `DATABASE_URL`, `DIRECT_URL`.
- `SPEC_SECURITY_DATA_PROTECTION.md` — dados sensíveis e retention.
- Todas as SPECs de domínio referenciam modelos aqui.

---

## Detalhes técnicos / Referência

> **Este archivo es la fuente de verdad del schema.** El `SPEC_DATABASE.md` original es una referencia condensada;
> este archivo contiene el schema Prisma completo y unificado que debe usarse para generar `schema.prisma`.

---

## Configuração del Cliente Prisma

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

---

## Módulo 1 — Identidad y Autenticación

### `Reseller` — Usuario central (revendedora / colaboradora / admin)

```prisma
model Reseller {
  id           String   @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  auth_user_id String?  @unique @db.Uuid  // FK a auth.users de Supabase
  manager_id   String?  @db.Uuid          // FK a sí mismo (consultora responsable)

  // Identidad
  name         String
  email        String   @unique
  whatsapp     String   @default("")
  avatar_url   String   @default("")
  slug         String   @unique           // ex: "ana-silva-a3f" — para vitrine pública

  // RBAC
  role         String   @default("REVENDEDORA") // "REVENDEDORA" | "COLABORADORA" | "ADMIN"

  // Comisión (definida por admin, inmutable para la revendedora)
  taxa_comissao Decimal @default(0) @db.Decimal(5,2)

  // Dirección (Paraguay)
  endereco_cep         String @default("")
  endereco_logradouro  String @default("")
  endereco_numero      String @default("")
  endereco_complemento String @default("")
  endereco_cidade      String @default("")
  endereco_estado      String @default("")

  // Datos de Candidatura (copiados del RevendedoraLead na aprovação)
  // Campos do formulário público /seja-revendedora — somente leitura no perfil admin
  cedula       String @default("")  // Cédula de Identidad
  instagram    String @default("")  // Handle sem @ (ex: "ana.silva.joyas")
  edad         String @default("")  // Edad en años
  estado_civil String @default("")  // "Solteira" | "Casada" | "Divorciada" | etc.
  hijos        String @default("")  // Número de hijos o "ninguno"
  empresa      String @default("")  // Lugar de trabajo actual
  informconf   String @default("")  // Situación crediticia (campo abierto)

  // Control
  ativo      Boolean  @default(true)
  created_at DateTime @default(now()) @db.Timestamptz()
  updated_at DateTime @updatedAt @db.Timestamptz()

  // Relaciones
  maletas             Maleta[]               @relation("ResellerMaletas")
  colaboradora        Reseller?              @relation("ManagerEquipe", fields: [manager_id], references: [id])
  equipe              Reseller[]             @relation("ManagerEquipe")
  pontos_extrato      PontosExtrato[]
  documentos          ResellerDocumento[]
  dados_bancarios     DadosBancarios?
  notif_preferencias  NotificacaoPreferencia?
  solicitacoes_brinde SolicitacaoBrinde[]
  vendas              VendaMaleta[]
  leads_atribuidos    RevendedoraLead[]      @relation("LeadsAtribuidos")

  @@index([manager_id])
  @@index([slug])
  @@map("resellers")
}
```


### `ResellerDocumento` — Documentos personales enviados para revisión

```prisma
model ResellerDocumento {
  id          String   @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  reseller_id String   @db.Uuid
  tipo        String   // "ci" | "rg" | "cpf"
  url         String   // URL en Cloudflare R2
  status      String   @default("pendente")
  // "pendente" | "em_analise" | "aprovado" | "rejeitado"
  observacao  String   @default("") // feedback del admin si fue rechazado
  created_at  DateTime @default(now()) @db.Timestamptz()
  updated_at  DateTime @updatedAt @db.Timestamptz()

  reseller Reseller @relation(fields: [reseller_id], references: [id], onDelete: Cascade)

  @@index([reseller_id])
  @@map("reseller_documentos")
}
```

### `Contrato` — PDFs de contrato gestionados por el admin

```prisma
model Contrato {
  id          String   @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  nome        String   // "Término de Consignación 2026"
  url         String   // URL del PDF en R2
  obrigatorio Boolean  @default(false)
  ativo       Boolean  @default(true)
  created_at  DateTime @default(now()) @db.Timestamptz()

  @@map("contratos")
}
```

### `DadosBancarios` — Datos bancários para pago de comisiones (Paraguay)

```prisma
model DadosBancarios {
  id            String   @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  reseller_id   String   @unique @db.Uuid
  tipo          String   // "alias" | "cuenta_bancaria"

  // Alias Bancard (equivalente al PIX paraguayo)
  alias_tipo    String?  // "CI" | "RUC" | "Celular" | "Email"
  alias_valor   String?
  alias_titular String?
  alias_ci_ruc  String?

  // Cuenta bancária tradicional
  banco         String?
  agencia       String?
  cuenta        String?
  tipo_cuenta   String?  // "corriente" | "ahorro"
  titular       String?
  ci_ruc        String?

  created_at DateTime @default(now()) @db.Timestamptz()
  updated_at DateTime @updatedAt @db.Timestamptz()

  reseller Reseller @relation(fields: [reseller_id], references: [id], onDelete: Cascade)
  @@map("datos_bancarios")
}
```

---

## Módulo 2 — Catálogo de Productos

### `Product` — Producto base (joya/semijoya)

```prisma
model Product {
  id          String   @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  name        String
  description String   @default("")
  category_id String?  @db.Uuid
  ativo       Boolean  @default(true)
  created_at  DateTime @default(now()) @db.Timestamptz()
  updated_at  DateTime @updatedAt @db.Timestamptz()

  category Category?        @relation(fields: [category_id], references: [id])
  variants ProductVariant[]

  @@map("products")
}
```

### `ProductVariant` — Variante con precio y stock

```prisma
model ProductVariant {
  id          String   @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  product_id  String   @db.Uuid
  sku         String   @unique
  name        String   @default("")  // ej: "Talla M / Dorado"
  price       Decimal  @db.Decimal(12,2)
  stock       Int      @default(0)
  image_url   String   @default("")
  ativo       Boolean  @default(true)
  created_at  DateTime @default(now()) @db.Timestamptz()

  product     Product      @relation(fields: [product_id], references: [id])
  maleta_itens MaletaItem[]

  @@index([product_id])
  @@map("product_variants")
}
```

### `Category` — Categorías jerárquicas

```prisma
model Category {
  id        String    @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  name      String
  slug      String    @unique
  parent_id String?   @db.Uuid
  ordem     Int       @default(0)
  ativo     Boolean   @default(true)

  parent   Category?  @relation("CategoryHierarchy", fields: [parent_id], references: [id])
  children Category[] @relation("CategoryHierarchy")
  products Product[]

  @@map("categories")
}
```

---

## Módulo 3 — Sistema de Maletas (Core del negocio)

### `Maleta` — Consignación enviada a la revendedora

```prisma
model Maleta {
  id          String   @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  numero      Int      @default(autoincrement()) // Nro legible: #102
  reseller_id String   @db.Uuid
  criada_por  String   @db.Uuid                  // ID del admin/colaboradora que creó

  status      String   @default("ativa")
  // "ativa" | "atrasada" | "aguardando_revisao" | "concluida"

  data_limite DateTime @db.Timestamptz()          // Fecha de vencimiento

  // Snapshot financiero (calculado al cerrar — INMUTABLE)
  valor_total_enviado   Decimal? @db.Decimal(12,2)  // Σ(precio × cant_enviada)
  valor_total_vendido   Decimal? @db.Decimal(12,2)  // Σ(precio × cant_vendida)
  valor_comissao_revendedora Decimal? @db.Decimal(12,2)
  pct_comissao_aplicado    Decimal? @db.Decimal(5,2) // % congelado en el cierre
  nota_acerto          String?                       // Observaciones del admin

  // Devolución
  comprovante_devolucao_url String?   // URL de la foto en R2

  created_at DateTime @default(now()) @db.Timestamptz()
  updated_at DateTime @updatedAt @db.Timestamptz()

  reseller Reseller     @relation("ResellerMaletas", fields: [reseller_id], references: [id])
  itens    MaletaItem[]
  vendas   VendaMaleta[]

  @@index([reseller_id])
  @@index([status])
  @@map("maletas")
}
```

### `MaletaItem` — Item dentro de la maleta

```prisma
model MaletaItem {
  id                 String   @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  maleta_id          String   @db.Uuid
  product_variant_id String   @db.Uuid

  // Snapshot del precio al momento del envío (INMUTABLE)
  preco_fixado      Decimal  @db.Decimal(12,2)

  quantidade_enviada Int      @default(1)
  quantidade_vendida Int      @default(0)   // Incrementado por registrarVenda()
  quantidade_recebida Int?                  // Llenado en la conferencia física

  created_at DateTime @default(now()) @db.Timestamptz()

  maleta          Maleta         @relation(fields: [maleta_id], references: [id])
  product_variant ProductVariant @relation(fields: [product_variant_id], references: [id])
  vendas          VendaMaleta[]

  @@index([maleta_id])
  @@map("maleta_items")
}
```

### `VendaMaleta` — Registro de venta individual

```prisma
model VendaMaleta {
  id              String   @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  maleta_id       String   @db.Uuid
  maleta_item_id  String   @db.Uuid
  reseller_id     String   @db.Uuid

  // Datos del cliente (capturados por la revendedora)
  cliente_nome    String
  cliente_telefone String

  preco_unitario  Decimal  @db.Decimal(12,2) // Snapshot del precio al momento de la venta
  created_at      DateTime @default(now()) @db.Timestamptz()

  maleta      Maleta     @relation(fields: [maleta_id], references: [id])
  maleta_item MaletaItem @relation(fields: [maleta_item_id], references: [id])
  reseller    Reseller   @relation(fields: [reseller_id], references: [id])

  @@index([maleta_id])
  @@index([reseller_id])
  @@map("vendas_maleta")
}
```

---

## Módulo 4 — Gamificación

### `GamificacaoRegra` — Reglas configurables de gamificación

```prisma
model GamificacaoRegra {
  id        String  @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  nome      String  // Nombre legible: "Venta en Maleta"
  descricao String  @default("")
  acao      String  @unique  // Clave técnica INMUTABLE: "venda_maleta"
  pontos    Int
  ativo     Boolean @default(true)
  icone     String  @default("star")     // Ícono Lucide
  tipo      String  @default("por_evento")
  // "diario" | "unico" | "por_evento" | "mensal"
  limite_diario Int?    // null = ilimitado
  meta_valor    Decimal? @db.Decimal(12,2) // Solo para acao = "meta_mensal"
  ordem         Int     @default(0)

  extrato PontosExtrato[]

  @@map("gamificacao_regras")
}
```

> **Valores del campo `acao`** (seed obligatorio):
> `primeiro_acesso`, `perfil_completo`, `venda_maleta`, `devolucao_prazo`,
> `maleta_completa`, `compartilhou_catalogo`, `meta_mensal`

### `PontosExtrato` — Historial de puntos (débitos y créditos)

```prisma
model PontosExtrato {
  id          String   @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  reseller_id String   @db.Uuid
  pontos      Int      // Positivo = ganado, Negativo = canje de regalo
  descricao   String   // "venda_maleta" | "Canje: Neceser Monarca Gold" | etc.
  regra_id    String?  @db.Uuid  // null en canjes (no tienen regla)
  created_at  DateTime @default(now()) @db.Timestamptz()

  reseller Reseller          @relation(fields: [reseller_id], references: [id])
  regra    GamificacaoRegra? @relation(fields: [regra_id], references: [id])

  @@index([reseller_id])
  @@index([created_at])
  @@map("pontos_extrato")
}
```

> ⚠️ **Protección anti-duplicados para tipo='unico':**  
> Verificar en código: antes de `awardPoints()` contar existencias en `pontos_extrato`  
> donde `descricao = regra.acao AND reseller_id = X`. Si `count >= 1`, no pontuar.  
> Candidato futuro: partial unique index `CREATE UNIQUE INDEX ON pontos_extrato(reseller_id, descricao) WHERE descricao IN ('primeiro_acesso','perfil_completo')`.

### `NivelRegra` — Niveles de gamificación (Bronce/Plata/Oro/Diamante)

```prisma
model NivelRegra {
  id             String  @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  nome           String  // "Bronce" | "Plata" | "Oro" | "Diamante"
  pontos_minimos Int
  cor            String  // "#CD7F32" | "#C0C0C0" | "#FFD700" | "#B9F2FF"
  ordem          Int     @default(0)
  ativo          Boolean @default(true)

  @@map("nivel_regras")
}
```

### `CommissionTier` — Tramos de comisión por volumen de ventas

```prisma
model CommissionTier {
  id              String  @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  min_sales_value Decimal @db.Decimal(12,2)
  pct             Decimal @db.Decimal(5,2)  // Ex: 25.00 = 25%
  ativo           Boolean @default(true)

  @@map("commission_tiers")
}
```

---

## Módulo 5 — Brindes (Regalos)

### `Brinde` — Catálogo de regalos rescatables

```prisma
model Brinde {
  id           String   @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  nome         String
  descricao    String   @default("")
  imagem_url   String
  custo_pontos Int      // Puntos necesarios para canjear
  estoque      Int      @default(0) // -1 = ilimitado
  ativo        Boolean  @default(true)
  created_at   DateTime @default(now()) @db.Timestamptz()

  solicitacoes SolicitacaoBrinde[]
  @@map("brindes")
}
```

### `SolicitacaoBrinde` — Solicitud de canje de regalo

```prisma
model SolicitacaoBrinde {
  id              String   @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  reseller_id     String   @db.Uuid
  brinde_id       String   @db.Uuid
  pontos_debitados Int     // Snapshot del costo al momento del canje
  status          String   @default("pendente")
  // "pendente" | "separado" | "entregado"
  created_at      DateTime @default(now()) @db.Timestamptz()

  reseller Reseller @relation(fields: [reseller_id], references: [id])
  brinde   Brinde   @relation(fields: [brinde_id], references: [id])

  @@index([reseller_id])
  @@index([status])
  @@map("solicitacoes_brinde")
}
```

---

## Módulo 6 — Notificaciones

### `NotificacaoPreferencia` — Preferencias de notificación por revendedora

```prisma
model NotificacaoPreferencia {
  id              String  @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  reseller_id     String  @unique @db.Uuid

  // Categorías (default: true, excepto pontos_ganados)
  nova_maleta       Boolean @default(true)
  prazo_proximo     Boolean @default(true)
  maleta_atrasada   Boolean @default(true)
  acerto_confirmado Boolean @default(true)
  brinde_entregue   Boolean @default(true)
  pontos_ganhos     Boolean @default(false) // off por defecto — puede ser muy frecuente

  updated_at DateTime @updatedAt @db.Timestamptz()

  reseller Reseller @relation(fields: [reseller_id], references: [id], onDelete: Cascade)
  @@map("notificacao_preferencias")
}
```

---

## Módulo 7 — Analytics

### `AnalyticsAcesso` — Eventos individuales de acceso a la vitrina

```prisma
model AnalyticsAcesso {
  id          String   @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  reseller_id String   @db.Uuid
  tipo_evento String   // "catalogo_revendedora" | "clique_whatsapp"
  visitor_id  String?  // Cookie anónimo (ver SPEC_VITRINE_PUBLICA.md para detalle)
  produto_id  String?  @db.Uuid  // Solo para tipo_evento = "clique_whatsapp"
  created_at  DateTime @default(now()) @db.Timestamptz()

  @@index([reseller_id])
  @@index([created_at])
  @@map("analytics_acessos")
}
```

### `AnalyticsDiario` — Agregado diario de visitas por revendedora

```prisma
model AnalyticsDiario {
  id          String   @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  reseller_id String   @db.Uuid
  data        DateTime @db.Date    // Fecha sin hora
  visitas     Int      @default(0)
  visitantes_unicos Int @default(0)
  cliques_whatsapp  Int @default(0)

  @@unique([reseller_id, data]) // Un registro por revendedora por día
  @@index([reseller_id])
  @@map("analytics_diario")
}
```

> **Estrategia de poblado:** El cron job nocturno agrega los datos de `AnalyticsAcesso`  
> del día anterior en `AnalyticsDiario` para queries eficientes de gráficos.

---

## Módulo 8 — Candidaturas (Leads de Revendedoras)

### `RevendedoraLead` — Solicitud pública de ser revendedora

> Creada cuando una candidata completa el formulario en `/seja-revendedora`.
> El admin la aprueba o rechaza desde `/admin/leads`.

```prisma
enum LeadStatus {
  pendente
  aprovado
  rejeitado

  @@map("lead_status")
}

model RevendedoraLead {
  id           String     @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid

  // Datos del formulario público (campos del Google Form)
  nome         String
  cedula       String                  // Cédula de Identidad
  edad         String
  direccion    String                  // Ciudad, barrio, departamento
  estado_civil String     @default("")
  hijos        String     @default("")  // "2" | "ninguno"
  instagram    String     @default("")  // Handle sin @
  whatsapp     String
  empresa      String     @default("")  // Lugar de trabajo actual
  informconf   String     @default("")  // Situación en Informconf (campo abierto)

  // Gestión del admin
  status          LeadStatus @default(pendente)
  taxa_comissao   Decimal?   @db.Decimal(5, 2)    // Definida por el admin al aprobar
  colaboradora_id String?    @db.Uuid              // Asignada al aprobar
  observacao_admin String    @default("")           // Notas internas o motivo de rechazo

  created_at DateTime @default(now()) @db.Timestamptz()
  updated_at DateTime @default(now()) @updatedAt @db.Timestamptz()

  colaboradora Reseller? @relation("LeadsAtribuidos", fields: [colaboradora_id], references: [id])

  @@index([status])
  @@index([created_at])
  @@map("revendedora_leads")
}
```

> **Nota:** Agregar relación inversa en el modelo `Reseller`:
> ```prisma
> leads_atribuidos RevendedoraLead[] @relation("LeadsAtribuidos")
> ```

---

## Resumen de Tablas

| Módulo | Tablas |
|--------|--------|
| Identidad | `resellers`, `reseller_documentos`, `contratos`, `datos_bancarios` |
| Catálogo | `products`, `product_variants`, `categories` |
| Maletas | `maletas`, `maleta_items`, `vendas_maleta` |
| Gamificación | `gamificacao_regras`, `pontos_extrato`, `nivel_regras`, `commission_tiers` |
| Brindes | `brindes`, `solicitacoes_brinde` |
| Notificaciones | `notificacao_preferencias` |
| Analytics | `analytics_acessos`, `analytics_diario` |
| Candidaturas | `revendedora_leads` |

**Total: 19 tablas**

---

## Variables de Entorno Requeridas

```env
# Supabase
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# Cloudflare R2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=monarca-assets
R2_PUBLIC_URL=https://assets.monarca.com.py

# OneSignal
NEXT_PUBLIC_ONESIGNAL_APP_ID=
ONESIGNAL_REST_API_KEY=

# App
NEXT_PUBLIC_SITE_URL=https://monarca.com.py
```
