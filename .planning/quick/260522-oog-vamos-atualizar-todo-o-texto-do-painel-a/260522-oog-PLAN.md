---
phase: 260522-oog
plan: oog
type: execute
wave: 1
depends_on: []
files_modified:
  # Task 1 — Shell, Dashboard & Core Pages
  - src/components/admin/BottomNav.tsx
  - src/components/admin/AdminLayoutClient.tsx
  - src/components/admin/dashboard/AlertasCard.tsx
  - src/app/admin/page.tsx
  - src/app/admin/leads/page.tsx
  - src/app/admin/relatorios/page.tsx
  - src/app/admin/gamificacao/page.tsx
  # Task 2 — People Management
  - src/app/admin/equipe/page.tsx
  - src/app/admin/consultoras/page.tsx
  - src/app/admin/consultoras/[id]/page.tsx
  - src/app/admin/revendedoras/page.tsx
  - src/app/admin/revendedoras/[id]/page.tsx
  - src/app/admin/revendedoras/[id]/documentos/page.tsx
  - src/app/admin/revendedoras/[id]/editar/RevendedoraEditForm.tsx
  - src/app/admin/config/notif-push/NotifPushClient.tsx
  - src/app/admin/config/notif-push/TemplateEditor.tsx
  # Task 3 — Configuration, Products & Inventory
  - src/app/admin/config/comissoes/ComissoesClient.tsx
  - src/app/admin/config/comissoes/TierForm.tsx
  - src/app/admin/config/niveis/NiveisClient.tsx
  - src/app/admin/config/niveis/NivelForm.tsx
  - src/app/admin/config/contratos/ContratosClient.tsx
  - src/app/admin/config/contratos/ContratoUploadModal.tsx
  - src/app/admin/produtos/ProductForm.tsx
  - src/app/admin/produtos/ProductTable.tsx
  - src/app/admin/produtos/[id]/page.tsx
  - src/app/admin/brindes/page.tsx
  - src/app/admin/brindes/BrindeForm.tsx
  - src/app/admin/brindes/nuevo/page.tsx
  - src/app/admin/brindes/[id]/editar/page.tsx
  - src/app/admin/maleta/page.tsx
  - src/app/admin/maleta/[id]/page.tsx
  - src/app/admin/maleta/[id]/editar/page.tsx
  - src/app/admin/maleta/[id]/conferir/page.tsx
  - src/app/admin/maleta/nova/page.tsx
  - src/app/admin/clientes/ClienteFormModal.tsx
  - src/app/admin/clientes/ClienteRow.tsx
  - src/app/admin/clientes/ClientesClient.tsx
  - src/app/admin/pdv/PdvStepCliente.tsx
  - src/app/admin/pdv/PdvStepProductos.tsx
  - src/app/admin/estoque/sincronizar/page.tsx
  - src/app/admin/categorias/CategoryManager.tsx
  - src/components/admin/estoque/StockSyncPreview.tsx
autonomous: true
requirements: []

must_haves:
  truths:
    - "All admin panel UI text (labels, buttons, placeholders, empty states, toast messages) is in Spanish"
    - "No Portuguese text remains in admin panel UI (e.g., 'Nome' → 'Nombre', 'Nenhum' → 'Ningún', 'Salvar' → 'Guardar')"
    - "No English text remains in admin panel UI (e.g., 'Simple' → 'Sencillo', 'Variable' → 'Variable')"
    - "All translated text uses natural Paraguayan Spanish conventions consistent with the rest of the project"
  artifacts:
    - path: "src/components/admin/BottomNav.tsx"
      provides: "Bottom navigation bar labels — all in Spanish"
    - path: "src/components/admin/AdminLayoutClient.tsx"
      provides: "Sidebar navigation labels — all in Spanish"
    - path: "src/app/admin/equipe/page.tsx"
      provides: "Team management UI — full Spanish conversion"
    - path: "src/app/admin/config/comissoes/ComissoesClient.tsx"
      provides: "Commission tiers UI — full Spanish conversion"
    - path: "src/app/admin/produtos/ProductForm.tsx"
      provides: "Product form — English product type labels converted"
  key_links:
    - from: "All admin .tsx files"
      to: "User-visible text strings"
      via: "JSX text content, placeholder props, title props, toast messages"
      pattern: "No Portuguese or English UI text remains"
---

<objective>
Convert all admin panel UI text from Portuguese and English to Spanish (Paraguayan convention). This is a mechanical text replacement across ~45 files — no logic changes, no refactoring, no new features.

Purpose: The project's language convention is Spanish for all user-facing interfaces (§3 of CLAUDE.md — "Idioma da UI: espanhol paraguaio"). Portuguese and English text leaks violate this convention and confuse users.

Output: All admin panel pages render exclusively in Spanish.
</objective>

<execution_context>
@/Users/wesleyhudson/.config/opencode/get-shit-done/workflows/execute-plan.md
@/Users/wesleyhudson/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/PROJECT.md
@docs/project_overview.md

<conventions>
- **Idioma da UI:** espanhol paraguaio em todas as interfaces (CLAUDE.md §3)
- No cambiar lógica de negocio, nombres de variables, keys de objetos, nombres de archivos, rutas, imports, o props de componentes
- Solo cambiar texto visible al usuario: JSX text content, placeholders, labels, titles, toast messages, alt text, aria-labels
- No tocar texto que ya está en español correcto
- Los valores de opciones `<option>` y atributos `value` no se traducen (son datos, no UI)
- Los nombres de toast en sonner y mensajes de confirmación SÍ se traducen
</conventions>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Shell, Dashboard & Core Pages — Portuguese/English → Spanish</name>
  <files>
    src/components/admin/BottomNav.tsx
    src/components/admin/AdminLayoutClient.tsx
    src/components/admin/dashboard/AlertasCard.tsx
    src/app/admin/page.tsx
    src/app/admin/leads/page.tsx
    src/app/admin/relatorios/page.tsx
    src/app/admin/gamificacao/page.tsx
  </files>
  <action>
Convert all Portuguese and English UI text to Spanish in the admin shell, dashboard, and core pages:

### File-by-file changes:

**src/components/admin/BottomNav.tsx:**
- `"Inicio"` → already Spanish ✓
- `"Maleta"` → already Spanish ✓
- `"Revend."` → already Spanish ✓
- `"Analytics"` → already Spanish ✓ (keep as-is, brand term)
- Sheet sections `"Catálogo"`, `"Configuraciones"`, `"Mi Cuenta"` → already Spanish ✓
- `"Más opciones"` → already Spanish ✓
- `"Volver al sitio"` → already Spanish ✓
- `"Salir del sistema"` → already Spanish ✓

**src/components/admin/AdminLayoutClient.tsx:**
- All sidebar labels are already in Spanish or proper nouns ✓
- `"Volver al sitio"` → already Spanish ✓
- `"Salir del sistema"` → already Spanish ✓

**src/components/admin/dashboard/AlertasCard.tsx:**
- Line 48: `"Maletas com Atenção"` → `"Maletas con Atención"`
- Line 51: `"Ver todas →"` → already Spanish ✓
- Line 58: `"Nenhuma maleta requer atenção."` → `"Ninguna maleta requiere atención."`
- Line 11: `"ATRASADA"` → already Portuguese/universal ✓ (status badge, keep)
- Line 18: `"ACERTO PENDENTE"` → `"AJUSTE PENDIENTE"`
- Line 25: `"Vence amanhã"` → already Portuguese/Spanish ✓ (keep)

**src/app/admin/page.tsx:**
- Line 79: `"Admin / Dashboard"` → already English/Spanish mix (keep breadcrumb)
- Line 82: `"Olá,"` → `"Hola,"`
- Line 115: `"Faturamento"` → `"Facturación"`
- Line 128: `"Minha Comissão"` → `"Mi Comisión"`
- Line 129: `"10% sobre grupo"` → already Spanish ✓
- Line 138: `"Maletas"` → already Spanish ✓
- Line 139: `"ativas"` → already Spanish ✓
- Line 144: `"atrasada"` → already Portuguese/Spanish ✓
- Line 150: `"Revendedoras"` → already Spanish ✓
- Line 158: `"novas"` → `"nuevas"`
- Line 162: `"Atenção"` → `"Atención"`
- Line 187: `"Ver analytics detallado →"` → already Spanish ✓
- Line 195: `"Desempenho por Consultora"` → `"Desempeño por Consultora"`
- Line 195: `"Ranking das Minhas Revendedoras"` → `"Ranking de Mis Revendedoras"`

**src/app/admin/leads/page.tsx:**
- Line 109: `"Carregando..."` → `"Cargando..."`
- Line 113: `"Ninguna candidatura encontrada."` → already Spanish ✓
- Line 120: `"Nombre"` → already Spanish ✓

**src/app/admin/relatorios/page.tsx:**
- Line 30: `"Lista completa de produtos com SKU, preço, estoque e variantes."` → `"Lista completa de productos con SKU, precio, stock y variantes."`
- Line 40: `"Lista de revendedoras com comissão, colaboradora vinculada e status."` → `"Lista de revendedoras con comisión, consultora vinculada y estado."`
- Line 48: `"Lista de colaboradoras com equipas e número de revendedoras."` → `"Lista de consultoras con equipos y número de revendedoras."`
- Line 58: `"Todas as maletas com status, peças, vendas e valores."` → `"Todas las maletas con estado, piezas, ventas y valores."`
- Line 66: `"Eventos de acesso dos últimos 30 dias com revendedora e tipo."` → `"Eventos de acceso de los últimos 30 días con revendedora y tipo."`
- Line 91: `"Erro ao exportar"` → `"Error al exportar"`
- Line 109: `"Erro ao descarregar ficheiro"` → `"Error al descargar archivo"`
- Line 117: `"Relatórios e Exportação"` → `"Reportes y Exportación"`
- Line 133: `"Resumo completo com todas as métricas da Monarca, formatado para impressão."` → `"Resumen completo con todas las métricas de Monarca, formateado para impresión."`
- Line 149: `"Descarregar PDF"` → `"Descargar PDF"`

**src/app/admin/gamificacao/page.tsx:**
- Line 45: `"Cargando..."` → already Spanish ✓
- Line 63: `"canjes"` → already Spanish ✓
- Line 63: `"pendientes"` → already Spanish ✓
- Line 72: `"Reglas de Puntos"` → already Spanish ✓
- Line 90: `"Sin reglas configuradas."` → already Spanish ✓
- Line 154: `"Canjes Pendientes"` → already Spanish ✓
- Line 164: `"Ningún canje solicitado."` → already Spanish ✓

DO NOT change: variable names (setLoading, loadMaletas), function names, component names, imports, CSS class names, route paths.

After all edits, run `grep` to verify no Portuguese text patterns remain in these files:
  ```bash
  grep -n 'Nenhum\|Nenhuma\|Carregando\|Faturamento\|Olá,\|Minha\|Atenção\|Desempenho\|das Minhas\|comissão\|comissão\|preço\|estoque\|acesso\|equipas\|Relatórios\|Exportação\|Descarregar\|ficheiro\|Resumo\|métricas\|impressão' src/components/admin/BottomNav.tsx src/components/admin/AdminLayoutClient.tsx src/components/admin/dashboard/AlertasCard.tsx src/app/admin/page.tsx src/app/admin/leads/page.tsx src/app/admin/relatorios/page.tsx src/app/admin/gamificacao/page.tsx
  ```
  Expected: 0 matches (or only comments/grep false positives for `grep` itself).
  </action>
  <verify>
    <automated>grep -c 'Nenhum\|Nenhuma\|Carregando\|Faturamento\|Olá,\|das Minhas\|preço\|estoque\|equipas\|Relatórios\|Descarregar\|ficheiro\|Resumo\|métricas\|impressão' src/components/admin/BottomNav.tsx src/components/admin/AdminLayoutClient.tsx src/components/admin/dashboard/AlertasCard.tsx src/app/admin/page.tsx src/app/admin/leads/page.tsx src/app/admin/relatorios/page.tsx src/app/admin/gamificacao/page.tsx 2>/dev/null || echo "ALL CLEAN"</automated>
  </verify>
  <done>All Portuguese and English text in shell, dashboard, and core admin pages converted to Spanish. Grep confirms 0 remaining Portuguese patterns.</done>
</task>

<task type="auto">
  <name>Task 2: People Management Pages — Portuguese → Spanish</name>
  <files>
    src/app/admin/equipe/page.tsx
    src/app/admin/consultoras/page.tsx
    src/app/admin/consultoras/[id]/page.tsx
    src/app/admin/revendedoras/page.tsx
    src/app/admin/revendedoras/[id]/page.tsx
    src/app/admin/revendedoras/[id]/documentos/page.tsx
    src/app/admin/revendedoras/[id]/editar/RevendedoraEditForm.tsx
    src/app/admin/config/notif-push/NotifPushClient.tsx
    src/app/admin/config/notif-push/TemplateEditor.tsx
  </files>
  <action>
Convert all Portuguese UI text to Spanish in people management and notification config pages:

### Translation reference table (Portuguese → Spanish):

| Portuguese | Spanish |
|---|---|
| Nome | Nombre |
| Nova / Novo | Nueva / Nuevo |
| Nenhum / Nenhuma | Ningún / Ninguna |
| Cadastrada / Cadastrado | Registrada / Registrado |
| Carregando | Cargando |
| Criar / Criando | Crear / Creando |
| Criada / Criado | Creada / Creado |
| Salvar / Salvando | Guardar / Guardando |
| Alterações | Cambios |
| Remover | Eliminar |
| Removida | Eliminada |
| Esta ação não pode ser desfeita | Esta acción no se puede deshacer |
| Sem vínculo | Sin vínculo |
| Sem consultora | Sin consultora |
| Ações | Acciones |
| Enviar | Enviar (same) |
| Buscar por nome | Buscar por nombre |
| Buscar por nome ou e-mail | Buscar por nombre o email |
| Enviar prueba | Enviar prueba (already Spanish ✓) |
| Enviando | Enviando (same) |
| Editar | Editar (same) |
| Cancelar | Cancelar (same) |

### File-by-file changes:

**src/app/admin/equipe/page.tsx:**
- Line 52: `"Colaboradora criada!"` → `"Consultora creada!"`
- Line 67: `"Revendedora criada!"` → `"Revendedora creada!"`
- Line 77: `` `Remover "${name}"? Esta ação não pode ser desfeita.` `` → `` `¿Eliminar "${name}"? Esta acción no se puede deshacer.` ``
- Line 81: `` `"${name}" removida` `` → `` `"${name}" eliminada` ``
- Line 94: `"Vínculo atualizado!"` → `"¡Vínculo actualizado!"`
- Line 115: `"Nova Consultora"` → `"Nueva Consultora"`
- Line 124: `"Nova Revendedora"` → `"Nueva Revendedora"`
- Line 157: `"Nenhuma consultora cadastrada"` → `"Ninguna consultora registrada"`
- Line 157: `"Adicione a primeira consultora pelo botão acima."` → `"Agregue la primera consultora con el botón de arriba."`
- Line 173: `title="Remover"` → `title="Eliminar"`
- Line 196: `"Nenhuma revendedora cadastrada"` → `"Ninguna revendedora registrada"`
- Line 196: `"Adicione a primeira revendedora pelo botão acima."` → `"Agregue la primera revendedora con el botón de arriba."`
- Line 202: `<th>Nome</th>` → `<th>Nombre</th>`
- Line 239: `"Sem vínculo"` → `"Sin vínculo"`
- Line 278: `"Nova Consultora"` → `"Nueva Consultora"`
- Line 286: `<label>Nome *</label>` → `<label>Nombre *</label>`
- Line 287: `placeholder="Nome completo"` → `placeholder="Nombre completo"`
- Line 306: `"Criando..."` → `"Creando..."`
- Line 306: `"Criar Consultora"` → `"Crear Consultora"`
- Line 328: `"Nova Revendedora"` → `"Nueva Revendedora"`
- Line 336: `<label>Nome *</label>` → `<label>Nombre *</label>`
- Line 337: `placeholder="Nome completo"` → `placeholder="Nombre completo"`
- Line 354: `"Sem consultora"` → `"Sin consultora"`
- Line 365: `"Criando..."` → `"Creando..."`
- Line 365: `"Criar Revendedora"` → `"Crear Revendedora"`

**src/app/admin/consultoras/page.tsx:**
- Line 61: `` `Remover "${name}"? Esta ação não pode ser desfeita.` `` → `` `¿Eliminar "${name}"? Esta acción no se puede deshacer.` ``
- Line 65: `` `"${name}" removida` `` → `` `"${name}" eliminada` ``
- Line 117: `"Nova Consultora"` → `"Nueva Consultora"`
- Line 122: `<DialogTitle>Nova Consultora</DialogTitle>` → `<DialogTitle>Nueva Consultora</DialogTitle>`
- Line 126: `<Label>Nome *</Label>` → `<Label>Nombre *</Label>`
- Line 127: `placeholder="Nome completo"` → `placeholder="Nombre completo"`
- Line 146: `"Criando..."` → `"Creando..."`
- Line 146: `"Criar e Enviar Convite"` → `"Crear y Enviar Invitación"`
- Line 161: `placeholder="Buscar por nome ou e-mail..."` → `placeholder="Buscar por nombre o email..."`
- Line 186: `"Carregando..."` → `"Cargando..."`
- Line 191: `"Nenhuma consultora encontrada"` → `"Ninguna consultora encontrada"`
- Line 191: `"Nenhuma consultora cadastrada"` → `"Ninguna consultora registrada"`

**src/app/admin/consultoras/[id]/page.tsx:**
- Line 62: `"Carregando perfil..."` → `"Cargando perfil..."`
- Line 85: `"Editar Dados"` → `"Editar Datos"`
- Line 177: `"Nenhuma revendedora vinculada"` → `"Ninguna revendedora vinculada"`
- Line 258: `"Editar Consultora"` → already Spanish ✓
- Line 266: `label: "Nome *"` → `label: "Nombre *"`
- Line 293: `"Nova Foto"` → `"Nueva Foto"`
- Line 297: `"Salvando..."` → `"Guardando..."`
- Line 297: `"Salvar Alterações"` → `"Guardar Cambios"`

**src/app/admin/revendedoras/page.tsx:**
- Line 391: `placeholder="Buscar por nome, CI ou e-mail..."` → `placeholder="Buscar por nombre, CI o email..."`
- Line 413: `"Status: Todos"` → already Spanish ✓ (keep)
- Line 458: `"Docs: Todos"` → already Spanish ✓ (keep)
- Line 495: `"Ninguna revendedora encontrada"` → already Spanish ✓
- Line 691: `"Editar Revendedora"` → already Spanish ✓

**src/app/admin/revendedoras/[id]/page.tsx:**
- Line 180, 191: `"Editar"` → already Spanish ✓
- Line 358: `"Nenhuma maleta"` → `"Ninguna maleta"`
- Line 480: `"Nenhum dado bancário cadastrado"` → `"Ningún dato bancario registrado"`

**src/app/admin/revendedoras/[id]/documentos/page.tsx:**
- Line 114: `"Nenhum documento enviado"` → `"Ningún documento enviado"`
- Line 114: `"A revendedora ainda não enviou documentos."` → `"La revendedora aún no ha enviado documentos."`
- Line 179: `"Cancelar"` → already Spanish ✓

**src/app/admin/revendedoras/[id]/editar/RevendedoraEditForm.tsx:**
- Line 155: `"Editar Revendedora"` → already Spanish ✓
- Line 171: `"Cancelar"` → already Spanish ✓

**src/app/admin/config/notif-push/NotifPushClient.tsx:**
- Line 40: `nova_maleta_revendedora: "Nova maleta (revendedora)"` → `nova_maleta_revendedora: "Nueva maleta (revendedora)"`
- Line 207: `"Enviando..."` → already Spanish ✓
- Line 207: `"Enviar prueba"` → already Spanish ✓
- Line 297: `title="Editar"` → already Spanish ✓
- Line 484: `"Enviando..."` → already Spanish ✓
- Line 484: `` `Enviar campaña (${selectedIds.size})` `` → already Spanish ✓

**src/app/admin/config/notif-push/TemplateEditor.tsx:**
- Line 27: `nova_maleta_revendedora: "Nova maleta (revendedora)"` → `nova_maleta_revendedora: "Nueva maleta (revendedora)"`
- Line 85: `"Editar Template"` → already Spanish ✓
- Line 200: `"Cancelar"` → already Spanish ✓

After all edits, verify with grep:
  ```bash
  grep -n 'Nova \|Novo \|Nenhum\|Nenhuma\|Cadastrad\|Carregando\|Criar \|Criando\|Salvar\|Salvando\|Alterações\|Remover\|removida\|Sem vínculo\|Sem consultora\|Nome \*\|Nome completo\|Buscar por nome\|Adicione a primeira\|Esta ação\|Criar e Enviar' src/app/admin/equipe/page.tsx src/app/admin/consultoras/page.tsx src/app/admin/consultoras/\[id\]/page.tsx
  ```
  Expected: 0 matches.
  </action>
  <verify>
    <automated>grep -c 'Nova \|Novo \|Nenhum\|Nenhuma\|Cadastrad\|Carregando\|Criar \|Criando\|Salvar\|Salvando\|Alterações\|Remover\|removida\|Sem vínculo\|Sem consultora\|Nome \*\|Nome completo\|Buscar por nome\|Adicione a primeira\|Esta ação\|Criar e Enviar' src/app/admin/equipe/page.tsx src/app/admin/consultoras/page.tsx src/app/admin/consultoras/\[id\]/page.tsx 2>/dev/null || echo "ALL CLEAN"</automated>
  </verify>
  <done>All Portuguese text in people management pages (equipe, consultoras, revendedoras, documentos, notif-push) converted to Spanish. Primary grep confirms 0 remaining Portuguese patterns.</done>
</task>

<task type="auto">
  <name>Task 3: Config, Products & Inventory — Portuguese/English → Spanish</name>
  <files>
    src/app/admin/config/comissoes/ComissoesClient.tsx
    src/app/admin/config/comissoes/TierForm.tsx
    src/app/admin/config/niveis/NiveisClient.tsx
    src/app/admin/config/niveis/NivelForm.tsx
    src/app/admin/config/contratos/ContratosClient.tsx
    src/app/admin/config/contratos/ContratoUploadModal.tsx
    src/app/admin/produtos/ProductForm.tsx
    src/app/admin/produtos/ProductTable.tsx
    src/app/admin/produtos/[id]/page.tsx
    src/app/admin/brindes/page.tsx
    src/app/admin/brindes/BrindeForm.tsx
    src/app/admin/brindes/nuevo/page.tsx
    src/app/admin/brindes/[id]/editar/page.tsx
    src/app/admin/maleta/page.tsx
    src/app/admin/maleta/[id]/page.tsx
    src/app/admin/maleta/[id]/editar/page.tsx
    src/app/admin/maleta/[id]/conferir/page.tsx
    src/app/admin/maleta/nova/page.tsx
    src/app/admin/clientes/ClienteFormModal.tsx
    src/app/admin/clientes/ClienteRow.tsx
    src/app/admin/clientes/ClientesClient.tsx
    src/app/admin/pdv/PdvStepCliente.tsx
    src/app/admin/pdv/PdvStepProductos.tsx
    src/app/admin/estoque/sincronizar/page.tsx
    src/app/admin/categorias/CategoryManager.tsx
    src/components/admin/estoque/StockSyncPreview.tsx
  </files>
  <action>
Convert all Portuguese and English UI text to Spanish in configuration, products, and inventory pages:

### Translation reference table:

| Original | Spanish |
|---|---|
| Faixa / Faixas | Franja / Franjas |
| Nenhuma faixa cadastrada | Ninguna franja registrada |
| Nova Faixa / Nova Faixa de Comissão | Nueva Franja / Nueva Franja de Comisión |
| Faixa actualizada / Faixa creada | Franja actualizada / Franja creada |
| Faixa eliminada | Franja eliminada |
| ¿Eliminar esta faixa? | ¿Eliminar esta franja? |
| No se puede eliminar la faixa base | No se puede eliminar la franja base |
| Mínimo de ventas (Gs) | Mínimo de ventas (Gs) ✓ |
| Nivel / Niveles | Nivel / Niveles (same) |
| Novo Nivel / Novo Nivel de Gamificación | Nuevo Nivel / Nuevo Nivel de Gamificación |
| Nenhum nivel cadastrado | Ningún nivel registrado |
| Ações | Acciones |
| Contrato / Contratos | Contrato / Contratos (same) |
| Novo Contrato / Nenhum contrato cadastrado | Nuevo Contrato / Ningún contrato registrado |
| Obrigatório / Obrigatorio | Obligatorio |
| Obrigatorio para nuevas revendedoras | Obligatorio para nuevas revendedoras |
| Ya no es obligatorio / Marcado como obligatorio | Ya no es obligatorio / Marcado como obligatorio ✓ |
| Simple (product type label) | Sencillo |
| Variable (product type label) | Variable |
| Nova Maleta | Nueva Maleta |
| Editar Consignación | Editar Consignación ✓ |
| Cancelar | Cancelar ✓ |
| Nenhuma maleta | Ninguna maleta |
| Todos os itens foram vendidos — nenhum retorno esperado | Todos los artículos fueron vendidos — ningún retorno esperado |
| Editar Brinde | Editar Brinde ✓ |
| Criar Brinde | Crear Brinde |
| Cancelar | Cancelar ✓ |
| Cadastrad → Registrad | Registrada / Registrado |

### File-by-file changes:

**src/app/admin/config/comissoes/ComissoesClient.tsx:**
- Line 28: `"¿Eliminar esta faixa?"` → `"¿Eliminar esta franja?"`
- Line 32: `"Faixa eliminada"` → `"Franja eliminada"`
- Line 49: `"Faixas de Comissão"` → `"Franjas de Comisión"`
- Line 55: `"Nova Faixa"` → `"Nueva Franja"`
- Line 66: `<th>Ações</th>` → `<th>Acciones</th>`
- Line 73: `"Nenhuma faixa cadastrada."` → `"Ninguna franja registrada."`
- Line 103: `"No se puede eliminar la faixa base"` → `"No se puede eliminar la franja base"`

**src/app/admin/config/comissoes/TierForm.tsx:**
- Line 36: `"Faixa actualizada"` → `"Franja actualizada"`
- Line 36: `"Faixa creada"` → `"Franja creada"`
- Line 70: `"Editar Faixa"` → `"Editar Franja"`
- Line 70: `"Nova Faixa de Comissão"` → `"Nueva Franja de Comisión"`

**src/app/admin/config/niveis/NiveisClient.tsx:**
- Line 57: `"Novo Nivel"` → `"Nuevo Nivel"`
- Line 70: `<th>Ações</th>` → `<th>Acciones</th>`
- Line 78: `"Nenhum nivel cadastrado."` → `"Ningún nivel registrado."`

**src/app/admin/config/niveis/NivelForm.tsx:**
- Line 76: `"Novo Nivel de Gamificación"` → `"Nuevo Nivel de Gamificación"`

**src/app/admin/config/contratos/ContratosClient.tsx:**
- Line 36: `"Contrato desactivado"` / `"Contrato activado"` → already Spanish ✓
- Line 48: `"Ya no es obligatorio"` / `"Marcado como obligatorio"` → already Spanish ✓
- Line 63: `"Novo Contrato"` → `"Nuevo Contrato"`
- Line 72: `<th>Obrigatório</th>` → `<th>Obligatorio</th>`
- Line 74: `<th>Ações</th>` → `<th>Acciones</th>`
- Line 82: `"Nenhum contrato cadastrado."` → `"Ningún contrato registrado."`

**src/app/admin/config/contratos/ContratoUploadModal.tsx:**
- Line 101: `"Novo Contrato"` → `"Nuevo Contrato"`
- Line 173: `"Obrigatorio para nuevas revendedoras"` → `"Obligatorio para nuevas revendedoras"`

**src/app/admin/produtos/ProductForm.tsx:**
- Line 150: `<option value="simple">Simple</option>` → `<option value="simple">Sencillo</option>`
- Line 151: `<option value="variable">Variable</option>` → `<option value="variable">Variable</option>`

**src/app/admin/produtos/ProductTable.tsx:**
- Line 128: `{product.product_type === "variable" ? "Variable" : "Simple"}` → `{product.product_type === "variable" ? "Variable" : "Sencillo"}`
- Line 169: `title="Editar"` → already Spanish ✓
- Line 236: `"Cancelar"` → already Spanish ✓

**src/app/admin/produtos/[id]/page.tsx:**
- Line 30: `{product.product_type === "variable" ? "Variable" : "Simple"}` → `{product.product_type === "variable" ? "Variable" : "Sencillo"}`

**src/app/admin/brindes/page.tsx:**
- Line 168: `"Editar"` → already Spanish ✓

**src/app/admin/brindes/BrindeForm.tsx:**
- Line 53: `title="Editar Brinde"` → already Spanish ✓

**src/app/admin/brindes/nuevo/page.tsx:**
- Line 55-56: Check `"Nombre"` label → already Spanish ✓

**src/app/admin/maleta/page.tsx:**
- Line 79: `"Nova Maleta"` → `"Nueva Maleta"`
- Line 90: `searchPlaceholder="Buscar revendedora..."` → already Spanish ✓

**src/app/admin/maleta/[id]/page.tsx:**
- Line 545: `"Editar Consignación"` → already Spanish ✓
- Line 588, 639: `"Cancelar"` → already Spanish ✓

**src/app/admin/maleta/[id]/editar/page.tsx:**
- Line 172: `` `Editar Consignación #${maleta.numero}` `` → already Spanish ✓
- Line 514: `"← Cancelar"` → already Spanish ✓

**src/app/admin/maleta/[id]/conferir/page.tsx:**
- Line 350: `"Todos os itens foram vendidos — nenhum retorno esperado."` → `"Todos los artículos fueron vendidos — ningún retorno esperado."`
- Line 815: `"Cancelar"` → already Spanish ✓

**src/app/admin/maleta/nova/page.tsx:**
- Line 207: `placeholder="Buscar producto..."` → already Spanish ✓

**src/app/admin/clientes/ClienteFormModal.tsx:**
- Line 82: `"Editar Cliente"` / `"Nuevo Cliente"` → already Spanish ✓
- Line 195: `"Cancelar"` → already Spanish ✓

**src/app/admin/clientes/ClienteRow.tsx:**
- Line 69: `"Editar"` → already Spanish ✓

**src/app/admin/clientes/ClientesClient.tsx:**
- Line 60: `{ key: "TODOS", label: "Todos" }` → already Spanish ✓

**src/app/admin/pdv/PdvStepCliente.tsx:**
- Line 87: `handleCriarClienteInline` → keep function name (code, not UI) ✓

**src/app/admin/pdv/PdvStepProductos.tsx:**
- Line 119: `placeholder="Buscar por nombre..."` → already Spanish ✓

**src/app/admin/estoque/sincronizar/page.tsx:**
- Check for Portuguese text → already minimal, Spanish ✓

**src/app/admin/categorias/CategoryManager.tsx:**
- Line 171: `title="Editar"` → already Spanish ✓
- Line 228: `"Cancelar"` → already Spanish ✓

**src/components/admin/estoque/StockSyncPreview.tsx:**
- Line 173: `"Cancelar"` → already Spanish ✓

After all edits, verify with grep:
  ```bash
  grep -n 'Faixa\|Nenhuma faixa\|Nova Faixa\|Faixas de Comissão\|Nenhum nivel\|Nenhum contrato\|Novo Nivel\|Novo Contrato\|Obrigatório\|>Simple<\|>Variable<\|Todos os itens\|Nova Maleta' src/app/admin/config/comissoes/ComissoesClient.tsx src/app/admin/config/comissoes/TierForm.tsx src/app/admin/config/niveis/NiveisClient.tsx src/app/admin/config/niveis/NivelForm.tsx src/app/admin/config/contratos/ContratosClient.tsx src/app/admin/config/contratos/ContratoUploadModal.tsx src/app/admin/produtos/ProductForm.tsx src/app/admin/produtos/ProductTable.tsx src/app/admin/produtos/\[id\]/page.tsx src/app/admin/maleta/page.tsx src/app/admin/maleta/\[id\]/conferir/page.tsx 2>/dev/null || echo "ALL CLEAN"
  ```
  Expected: 0 matches for Portuguese/English UI text.
  </action>
  <verify>
    <automated>grep -c 'Faixa\|Nova Faixa\|Faixas de Comiss\|Nenhum nivel\|Nenhum contrato\|Novo Nivel\|Novo Contrato\|Obrigatório\|>Simple<\|>Variable<\|Todos os itens\|Nova Maleta' src/app/admin/config/comissoes/ComissoesClient.tsx src/app/admin/config/comissoes/TierForm.tsx src/app/admin/config/niveis/NiveisClient.tsx src/app/admin/config/niveis/NivelForm.tsx src/app/admin/config/contratos/ContratosClient.tsx src/app/admin/config/contratos/ContratoUploadModal.tsx src/app/admin/produtos/ProductForm.tsx src/app/admin/produtos/ProductTable.tsx src/app/admin/produtos/\[id\]/page.tsx src/app/admin/maleta/page.tsx src/app/admin/maleta/\[id\]/conferir/page.tsx 2>/dev/null || echo "ALL CLEAN"</automated>
  </verify>
  <done>All Portuguese and English text in config, products, inventory, and brindes pages converted to Spanish. Grep confirms 0 remaining Portuguese/English UI patterns.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| None | This change is purely cosmetic — text string replacements in JSX. No data flow, auth, or input changes. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-oog-01 | Tampering | All admin .tsx files | accept | Text-only change, no logic modification. Git diff review catches any accidental code changes. |
</threat_model>

<verification>
### Global verification (run after all tasks):

```bash
# Verify no Portuguese UI patterns remain across ALL admin files
echo "=== Checking for Portuguese UI text in admin ===" && \
rg -n 'Nenhum|Nenhuma|Cadastrad[ao]|Carregando|Criando\.\.\.\|Salvando\.\.\.\|Alterações|Remover|removida|Sem vínculo|Sem consultora|Esta ação|Faixa\b|Faixas|Obrigatório|Simple\b|Variable\b|Relatórios|Descarregar|ficheiro|Equipas' src/app/admin/ src/components/admin/ 2>/dev/null | grep -v 'node_modules' | grep -v '\.planning' || echo "✓ No Portuguese text found"

# Verify no English UI patterns remain
echo "=== Checking for English UI text in admin ===" && \
rg -n '>Simple<|>Variable<' src/app/admin/produtos/ 2>/dev/null || echo "✓ No English text found"

# Build check
npm run lint 2>&1 | tail -5
```

All verifications must pass with no Portuguese or English UI text remaining.
</verification>

<success_criteria>
- [ ] All admin panel pages render UI text exclusively in Spanish
- [ ] `rg` (ripgrep) finds 0 Portuguese UI patterns (`Nenhum`, `Nenhuma`, `Cadastrad`, `Carregando`, `Salvando`, `Remover`, `Faixa`, `Obrigatório`, etc.) in `src/app/admin/` and `src/components/admin/`
- [ ] `rg` finds 0 English product type labels (`>Simple<`, `>Variable<`) in `src/app/admin/produtos/`
- [ ] `npm run lint` passes with no new errors
- [ ] No business logic, variable names, function names, imports, or route paths were changed
</success_criteria>

<output>
After completion, create `.planning/quick/260522-oog-vamos-atualizar-todo-o-texto-do-painel-a/260522-oog-SUMMARY.md`
</output>
