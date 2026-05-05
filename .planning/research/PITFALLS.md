# Domain Pitfalls

**Domain:** NEXT-MONARCA v1.0 — Notificações, Analytics, Leads, Configs, Error Handling, Build Optimization
**Researched:** 2026-05-04
**Context:** Brownfield Next.js 15 + Prisma + Supabase com usuários reais (revendedoras)

---

## Critical Pitfalls

### CP-1: Template Variable Injection em Notificações
**What goes wrong:** O helper `substituirVariaveis` faz replace direto de strings sem sanitização. Se o template contiver HTML/JS e o replace for aplicado em contexto de email ou push com rich content, vaza XSS. Pior: se variáveis vierem de input do usuário (ex: `{nome_revendedora}` com `<script>`), o push/email renderiza código arbitrário.
**Why it happens:** Variable substitution é tipicamente implementado com `String.prototype.replaceAll()` sem HTML-escape ou validação de whitelist de variáveis.
**Consequences:** XSS em notificações push (OneSignal aceita HTML em alguns canais), emails com scripts, ou injection de variáveis não-esperadas que quebram o payload JSON da API OneSignal.
**Prevention:**
- Whitelist de variáveis permitidas por tipo (`{maleta_id}`, `{dias_restantes}`). Rejeitar chaves desconhecidas.
- Escapar HTML em templates de email (usar helper existente de sanitização).
- OneSignal push usar `contents` plain-text apenas; nunca injetar HTML no `contents`.
- Validar que `maleta_id` e outros IDs são UUIDs antes de substituição.
**Detection:** Log de notificações com caracteres `<`, `>`, `{` inesperados no corpo. Teste com variável `{nome_revendedora} = "<script>alert(1)</script>"`.
**Phase:** Notificações e Leads — Fase 1
**Severity:** Critical

### CP-2: Analytics Queries N+1 ou Table Scan em `AnalyticsAcesso`
**What goes wrong:** O dashboard de desempenho da revendedora (`/app/desempeno`) e o admin dashboard (`/admin`) fazem agregações em `AnalyticsAcesso` (eventos brutos) em vez de usar `AnalyticsDiario` (pré-agregado). Com milhares de eventos, a query explode em tempo e memória.
**Why it happens:** Dev escreve `COUNT(*)` em `AnalyticsAcesso` filtrando por `reseller_id` e range. Sem índice composto `(reseller_id, created_at, tipo_evento)`, o PostgreSQL faz sequential scan.
**Consequences:** Timeout de 10s na Vercel (Server Components), custo alto de CPU no Supabase, possível kill da query pelo Postgres, dashboard quebrado para revendedoras.
**Prevention:**
- Índice obrigatório: `CREATE INDEX idx_analytics_acesso_reseller_data_tipo ON analytics_acessos(reseller_id, created_at, tipo_evento);`
- Dashboard usar `AnalyticsDiario` para ranges > 7 dias. `AnalyticsAcesso` só para "hoje" ou período real-time.
- Query usar `EXPLAIN ANALYZE` antes de merge.
- Limitar granularidade: semana/mês/ano → `AnalyticsDiario`; últimos 7 dias → `AnalyticsAcesso` com `LIMIT`.
**Detection:** Query duration > 500ms no Supabase Dashboard → Insights. Slow query log.
**Phase:** Analytics — Fase 2
**Severity:** Critical

### CP-3: Race Condition na Aprovação de Leads (Duplicate Auth Users)
**What goes wrong:** Dois admins clicam "Aprovar" simultaneamente no mesmo lead, ou o admin clica duas (double-submit). O Server Action `aprovarLead` cria usuário Supabase Auth + `Reseller` no banco, mas sem transação atômica entre os dois sistemas.
**Why it happens:** Supabase Auth e Prisma são serviços separados. Não há distributed lock. A verificação `if (lead.status !== 'pendente')` é feita no início, mas entre o check e o update outro request pode passar.
**Consequences:** Dois users no Supabase Auth para o mesmo email, ou um `Reseller` órfão sem auth_user_id. Dados inconsistentes exigem intervenção manual no banco.
**Prevention:**
- Usar `SELECT FOR UPDATE` (ou Prisma `findUnique` + `update` com where status=pendente) para lock otimista.
- Verificar idempotência: `if (lead.status !== 'pendente') return { success: false, error: '...' }` **após** re-ler o lead no início da action.
- Criar Supabase Auth user primeiro; se falhar, abortar antes de criar `Reseller`.
- Se criar `Reseller` falhar, deletar o Auth user (compensação) ou marcar lead como `erro` para retry manual.
- Botão de aprovação com `disabled` durante `isPending` + debounce de 1s.
**Detection:** Erro `P2002` (unique constraint) em `resellers.email` ou `auth.users.email`. Logs de duplicidade.
**Phase:** Leads — Fase 1
**Severity:** Critical

### CP-4: Remover `force-dynamic` sem `DATABASE_URL` no Build → Produção Down
**What goes wrong:** Em deploy, se alguém remove `export const dynamic = 'force-dynamic'` de páginas públicas (`/`, `/catalogo`, `/produto/*`) mas não configura `DATABASE_URL` nas env vars do Vercel para o build step, o `next build` falha ao tentar prerender com Prisma.
**Why it happens:** Next.js 15 faz static generation por padrão. Se a página faz qualquer query Prisma no Server Component (mesmo que envolvida em `unstable_cache`), o build precisa de conexão com o banco.
**Consequences:** Build quebrado em produção. Rollback necessário. Downtime até reverter.
**Prevention:**
- **Passo 1:** Adicionar `DATABASE_URL` e `DIRECT_URL` nas env vars do Vercel (Production, Preview, Development) **antes** de tocar em qualquer `force-dynamic`.
- **Passo 2:** Usar `export const revalidate = 60` em páginas públicas, NÃO `dynamic = 'auto'` sem entender as implicações.
- **Passo 3:** Testar build localmente com `DATABASE_URL` apontando para staging antes de merge.
- **Passo 4:** Para páginas que realmente precisam de dados no build (ex: catálogo estático), usar `generateStaticParams` com fallback.
**Detection:** CI build falha com `PrismaClientInitializationError` ou `Can't reach database server`. Vercel deployment log mostra erro em `page.tsx`.
**Phase:** Build Optimization — Fase 4 (última, após todas as features)
**Severity:** Critical

### CP-5: Alterar Commission Tiers ou Gamification Levels Afeta Maletas Congeladas
**What goes wrong:** Admin edita `CommissionTier` (porcentagem) ou `NivelRegra` (pontos mínimos). O sistema recalcula comissão ou nível de maletas já fechadas, violando a regra de negócio "valores de maleta fechada são imutáveis".
**Why it happens:** Query de dashboard ou relatório faz JOIN com `CommissionTier` atual em vez de usar o snapshot `maleta.taxa_comissao` gravado no fechamento.
**Consequences:** Comissões pagas incorretamente, revendedoras questionando valores, necessidade de auditoria financeira.
**Prevention:**
- **Invariante de código:** Nunca recalcular `valor_comissao` de maleta com `status = 'concluida'`. Usar `maleta.valor_comissao` (snapshot).
- **Audit:** Toda query financeira que envolve `CommissionTier` deve ter teste de regressão verificando que maletas concluídas mantêm valor histórico.
- **UI:** Admin mostrar aviso "Mudanças afetam apenas novas consignações" ao editar tiers.
**Detection:** Diff entre `maleta.valor_comissao` e `recalcular(maleta.valor_total_vendido, tier_atual)` para maletas concluídas.
**Phase:** Configurações Globais — Fase 3
**Severity:** Critical

### CP-6: Migração Parcial do ActionResult → Estado Inconsistente de Erro
**What goes wrong:** Durante a transição para error handling centralizado, algumas Server Actions retornam `ActionResult` ( `{ success: false, error }` ) enquanto outras ainda fazem `throw new Error('BUSINESS: ...')`. Client Components que esperam um padrão quebram.
**Why it happens:** Migração incremental sem checklist de coverage. Dev muda algumas actions mas esquece outras.
**Consequences:** UI mostra `[object Object]` em toast, ou erro silencioso sem mensagem. UX degradada. Dificulta debug.
**Prevention:**
- **Não fazer migração gradual por action.** Criar wrapper `safeAction` (já existe em `action-utils.ts`) e aplicar a **todas** as actions de um módulo por vez.
- **Checklist obrigatório:** Antes de marcar fase como concluída, rodar script de grep: `grep -r "throw new Error.*BUSINESS" src/app/*/actions*.ts` deve retornar vazio.
- **Client-side:** Criar hook `useAction` que lida com ambos os formatos durante transição, mas deprecar suporte a throw em 1 sprint.
**Detection:** `grep -n "throw new Error" src/app/**/actions*.ts`. Testes de integração quebrando com `result.error` undefined.
**Phase:** Error Handling — Fase 4 (depois das features, antes do build)
**Severity:** Critical

---

## High Pitfalls

### HP-1: Cron Job sem Fallback quando `NotificacaoTemplate` está Inativo ou Ausente
**What goes wrong:** O cron `check-maleta-prazo` lê template do banco. Se o template foi desativado pelo admin ou se a query falha (network blip), o job não envia notificação alguma — nem mesmo a mensagem padrão hardcoded.
**Why it happens:** Refatoração remove os textos hardcoded mas não implementa fallback robusto. Ou o fallback é `null` e o job silenciosamente skipa.
**Consequences:** Revendedoras não recebem alertas de prazo. Maleta vence sem aviso. Reputação operacional comprometida.
**Prevention:**
- Fallback hierárquico: (1) Template ativo do banco com variáveis substituídas; (2) Template default seed em código; (3) Mensagem genérica hardcoded.
- Log de fallback ativado para monitoring (Sentry).
- Edge Function nunca deve falhar silenciosamente — sempre retornar count de notificações enviadas/fallbacks.
**Detection:** `NotificacaoLog` sem registros em dias com maletas próximas ao vencimento. Alerta se count de pushes = 0 em 24h.
**Phase:** Notificações — Fase 1
**Severity:** High

### HP-2: Admin Dashboard sem Scope Filtering → Vazamento de Dados (IDOR)
**What goes wrong:** O dashboard admin (`/admin`) carrega KPIs globais. A query usa `getResellerScope(caller)` mas alguma métrica nova (ex: "top produtos populares") esquece de aplicar o scope, retornando dados de todos os grupos para COLABORADORA.
**Why it happens:** Dashboard usa `Promise.all` com múltiplas queries. Uma query ad-hoc (ex: ranking de produtos) é escrita sem `WHERE reseller.manager_id = caller.id`.
**Consequences:** COLABORADORA vê vendas e nomes de revendedoras de outras consultoras. Violação de privacidade + confiança.
**Prevention:**
- **Regra de arquitetura:** Todo `prisma.*.findMany` no admin DEVE começar com `const scope = getResellerScope(caller);` e espalhar `...scope` no where.
- **Code review gate:** PRs de dashboard/admin exigem evidência de `EXPLAIN` ou ao menos assert de scope nos testes.
- **Teste de segurança:** Teste unitário que simula COLABORADORA A acessando dados de COLABORADORA B → espera array vazio ou erro.
**Detection:** RLS logs no Supabase mostrando acessos fora do grupo (se RLS estiver ativa). Ou diferença de counts entre dashboards de duas consultoras.
**Phase:** Dashboard Admin — Fase 2
**Severity:** High

### HP-3: Agregação de Analytics em Request Thread (Server Component Timeout)
**What goes wrong:** O dashboard de desempenho (`/app/desempeno`) calcula "visitantes únicos" com `COUNT(DISTINCT visitor_id)` sobre `AnalyticsAcesso` no Server Component. Para revendedora com muitos acessos e range "Este Año", a query demora > 10s.
**Why it happens:** `COUNT(DISTINCT ...)` em tabela grande sem índice adequado. Next.js 15 Server Components têm timeout implícito na Vercel.
**Consequences:** 504 Gateway Timeout, página de erro genérica, revendedora sem acesso ao próprio desempenho.
**Prevention:**
- Usar `AnalyticsDiario` para TODO range > 7 dias. A tabela `AnalyticsDiario` é literalmente o pré-agregado para isso.
- Para "Este Año", somar `visitantes_unicos` de `AnalyticsDiario` — nunca calcular DISTINCT no evento bruto.
- Adicionar índice em `analytics_diario(reseller_id, data)`.
- Implementar timeout de query no Prisma (`connectionTimeoutMillis` já configurado, mas adicionar `query timeout` se necessário).
**Detection:** Slow query log no Supabase. Timeout 504 no Vercel Function log.
**Phase:** Analytics — Fase 2
**Severity:** High

### HP-4: Lead Aprovado mas Email de Boas-Vindas Falha → Revendedora sem Senha
**What goes wrong:** O fluxo `aprovarLead` cria Auth user e `Reseller`, atualiza lead para `aprovado`, mas o envio de email com senha temporária falha (Brevo/Resend down, rate limit). A revendedora não recebe credenciais.
**Why it happens:** Email é enviado após a transação de banco. Se falha, não há rollback do estado de aprovação.
**Consequences:** Revendedora aprovada mas sem acesso. Admin precisa resetar senha manualmente. Suporte operacional.
**Prevention:**
- **Compensação:** Se email falha, criar registro em fila de retry (tabela `EmailQueue` ou usar Supabase Edge Function async).
- **Ou:** Enviar email ANTES de marcar lead como aprovado, e só confirmar aprovação se email retornar 2xx. Se email falha, manter lead como `pendente` e informar admin.
- **Dashboard admin:** Mostrar status de envio de email na lista de aprovados. Botão "Reenviar credenciais".
**Detection:** `NotificacaoLog` ou tabela de email sem registro de envio para lead aprovado. Lead `aprovado` com `email_enviado = false`.
**Phase:** Leads — Fase 1
**Severity:** High

### HP-5: Skeleton States Inconsistentes Causando "Flash de Vazio"
**What goes wrong:** Algumas páginas usam `<Suspense fallback={<SkeletonList />}>` mas outras não têm `loading.tsx` ou usam skeleton com count errado (ex: 5 cards para lista que normalmente tem 1). O usuário vê layout shift ou flash de empty state antes dos dados.
**Why it happens:** Implementação incremental de skeletons sem padronização. Dev esquece de adicionar `loading.tsx` em nova rota.
**Consequences:** Percepção de app quebrado, especialmente em 3G. CLS (Cumulative Layout Shift) negativo se skeleton tem altura diferente do conteúdo real.
**Prevention:**
- **Checklist por rota:** Cada nova rota em `/app/*` ou `/admin/*` deve ter `loading.tsx` com skeleton que espelha o layout real (mesmo número de cards, mesma altura aproximada).
- **Componentes obrigatórios:** Usar `SkeletonMetricDashboard`, `SkeletonList`, `SkeletonCard` do design system. Nunca criar skeleton one-off.
- **Empty state nunca aparece antes do skeleton:** Garantir que `loading.tsx` é o único estado intermediário. Empty state só renderiza após fetch completar e retornar `[]`.
**Detection:** Lighthouse CLS score > 0.1. Teste visual de throttling 3G.
**Phase:** Skeleton/Empty States — Fase 4
**Severity:** High

### HP-6: ISR Público sem `revalidateTag` → Dados Stalados Após Mutação
**What goes wrong:** Páginas públicas (`/catalogo`, `/produto/[slug]`, `/vitrina/[slug]`) usam `revalidate = 60` mas quando admin altera produto, a página continua mostrando preço/nome antigo até o TTL expirar.
**Why it happens:** A mutação (ex: `updateProduct`) não chama `revalidateTag('catalog')` ou `revalidatePath('/produto/[slug]')`.
**Consequences:** Cliente vê preço errado na vitrina. Revendedora compartilha link com produto inativo.
**Prevention:**
- **Invalidação centralizada:** Usar helper `invalidateCache` (já definido na SPEC_CACHING_STRATEGY) em toda Server Action de mutação.
- **Tabela de mapeamento:** Documentar qual tag invalida qual rota.
  - `updateProduct` → `revalidateTag('catalog')` + `revalidatePath('/produto/' + slug)`
  - `updateBrinde` → `revalidateTag('brindes')`
  - `closeMaleta` → `revalidateTag('commission-' + resellerId)`
- **On-demand revalidation:** Para produtos/categorias, usar `revalidatePath` ao invés de esperar o TTL.
**Detection:** Acessar `/produto/x` imediatamente após editar nome no admin. Se mostra nome antigo → bug.
**Phase:** Build Optimization — Fase 4
**Severity:** High

---

## Moderate Pitfalls

### MP-1: Variáveis de Template Ausentes ou Mal-Formatadas
**What goes wrong:** O template no banco tem `{dias_restantes}` mas o código passa `{ diasRestantes: 3 }` (camelCase vs snake_case). O resultado é `"Tu consignación vence en {dias_restantes} días"` — variável não substituída.
**Why it happens:** Falta de contrato de tipos entre o editor de templates e o helper `substituirVariaveis`. Não há validação em tempo de desenvolvimento.
**Consequences:** Notificações com placeholder cru, aparência amadora, revendedoras confusas.
**Prevention:**
- **Type-safe context:** `substituirVariaveis<T extends keyof VariableMap>(template: string, ctx: VariableMap[T])` — TypeScript garante que todas as chaves do template existem no contexto.
- **Validação em runtime:** Após substituição, se ainda houver `{...}` no texto, logar erro e usar fallback.
- **Editor de templates:** Mostrar preview com variáveis de exemplo substituídas antes de salvar.
**Detection:** Regex scan em `NotificacaoLog` por padrão `\{[a-z_]+\}` no corpo final enviado.
**Phase:** Notificações — Fase 1
**Severity:** Moderate

### MP-2: Timezone Mismatch em Analytics (UTC vs America/Asuncion)
**What goes wrong:** O cron `agrega-analytics-diario` roda às 03:00 PY e consolida "ontem". Mas se o `created_at` está em UTC e a comparação usa `NOW()` sem `AT TIME ZONE`, o dia "ontem" em PY pode ainda ser "hoje" em UTC (PY é UTC-3/UTC-4).
**Why it happens:** PostgreSQL `NOW()` retorna UTC. Sem conversão explícita de timezone, a janela de agregação fica deslocada.
**Consequences:** Analytics diário mostra dados do dia errado. Revendedora vê "0 visitas" para ontem quando teve 500.
**Prevention:**
- **Timezone padrão:** Todas as comparações de data em SQL usar `AT TIME ZONE 'America/Asuncion'`.
- **Helper centralizado:** `getInicioFimDia(data, tz = 'America/Asuncion')` que retorna `Date` em UTC para queries.
- **Teste:** Criar evento às 23:30 PY (que é 03:30 UTC do dia seguinte) e garantir que cai no dia correto na agregação.
**Detection:** Comparar sum(`AnalyticsAcesso` por dia) com `AnalyticsDiario` para o mesmo dia. Divergência > 1% = bug.
**Phase:** Analytics — Fase 2
**Severity:** Moderate

### MP-3: Mudança de Config Global (Tiers/Níveis) sem Invalidar Cache
**What goes wrong:** Admin altera `CommissionTier` de 20% para 25%. Revendedora acessa `/app` e continua vendo pill "20%" porque `getCommissionTiers` está cacheada por 24h (`unstable_cache` com `revalidate: 86400`).
**Why it happens:** A mutation `upsertCommissionTier` não chama `revalidateTag('tiers-config')`. O cache continua servindo dado antigo.
**Consequences:** Revendedora vê informação desatualizada. Admin pensa que a mudança não funcionou.
**Prevention:**
- **Invalidação obrigatória:** Toda mutation em config global deve invalidar a tag correspondente.
  - `CommissionTier` → `revalidateTag('tiers-config')`
  - `NivelRegra` → `revalidateTag('niveis-config')`
  - `GamificacaoRegra` → `revalidateTag('gamificacao-config')`
- **Helper:** Usar `invalidateCache.tiersConfig()` existente.
- **UI:** Após salvar config, mostrar toast "Configuração atualizada. Pode levar até 1 minuto para aparecer no app."
**Detection:** Editar tier no admin, recarregar `/app` em modo anônimo. Se mostra valor antigo → cache não invalidado.
**Phase:** Configurações Globais — Fase 3
**Severity:** Moderate

### MP-4: Spam de Leads e Submissões Duplicadas
**What goes wrong:** O formulário `/seja-revendedora` não tem rate limiting nem CSRF protection. Um bot envia 500 candidaturas em 1 minuto, inundando o admin.
**Why it happens:** Formulário público sem proteção. Sem CAPTCHA ou honeypot.
**Consequences:** Admin não consegue filtrar leads reais. Banco inflado. Potencial gasto de email se aprovação for automatizada.
**Prevention:**
- **Rate limiting:** Implementar Upstash Redis rate limit por IP (max 3 submissions / hora) por `SPEC_SECURITY_API_ENDPOINTS.md`.
- **Honeypot:** Campo oculto `website` que se preenchido = bot.
- **CSRF token:** Embora Server Actions já tenham proteção implícita, validar origin no Route Handler se houver.
- **Unique constraint:** `RevendedoraLead.email` deve ter índice unique para evitar duplicidade exata.
**Detection:** Spike de inserts em `RevendedoraLead`. Count de leads por hora > threshold.
**Phase:** Leads — Fase 1
**Severity:** Moderate

### MP-5: Contrato PDF Substitui Versão mas Aceites Antigos Perdem Referência
**What goes wrong:** Admin faz upload de novo PDF para contrato "Termo 2026", substituindo o arquivo no R2. Revendedoras que aceitaram o contrato antigo agora clicam no link e veem o novo PDF, sem registro de qual versão aceitaram.
**Why it happens:** O registro `Contrato` atualiza `url` em vez de criar nova versão. O aceite (`ResellerDocumento` ou similar) referencia `contrato_id`, não `(contrato_id, versao)`.
**Consequences:** Problema legal: não há prova de qual versão foi aceita. Admin não pode auditar histórico.
**Prevention:**
- **Versionamento:** Upload de novo PDF criar NOVO registro `Contrato` com `versao` auto-incremental. Marcar versão anterior como `ativo = false`.
- **Aceite:** Vincular ao `contrato_id` específico. Nunca permitir update de `url` em contrato com aceites.
- **UI:** Mostrar "v1", "v2" no admin. Opção "Substituir" cria nova versão; "Editar metadados" altera nome sem mudar URL.
**Detection:** Query de contratos aceitos com JOIN no contrato atual. Se hash/URL diferente do momento do aceite → versão foi sobrescrita.
**Phase:** Configurações Globais — Fase 3
**Severity:** Moderate

### MP-6: Build Vercel com Prisma Client Desatualizado
**What goes wrong:** Dev adiciona model `AnalyticsDiario` ao `schema.prisma`, faz `prisma db push`, mas esquece de gerar o Prisma Client (`prisma generate`) antes do commit. O build na Vercel usa client antigo sem o novo model.
**Why it happens:** Em desenvolvimento local, `prisma generate` roda automaticamente às vezes (VSCode extension), mas em CI pode não rodar se não estiver no `postinstall`.
**Consequences:** Runtime error `Property 'analyticsDiario' does not exist` em produção. Página de analytics quebra.
**Prevention:**
- **Package.json:** `postinstall: "prisma generate"` deve existir e ser verificado.
- **CI:** `npm ci` já dispara `postinstall`. Garantir que `prisma generate` está no `postinstall` ou explicitamente no CI pipeline.
- **Typecheck:** `npm run typecheck` deve falhar se o client está desatualizado (pois o tipo não existe).
**Detection:** Build log da Vercel mostrando `PrismaClientKnownRequestError` ou `undefined` em novo model.
**Phase:** Build Optimization — Fase 4
**Severity:** Moderate

---

## Minor Pitfalls

### LP-1: Gráfico de Analytics vazio para Revendedora Nova
**What goes wrong:** Revendedora com < 7 dias de cadastro acessa `/app/desempeno`. O gráfico de barras recebe array vazio e quebra (recharts sem dados).
**Why it happens:** Componente `VisitasDiariasChart` não lida com array vazio ou todos os valores zero.
**Consequences:** Tela branca ou crash no app. Revendedora desiste de usar a feature.
**Prevention:**
- **Guard clause:** Se `grafico.length === 0`, mostrar `EmptyState` com ícone 📊 e texto "Aún no hay datos de visitas. ¡Comparte tu vitrina para empezar!".
- **Recharts:** Sempre passar array com pelo menos labels (dias) e valores `0`.
**Phase:** Analytics — Fase 2
**Severity:** Low

### LP-2: OneSignal External ID Mismatch após Migração de Auth
**What goes wrong:** O cron envia push usando `external_id = reseller_id` (UUID do Prisma). Mas se o OneSignal foi inicializado com `OneSignal.login(user.id)` onde `user.id` é o UUID do Supabase Auth, o external_id não bate e o push não chega.
**Why it happens:** `reseller_id` (Prisma) ≠ `auth_user_id` (Supabase). O cron usa um, o login usa outro.
**Consequences:** Push enviado para 0 dispositivos. Revendedora não recebe notificações.
**Prevention:**
- **Padronização:** Usar `auth_user_id` como `external_id` em TODAS as chamadas OneSignal (cron, server actions, admin testes).
- **Tabela de mapeamento:** `NotificacaoLog` deve registrar qual `external_id` foi usado para debug.
**Detection:** OneSignal Dashboard mostrando "Delivered: 0" para notificações com target válido.
**Phase:** Notificações — Fase 1
**Severity:** Low

### LP-3: Toast de Erro com Mensagem Bruta de Prisma
**What goes wrong:** Durante a migração para `ActionResult`, algumas actions retornam `error: err.message` diretamente. Se o erro é do Prisma, a mensagem chega ao usuário como `"Unique constraint failed on the fields: (email)"` (inglês técnico).
**Why it happens:** `safeAction` usa `err.message` sem passar pelo `mapError` que traduz para espanhol paraguaio.
**Consequences:** Usuário vê mensagem técnica em inglês. Percepção de app amador.
**Prevention:**
- **Always use `mapError`:** `safeAction` deve chamar `mapError(err)` em vez de `err.message`.
- **Catálogo:** Expandir `mapError` para cobrir novos códigos Prisma que possam surgir nas features novas (`P2002`, `P2025`, `P2014`).
**Phase:** Error Handling — Fase 4
**Severity:** Low

---

## Phase-Specific Warnings

| Phase | Topic | Likely Pitfall | Mitigation |
|-------|-------|----------------|------------|
| **Fase 1** — Notificações + Leads | Template substitution | Variáveis não substituídas (CP-1, MP-1) | Type-safe context + validação pós-substituição |
| **Fase 1** — Notificações + Leads | Cron fallback | Job silencioso sem notificações (HP-1) | Fallback hierarchy + alerta de zero envios |
| **Fase 1** — Notificações + Leads | Lead approval | Race condition duplicando user (CP-3) | Lock otimista + verificação de status |
| **Fase 2** — Analytics + Dashboard | Query performance | Table scan em AnalyticsAcesso (CP-2) | Índice composto + usar AnalyticsDiario |
| **Fase 2** — Analytics + Dashboard | Scope leak | COLABORADORA vendo dados de outros (HP-2) | `getResellerScope` em toda query admin |
| **Fase 2** — Analytics + Dashboard | Timezone | Dados do dia errado (MP-2) | `AT TIME ZONE 'America/Asuncion'` em toda query date-range |
| **Fase 3** — Configs Globais | Financial immutability | Tiers alterando maletas fechadas (CP-5) | Snapshot enforcement + teste de regressão |
| **Fase 3** — Configs Globais | Cache staleness | Config nova não aparecendo (MP-3) | `revalidateTag` em toda mutation + helper centralizado |
| **Fase 3** — Configs Globais | Contract versioning | Substituição de PDF sem histórico (MP-5) | Versionamento obrigatório, nunca update de URL |
| **Fase 4** — Error + Skeleton + Build | Partial migration | Algumas actions throw, outras retornam ActionResult (CP-6) | Migração por módulo, grep de validação |
| **Fase 4** — Error + Skeleton + Build | force-dynamic removal | Build quebrado sem DATABASE_URL (CP-4) | Configurar env vars ANTES de remover dynamic |
| **Fase 4** — Error + Skeleton + Build | ISR staleness | Página pública com dado antigo após mutação (HP-6) | `revalidateTag`/`revalidatePath` em toda mutation |

---

## Detection Checklist (para QA/Monitoramento)

```
□ Notificações: Verificar NotificacaoLog por 7 dias. Nenhum dia deve ter 0 envios se há maletas ativas.
□ Leads: Tentar aprovar mesmo lead 2x simultaneamente (2 abas). Segunda deve falhar com erro.
□ Analytics: Comparar sum(AnalyticsDiario.visitas) vs count(AnalyticsAcesso) para últimos 7 dias. Divergência < 2%.
□ Dashboard: Logar como COLABORADORA A. Verificar que não vê revendedoras da COLABORADORA B.
□ Configs: Alterar tier, recarregar /app em 10s. Deve mostrar novo valor.
□ Build: npm run build com DATABASE_URL configurado. Nenhum erro de Prisma em páginas públicas.
□ Error Handling: Chamar action com input inválido. Deve retornar { success: false, error: "..." } em espanhol.
□ Skeleton: Throttle 3G em /app/desempeno. Deve ver skeleton imediatamente, nunca tela branca.
```

---

## Sources

- `.planning/PROJECT.md` — Contexto do milestone v1.0, stack, constraints
- `.planning/codebase/CONCERNS.md` — Dívida técnica ativa e conhecida
- `docs/sistema/SPEC_SECURITY_RBAC.md` — Matriz de permissões, prevenção IDOR, padrões proibidos
- `docs/sistema/SPEC_ERROR_HANDLING.md` — ActionResult, mapError, catálogo de mensagens
- `docs/sistema/SPEC_CRON_JOBS.md` — Jobs existentes, deduplicação, timezone
- `docs/sistema/SPEC_CACHING_STRATEGY.md` — Tags de cache, invalidação, force-dynamic vs ISR
- `docs/sistema/SPEC_SKELETON_EMPTY_STATES.md` — Componentes padrão, acessibilidade
- `docs/sistema/SPEC_DEPLOY_STRATEGY.md` — Zero-downtime, migrations aditivas, rollback
- `docs/revendedoras/SPEC_NOTIFICACOES.md` — OneSignal integration, preferências
- `docs/revendedoras/SPEC_DESEMPENHO.md` — Analytics individual, recharts, ranges
- `docs/admin/SPEC_ADMIN_DASHBOARD.md` — KPIs, scope, queries paralelas
- `docs/admin/SPEC_ADMIN_LEADS.md` — Fluxo de aprovação, criação de user, emails
- `docs/admin/SPEC_ADMIN_CONFIG.md` — Commission tiers, contratos, versionamento
- `src/lib/notifications.ts` — Código atual de notificações (sem template substitution)
- `src/lib/action-utils.ts` — safeAction e ActionResult existentes
