# Research Summary: v1.1 Visibilidade e Polimento

## Key Findings

### Stack
Nenhuma biblioteca nova é necessária. O stack existente já cobre 100% das 3 features:

- **Vitrina Pública:** `generateMetadata`, `cookies()`, `crypto.randomUUID()`, Route Handler `POST`, e `ImageResponse` (next/og) são nativos do Next.js 15+.
- **Email Branding:** Wrapper `renderEmailBase()` de ~30 linhas resolve a padronização dos 7 templates. `@react-email` é overkill neste momento e pode conflitar com Tailwind v4.
- **Admin Analytics:** `recharts` 3.8.1 (já usado em produção), Prisma `$queryRaw`, Supabase Realtime, e export CSV via string template + `Blob` nativo são suficientes.

**Ação imediata:** zero `npm install`. Começar implementação diretamente nas camadas de aplicação.

### Features

| Feature | Table Stakes | Differentiators | Anti-Features |
|---|---|---|---|
| **1. Vitrina Pública** | URL única `/vitrina/{slug}`; página pública sem auth; grid de produtos da maleta ativa; CTA WhatsApp; SEO dinâmico + OG; 404 elegante; placeholder sem maleta ativa. | Mensagem contextual por produto no WhatsApp; tracking anônimo com cookie `visitor_id` (30d); estratégia deliberada `noindex` para evitar thin content; eventos granulares (`catalogo_revendedora`, `clique_whatsapp`); fallback de preço nulo. | Não é loja com checkout; não indexar no Google; não exigir cookies (funciona sem); não expor dados sensíveis da revendedora; não sincronizar estoque em tempo real. |
| **2. Email Branding** | Remetente verificado `no-reply@monarcasemijoyas.com.py`; layout HTML consistente (600px); cor primária `#35605a`; footer padronizado; copy en español paraguayo; templates mobile-friendly. | Wrapper centralizado `renderEmailTemplate()` para consistência visual; tonalidade premium (emojis `#C9A84C`); breakdown visual em emails de acerto; consistência entre Supabase Auth e transacionais. | Sem imagens pesadas/hero banners; sem fontes customizadas; sem CSS complexo/flexbox; sem PII em plaintext; sem português/español neutro. |
| **3. Admin Analytics Extension** | KPI cards; gráfico de linha temporal (7d/30d/3m/12m); donut de status; Top 10 revendedoras; alertas de prazo; filtro por consultora; export CSV; RBAC. | Ranking de produtos mais vendidos com alerta de estoque baixo; layout dual-column (quem vende + o que vende); correlação com tiers de comissão; links diretos para ação (conferir maleta, catálogo). | Não é BI enterprise; não editar dados no painel; não expor PII no CSV; não query em tempo real sem cache; não mostrar dados de outras consultoras. |

### Architecture

**Ordem de build recomendada:**

1. **Phase 1 — Vitrina Pública (data source):**
   - Estender `middleware.ts` para cookie `monarca_visitor_id` (UUID v4, 30d, SameSite=Lax).
   - Criar `/api/track-evento` (whitelist de eventos).
   - Reescrever `/vitrina/[slug]/page.tsx` (`generateMetadata` com `noindex`, fetch reseller + maleta ativa, fire tracking).
   - Componentes: `VitrinaHeader`, `ArticuloCard`, `WhatsAppConsultarButton` (client).

2. **Phase 2 — Email Branding (independente, pode rodar em paralelo com Phase 1):**
   - Criar `src/lib/email-layout.ts` (header logo, tokens DS, footer).
   - Refatorar 7 templates em `src/lib/email-templates/` para usar `wrapEmail()`.
   - Revisar copy para español paraguayo.
   - Atualizar templates Supabase Auth no dashboard para consistência visual.

3. **Phase 3 — Admin Analytics Extension (consumer):**
   - Estender `actions-analytics.ts` com `getAnalyticsVitrina()` e ranking por revendedora.
   - Adicionar seção "Vitrina Pública" em `/admin/analytics/page.tsx` (cards + tabela).
   - Implementar `ExportCsvButton` (dados do período filtrado).
   - Integrar com cache invalidation existente.

**Não há migrations necessárias.** `Reseller.slug`, `AnalyticsAcesso`, `AnalyticsDiario` e índices essenciais já existem no schema.

### Pitfalls to Watch

1. **RLS bloqueando reads públicas da Vitrina**
   - **Risco:** Políticas RLS padrão `DENY` para `anon` impedem que a vitrina pública (sem sessão) leia `Reseller`, `Maleta` e `MaletaItem`.
   - **Prevenção:** Criar policies `anon` explícitas (`SELECT` onde `ativo = true`) antes do deploy. Testar com sessão nula.

2. **Conflito entre ISR e tracking dinâmico**
   - **Risco:** `revalidate = 60` gera metadata/analytics desatualizados ou misses de visita se o tracking for server-side puro.
   - **Prevenção:** Manter ISR para o grid; tracking de pageview via client-side `useEffect` ping para `/api/track-evento`. Usar `generateStaticParams` para slugs conhecidos.

3. **Crescimento descontrolado da tabela `AnalyticsAcesso`**
   - **Risco:** ~150K linhas/mês sem retenção causa bloat de storage e performance em meses.
   - **Prevenção:** Definir política de retenção (ex.: agregar e deletar raw >90 dias via cron mensal). Documentar em `SPEC_SECURITY_DATA_PROTECTION.md`.

4. **Vazamento de escopo RBAC em queries raw SQL**
   - **Risco:** Injeção condicional `${scope.colaboradora_id ? ... : Prisma.empty}` pode falhar silenciosamente se `scope` estiver malformado, expondo dados globais.
   - **Prevenção:** Validar `scope` com Zod antes de gerar SQL. Usar parâmetros tipados ou query builder do Prisma sempre que possível para fronteiras de segurança.

5. **Inflação de analytics por prefetch/bots**
   - **Risco:** Prefetch do Next.js, crawlers do WhatsApp e bots geram eventos falsos em `AnalyticsAcesso`.
   - **Prevenção:** Filtrar `purpose !== 'prefetch'` e user-agents conhecidos (`bot|crawl|spider`) no endpoint `/api/track-evento`. Separar raw hits de "visitas humanas".

6. **Queries de agregação sem índice causando timeout**
   - **Risco:** `GROUP BY DATE(created_at)` sobre `maleta_itens` (10K+ linhas/mês) pode estourar o limite de 10s do Vercel.
   - **Prevenção:** Verificar índices compostos (`maletas(created_at, status, colaboradora_id)`, `maleta_itens(maleta_id, produto_id)`). Preferir agregações diárias via cron `agrega-analytics-diario` ou materialized view.

7. **Estouro de cota Brevo em operações em lote**
   - **Risco:** Free tier = 300 emails/dia. Aprovar 50 leads de uma vez pode silenciar emails subsequentes.
   - **Prevenção:** Adicionar wrapper de rate-limit diário (contador em tabela `email_quota` ou Redis) e fila `EmailQueue` para retry. Logar todo envio e falha.

## Recommendation

**Não adicione dependências.** O milestone v1.1 é 100% implementável com o stack existente. Priorize:

1. **Segurança de dados antes de features:** RLS para rotas públicas, validação de escopo RBAC em queries SQL, e sanitização de logs de email.
2. **Integridade dos analytics desde o dia 1:** filtro de bots/prefetch + política de retenção de `AnalyticsAcesso` para evitar dívida técnica operacional.
3. **Performance preditiva:** `generateStaticParams` para vitrinas conhecidas + índices compostos verificados antes de lançar o dashboard admin.
4. **Execução em 3 fases:** Vitrina gera dados → Email polimento paralelo → Analytics consome e exibe. Isso desacopla entregas e permite validar tracking antes do painel.

O milestone está bem delimitado, sem gaps de schema, e com riscos técnicos mitigáveis. Aprovado para desenvolvimento.

---

*Research synthesized: 2026-05-05*
