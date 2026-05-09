---
phase: 17
slug: pdv-core-cotizacion-fluxo-venda
status: draft
shadcn_initialized: true
preset: none
created: 2026-05-08
---

# Phase 17 — UI Design Contract: PDV Core

> Contrato visual e de interação para as duas telas do PDV Core.
> Gerado por gsd-ui-researcher. Consumido por gsd-planner e gsd-executor.

---

## Design System

| Campo | Valor |
|-------|-------|
| Tool | shadcn/ui (já inicializado) |
| Preset | none — tokens admin manuais via CSS variables |
| Component library | shadcn/ui + componentes admin existentes (`src/components/admin/`) |
| Icon library | lucide-react (já em uso no projeto) |
| Font | Raleway (corpo/UI admin) + Playfair Display (títulos `AdminPageHeader`) |

---

## Spacing Scale

Todos os espaçamentos usam a escala de 4pt do projeto. Zero px hardcoded em JSX de produção.

| Token / classe utilitária | Valor px | Uso típico nesta fase |
|---------------------------|----------|-----------------------|
| `gap-1` / `p-1` | 4 | Separação mínima entre ícone e texto inline |
| `gap-2` / `p-2` | 8 | Espaço interno de badges e pills |
| `gap-3` / `p-3` | 12 | Padding interno de linhas de produto no carrinho; altura de inputs de busca (`py-3`) |
| `gap-4` / `p-4` | 16 | Padding de cards (`admin-card`) |
| `gap-6` / `p-6` | 24 | Espaço entre seções dentro de um card |
| `gap-8` / `mt-8` | 32 | Separação entre blocos de conteúdo |
| `mt-3` / `mb-3` | 12 | Label para input |
| Toque mínimo | 44px | Botões +/- de quantidade (touch target) — min `h-11 w-11` |

Exceções: nenhuma. `py-2.5` (10px) removido — substituído por `py-3` (12px) nos inputs de busca.

---

## Typography

Todos os tamanhos usam `fontFamily: Raleway, system-ui, sans-serif` exceto onde indicado.

| Role | Tamanho | Peso | Line-height | Uso |
|------|---------|------|-------------|-----|
| Page title | 24px (classe `admin-page-title`) | **600** (Playfair Display, herdado da classe existente) | 1.2 | `AdminPageHeader` título — estilo encapsulado no componente, não introduzir `font-bold` manualmente |
| Section heading | 16px (`text-base font-semibold`) | 600 | 1.3 | Cabeçalho de card ("Paso 3 — Productos") |
| Body / label | 14px (`text-sm`) | 400 | 1.5 | Rótulos de formulário, descrições, page description |
| Caption / meta | 12px (`text-xs`) | 400 | 1.4 | Stock disponível, metadados de produto, timestamps, breadcrumb |

**Escala de pesos: 2 valores — 400 (regular) e 600 (semibold).** O peso 700 (`font-bold`) é usado internamente pelo `AdminPageHeader` / `admin-page-title` CSS class — componente pré-existente, não introduzir peso 700 em nenhum elemento novo desta fase.

Exceções fora da escala: breadcrumb usa `text-[10px] tracking-[1px] uppercase` — estilo herdado do `AdminPageHeader`, não introduzir em novas UIs desta fase. Texto descritivo secundário usa `text-sm` (14px), não criar tamanho 13px.

---

## Color

Todos os valores referenciam CSS variables. Nunca hex raw em JSX de produção.

**Distribuição 60/30/10:** `--admin-bg` + `--admin-surface` cobrem ~60% (backgrounds e superfícies); `--admin-surface-hover` + cards e modais cobrem ~30%; `--admin-accent` cobre ~10% (CTAs primários, step ativo, total em destaque).

| Role | CSS Variable | Hex de referência | Uso |
|------|-------------|-------------------|-----|
| Background geral | `var(--admin-bg)` | #0a0a0a | Fundo da página, fundo de linhas de produto |
| Surface (card) | `var(--admin-surface)` | #171717 | Todos os `admin-card` nesta fase |
| Surface hover | `var(--admin-surface-hover)` | #222222 | Hover em linhas de produto no buscador |
| Borda | `var(--admin-border)` | #2a2a2a | Bordas de cards, separadores, inputs |
| Borda em foco | `var(--admin-border-focus)` | #35605a | Input focado |
| Texto principal | `var(--admin-text)` | #ededed | Labels, nomes de produto, totais |
| Texto secundário | `var(--admin-text-muted)` | #888888 | Stock, preço unitário, metadados |
| Texto terciário / placeholder | `var(--admin-text-dim)` | #444444 | Placeholders de input |
| Accent (CTA primário) | `var(--admin-accent)` | #35605a | Botão "Confirmar venta", step ativo, total em destaque |
| Accent hover | `var(--admin-accent-hover)` | #2a4d48 | Hover no CTA primário |
| Sucesso | `var(--admin-success)` | #4ade80 | Splash de venda concluída, badge stock "ok" |
| Sucesso 10% | `var(--admin-success-10)` | rgba(74,222,128,0.1) | Background do splash de sucesso |
| Danger | `var(--admin-danger)` | #e05c5c | Mensagens de stock insuficiente, erro de busca RUC |
| Danger 10% | `var(--admin-danger-10)` | rgba(224,92,92,0.1) | Background de alerta de stock |
| Warning | `var(--admin-warning)` | #facc15 | Badge "última unidad" (stock = 1) |
| Warning 10% | `var(--admin-warning-10)` | rgba(250,204,21,0.1) | Background do aviso de última unidade |
| Muted 10% | `var(--admin-muted-10)` | rgba(136,136,136,0.1) | Pill do step inativo no StepIndicator |

**Accent reservado para:**
- Botão de CTA primário de navegação ("Guardar cotización", botões "Siguiente" / "Anterior" no PDV)
- Step ativo no `AdminStepIndicator`
- Valor total da venda em destaque no painel lateral do carrinho
- Borda de input em foco (`--admin-border-focus`)

**Nota — botão "Confirmar venta":** usa `var(--admin-success)` como background (semântica de conclusão de venda), NÃO `--admin-accent`. É o único CTA que usa success bg. Isso é intencional — diferencia confirmação final dos passos de navegação.

**Danger reservado para:**
- Mensagem de stock insuficiente ao tentar adicionar produto
- Erro de validação do server action na confirmação da venta

---

## Copywriting Contract — /admin/config/cotizacion

Tela simples de configuração de câmbio. Idioma: espanhol paraguaio.

| Elemento | Cópia ES-PY |
|----------|-------------|
| Breadcrumb | `Configuración` |
| Page title | `Cotización del Día` |
| Page description | `Ingresá las tasas de cambio vigentes. Cada guardado crea un nuevo registro — no se sobreescribe el historial.` |
| Label campo BRL | `1 Real (BRL) =` |
| Placeholder campo BRL | `Ej: 1400` |
| Unidade BRL | `Gs.` (após o input) |
| Label campo USD | `1 Dólar (USD) =` |
| Placeholder campo USD | `Ej: 7500` |
| Unidade USD | `Gs.` (após o input) |
| CTA guardar | `Guardar cotización` |
| Estado salvando | `Guardando...` |
| Última atualização (label) | `Última actualización:` |
| Formato timestamp | `08/05/2026 a las 14:30` |
| Empty state (sem cotizacion) | `Todavía no hay cotizaciones registradas. Ingresá los valores actuales para empezar.` |
| Sucesso ao salvar | `Cotización guardada correctamente.` |
| Erro ao salvar | `No se pudo guardar la cotización. Verificá los valores e intentá de nuevo.` |
| Historial section title | `Historial de cotizaciones` |
| Coluna tabela historial | `Fecha / hora`, `BRL → Gs.`, `USD → Gs.` |
| Empty historial | `Sin registros anteriores.` |

---

## Copywriting Contract — /admin/pdv

Tela de PDV com fluxo multi-step. Idioma: espanhol paraguaio.

### Global / navegação

| Elemento | Cópia ES-PY |
|----------|-------------|
| Breadcrumb | `Ventas` |
| Page title | `Punto de Venta` |
| Page description | `Registrá una venta en la tienda física.` |
| Botão "Anterior" | `← Anterior` |
| Botão "Siguiente" | `Siguiente →` |
| Botão CTA final | `Confirmar venta` |
| Estado confirmando | `Procesando...` |

### Step 1 — Identificación del cliente

| Elemento | Cópia ES-PY |
|----------|-------------|
| Step label | `Cliente` |
| Section heading | `¿Quién compra?` |
| Label campo RUC | `RUC / Cédula` |
| Placeholder RUC | `Buscá por RUC o cédula` |
| Botão buscar | `Buscar cliente` |
| Estado buscando | `Buscando...` |
| Cliente encontrado (badge) | `Cliente encontrado` |
| Cliente não encontrado (mensagem) | `No encontramos a nadie con ese RUC. ¿Querés registrarlo?` |
| Botão registrar cliente inline | `Registrar cliente` |
| Botão skip (consumidor final) | `Continuar como Consumidor Final` |
| Label mini-form nombre | `Nombre completo` |
| Placeholder mini-form nombre | `Ej: María González` |
| Label mini-form ciudad | `Ciudad` |
| Placeholder mini-form ciudad | `Ej: Asunción` |
| Label mini-form telefono | `Teléfono (opcional)` |
| Placeholder mini-form telefono | `Ej: 0981 000 000` |
| CTA mini-form | `Guardar y continuar` |
| Estado salvando mini-form | `Guardando...` |
| Erro mini-form (nombre vacío) | `El nombre es obligatorio.` |
| Erro mini-form (RUC duplicado) | `Ya existe un cliente con ese RUC.` |
| Consumidor Final (label) | `Consumidor Final` |
| Consumidor Final (sub-label) | `Sin identificación registrada` |
| Botão trocar cliente (após seleção) | `Cambiar cliente` |

### Step 2 — Productos

| Elemento | Cópia ES-PY |
|----------|-------------|
| Step label | `Productos` |
| Section heading | `Agregá productos a la venta` |
| Placeholder busca | `Buscar por nombre...` |
| Label filtro categoria | `Categoría` |
| Opção "todas categorias" | `Todas las categorías` |
| Stock disponível (caption) | `Stock: {n}` |
| Badge última unidade | `Última unidad` |
| Sem resultados (busca) | `No encontramos productos con "{query}".` |
| Sem resultados (sem stock) | `Sin productos con stock disponible.` |
| Botão adicionar produto | `Agregar al carrito` |
| Produto já no carrinho (estado) | `En carrito` (desabilitado) |
| Carrinho vazio (empty state title) | `El carrito está vacío` |
| Carrinho vazio (description) | `Buscá y agregá productos para continuar.` |
| Erro stock insuficiente | `Stock insuficiente. Solo hay {n} unidad(es) disponible(s).` |
| Label subtotal (carrinho) | `Subtotal` |
| Label quantidade (carrinho) | `Cant.` |
| Tooltip remover item | `Quitar del carrito` |

### Step 3 — Moneda

| Elemento | Cópia ES-PY |
|----------|-------------|
| Step label | `Moneda` |
| Section heading | `¿En qué moneda se paga?` |
| Opção Guaraní | `Guaraní (Gs.)` |
| Opção Dólar | `Dólar (USD)` |
| Opção Real | `Real (BRL)` |
| Cotização display | `1 USD = 7.800 Gs. · Actualizado 08/05 14:30` |
| Cotização sem dados | `Sin cotización registrada hoy. Pedile al admin que la actualice.` |
| Total em PYG (label) | `Total estimado en Gs.` |
| Nota conversão | `Los precios del sistema están en Gs. Esta cotización es orientativa.` |

### Step 4 — Resumen

| Elemento | Cópia ES-PY |
|----------|-------------|
| Step label | `Resumen` |
| Section heading | `Revisá la venta antes de confirmar` |
| Cliente section label | `Cliente` |
| Productos section label | `Productos` |
| Moneda section label | `Moneda de pago` |
| Total label | `Total` |
| Coluna tabla | `Producto`, `Cant.`, `Precio unit.`, `Subtotal` |
| Aviso estoque (alerta) | `Al confirmar, el stock de los productos seleccionados se actualizará automáticamente.` |
| Erro server (confirmação) | `No se pudo registrar la venta. Intentá de nuevo o verificá el stock disponible.` |

### Splash de sucesso (post-confirmação)

| Elemento | Cópia ES-PY |
|----------|-------------|
| Ícone central | CheckCircle (lucide) — `var(--admin-success)` — 64px |
| Heading principal | `¡Venta registrada!` |
| Sub-heading | `La venta fue guardada correctamente.` |
| Total resumido | `Total: {valor} Gs.` |
| Cliente resumido | `Cliente: {nombre}` ou `Consumidor Final` |
| Botão principal | `Nueva venta` |
| Botão secundário | `Ver detalles` (link para futura tela de detalhe da venda) |

---

## Component Inventory

### /admin/config/cotizacion

| Componente | Fonte | Props / Notas |
|------------|-------|---------------|
| `AdminPageHeader` | admin-existing (`src/components/admin/AdminPageHeader.tsx`) | `title="Cotización del Día"`, `description={...}`, `breadcrumb="Configuración"` |
| `admin-card` (div) | admin CSS class | Container único para o formulário de câmbio |
| `<input type="number">` | HTML nativo + classe `admin-input` | `min="1"`, `step="0.01"` para BRL e USD |
| Botão salvar | `admin-btn admin-btn-primary` | Texto "Guardar cotización" |
| Alerta de sucesso inline | `admin-alert admin-alert-success` (classe CSS existente) | Aparece abaixo do botão após save |
| Alerta de erro inline | `admin-alert admin-alert-error` | Aparece abaixo do botão em caso de falha |
| `<table>` historial | `admin-table` (classe CSS existente) | Colunas: data/hora, BRL→Gs., USD→Gs. |
| `AdminEmptyState` | admin-existing | Para histórico vazio e para estado inicial sem cotação |

### /admin/pdv

#### Layout geral

| Componente | Fonte | Props / Notas |
|------------|-------|---------------|
| `AdminPageHeader` | admin-existing | `title="Punto de Venta"`, `breadcrumb="Ventas"` |
| `AdminStepIndicator` | admin-existing (`src/components/admin/AdminStepIndicator.tsx`) | `steps={PDV_STEPS}`, `currentStep={step}` — 4 steps |

#### Step 1 — Cliente

| Componente | Fonte | Props / Notas |
|------------|-------|---------------|
| `admin-card` (div) | admin CSS class | Container do passo |
| `<input type="text">` RUC | `admin-input` + shadcn `Input` | Busca por RUC com debounce 400ms |
| Botão buscar | `admin-btn admin-btn-secondary admin-btn-sm` | Dispara busca manual além do debounce |
| Cliente encontrado — row inline | div com `var(--admin-bg)` + `var(--admin-radius)` | Mostra nome, RUC, cidade — padrão idêntico ao AdminAvatar row de maleta/nova |
| Badge "Cliente encontrado" | `admin-btn` pill pequeno, `var(--admin-success-10)` bg + `var(--admin-success)` text | Não é AdminStatusBadge (aquela é tipada para MaletaStatus) — criar pill inline |
| Mini-form inline | Seção colapsível dentro do mesmo card | Campos: nombre, ciudad, telefono. Aparece só quando cliente não encontrado e admin clica "Registrar cliente" |
| `<input>` nombre | `admin-input` | required |
| `<input>` ciudad | `admin-input` | optional |
| `<input>` telefono | `admin-input` | optional |
| Botão "Guardar e continuar" (mini-form) | `admin-btn admin-btn-primary` | Cria cliente + avança para step 2 |
| Botão "Continuar como Consumidor Final" | `admin-btn admin-btn-secondary` | Pula identificação |
| Pill "Consumidor Final" | div inline, `var(--admin-muted-10)` bg, `var(--admin-text-muted)` text | Substituí o row de cliente quando sem identificação |

#### Step 2 — Produtos

| Componente | Fonte | Props / Notas |
|------------|-------|---------------|
| Layout dois-colunas | CSS Grid `grid-cols-[1fr_360px]` | Coluna esquerda: buscador. Direita: carrinho. Em telas < 1024px: stack vertical |
| `AdminFilterBar` | admin-existing | `searchPlaceholder="Buscar por nombre..."`, filtro de categoria como `filters[]` prop |
| Lista de produtos | div scrollável `maxHeight: 480px` com `overflowY: auto` | Padrão idêntico ao buscador de variantes em `maleta/nova` |
| Produto row | div hover + `var(--admin-surface-hover)` | Thumbnail 40x40 + nome + stock caption + botão "Agregar" |
| `<img>` thumbnail produto | `admin-table-thumb` CSS class | Fallback: ícone `Package` lucide |
| Badge "Última unidad" | pill, `var(--admin-warning-10)` bg + `var(--admin-warning)` text, `text-xs font-semibold` (12px/600) | Mostrado quando `stock_quantity === 1` |
| Badge "En carrito" | pill, `var(--admin-muted-10)` bg + `var(--admin-text-muted)` text, disabled | Quando produto já foi adicionado ao carrinho |
| `AdminEmptyState` (sem stock) | admin-existing | `icon={Package}` |
| Carrinho (coluna direita) | `admin-card` fixo | Heading "Carrito ({n} ítems)" + lista + total |
| Item do carrinho | div com `var(--admin-bg)` bg | Thumbnail + nome + controles +/- + remover |
| Controles quantidade | `admin-btn admin-btn-icon` (44px min touch) | Botões `<Minus>` e `<Plus>` lucide; `aria-label="Reducir cantidad"` e `aria-label="Aumentar cantidad"` obrigatórios |
| Remover item | `admin-btn admin-btn-icon` com `var(--admin-danger)` | Ícone `<Trash2>` lucide; `aria-label="Quitar del carrito"` obrigatório |
| Subtotal badge | pill `var(--admin-accent)` text | "Total: {valor} Gs." no topo do carrinho |
| `AdminEmptyState` (carrinho vazio) | admin-existing | `icon={Package}`, sem action |
| Alerta stock insuficiente | `admin-alert admin-alert-error` inline | Aparece abaixo do botão "Agregar" se stock < quantidade solicitada |

#### Step 3 — Moneda

| Componente | Fonte | Props / Notas |
|------------|-------|---------------|
| `admin-card` (div) | admin CSS class | Container do passo |
| Grupo de radio visual | 3 cards clicáveis com borda | PYG / USD / BRL — selecionado: `border: var(--admin-accent)`, não selecionado: `border: var(--admin-border)` |
| Display cotização | div row com `var(--admin-surface)` bg + `var(--admin-border)` border | "1 USD = 7.800 Gs. · Actualizado 08/05 14:30" — caption `text-xs` `var(--admin-text-muted)` |
| Total estimado | `text-2xl font-semibold var(--admin-text)` | Valor em PYG calculado client-side com snapshot da cotização |
| Alerta sem cotização | `admin-alert admin-alert-warning` | Quando nenhuma cotizacion_dia registrada |

#### Step 4 — Resumen

| Componente | Fonte | Props / Notas |
|------------|-------|---------------|
| `admin-card` (div) | admin CSS class | Container do passo |
| Row cliente | div `var(--admin-bg)` bg | Nome + RUC (ou "Consumidor Final") |
| Tabela de itens | `admin-table` CSS class | Produto, Cant., Precio unit., Subtotal |
| Separador | `border-t var(--admin-border)` | Acima da linha de total |
| Total final | `text-base font-semibold var(--admin-accent)` | "{valor} Gs." — `text-base` (16px) dentro da escala; semibold para destaque sem introduzir peso extra |
| Alerta pre-confirmação | `admin-alert admin-alert-warning` | Texto sobre movimentação de estoque |
| Alerta erro server | `admin-alert admin-alert-error` | Aparece em baixo do botão confirmar |
| Botão "Confirmar venta" | `admin-btn admin-btn-primary` com `var(--admin-success)` bg + `var(--admin-bg)` text | Estado loading: "Procesando..." + disabled |

#### Splash de sucesso

| Componente | Fonte | Props / Notas |
|------------|-------|---------------|
| Container overlay | div full-width, `var(--admin-surface)` bg, `var(--admin-radius-lg)` border-radius | Substitui todo o conteúdo de steps quando venda concluída |
| Ícone CheckCircle | lucide `CheckCircle` 64px | cor: `var(--admin-success)` |
| Heading "¡Venta registrada!" | `text-2xl font-semibold var(--admin-text)` Raleway | |
| Sub-texto resumo | `text-sm var(--admin-text-muted)` | Total + nome do cliente |
| Botão "Nueva venta" | `admin-btn admin-btn-primary` | Reseta todo o state do PDV (step→0, carrinho→[], cliente→null) |
| Botão "Ver detalles" | `admin-btn admin-btn-secondary` | Link para `/admin/ventas/{id}` (tela futura) |

---

## Interaction Specs

### Focal Point por Step

| Step | Ancora visual primária |
|------|------------------------|
| Step 1 — Cliente | Campo de busca RUC — full-width, `autoFocus` no mount |
| Step 2 — Productos | Campo de busca por nome — `autoFocus` no mount; carrinho visível na coluna direita |
| Step 3 — Moneda | Grupo de radio (3 cards) — seleção de Guaraní pré-selecionada por padrão |
| Step 4 — Resumen | Botão "Confirmar venta" (`var(--admin-success)` bg) — âncora visual final |

### Ação "Quitar del carrito"

Remoção de item do carrinho NÃO exige confirmação modal — o estado é puramente client-side e imediatamente reversível re-adicionando o produto. Declaração explícita: "ação destrutiva imediatamente reversível dentro da mesma sessão, sem persistência — confirmação omitida por design".

---

### Stock Validation (D-17-PDV-03)

**Quando bloquear:** ao clicar no botão "Agregar" de um produto, antes de adicionar ao carrinho.

**Verificação client-side:**
1. Se o produto já está no carrinho e o usuário tenta adicionar novamente → mostrar badge "En carrito" (botão desabilitado, sem mensagem de erro).
2. Se `stock_quantity === 0` → o produto não aparece na lista (filtrado na query server).
3. Se `stock_quantity === 1` → mostrar badge "Última unidad" (warning), produto permanece adicionável.
4. Ao incrementar `+` no carrinho: se `quantidade + 1 > stock_quantity` → botão `+` desabilitado (não bloquear com mensagem, apenas travar o incremento).

**Verificação server-side:**
- Server action `criarVentaLoja` re-valida stock no momento do `INSERT`. Se stock insuficiente: retornar `{ success: false, error: "STOCK_INSUFICIENTE", produto: "{nome}" }`.
- UI exibe: `admin-alert admin-alert-error` — "No se pudo registrar la venta. Intentá de nuevo o verificá el stock disponible." (sem expor nome do produto no erro genérico ao usuário final).

**Visual feedback ao bloquear `+`:**
- Botão `+` recebe `opacity: 0.4` e `cursor: not-allowed` quando no máximo de stock.
- Sem toast, sem modal — bloqueio silencioso no incremento.

---

### RUC Search + Mini-form (D-17-PDV-01)

**Estados do campo RUC:**

| Estado | Trigger | Visual |
|--------|---------|--------|
| Idle | Campo vazio | Placeholder "Buscá por RUC o cédula", sem botão "Buscar" ativo |
| Digitando | Usuário digita ≥ 3 caracteres | Debounce 400ms, spinner inline no campo |
| Buscando | Após debounce disparar | Spinner, botão "Buscar" com `opacity: 0.6` |
| Encontrado | API retorna cliente | Row inline com dados do cliente + badge "Cliente encontrado" (`var(--admin-success-10)`) |
| Não encontrado | API retorna null | Mensagem em `var(--admin-text-muted)` + botão "Registrar cliente" + botão "Continuar como Consumidor Final" |
| Mini-form aberto | Clicar "Registrar cliente" | Formulário inline se expande com animação `max-height` transition 280ms |
| Mini-form salvando | Clicar "Guardar e continuar" | Botão em estado "Guardando...", campos disabled |
| Mini-form erro | RUC duplicado no banco | Mensagem vermelha inline abaixo do campo RUC do mini-form |
| Consumidor Final | Clicar "Continuar como Consumidor Final" | Row mostrando pill "Consumidor Final" substitui o campo de busca |

**Campos do mini-form:**
- `nombre` (obrigatório) — `admin-input`
- `ciudad` (opcional) — `admin-input`
- `telefono` (opcional) — `admin-input`
- RUC: herdado do campo de busca, exibido como texto fixo (`var(--admin-text-muted)`)

---

### Exchange Rate Display

**Formato canônico:** `1 USD = 7.800 Gs. · Actualizado 08/05 14:30`

Regras de formatação:
- Valor em Guaraníes: inteiro sem casas decimais, separador de milhar = ponto (`.`) — ex: `7.800`, `1.400`
- Data: `DD/MM` (sem ano se mesmo ano)
- Hora: `HH:mm` (formato 24h, timezone Assunção — `America/Asuncion`)
- BRL: `1 BRL = 1.400 Gs.`
- USD: `1 USD = 7.800 Gs.`
- Ambos exibidos juntos quando moneda selecionada não é PYG; apenas o relevante em destaque quando moneda está selecionada

**Quando cotização está ausente (nenhum registro hoje):**
- Exibir `admin-alert admin-alert-warning` com cópia: "Sin cotización registrada hoy. Pedile al admin que la actualice."
- Total em PYG não exibido (mostrar "—" no lugar do valor)
- Usuário ainda pode avançar mas cálculo fica suspenso

**Localização do display:**
- Step 3 (Moneda): exibido abaixo dos radio de moeda, sempre visível
- Step 4 (Resumen): linha de rodapé abaixo da tabela de itens, `text-xs var(--admin-text-muted)`

---

### Success Splash (D-17-PDV-04)

**Trigger:** Server action `criarVentaLoja` retorna `{ success: true, id: "..." }`

**Comportamento:**
1. O componente de steps é desmontado.
2. Splash monta com animação `opacity: 0 → 1` + `translateY: 8px → 0` em 280ms (`--motion-duration-base`, `--motion-ease-standard`).
3. Conteúdo:
   - Ícone `CheckCircle` 64px em `var(--admin-success)`
   - Heading "¡Venta registrada!"
   - Sub-texto: "Total: {totalPYG} Gs. · Cliente: {nombre}" (ou "Consumidor Final")
   - Botão "Nueva venta" — ação: reseta `state` inteiro (step=0, cart=[], cliente=null, moneda=PYG) → desmonta splash → monta step 1 novamente
   - Botão "Ver detalles" — link `href="/admin/ventas/{id}"` (`target="_self"`)

**Não usar:** `router.push()` após sucesso (para não perder contexto de histórico). O estado é limpo in-place.

---

## Registry Safety

| Bloco | Fonte | Verificação |
|-------|-------|-------------|
| `Dialog` | shadcn/ui oficial | view passed — componente nativo shadcn — sem flags |
| `Input` | shadcn/ui oficial | view passed — componente nativo shadcn — sem flags |
| `Button` | shadcn/ui oficial | view passed — componente nativo shadcn — sem flags |
| `Select` | shadcn/ui oficial | view passed — componente nativo shadcn — sem flags |
| `Badge` | shadcn/ui oficial | view passed — componente nativo shadcn — sem flags |
| `Separator` | shadcn/ui oficial | view passed — componente nativo shadcn — sem flags |

Nenhum registry de terceiros declarado para esta fase. Todos os componentes são do repositório oficial `shadcn/ui` ou do projeto admin existente.

---

## Checker Sign-Off

- [ ] **Spacing:** todos os valores são múltiplos de 4 (`py-2.5` removido → `py-3`); toque mínimo de 44px definido para +/-
- [ ] **Typography:** 4 tamanhos definidos (12, 14, 16, 24px), 2 pesos (400 e 600), line-heights declarados; peso 700 encapsulado no `AdminPageHeader` existente — não introduzir em UIs novas
- [ ] **Color:** 60/30/10 declarado; accent reservado (navegação/step/total); "Confirmar venta" usa success bg — diferenciação intencional declarada
- [ ] **Copywriting:** todas as cópias ES-PY definidas; CTAs com verbo+substantivo; "Quitar del carrito" sem confirmação justificado
- [ ] **Components:** inventário completo com fonte + aria-labels para botões icon-only; focal points por step declarados
- [ ] **Interactions:** stock validation, RUC search states, exchange rate format, success splash e ação de remoção de carrinho especificados

**Approval:** approved 2026-05-08 — force-approved após 2 iterações de revisão + fix manual do badge typography. Todos os 6 critérios substancialmente atendidos.
