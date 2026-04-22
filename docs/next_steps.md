# NEXT-MONARCA — Próximos Passos

> Plano de evolução baseado no delta entre SPECs em `/docs` e o estado atual descrito em [`project_overview.md`](./project_overview.md) §6–7. Atualizar após cada entrega.

**Convenção de status:** `[ ]` pendente · `[~]` em andamento · `[x]` concluído.

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
- [ ] **Devolução com câmera + comprovante** — upload via `/api/upload-r2`. Ref.: [`revendedoras/SPEC_DEVOLUCAO.md`](./revendedoras/SPEC_DEVOLUCAO.md), [`sistema/SPEC_API_UPLOAD_R2.md`](./sistema/SPEC_API_UPLOAD_R2.md).
  - [ ] Paso 1: Resumen — resumo de enviados/vendidos/a devolver, badge de atrasada
  - [ ] Paso 2: Foto — captura de câmera ou upload, preview da imagem
  - [ ] Paso 3: Revisión final — resumo + comissão estimada + foto confirmada
  - [ ] Paso 4: Confirmación — splash de sucesso com próximos passos
  - [ ] Server Action `devolverMaleta()` — muda status para `aguardando_revisao`, faz upload do comprovante via R2, dispara notificação
- [ ] **Fechar maleta sem comprovante (admin/consultora)** — tornar comprovante opcional no `conferirEFecharMaleta` quando acionado via botão "Cerrar sin comprobante" no `/admin/maletas/[id]`. Registrar justificativa em `nota_acerto` (ex.: "Cierre manual sin comprobante"). Revendedora continua obrigada a enviar foto pelo PWA. Atualizar antes: [`admin/SPEC_ADMIN_CONFERIR_MALETA.md`](./admin/SPEC_ADMIN_CONFERIR_MALETA.md) e [`admin/SPEC_ADMIN_MALETAS.md`](./admin/SPEC_ADMIN_MALETAS.md) (seção "Fechar Maleta Manualmente"). Tocar: `src/app/admin/actions-maletas.ts` (`conferirEFecharMaleta` — remover bloqueio da linha 464-466 condicionalmente), `src/app/admin/maleta/[id]/` (UI do botão).
- [ ] **Editar maleta após criação — acrescentar itens e aumentar quantidade** — nova Server Action `adicionarItensMaleta(maletaId, itens[])` permitida para ADMIN/COLABORADORA enquanto maleta estiver em `ativa` ou `atrasada`. Regras: (1) apenas acréscimo — não remove nem diminui; (2) valida estoque com reserva atômica (mesma lógica de `criarMaleta`); (3) novos itens recebem snapshot do preço atual em `preco_fixado`; (4) itens que já existiam na maleta: incrementa `quantidade_enviada` mantendo o `preco_fixado` original; (5) registra `estoqueMovimento` tipo `reserva_maleta`; (6) dispara push para a revendedora ("Se añadieron artículos a tu consignación"). Criar UI em `/admin/maletas/[id]/editar` (ou modal na página de detalhe) reutilizando `ProdutosSelectorStep` de `/admin/maletas/nova`. Atualizar antes: [`admin/SPEC_ADMIN_MALETAS.md`](./admin/SPEC_ADMIN_MALETAS.md) (nova seção "Tela 5: Editar Maleta") e [`revendedoras/SPEC_MALETA.md`](./revendedoras/SPEC_MALETA.md) (avisar revendedora quando a maleta foi alterada).
- [ ] **RBAC e RLS validados por tabela** — revisar middleware, guards de Server Actions e policies Supabase para `REVENDEDORA`, `COLABORADORA`, `ADMIN`. Ref.: [`sistema/SPEC_SECURITY_RBAC.md`](./sistema/SPEC_SECURITY_RBAC.md).
- [ ] **Proteção de dados sensíveis** — sanitização de logs, criptografia/acesso a documentos e dados bancários. Ref.: [`sistema/SPEC_SECURITY_DATA_PROTECTION.md`](./sistema/SPEC_SECURITY_DATA_PROTECTION.md).
- [ ] **Onboarding e completude de perfil** da revendedora. Ref.: [`revendedoras/SPEC_ONBOARDING_REVENDEDORA.md`](./revendedoras/SPEC_ONBOARDING_REVENDEDORA.md), [`revendedoras/SPEC_PERFIL.md`](./revendedoras/SPEC_PERFIL.md).
- [ ] **Home do PWA** com métricas reais e maleta ativa. Ref.: [`revendedoras/SPEC_HOME.md`](./revendedoras/SPEC_HOME.md).
- [ ] **Recuperar senha** (reset via SMTP). Ref.: [`revendedoras/SPEC_RECUPERAR_CONTRASENA.md`](./revendedoras/SPEC_RECUPERAR_CONTRASENA.md).

---

## Prioridade Média — Engajamento e operação

Itens que aumentam valor do produto depois do ciclo base estar estável.

- [ ] **Motor de gamificação** — pontos por prazo/meta/completude, progressão de níveis, tiers de comissão. Ref.: [`admin/SPEC_ADMIN_GAMIFICACAO.md`](./admin/SPEC_ADMIN_GAMIFICACAO.md), [`revendedoras/SPEC_PROGRESSO.md`](./revendedoras/SPEC_PROGRESSO.md).
- [ ] **Brindes** — catálogo admin + resgates + extrato. Ref.: [`admin/SPEC_ADMIN_BRINDES.md`](./admin/SPEC_ADMIN_BRINDES.md), [`revendedoras/SPEC_EXTRATO_BRINDES.md`](./revendedoras/SPEC_EXTRATO_BRINDES.md).
- [ ] **Gestão de Equipe** no admin (revendedoras + consultoras, vínculos `manager_id`). Ref.: [`admin/SPEC_ADMIN_EQUIPE.md`](./admin/SPEC_ADMIN_EQUIPE.md), [`admin/SPEC_ADMIN_CONSULTORA_PERFIL.md`](./admin/SPEC_ADMIN_CONSULTORA_PERFIL.md).
- [ ] **Centro de notificações** no PWA + campanhas push no admin. Ref.: [`revendedoras/SPEC_NOTIFICACOES.md`](./revendedoras/SPEC_NOTIFICACOES.md), [`admin/SPEC_ADMIN_ANALYTICS_NOTIFICATIONS.md`](./admin/SPEC_ADMIN_ANALYTICS_NOTIFICATIONS.md), [`prd/PRD_OneSignal_PWA.md`](./prd/PRD_OneSignal_PWA.md).
- [ ] **Emails transacionais** via Brevo (boas-vindas, reset senha, prazo de maleta, acerto). Ref.: [`sistema/SPEC_EMAILS.md`](./sistema/SPEC_EMAILS.md).
- [ ] **Cron jobs** (notificação de prazo de maleta etc.) em Supabase Edge Functions. Ref.: [`sistema/SPEC_CRON_JOBS.md`](./sistema/SPEC_CRON_JOBS.md).
- [ ] **Documentos e acertos** no admin. Ref.: [`admin/SPEC_ADMIN_DOCUMENTOS_ACERTOS.md`](./admin/SPEC_ADMIN_DOCUMENTOS_ACERTOS.md).
- [ ] **Pipeline de Leads** vindos da landing "Seja Revendedora". Ref.: [`admin/SPEC_ADMIN_LEADS.md`](./admin/SPEC_ADMIN_LEADS.md), [`revendedoras/SPEC_SEJA_REVENDEDORA.md`](./revendedoras/SPEC_SEJA_REVENDEDORA.md).
- [ ] **Catálogo no PWA** da revendedora. Ref.: [`revendedoras/SPEC_CATALOGO.md`](./revendedoras/SPEC_CATALOGO.md).
- [ ] **Desempenho da revendedora** (analytics individual). Ref.: [`revendedoras/SPEC_DESEMPENHO.md`](./revendedoras/SPEC_DESEMPENHO.md).
- [ ] **Dashboard admin** com KPIs globais/grupo. Ref.: [`admin/SPEC_ADMIN_DASHBOARD.md`](./admin/SPEC_ADMIN_DASHBOARD.md).
- [ ] **Configurações globais** (tiers, níveis, contratos). Ref.: [`admin/SPEC_ADMIN_CONFIG.md`](./admin/SPEC_ADMIN_CONFIG.md).

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
- [ ] **Deploy e rollback documentados** (ambientes, preview, produção). Ref.: [`sistema/SPEC_DEPLOY_STRATEGY.md`](./sistema/SPEC_DEPLOY_STRATEGY.md), [`sistema/SPEC_ENVIRONMENT_VARIABLES.md`](./sistema/SPEC_ENVIRONMENT_VARIABLES.md).

---

## Regras para este arquivo

1. **Atualizar ao concluir qualquer tarefa.** Marcar `[x]` e, se relevante, mover para `CHANGELOG.md`.
2. **Não adicionar itens sem SPEC correspondente** em `/docs`. Se a funcionalidade não existir na SPEC, a SPEC deve ser criada primeiro.
3. **Manter a referência à SPEC** em cada item — é o contrato de implementação.
4. **Reordenar prioridades** quando o contexto de negócio mudar; justificar no commit.
