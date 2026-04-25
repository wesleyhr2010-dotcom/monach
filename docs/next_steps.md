# NEXT-MONARCA — Próximos Passos

> Plano de evolução baseado no delta entre SPECs em `/docs` e o estado atual descrito em [`project_overview.md`](./project_overview.md) §6–7. Atualizar após cada entrega.

**Convenção de status:** `[ ]` pendente · `[~]` em andamento · `[x]` concluído.

---

## Prioridade Crítica — Auditoria de segurança RBAC (2026-04-22)

Vulnerabilidades identificadas em auditoria da [`SPEC_SECURITY_RBAC.md`](./sistema/SPEC_SECURITY_RBAC.md) após implementação inicial. Servidor Actions de mutação financeira expostas sem autenticação — exploráveis hoje por qualquer cliente que conheça a superfície de Server Actions. Corrigir antes de qualquer outra entrega.

- [x] **[CRÍTICO] `devolverMaleta` sem `requireAuth` nem ownership check** — `src/app/admin/actions-maletas.ts:286`. Adicionado `requireAuth(["REVENDEDORA"])` + `findFirst({ where: { id, reseller_id: user.profileId }})` + validação de status. Ref.: [`sistema/SPEC_SECURITY_RBAC.md`](./sistema/SPEC_SECURITY_RBAC.md) §4, §5.
- [x] **[CRÍTICO] `fecharMaleta` sem `requireAuth` nem ownership check** — `src/app/admin/actions-maletas.ts:314`. Função não era usada no fluxo atual; removido o `export` e renomeada para `_fecharMaleta` (referência interna apenas). Ref.: [`sistema/SPEC_SECURITY_RBAC.md`](./sistema/SPEC_SECURITY_RBAC.md) §4.
- [x] **[CRÍTICO] `conciliarMaleta` (legado) sem `requireAuth`** — `src/app/admin/actions-maletas.ts:351`. Removido o `export`; renomeada para `_conciliarMaleta` (referência interna apenas). Ref.: [`sistema/SPEC_SECURITY_RBAC.md`](./sistema/SPEC_SECURITY_RBAC.md) §4.
- [x] **[CRÍTICO] `checkOverdueMaletas` sem `requireAuth`** — `src/app/admin/actions-maletas.ts:908`. Removida da Server Action; convertida em cron job autenticado por `CRON_SECRET` em `src/app/api/cron/check-overdue-maletas/route.ts`. Ref.: [`sistema/SPEC_CRON_JOBS.md`](./sistema/SPEC_CRON_JOBS.md).
- [x] **[CRÍTICO] `getActiveResellers` sem `requireAuth`** — `src/app/admin/actions-maletas.ts:606`. Adicionado `requireAuth(["ADMIN","COLABORADORA"])` + filtro por `colaboradora_id` quando caller for COLABORADORA. Ref.: [`sistema/SPEC_SECURITY_DATA_PROTECTION.md`](./sistema/SPEC_SECURITY_DATA_PROTECTION.md).
- [x] **[CRÍTICO] `getColaboradoras` em `actions-maletas.ts` sem `requireAuth`** — `src/app/admin/actions-maletas.ts:622`. Removida duplicata; importações em `maleta/page.tsx` atualizadas para usar `actions-equipe.ts` (já protegida). Ref.: [`sistema/SPEC_SECURITY_RBAC.md`](./sistema/SPEC_SECURITY_RBAC.md) §4.
- [x] **[ALTO] Email auto-linking em `getCurrentUser` permite takeover de perfis elevados** — `src/lib/user.ts:40`. Restringido auto-link apenas a `role=REVENDEDORA`; ADMIN/COLABORADORA exigem vinculação explícita. Ref.: [`sistema/SPEC_SECURITY_RBAC.md`](./sistema/SPEC_SECURITY_RBAC.md) §3.
- [x] **[ALTO] COLABORADORA vê dados fora do seu grupo em `/app` actions** — `src/app/app/actions-revendedora.ts:70,151,181` (`getMinhasMaletas`, `getMinhasVendas`, `getResumoFinanceiro`). Adicionado `assertIsInGroup(resellerId, user.profileId!)` para COLABORADORA. Ref.: [`sistema/SPEC_SECURITY_RBAC.md`](./sistema/SPEC_SECURITY_RBAC.md) §5.
- [x] **[ALTO] Middleware fail-open em `userRole === null`** — `src/lib/middleware-auth.ts:42`. Invertido para fail-closed: só permite `/admin` se `userRole` for explicitamente 'ADMIN' ou 'COLABORADORA'; todos os outros casos redirecionam para `/app`. Ref.: [`sistema/SPEC_SECURITY_RBAC.md`](./sistema/SPEC_SECURITY_RBAC.md) §3.
- [x] **[MÉDIO] `registrarVenda` usa `preco_unitario` controlado pelo cliente** — `src/app/app/actions-revendedora.ts:221`. Action agora ignora `preco_unitario` do input e usa `item.preco_fixado` do banco. Schema e frontend atualizados. Ref.: [`revendedoras/SPEC_MALETA.md`](./revendedoras/SPEC_MALETA.md).
- [x] **[MÉDIO] `getAvailableVariants` sem `requireAuth`** — `src/app/admin/actions-maletas.ts:871`. Adicionado `requireAuth(["ADMIN","COLABORADORA"])`. Ref.: [`sistema/SPEC_SECURITY_RBAC.md`](./sistema/SPEC_SECURITY_RBAC.md) §4.
- [x] **[MÉDIO] Role default `REVENDEDORA` + `isActive=true` para perfil ausente** — `src/lib/user.ts:62`. `getCurrentUser` agora retorna `null` quando não há perfil no banco, forçando `requireAuth` a rejeitar. Ref.: [`sistema/SPEC_SECURITY_RBAC.md`](./sistema/SPEC_SECURITY_RBAC.md) §3.
- [x] **[DOC] Testes de regressão de segurança** — Criados 11 testes em `src/__tests__/security/rbac-regression.test.ts` cobrindo: (a) chamadas sem sessão retornam erro; (b) COLABORADORA não acessa dados fora do grupo; (c) `getCurrentUser` retorna null sem perfil. Ref.: [`sistema/SPEC_TESTING_STRATEGY.md`](./sistema/SPEC_TESTING_STRATEGY.md).

---

## Prioridade Alta — Base do ciclo de negócio

Itens bloqueantes do produto principal (maleta em consignação) e da segurança.

- [x] **Fechar ciclo completo da Maleta no Admin** — implementar `createMaleta`, `closeMaleta` com snapshot imutável de valores e devolução de estoque. Ref.: [`admin/SPEC_ADMIN_MALETAS.md`](./admin/SPEC_ADMIN_MALETAS.md), [`admin/SPEC_ADMIN_CONFERIR_MALETA.md`](./admin/SPEC_ADMIN_CONFERIR_MALETA.md), [`sistema/SPEC_GAMIFICACAO_OVERVIEW.md`](./sistema/SPEC_GAMIFICACAO_OVERVIEW.md).
  - [x] **Bug: erro ao criar/conferir maleta** — Refatoradas todas as funções que usavam `$transaction(async tx => {...})` para operações sequenciais ou `$transaction([arr])` batch, compatíveis com Prisma 7 + PrismaPg driver adapter. `criarMaleta` usa criação da maleta + decrementos sequenciais com compensação; `conferirEFecharMaleta` usa pre-read + batch transaction; `conciliarMaleta`, `fecharMaleta`, `fecharManualmenteMaleta` refatorados da mesma forma.
  - [x] **Atualizar telas admin/maleta para seguir design do Paper** — refatoradas lista, detalhe, conferência e wizard de nova maleta (4 steps) para usar tema dark consistente com admin.css + shadcn/ui. Criados 8 componentes reutilizáveis em `src/components/admin/`: `AdminPageHeader`, `AdminStatCard`, `AdminStatusBadge`, `AdminStepIndicator`, `AdminFilterBar`, `AdminEmptyState`, `AdminFinancialSummary`, `AdminAvatar`. Helpers centralizados em `src/lib/maleta-helpers.ts`.
- [x] **Maleta no PWA da Revendedora** — Ref.: [`revendedoras/SPEC_MALETA.md`](./revendedoras/SPEC_MALETA.md).
  - [x] Componentes UI reutilizáveis: `StatusBadge`, `MaletaList`, `MaletaItemRow`, `ActionButton`, `AppPageHeader`, `SummaryCard`, `CommissionCard`, `AlertBanner`, `SummaryRow`, `BottomAction`
  - [x] Página listagem `/app/maleta/` — cards de consignações com status e totais
  - [x] Página detalhes `/app/maleta/[id]/` — itens, total vendido, badge de status, botões Registrar Venta e Devolver
  - [x] Página Registrar Venta `/app/maleta/[id]/registrar-venta/` — formulário com cliente + seleção de artigo
  - [x] Server Action `registrarVenda()` — cria venda e incrementa `quantidade_vendida`
  - [x] **Validação Zod** em `registrarVenda` — SPEC define `registrarVendaSchema` mas não foi adicionado
  - [x] **Lock pessimista** — SPEC exige `SELECT FOR UPDATE` na `registrarVenda` para evitar race condition em vendas simultâneas
  - [x] **Integração de gamificação** — SPEC exige `awardPoints(resellerId, 'venda_maleta')` e bônus `maleta_completa`; não implementado
  - [x] **Imagens reais dos produtos** em `MaletaItemRow` — usar `next/image` em vez de `<img>`
  - [x] **Estado de loading/skeleton** nas páginas server component de maleta
  - [x] **Testes unitários** para componentes e actions de maleta
- [x] **Devolução com câmera + comprovante** — upload via `/api/upload-r2`. Ref.: [`revendedoras/SPEC_DEVOLUCAO.md`](./revendedoras/SPEC_DEVOLUCAO.md), [`sistema/SPEC_API_UPLOAD_R2.md`](./sistema/SPEC_API_UPLOAD_R2.md).
  - [x] Paso 1: Resumen — resumo de enviados/vendidos/a devolver, badge de atrasada
  - [x] Paso 2: Foto — captura de câmera ou upload, preview da imagem
  - [x] Paso 3: Revisión final — resumo + comissão estimada + foto confirmada
  - [x] Paso 4: Confirmación — splash de sucesso com próximos passos
  - [x] Server Action `submitDevolucao()` — muda status para `aguardando_revisao`, faz upload do comprovante via R2, dispara notificação push para consultora e admins
- [x] **Fechar maleta sem comprovante (admin/consultora)** — tornar comprovante opcional no `conferirEFecharMaleta` quando acionado via botão "Cerrar sin comprobante" no `/admin/maletas/[id]`. Registrar justificativa em `nota_acerto` (ex.: "Cierre manual sin comprobante"). Revendedora continua obrigada a enviar foto pelo PWA. Tocou: `src/app/admin/actions-maletas.ts` (`conferirEFecharMaleta` — parâmetro `cierre_manual_sin_comprobante`), `src/app/admin/maleta/[id]/page.tsx` (botão + diálogo), `src/lib/validators/maleta.schema.ts`.
- [x] **Editar maleta após criação — acrescentar itens e aumentar quantidade** — nova Server Action `adicionarItensMaleta(maletaId, itens[])` permitida para ADMIN/COLABORADORA enquanto maleta estiver em `ativa` ou `atrasada`. Regras: (1) apenas acréscimo — não remove nem diminui; (2) valida estoque com reserva atômica (mesma lógica de `criarMaleta`); (3) novos itens recebem snapshot do preço atual em `preco_fixado`; (4) itens que já existiam na maleta: incrementa `quantidade_enviada` mantendo o `preco_fixado` original; (5) registra `estoqueMovimento` tipo `reserva_maleta`; (6) dispara push para a revendedora ("Se añadieron artículos a tu consignación"). UI em `/admin/maletas/[id]/editar` com busca de produtos, seleção de quantidades e confirmação. SPECs atualizadas: [`admin/SPEC_ADMIN_MALETAS.md`](./admin/SPEC_ADMIN_MALETAS.md) (nova seção "Tela 5: Editar Maleta") e [`revendedoras/SPEC_MALETA.md`](./revendedoras/SPEC_MALETA.md).
- [x] **RBAC e RLS validados por tabela** — middleware, guards de Server Actions e policies Supabase revisados para `REVENDEDORA`, `COLABORADORA`, `ADMIN`. Todas as vulnerabilidades críticas da auditoria 2026-04-22 foram corrigidas e testes de regressão adicionados. Ref.: [`sistema/SPEC_SECURITY_RBAC.md`](./sistema/SPEC_SECURITY_RBAC.md).
  - [x] `requireAuth` refatorado para lançar `BUSINESS:` errors (throw em vez de retornar null) e verificar `is_active`.
  - [x] Criados helpers `assertIsInGroup` e `getResellerScope` em `src/lib/auth/`.
  - [x] Adicionado `requireAuth` em todas as Server Actions do admin (`actions-products`, `actions-categories`, `actions-dashboard`, `actions-equipe`, `actions-gamificacao`, `actions-leads`, `actions-analytics`).
  - [x] Fix IDOR em `getMaletaById` (owner check por colaboradora) e `getMinhasMaletas`/`getMinhasVendas`/`getResumoFinanceiro` (validação de `profileId` + `assertIsInGroup` para COLABORADORA).
  - [x] Atualizado middleware (`middleware-auth.ts`) para fail-closed: só permite `/admin` se `userRole in ['ADMIN','COLABORADORA']`; verifica `is_active`; restringe rotas admin exclusivas para COLABORADORA.
  - [x] Criado script SQL consolidado `scripts/rls-policies.sql` com policies para todas as 23 tabelas sensíveis.
  - [x] Cobertura completa: `devolverMaleta`, `fecharMaleta`, `conciliarMaleta`, `checkOverdueMaletas`, `getActiveResellers`, `getColaboradoras`, `getAvailableVariants` protegidos ou removidos.
  - [x] `getCurrentUser` retorna `null` para perfil ausente; auto-link restrito a `REVENDEDORA`.
  - [x] `registrarVenda` usa `preco_fixado` do banco; schema e frontend atualizados.
  - [x] Testes de regressão de segurança em `src/__tests__/security/rbac-regression.test.ts` (11 testes passando).
- [x] **Proteção de dados sensíveis** — sanitização de logs, criptografia at-rest AES-256-GCM para dados bancários, signed URLs para documentos pessoais (1h TTL), helpers de máscara para UI, e sanitizador de vitrina pública. Ref.: [`sistema/SPEC_SECURITY_DATA_PROTECTION.md`](./sistema/SPEC_SECURITY_DATA_PROTECTION.md).
- [x] **Onboarding e completude de perfil** da revendedora. Ref.: [`revendedoras/SPEC_ONBOARDING_REVENDEDORA.md`](./revendedoras/SPEC_ONBOARDING_REVENDEDORA.md), [`revendedoras/SPEC_PERFIL.md`](./revendedoras/SPEC_PERFIL.md).
- [x] **Home do PWA** com métricas reais e maleta ativa. Ref.: [`revendedoras/SPEC_HOME.md`](./revendedoras/SPEC_HOME.md).
- [x] **Recuperar senha** (reset via SMTP). Ref.: [`revendedoras/SPEC_RECUPERAR_CONTRASENA.md`](./revendedoras/SPEC_RECUPERAR_CONTRASENA.md).

---

## Prioridade Média — Engajamento e operação

Itens que aumentam valor do produto depois do ciclo base estar estável.

- [x] **Motor de gamificação** — pontos por prazo/meta/completude, progressão de níveis, tiers de comissão. Ref.: [`admin/SPEC_ADMIN_GAMIFICACAO.md`](./admin/SPEC_ADMIN_GAMIFICACAO.md), [`revendedoras/SPEC_PROGRESSO.md`](./revendedoras/SPEC_PROGRESSO.md).
- [x] **Brindes** — catálogo admin + resgates + extrato. Ref.: [`admin/SPEC_ADMIN_BRINDES.md`](./admin/SPEC_ADMIN_BRINDES.md), [`revendedoras/SPEC_EXTRATO_BRINDES.md`](./revendedoras/SPEC_EXTRATO_BRINDES.md).
- [~] **Gestão de Equipe** no admin (revendedoras + consultoras, vínculos `manager_id`). Ref.: [`admin/SPEC_ADMIN_EQUIPE.md`](./admin/SPEC_ADMIN_EQUIPE.md), [`admin/SPEC_ADMIN_CONSULTORA_PERFIL.md`](./admin/SPEC_ADMIN_CONSULTORA_PERFIL.md).
  - [x] **Lista de Consultoras** separada em `/admin/consultoras` — tabela com métricas agregadas (faturamento do grupo, comissão, revendedoras ativas). Refatorado a partir da tab em `/admin/equipe`.
  - [x] **Perfil detalhado da Revendedora** em `/admin/revendedoras/[id]` — dados de candidatura, documentos, maletas, dados bancários (mascarados), faturamento total/mensal, pontos e nível. Server Action `getPerfilRevendedora`.
  - [x] **Perfil detalhado da Consultora** em `/admin/consultoras/[id]` — revendedoras do grupo com faturamento individual, pontos e status. Cards de resumo: faturamento do grupo, comissão total, revendedoras ativas/inativas. Server Action `getPerfilConsultora`.
  - [x] **Navegação** — sidebar atualizado (`/admin/equipe` → `/admin/consultoras`), links entre listas e perfis.
  - [x] **Criação via Supabase Auth + convite por email** — `criarColaboradora` e `criarRevendedora` agora criam usuário no Supabase Auth (`auth.admin.createUser` com senha temporária), gravam `auth_user_id` no Prisma, geram link de recovery (`auth.admin.generateLink`) e enviam email de convite via Brevo. Compensação: se Prisma falhar, usuário Auth é removido. Tratamento de email já registrado. Ref.: [`admin/SPEC_ADMIN_EQUIPE.md`](./admin/SPEC_ADMIN_EQUIPE.md), [`sistema/SPEC_EMAILS.md`](./sistema/SPEC_EMAILS.md).
  - [x] **Sidebar da Consultora** com escopo restrito e `/admin/minha-conta` (perfil + extrato de comissões). Sidebar e BottomNav filtrados por role; rotas `/admin/minha-conta` e `/admin/minha-conta/comissoes` criadas. Server Actions `getMinhaConta` e `getExtratoComissoes`. Ref.: [`admin/SPEC_ADMIN_CONSULTORA_PERFIL.md`](./admin/SPEC_ADMIN_CONSULTORA_PERFIL.md).
  - [x] **Analytics do Grupo** filtrado para consultora (`/admin/analytics`) — reescrita completa da rota. Server Actions `actions-analytics.ts` refatoradas para analytics operacional de maletas com filtro por grupo (`reseller.colaboradora_id` para COLABORADORA, tudo para ADMIN). KPIs: maletas ativas, devolvidas mês, taxa de atraso, ticket médio, revendedoras com maleta, tempo médio de devolução. Gráficos: fluxo de maletas (barras CSS), distribuição por status (donut SVG). Tabelas: top revendedoras por volume, alertas de prazo (≤7 días), produtos mais vendidos. Filtro de período via query params (7d/30d/3m/12m). Ref.: [`admin/SPEC_ADMIN_ANALYTICS_NOTIFICATIONS.md`](./admin/SPEC_ADMIN_ANALYTICS_NOTIFICATIONS.md), [`admin/SPEC_ADMIN_CONSULTORA_PERFIL.md`](./admin/SPEC_ADMIN_CONSULTORA_PERFIL.md).
- [~] **Centro de notificações** no PWA + campanhas push no admin. Ref.: [`revendedoras/SPEC_NOTIFICACOES.md`](./revendedoras/SPEC_NOTIFICACOES.md), [`admin/SPEC_ADMIN_ANALYTICS_NOTIFICATIONS.md`](./admin/SPEC_ADMIN_ANALYTICS_NOTIFICATIONS.md), [`prd/PRD_OneSignal_PWA.md`](./prd/PRD_OneSignal_PWA.md).
  - [x] **Preferências de push no PWA** (`/app/perfil/notificaciones`) — toggles para 6 tipos de notificação com auto-save (debounce 500ms) + `useOptimistic`, status do OneSignal, defaults da SPEC. Server Actions `getPreferenciasNotificaciones` e `actualizarPreferenciasNotificaciones`.
  - [x] **Histórico persistente de notificações no PWA** — tela `/app/notificaciones` com lista agrupada por día (Hoy, Ayer, Anteriores). Server Actions `getNotificacoes`, `marcarComoLida`, `getContagemNaoLidas`. Tabela `Notificacao` criada no Prisma + migration. Instrumentação das ações geradoras: `nova_maleta` (criarMaleta), `acerto_confirmado` (conferirEFecharMaleta), `prazo_proximo` e `maleta_atrasada` (cron job `check-overdue-maletas`), `pontos_ganhos` (registrarVenda, registrarVendaMultipla, awardPoints em devolução/maleta completa). Helper central `src/lib/notifications.ts` (criar notificação + push condicional por preferência). Componentes reutilizáveis: `NotificacionItem`, `NotificacionesList`. Badge de não lidas no menu "Más". Ref.: [`revendedoras/SPEC_NOTIFICACOES.md`](./revendedoras/SPEC_NOTIFICACOES.md).
  - [x] **Admin AlertBell** — sininho persistente no header admin com badge de maletas `aguardando_revisao` + drawer de devoluções pendentes. Componente `AdminAlertBell` em `src/components/admin/AdminAlertBell.tsx`; API routes `/api/admin/alertas/count` e `/api/admin/alertas/maletas` com RBAC (`getResellerScope`); contagem SSR no `layout.tsx` admin; polling a cada 30s; drawer custom com animação CSS. Ref.: [`admin/SPEC_ADMIN_ANALYTICS_NOTIFICATIONS.md`](./admin/SPEC_ADMIN_ANALYTICS_NOTIFICATIONS.md) §3.
  - [ ] **Configuração de notificações push no admin** (`/admin/config/notif-push`) — templates OneSignal, histórico de envios, teste de push.
- [x] **Emails transacionais** via Brevo (SDK instalado, cliente central `src/lib/emails.ts`, 6 templates criados). Configuração SMTP no Supabase Dashboard ainda pendente (manual). Ref.: [`sistema/SPEC_EMAILS.md`](./sistema/SPEC_EMAILS.md).
- [x] **Configurar SMTP do Brevo no Supabase Dashboard** — concluído em 2026-04-23. Credenciais SMTP do Brevo configuradas no Supabase Dashboard (host `smtp-relay.brevo.com`, port `587`, user e senha SMTP). Reset de senha, convite por email e magic links do Supabase Auth agora saem via Brevo. Rota de callback `/admin/login/reset-password` criada. Ref.: [`sistema/SPEC_EMAILS.md`](./sistema/SPEC_EMAILS.md) §10.
- [ ] **Padronizar layout/branding dos emails transacionais** — revisar e unificar os templates de: recuperação de senha, convite de nova consultora, convite de nova revendedora e demais emails operacionais. Entregáveis: identidade visual consistente, copy final em espanhol paraguaio, componentes reutilizáveis de template e checklist de QA (cliente desktop/mobile + spam). Ref.: [`sistema/SPEC_EMAILS.md`](./sistema/SPEC_EMAILS.md).
- [ ] **Cron jobs** (notificação de prazo de maleta etc.) em Supabase Edge Functions. Ref.: [`sistema/SPEC_CRON_JOBS.md`](./sistema/SPEC_CRON_JOBS.md).
- [ ] **Documentos e acertos** no admin. Ref.: [`admin/SPEC_ADMIN_DOCUMENTOS_ACERTOS.md`](./admin/SPEC_ADMIN_DOCUMENTOS_ACERTOS.md).
- [ ] **Pipeline de Leads** vindos da landing "Seja Revendedora". Ref.: [`admin/SPEC_ADMIN_LEADS.md`](./admin/SPEC_ADMIN_LEADS.md), [`revendedoras/SPEC_SEJA_REVENDEDORA.md`](./revendedoras/SPEC_SEJA_REVENDEDORA.md).
- [x] **Catálogo no PWA** da revendedora. Ref.: [`revendedoras/SPEC_CATALOGO.md`](./revendedoras/SPEC_CATALOGO.md).
  - [x] Página `/app/catalogo` — grid com produtos da maleta ativa, busca e filtro por categoria
  - [x] Página `/app/catalogo/compartir` — seleção multi-foto com checkmark e barra sticky
  - [x] Server Action `getCatalogoRevendedora()` — lista itens da maleta ativa com saldo
  - [x] Server Action `registrarPuntosCompartirCatalogo()` — gamificação +50pts por compartilhar
  - [x] **[BUG] Compartilhar individual não envia foto nem informações completas** — Corrigido: `handleShareIndividual` agora baixa a imagem via proxy `/api/proxy-image`, cria `File` e usa `navigator.share({ files, text })` com foto + nome + preço + variante. Fallback WhatsApp inclui link do produto (`/produto/{id}`). Ref.: `src/app/app/catalogo/page.tsx`, `src/lib/share-images.ts`.
  - [x] **[BUG] Compartilhar múltiplas fotos não funciona** — Corrigido: criada route `/api/proxy-image` para contornar CORS do R2; `handleCompartir` usa `downloadImageAsFile` via proxy; `AbortError` tratado como cancelamento (não exibe erro); fallback WhatsApp envia nomes + URLs dos produtos; validação de pelo menos 1 imagem válida antes de compartilhar; botão desabilitado se nenhuma imagem disponível. Ref.: `src/app/app/catalogo/compartir/page.tsx`, `src/lib/share-images.ts`, `src/app/api/proxy-image/route.ts`.
- [x] **Menu "Más" do PWA** (`/app/mais`) — hub de navegação com grupos "Mi Cuenta / Actividad / Soporte" + Cerrar Sesión. Criar rota `/app/mais`, novas moléculas `MenuHeader`, `MenuSectionCard`, `MenuRow`, `LogoutButton` em `src/components/app/`, ajustar `AppBottomNav` para ativar **Más** também em `/app/perfil*`, adicionar tokens `--app-accent-green*` e `--app-danger*` em `docs/design-system/tokens.md`. Design no Paper: artboard `Menu` (`1G-0`) do arquivo `monarca`. Ref.: [`revendedoras/SPEC_MENU_MAS.md`](./revendedoras/SPEC_MENU_MAS.md).
- [ ] **Desempenho da revendedora** (analytics individual). Ref.: [`revendedoras/SPEC_DESEMPENHO.md`](./revendedoras/SPEC_DESEMPENHO.md).
- [ ] **Dashboard admin** com KPIs globais/grupo. Ref.: [`admin/SPEC_ADMIN_DASHBOARD.md`](./admin/SPEC_ADMIN_DASHBOARD.md).
- [ ] **Configurações globais** (tiers, níveis, contratos). Ref.: [`admin/SPEC_ADMIN_CONFIG.md`](./admin/SPEC_ADMIN_CONFIG.md).
- [ ] **Otimizar build do Vercel — remover workaround `force-dynamic`** — causa-raiz: o ambiente de build do Vercel não tem `DATABASE_URL` válida, então qualquer prerender que chame Prisma falha com `Can't reach database server at 127.0.0.1:5432`. Workaround atual: `export const dynamic = "force-dynamic"` em todas as páginas que fazem queries (home `/`, `/catalogo/*`, `/produto/[slug]`, `/admin/*`) — isso força render em cada request e degrada performance. Ações: (1) configurar `DATABASE_URL` apontando para Supabase real nas env vars do Vercel (scope: Production + Preview + Development no build step); OU (2) migrar para ISR com `export const revalidate = N` nas páginas de catálogo (exige banco acessível no build); (3) depois de qualquer uma das duas, remover os `force-dynamic` das páginas públicas e avaliar caso a caso nas admin. Ref.: [`sistema/SPEC_DEPLOY_STRATEGY.md`](./sistema/SPEC_DEPLOY_STRATEGY.md), [`sistema/SPEC_ENVIRONMENT_VARIABLES.md`](./sistema/SPEC_ENVIRONMENT_VARIABLES.md), [`sistema/SPEC_CACHING_STRATEGY.md`](./sistema/SPEC_CACHING_STRATEGY.md).

---

## Prioridade Baixa — Expansão e qualidade contínua

- [ ] **Vitrina pública** `/vitrina/[slug]` com indexação SEO e tracking. Ref.: [`revendedoras/SPEC_VITRINE_PUBLICA.md`](./revendedoras/SPEC_VITRINE_PUBLICA.md).
- [ ] **Analytics agregados** admin (além de campanhas push). Ref.: [`admin/SPEC_ADMIN_ANALYTICS_NOTIFICATIONS.md`](./admin/SPEC_ADMIN_ANALYTICS_NOTIFICATIONS.md).
- [ ] **Estratégia de cache e revalidação** — `revalidateTag` por entidade. Ref.: [`sistema/SPEC_CACHING_STRATEGY.md`](./sistema/SPEC_CACHING_STRATEGY.md).
- [ ] **Error handling centralizado** (ActionResult + mensagens). Ref.: [`sistema/SPEC_ERROR_HANDLING.md`](./sistema/SPEC_ERROR_HANDLING.md).
- [ ] **Skeleton / empty / error states** consistentes. Ref.: [`sistema/SPEC_SKELETON_EMPTY_STATES.md`](./sistema/SPEC_SKELETON_EMPTY_STATES.md).
- [ ] **Testes E2E com Playwright** — golden paths (login → maleta → venda → devolução). Ref.: [`sistema/SPEC_TESTING_STRATEGY.md`](./sistema/SPEC_TESTING_STRATEGY.md).
- [ ] **Observabilidade** — Sentry + logs estruturados + alertas. Ref.: [`sistema/SPEC_LOGGING_MONITORING.md`](./sistema/SPEC_LOGGING_MONITORING.md).
- [ ] **Rate limiting** nos endpoints sensíveis (Upstash Redis). Ref.: [`sistema/SPEC_SECURITY_API_ENDPOINTS.md`](./sistema/SPEC_SECURITY_API_ENDPOINTS.md).
- [ ] **Migração para domínio oficial `monarcasemijoyas.com.py`** — seguir o checklist canônico em [`sistema/SPEC_DOMAIN_MIGRATION.md`](./sistema/SPEC_DOMAIN_MIGRATION.md). Cobre: DNS + Vercel, env vars, Supabase Auth (Site URL + Redirect URLs + templates OTP), Brevo (SPF/DKIM/DMARC), Cloudflare R2 (subdomínio + reescrita de URLs antigas), OneSignal, OAuth providers, PWA, validação pós-migração e rollback. Fluxo de recovery já validado em 2026-04-23 no preview via `src/app/auth/callback/route.ts` (aceita `token_hash` e `code`) — só falta executar a virada.
- [ ] **Deploy e rollback documentados** (ambientes, preview, produção). Ref.: [`sistema/SPEC_DEPLOY_STRATEGY.md`](./sistema/SPEC_DEPLOY_STRATEGY.md), [`sistema/SPEC_ENVIRONMENT_VARIABLES.md`](./sistema/SPEC_ENVIRONMENT_VARIABLES.md).
- [ ] **Migração PWA → Capacitor (iOS + Android)** — empacotar o app da revendedora como app nativo publicado na App Store e Google Play para viabilizar Universal Links/App Links (link do email de reset abre no app), push nativo, câmera nativa e melhor retenção. SPEC completa com arquitetura "Capacitor remoto", checklist de implementação, QA, custos e riscos em [`sistema/SPEC_CAPACITOR_MIGRATION.md`](./sistema/SPEC_CAPACITOR_MIGRATION.md). Decisão opcional — justifica-se com crescimento da base de revendedoras ativas ou demanda de posicionamento mobile-first.
- [ ] **Modo offline do PWA da revendedora** — arquitetura local-first com outbox, sync idempotente por `client_operation_id`, resolução de conflitos e UI de estados pendentes. Permite registrar vendas sem sinal, com sincronização automática ao reconectar. Faseado em 4 etapas: (1) cache de leitura, (2) outbox para `registrarVenda`, (3) demais mutações, (4) SQLite+SQLCipher via Capacitor. Ver [`sistema/SPEC_OFFLINE_SYNC.md`](./sistema/SPEC_OFFLINE_SYNC.md). Exige migration Prisma (coluna `client_operation_id` em `vendas_maleta`) e refatoração das Server Actions afetadas para idempotência.

---

## Regras para este arquivo

1. **Atualizar ao concluir qualquer tarefa.** Marcar `[x]` e, se relevante, mover para `CHANGELOG.md`.
2. **Não adicionar itens sem SPEC correspondente** em `/docs`. Se a funcionalidade não existir na SPEC, a SPEC deve ser criada primeiro.
3. **Manter a referência à SPEC** em cada item — é o contrato de implementação.
4. **Reordenar prioridades** quando o contexto de negócio mudar; justificar no commit.
