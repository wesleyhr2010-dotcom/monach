# Feature Landscape

**Domain:** Plataforma de gestão de revendedoras de semijoias (Monarca — Paraguai)
**Milestone:** v1.0 — Operação e Visibilidade
**Researched:** 2026-05-04
**Scope:** Apenas features NOVAS deste milestone. Features já existentes (autenticação, maletas, gamificação, notificações push, catálogo, etc.) estão fora deste documento — consultar `PROJECT.md` §Validated.

---

## 1. Categorias de Feature deste Milestone

| # | Categoria | SPEC Principal | Descrição Resumida |
|---|-----------|----------------|--------------------|
| 1 | **Motor de Templates de Notificação** | `admin/SPEC_ADMIN_ANALYTICS_NOTIFICATIONS.md` | Conectar o editor de templates existente aos cron jobs e geradores automáticos; implementar substituição de variáveis (`{nome_revendedora}`, `{maleta_id}`, etc.) |
| 2 | **Analytics da Revendedora (PWA)** | `revendedoras/SPEC_DESEMPENHO.md` | Tela `/app/desempenho` com métricas individuais de acessos, visitantes únicos, cliques WhatsApp e peças vendidas; gráfico de visitas diárias; ranking de produtos populares |
| 3 | **Dashboard Admin (KPIs globais/grupo)** | `admin/SPEC_ADMIN_DASHBOARD.md` | Visão executiva em `/admin` com cards de faturamento, maletas, revendedoras e alertas; lista de maletas com atenção; ranking por consultora ou revendedora; filtro por período |
| 4 | **Pipeline de Candidaturas (Leads)** | `admin/SPEC_ADMIN_LEADS.md` | Revisão de candidaturas da landing `/seja-revendedora`; aprovação com criação automática de usuário Supabase + `Reseller` + email de boas-vindas; rejeição com email |
| 5 | **Configurações Globais Admin** | `admin/SPEC_ADMIN_CONFIG.md` | CRUD de faixas de comissão (`CommissionTier`); upload e gestão de contratos PDF; regras de enquadramento automático |
| 6 | **Error Handling Centralizado + Estados de UI** | `sistema/SPEC_ERROR_HANDLING.md` | Padronização `ActionResult<T>` em todas as Server Actions; catálogo de mensagens em espanhol paraguaio; `mapError()` helper; skeleton/empty/error states por tela |
| 7 | **Otimização de Build** | `sistema/SPEC_DEPLOY_STRATEGY.md` | Remover `force-dynamic` de páginas públicas; configurar `DATABASE_URL` no build step da Vercel; adotar ISR onde apropriado |

---

## 2. Table Stakes (Must-Have)

Features que o usuário espera encontrar. Ausência = produto incompleto ou frustração operacional.

### 2.1 Motor de Templates de Notificação

| Feature | Por que é esperado | Complexidade | Notas |
|---------|-------------------|--------------|-------|
| Helper `substituirVariaveis(template, contexto)` | Templates salvos no banco são inúteis sem interpolação de variáveis | **S** | Regex simples ou `String.replace` com validação de chaves |
| Refatorar cron jobs para ler `NotificacaoTemplate` por `tipo` | Hoje os cron jobs usam textos hardcoded; ignoram o editor existente | **M** | Tocar `check-maleta-prazo`, `marcar-maletas-atrasadas`, `registrarVenda`, `conferirEFecharMaleta`, `submitDevolucao` |
| Fallback para texto default quando template inativo/ausente | Se admin desativar um template, o sistema não pode quebrar | **S** | Textos default já existem nos cron; manter como fallback |
| Hint "Variables disponibles" no modal de edição | Admin precisa saber quais variáveis pode usar em cada tipo de template | **S** | Adicionar lista de variáveis por tipo no modal existente |

### 2.2 Analytics da Revendedora (PWA)

| Feature | Por que é esperado | Complexidade | Notas |
|---------|-------------------|--------------|-------|
| 4 cards de métricas com valor + tendência % | Todo app de analytics mostra KPIs em cards com comparação temporal | **M** | Reutilizar padrão de cards do admin; calcular período anterior equivalente |
| Seletor de período (Semana / Mês / 30 dias / Ano) | Sem filtro de data, o analytics é estático e pouco útil | **M** | Dropdown client-side; recarrega dados via Server Action |
| Gráfico de barras de visitas diárias | Visualização temporal é table stake de qualquer dashboard | **M** | `recharts` já é dependência; BarChart com gradiente verde |
| Lista de top 10 produtos populares | Revendedora precisa saber o que está funcionando na vitrina | **M** | Query `GROUP BY produto_id ORDER BY COUNT DESC LIMIT 10` |
| Tendência % vs período anterior (verde/vermelho/"Nuevo") | Comparativo é o mínimo para dar contexto aos números | **S** | Fórmula simples; edge case `anterior = 0` → "Nuevo" |
| Empty state quando sem dados | Recém-cadastrada ou sem atividade não pode ver tela em branco | **S** | Mensagem amigável em espanhol paraguaio |

### 2.3 Dashboard Admin (KPIs globais/grupo)

| Feature | Por que é esperado | Complexidade | Notas |
|---------|-------------------|--------------|-------|
| Cards KPI principais (faturamento, maletas, revendedoras, alertas) | Dashboard sem KPIs numéricos não é dashboard | **M** | 4 queries agregadas em paralelo (`Promise.all`) |
| Visão diferenciada por role (SUPER_ADMIN vs CONSULTORA) | Consultora não pode ver dados de outras consultoras | **M** | Reutilizar `getResellerScope` e `assertIsInGroup` existentes |
| Lista "Maletas com Atenção" (atrasadas / aguardando revisão / vence em ≤2 dias) | Admin precisa de uma fila de ação imediata | **M** | Query com `OR` de status + filtro de prazo |
| Ranking de desempenho (consultoras ou revendedoras) | Comparativo de performance é essencial para gestão | **M** | `GROUP BY` com `SUM` e `COUNT`; ordenação DESC |
| Filtro de período (semana / mês / personalizado) | Métricas reagem ao contexto temporal | **M** | Dropdown client-side; recalcular queries |
| CTAs diretos para telas de ação | Dashboard é um hub — cada item deve ser clicável | **S** | Links para `/admin/maletas/[id]`, `/admin/revendedoras/[id]` |

### 2.4 Pipeline de Candidaturas (Leads)

| Feature | Por que é esperado | Complexidade | Notas |
|---------|-------------------|--------------|-------|
| Tabs por status (Pendientes / Aprobadas / Rechazadas) | Sem organização por status, admin não consegue operar | **S** | Filtro por query param; contagem por tab |
| Badge numérico no sidebar com leads pendentes | Admin precisa saber que há novas candidaturas sem entrar na tela | **S** | Contagem SSR no `layout.tsx`; polling ou revalidação |
| Modal de aprovação com seleção de consultora + taxa de comissão | Aprovação sem vinculação de consultora quebra o modelo de negócio | **M** | Select de colaboradoras; input de taxa (0-100) |
| Criação automática de usuário Supabase Auth + `Reseller` | Aprovação manual de conta é inviável em escala | **M** | `supabaseAdmin.auth.admin.createUser`; senha temporária; rollback se falhar |
| Envio de email de boas-vindas com credenciais | Nova revendedora precisa saber como acessar | **M** | Template Brevo/Resend; substituição de variáveis |
| Modal de rejeição com motivo + email de recusa | Candidata rejeitada deve ser informada formalmente | **M** | Campo de observação; template de email |
| Validação de duplicidade (email/cédula já existentes) | Evitar criar revendedora duplicada | **S** | `findFirst` antes de criar; erro `CONFLICT` |

### 2.5 Configurações Globais Admin

| Feature | Por que é esperado | Complexidade | Notas |
|---------|-------------------|--------------|-------|
| CRUD de faixas de comissão (`CommissionTier`) | Admin precisa ajustar comissões sem alterar código | **M** | Tabela já existe no Prisma; falta UI e Server Actions |
| Regra de enquadramento automático (maior faixa cujo mínimo supera) | Sistema deve calcular comissão automaticamente | **S** | Lógica de query: `WHERE min_sales_value <= faturamento ORDER BY min_sales_value DESC LIMIT 1` |
| Proteção da faixa base (`min_sales_value = 0`) | Deletar a faixa base quebra o cálculo para todas | **S** | Guard no `deleteCommissionTier` |
| Upload de contratos PDF com drag-and-drop | Admin precisa versionar contratos sem dev | **M** | R2 upload; validação de tipo/tamanho (PDF ≤10MB) |
| Ativar/inativar contratos | Contratos antigos não devem aparecer para novas revendedoras | **S** | Flag `ativo` no schema; filtro na query |

### 2.6 Error Handling Centralizado + Estados de UI

| Feature | Por que é esperado | Complexidade | Notas |
|---------|-------------------|--------------|-------|
| Tipo `ActionResult<T>` em todas as Server Actions | Sem padrão, cada action retorna algo diferente | **M** | Refatoração cross-cutting; toca dezenas de arquivos |
| Helper `mapError(error)` centralizado | Mapear Prisma errors, business errors e unknowns para mensagens amigáveis | **M** | `P2002` → `CONFLICT`, `P2025` → `NOT_FOUND`, `BUSINESS:` → mensagem limpa |
| Catálogo de mensagens de erro por módulo | Evitar inventar mensagens em cada Server Action | **M** | Documento vivo em `SPEC_ERROR_HANDLING.md` §2 |
| Duração de toast por severidade (sucesso 3s, negócio 5s, crítico 7s) | UX consistente de feedback | **S** | Config no `sonner` provider |
| Skeleton states por tela | Tela em branco durante loading parece quebrada | **M** | Componentes `SkeletonCard`, `SkeletonList`, etc. reutilizáveis |
| Empty states por tela | Sem dados não é erro — é estado válido que precisa de mensagem | **M** | Mapear todas as telas de `/app/*` e `/admin/*` |
| Error states por tela (botão "Reintentar") | Falha de rede ou servidor precisa de recovery path | **M** | Wrapper `ErrorBoundary` ou estados inline com retry |

### 2.7 Otimização de Build

| Feature | Por que é esperado | Complexidade | Notas |
|---------|-------------------|--------------|-------|
| Remover `force-dynamic` de páginas públicas | Degradação de performance em todas as páginas públicas | **S-M** | `/`, `/catalogo/*`, `/produto/[slug]`, `/seja-revendedora` |
| Configurar `DATABASE_URL` no build step da Vercel | Build falha sem banco acessível para Prisma | **S** | Env var em Production + Preview + Development |
| Adotar ISR (`revalidate = 60`) em páginas públicas | Cache estático com stale-while-revalidate é o padrão Next.js | **S** | Substitui `force-dynamic` com comportamento de cache saudável |
| Revalidar `force-dynamic` caso a caso em páginas autenticadas | Algumas páginas admin/app realmente precisam de dados em tempo real | **S** | Manter apenas onde há `headers()`/`cookies()` ou dados sensíveis a cada request |

---

## 3. Differentiators (Nice-to-Have)

Features que agregam valor perceptível sem serem esperadas. Implementar se sobrar tempo ou se o time quiser se diferenciar.

### 3.1 Motor de Templates de Notificação

| Feature | Proposta de Valor | Complexidade | Notas |
|---------|-------------------|--------------|-------|
| Preview de push/email com variáveis substituídas | Admin vê exatamente como a mensagem chegará ao usuário | **M** | Simular contexto com dados fictícios no modal |
| Segmentação de template por grupo de revendedoras | Mensagens diferentes para novas vs veteranas | **M** | Adicionar `group_id` ou `segmento` ao `NotificacaoTemplate` |
| Estatísticas de abertura/clique por template | Saber quais notificações funcionam melhor | **L** | Rastrear no `NotificacaoLog`; dashboard simples |

### 3.2 Analytics da Revendedora (PWA)

| Feature | Proposta de Valor | Complexidade | Notas |
|---------|-------------------|--------------|-------|
| Meta de acessos/vendas com barra de progresso | Gamificação visual do desempenho | **M** | Comparar faturamento atual com `min_sales_value` do tier superior |
| Comparativo com média do grupo | "Você está acima de 70% das revendedoras do seu grupo" | **M** | Query agregada do grupo; requer cuidado com privacidade |
| Exportar dados (PDF ou imagem) | Revendedora pode compartilhar métricas no WhatsApp | **M** | `html2canvas` ou `jspdf` no client |

### 3.3 Dashboard Admin (KPIs globais/grupo)

| Feature | Proposta de Valor | Complexidade | Notas |
|---------|-------------------|--------------|-------|
| Exportação de dados (CSV/Excel) | Admin pode levar dados para planilhas | **M** | `json2csv` ou `xlsx` no Server Action; restrito a SUPER_ADMIN |
| Alertas preditivos ("Esta revendedora tende a atrasar") | Ação preventiva antes do problema | **L** | Requer análise histórica de prazos de devolução |
| Comparativo mês a mês com gráfico de linha | Tendência de crescimento do negócio | **M** | `recharts` LineChart; query de 12 meses |

### 3.4 Pipeline de Candidaturas (Leads)

| Feature | Proposta de Valor | Complexidade | Notas |
|---------|-------------------|--------------|-------|
| Auto-preenchimento de dados do candidato via Informconf | Reduzir fricção no preenchimento do formulário | **L** | Integração com API Informconf (PY) — fora do escopo atual |
| Scoring automático de lead (pontuação por perfil) | Priorizar candidaturas mais promissoras | **L** | Regras de pontuação baseadas em idade, cidade, experiência |
| Aprovação/rejeição em massa (bulk actions) | Operar várias candidaturas de uma vez | **M** | Checkbox multi-select; batch de criações/emails |

### 3.5 Configurações Globais Admin

| Feature | Proposta de Valor | Complexidade | Notas |
|---------|-------------------|--------------|-------|
| Simulador de comissão ("Se vender X, ganha Y") | Admin testa faixas antes de publicar | **M** | Input de valor fictício + cálculo com tiers atuais |
| Histórico de versões de contrato | Rastrear alterações nos contratos | **M** | Soft-delete ou versionamento com `created_at` |
| Notificação push/email quando contrato é atualizado | Revendedoras sabem que há novo contrato | **S** | Hook no `updateContrato` |

### 3.6 Error Handling Centralizado + Estados de UI

| Feature | Proposta de Valor | Complexidade | Notas |
|---------|-------------------|--------------|-------|
| Error boundary com link para suporte | Usuário não fica preso em tela quebrada | **M** | `react-error-boundary` + componente custom de fallback |
| Telemetria de erros no Sentry | Time de dev vê erros em produção em tempo real | **M** | `SPEC_LOGGING_MONITORING.md` já prevê isso |
| Retry automático com backoff para falhas de rede | Resiliência transparente para o usuário | **M** | Wrapper em `fetch` ou Server Action com `setTimeout` |

### 3.7 Otimização de Build

| Feature | Proposta de Valor | Complexidade | Notas |
|---------|-------------------|--------------|-------|
| ISR com `revalidateTag` por entidade | Invalidação granular de cache quando dados mudam | **M** | `revalidateTag('produtos')` no `createProduto`; `SPEC_CACHING_STRATEGY.md` |
| Edge caching via Vercel + Cloudflare | Menor TTFB para usuários no PY | **S** | Configuração de CDN; sem alteração de código |
| Bundle analysis e code splitting | Reduzir tamanho do bundle do PWA | **M** | `@next/bundle-analyzer`; lazy load de componentes pesados |

---

## 4. Anti-Features (O que NÃO construir)

Features que parecem boas ideias mas adicionam complexidade sem valor proporcional para v1.0.

| Anti-Feature | Por que evitar | O que fazer em vez disso |
|--------------|---------------|-------------------------|
| **i18n / templates multi-idioma** | Idioma fixo é espanhol paraguaio (PROJECT.md §Constraints). Suporte a múltiplos idiomas multiplicaria complexidade de templates, emails e UI sem demanda de negócio. | Templates em espanhol paraguaio único. Se necessário no futuro, adicionar campo `idioma` ao `Reseller` e replicar templates. |
| **Real-time analytics com WebSocket** | O modelo de negócio não exige dados em tempo real. Maleta e vendas são eventos diários, não segundos. WebSocket aumentaria infra e custo sem benefício claro. | Polling a cada 30s no admin (já usado no AlertBell) e refresh manual no PWA. Cron diário para consolidação. |
| **CRM completo para leads** | Pipeline de leads deste milestone é operacional (aprovar/rejeitar), não de vendas. Adicionar notas, tarefas, timeline e integração com CRM externo (HubSpot/Pipedrive) sai do escopo de gestão de consignação. | Manter fluxo simples: pendente → aprovado/rejeitado. Se necessário no futuro, exportar leads via CSV. |
| **Dashboard arrastável/customizável** | Drag-and-drop de widgets, resize de cards e salvar layout por usuário soam premium mas raramente são usados em operações B2B simples. | Layout fixo otimizado para o papel do usuário (SUPER_ADMIN vs CONSULTORA). Alterações via código se necessário. |
| **Edição de templates com rich text / Markdown** | Templates de push têm limite de 240 chars; emails transacionais usam HTML estático. Um editor WYSIWYG seria overkill. | Editor de textarea simples com highlight de variáveis (`{...}`) e lista de variáveis disponíveis. |
| **Offline-first no PWA para analytics** | Analytics é read-only e depende de dados agregados no servidor. Cache local complexo não justifica para visualização de métricas. | Cache do Next.js (`revalidate`) e do navegador (`Cache-Control`) são suficientes. |
| **Rate limiting customizado por endpoint** | Requer infra adicional (Upstash Redis). O milestone v1.0 foca em funcionalidade de negócio; segurança de API já é tratada em `SPEC_SECURITY_API_ENDPOINTS.md` (prioridade baixa). | Usar `requireAuth` + RLS como defesa primária. Rate limiting é v1.1+. |
| **Testes E2E com Playwright** | Playwright ainda não está configurado e golden paths são item de prioridade baixa em `next_steps.md`. Não bloquear v1.0 por isso. | Testes unitários com Vitest para Server Actions e componentes. E2E faseado para v1.1. |
| **Observabilidade completa (Sentry + logs estruturados)** | Requer conta Sentry, configuração de source maps, e manutenção contínua. Item de prioridade baixa no roadmap. | `console.error` centralizado no `mapError` é suficiente para v1.0. Sentry é v1.1+. |
| **Migração PWA → Capacitor** | Capacitor resolve push nativo e Universal Links, mas é projeto paralelo de infraestrutura mobile. Não tem relação direta com as features de v1.0. | Manter PWA com Serwist. Capacitor é milestone futuro (`SPEC_CAPACITOR_MIGRATION.md`). |

---

## 5. Dependências entre Features

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          DEPENDÊNCIAS v1.0                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ERROR HANDLING ─────────────────────────────────────────────┐              │
│  (ActionResult + mapError + skeleton/empty/error)            │              │
│         │                                                    │              │
│         ▼                                                    │              │
│  ┌─────────────────┐    ┌─────────────────┐                  │              │
│  │  LEAD PIPELINE  │    │  ADMIN CONFIG   │                  │              │
│  │  (aprovarLead)  │◄───┤  (commission    │                  │              │
│  │                 │    │   tiers)        │                  │              │
│  └────────┬────────┘    └─────────────────┘                  │              │
│           │                                                   │              │
│           │  (cria Reseller + Auth user)                      │              │
│           ▼                                                   │              │
│  ┌─────────────────┐                                          │              │
│  │  NOTIFICATION   │◄─────────────────────────────────────────┘              │
│  │  TEMPLATE ENGINE│  (todos usam ActionResult e mapError)                  │
│  │  (substituir    │                                                          │
│  │   variáveis)    │                                                          │
│  └────────┬────────┘                                                          │
│           │                                                                   │
│           │  (emails de boas-vindas/rejeição usam templates)                  │
│           ▼                                                                   │
│  ┌─────────────────┐    ┌─────────────────┐                                   │
│  │  ADMIN DASHBOARD│◄───┤  RESELLER       │                                   │
│  │  (KPIs, alertas)│    │  ANALYTICS      │                                   │
│  │                 │    │  (/app/desempenho)                                │
│  └─────────────────┘    └─────────────────┘                                   │
│           │                    │                                              │
│           │                    │  (depende de AnalyticsDiario                  │
│           │                    │   já consolidado pelo cron)                   │
│           │                    ▼                                              │
│           │           ┌─────────────────┐                                     │
│           │           │  CRON JOBS      │                                     │
│           │           │  (já existentes)│                                     │
│           │           └─────────────────┘                                     │
│           │                                                                   │
│           │  (dados de maletas, revendedoras, documentos)                     │
│           ▼                                                                   │
│  ┌─────────────────┐                                                          │
│  │  BUILD          │                                                          │
│  │  OPTIMIZATION   │  (independente, mas afeta todas as páginas)              │
│  └─────────────────┘                                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Detalhamento das dependências

| Feature | Depende de | Por que |
|---------|-----------|---------|
| **Notification Template Engine** | `NotificacaoTemplate` table, cron jobs existentes, `ActionResult` | Precisa do schema e dos geradores automáticos que hoje usam textos hardcoded |
| **Lead Pipeline** | Landing page `/seja-revendedora`, Supabase Auth, Brevo/Resend, `ActionResult` | Lead é originado na landing; aprovação cria user Auth; emails transacionais já configurados |
| **Reseller Analytics** | `AnalyticsAcesso` table, `AnalyticsDiario` cron, vitrina pública (eventos), recharts | Dados são originados no tracking da vitrina e consolidados pelo cron diário |
| **Admin Dashboard** | RBAC (`getResellerScope`), maleta data, document data, `ActionResult` | Reutiliza queries existentes de maletas e documentos; escopo RBAC já implementado |
| **Admin Config** | `CommissionTier` schema, R2 upload, gamification engine | Schema já existe; upload de PDF segue mesmo padrão de documentos; gamification consome tiers |
| **Error Handling + UI States** | Nenhuma — é foundational | Deve ser implementado primeiro ou em paralelo; todas as outras features devem adotar o padrão |
| **Build Optimization** | Nenhuma — é infraestrutura | Independente, mas deve ser testado em todas as páginas afetadas |

---

## 6. Complexidade por Feature (S/M/L)

| Feature | Complexidade | Justificativa |
|---------|-------------|---------------|
| **Notification Template Engine** | **M** | Refatorar múltiplos cron jobs e geradores para ler do banco; criar helper de substituição; garantir fallback. Não é difícil, mas toca muitos pontos. |
| **Reseller Analytics (PWA)** | **M** | Queries agregadas com `GROUP BY` e `COUNT DISTINCT`; integração `recharts`; cálculo de tendência com edge cases. Layout já definido no Paper. |
| **Admin Dashboard** | **L** | Múltiplas queries paralelas agregadas; escopo RBAC diferenciado; ranking com múltiplas dimensões; lista de alertas com lógica de prazo. Maior volume de dados. |
| **Lead Pipeline** | **L** | Fluxo transacional complexo (criar user Auth + Reseller + email); rollback em caso de falha; dupla modal (aprovar/rejeitar); validação de duplicidade. |
| **Admin Config** | **S-M** | CRUD simples de tiers + upload de PDF. Regras de negócio claras e bem delimitadas. Menor volume de interação com sistemas externos. |
| **Error Handling + UI States** | **M** | Cross-cutting: refatorar dezenas de Server Actions, criar componentes reutilizáveis, mapear todas as telas. Não é complexo logicamente, mas é trabalhoso. |
| **Build Optimization** | **S-M** | Principalmente configuração de env vars e remoção de `force-dynamic`. Risco está na regressão — precisa testar build e runtime de todas as páginas. |

---

## 7. Recomendação de MVP (v1.0)

**Priorizar nesta ordem:**

1. **Error Handling Centralizado** — Foundation para todas as outras features. Sem `ActionResult` padronizado, cada nova feature adiciona dívida técnica.
2. **Build Optimization** — Remove workaround que afeta performance de todas as páginas públicas. Baixo esforço, alto impacto.
3. **Admin Config (Commission Tiers + Contratos)** — Desbloqueia operação autônoma do admin. Sem editar tiers, todo ajuste de comissão exige dev.
4. **Notification Template Engine** — Conecta feature já construída (editor) ao resto do sistema. Sem isso, o editor continua sendo dead code.
5. **Lead Pipeline** — Completa o funil de aquisição de revendedoras. Landing existe mas não converte em conta sem este pipeline.
6. **Admin Dashboard** — Dá visibilidade executiva. Depende de queries já existentes; é mais "colar" dados do que criar novos.
7. **Reseller Analytics (PWA)** — Fecha o loop de visibilidade para a revendedora. Depende do cron de analytics diário já existente.

**Deferir para pós-v1.0:**
- Exportação CSV do admin dashboard
- Preview de template com variáveis
- Simulador de comissão
- Scoring de leads
- Retry automático com backoff
- Bundle analysis avançado

---

## 8. Flags de Pesquisa por Fase

| Fase | Tópico | Provável necessidade de pesquisa? | Notas |
|------|--------|-----------------------------------|-------|
| Error Handling | Integração com Sentry | Sim (v1.1) | Sentry não está configurado; pesquisar SDK Next.js + source maps |
| Build Optimization | ISR com `revalidateTag` | Talvez | `SPEC_CACHING_STRATEGY.md` já detalha; pesquisa de implementação específica por entidade |
| Lead Pipeline | Provedor de email transacional | Não | Brevo já configurado; usar mesmo cliente `src/lib/emails.ts` |
| Admin Dashboard | Queries de performance com JOINs pesados | Sim | Ranking e KPIs podem exigir índices ou materialized views em escala |
| Reseller Analytics | `recharts` em mobile | Não | `recharts` já é dependência; usado em outras telas |
| Notification Engine | Deduplicação de notificações do cron | Não | Já implementado nos cron jobs existentes (`notificado_em` timestamp) |

---

## 9. Fontes

- `docs/revendedoras/SPEC_DESEMPENHO.md` — Analytics individual da revendedora
- `docs/admin/SPEC_ADMIN_DASHBOARD.md` — Dashboard admin com KPIs
- `docs/admin/SPEC_ADMIN_CONFIG.md` — Configurações de comissão e contratos
- `docs/admin/SPEC_ADMIN_LEADS.md` — Pipeline de candidaturas
- `docs/sistema/SPEC_ERROR_HANDLING.md` — Padrão de erros e estados de UI
- `docs/sistema/SPEC_DEPLOY_STRATEGY.md` — Estratégia de deploy e build
- `.planning/PROJECT.md` — Contexto geral, stack, decisões e constraints
- `docs/next_steps.md` — Ordem de prioridade e itens pendentes
