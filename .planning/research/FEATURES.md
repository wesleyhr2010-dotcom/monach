# Research: Features for v1.1

## Feature 1: Vitrina Pública

### Table Stakes
- URL única e compartilhável por revendedora (`/vitrina/{slug}`), gerada no cadastro (`{nombre-slug}-{random-3}`)
- Página pública sem autenticação — cliente final acessa diretamente
- Grid de produtos com foto, nome e preço, alimentado pela maleta ativa da revendedora
- CTA "Consultar por WhatsApp" com deep-link preenchido
- SEO mínimo: title/description dinâmicos e Open Graph tags (imagem do avatar)
- 404 para slug inexistente ou revendedora desativada
- Placeholder para imagens quebradas
- Estado vazio elegante quando não há maleta ativa ("Próximamente artículos disponibles")

### Differentiators
- **Mensagem contextual por produto**: o deep-link do WhatsApp preenche o nome do produto e preço, não apenas uma mensagem genérica — isso aumenta a conversão porque o cliente não precisa digitar o que viu
- **Tracking anônimo com `visitor_id` persistente** (cookie UUID, 30 dias): permite contar visitantes únicos sem exigir login ou coletar PII
- **Estratégia `noindex` deliberada**: vitrinas pessoais são deixadas fora do Google para evitar conteúdo duplicado em massa, mas têm metadata rica para preview em redes sociais/WhatsApp
- **Eventos de analytics granulares**: `catalogo_revendedora` (visita) e `clique_whatsapp` (clique) com `produto_id` opcional — permite à revendedora entender o que gera interesse
- **Fallback de preço**: se preço for nulo/zerado, oculta o valor mas mantém o CTA (evita mostrar "G$ 0")

### Anti-Features
- **Não é loja com checkout**: não adicionar carrinho, pagamento ou fluxo de compra — a vitrina é um catálogo de consulta, não e-commerce
- **Não indexar no Google**: milhares de vitrinas com produtos similares competiriam entre si (thin content). `noindex` é uma escolha de SEO, não uma limitação
- **Não exigir cookies**: se o visitante bloquear cookies, o `visitor_id` usa o request — perde-se a contagem de únicos, mas a página funciona normalmente
- **Não expor dados sensíveis da revendedora**: apenas nome, avatar e WhatsApp. Não mostrar endereço, banco, documentos
- **Não sincronizar estoque em tempo real**: a vitrina reflete o snapshot da maleta ativa; não é um ERP de estoque

### Complexity
**Medium**

Razões:
- Next.js App Router não permite Server Components setarem cookies diretamente — requer middleware para estabelecer `monarca_visitor_id`, ou um padrão híbrido (Server Component lê, middleware escreve)
- Rota API pública `/api/track-evento` precisa de validação básica (whitelist de `tipo_evento`) e potencialmente rate limiting para evitar spam de analytics
- Metadata dinâmica exige `generateMetadata` com fetch de reseller — precisa de cache curto para não sobrecarregar
- Múltiplos edge cases: reseller inativa, sem maleta ativa, imagem quebrada, preço nulo, cookie bloqueado, prefetch do Next.js contando como visita falsa

### Dependencies
- **Maleta ativa** (`SPEC_MALETA.md`): fonte dos itens exibidos — só produtos com `quantidade_vendida < quantidade_enviada`
- **R2 images** (`SPEC_API_UPLOAD_R2.md`): imagens dos produtos e avatar da revendedora
- **Reseller.slug** (`SPEC_DATABASE.md`): campo existente ou a adicionar; único e imutável
- **AnalyticsAcesso** (`SPEC_DATABASE.md`): tabela de eventos para tracking
- **Site público existente**: herda layout, tokens de design e componentes visuais (ex.: header, footer)
- **WhatsApp deep-link**: depende do número de WhatsApp da revendedora estar preenchido no perfil

---

## Feature 2: Email Branding

### Table Stakes
- Remetente único e verificado: `no-reply@monarcasemijoyas.com.py` (SPF/DKIM/DMARC configurados)
- Layout HTML consistente em todos os emails: `max-width: 600px`, padding padrão, fonte segura para email (Arial/sans-serif)
- Cor de marca primária (`#35605a`) em títulos e botões CTA
- Footer padronizado com nome da marca e domínio
- Copy em **español paraguayo** (não neutro): "Restablece tu contraseña", "Consignación", "Acerto" (adaptado), "Revendedora"
- Templates mobile-friendly (botões com padding generoso, fontes legíveis)

### Differentiators
- **Wrapper/template centralizado**: em vez de cada email ter seu próprio HTML inline repetido, criar uma função `renderEmailTemplate({ title, body, cta })` que aplica o branding consistentemente — facilita futuras alterações de identidade visual
- **Tonalidade de marca premium de semijoias**: uso estratégico de emojis (💎, 🦋, ✨) e cor de destaque dourada (`#C9A84C`) para emails de celebração (candidatura aprovada, documento aprovado)
- **Emails de acerto com breakdown visual**: tabela estilizada mostrando total vendido, comissão e percentual — transforma um email transacional em um "recibo de comissão" que a revendedora pode guardar
- **Consistência entre Supabase Auth e transacionais**: mesmo o email de reset de senha (enviado pelo Supabase via SMTP Brevo) deve compartilhar a mesma paleta e estrutura visual dos emails transacionais da aplicação

### Anti-Features
- **Não usar imagens pesadas ou hero banners**: emails transacionais precisam carregar instantaneamente; imagens externas aumentam spam score e quebram em clientes que bloqueiam imagens
- **Não usar fontes customizadas (Google Fonts, etc.)**: a maioria dos clientes de email ignora; usar fonte segura (Arial, Helvetica, sans-serif)
- **Não usar CSS complexo ou flexbox**: tabelas são ainda o padrão mais confiável para layout de email; manter inline styles simples
- **Não enviar PII em plaintext no corpo**: senhas temporárias podem ser enviadas (necessário para onboarding), mas sempre com contexto de segurança e recomendação de troca
- **Não criar templates em português ou espanhol neutro**: manter terminologia local ("Consignación" em vez de "Bolsa", "Revendedora" em vez de "Vendedora")

### Complexity
**Low-Medium**

Razões:
- A maior parte do trabalho é design/template, não lógica de negócio. Pode ser resolvida com um wrapper centralizado e refatoração dos 7 templates existentes
- Complexidade menor: atualizar templates do Supabase Auth requer edição no dashboard do Supabase (não código), o que é manual mas simples
- Risco técnico baixo: emails são fire-and-forget; falhas não quebram o fluxo principal (já há try/catch no `sendEmail`)
- Única complexidade moderada: garantir que o wrapper funcione bem em clientes de email antigos (Gmail, Outlook, Apple Mail)

### Dependencies
- **Brevo SDK** (`@getbrevo/brevo`): já instalado e funcional
- **`sendEmail()` helper** (`src/lib/emails.ts`): cliente central já existente
- **Variáveis de ambiente** (`SPEC_ENVIRONMENT_VARIABLES.md`): `BREVO_API_KEY`, `BREVO_FROM_EMAIL`, `BREVO_FROM_NAME`
- **DNS/SPF/DKIM**: domínio `monarcasemijoyas.com.py` precisa estar verificado no Brevo (pré-requisito de infra, não código)
- **Supabase Auth SMTP**: templates de reset/convite editados no dashboard Supabase

---

## Feature 3: Admin Analytics

### Table Stakes
- KPI cards no topo: Maletas Ativas, Total Devolvidas (mês), Taxa de Atraso, Ticket Médio, Revendedoras com Maleta, Tempo Médio de Devolução
- Gráfico de linha temporal (série temporal de envios/devoluções/atrasadas) com filtro de período: 7d / 30d / 3m / 12m
- Gráfico donut de distribuição por status atual
- Tabela Top 10 revendedoras por volume (maletas ativas + valor em maleta)
- Tabela de alertas de prazo (maletas com vencimento nos próximos 7 dias)
- Filtro por consultora (SUPER_ADMIN only) e exportar CSV
- RBAC: consultora vê apenas dados de seu grupo; SUPER_ADMIN vê tudo

### Differentiators
- **Ranking de produtos mais vendidos com alerta de estoque**: uma coluna paralela às top revendedoras mostrando o top 5 (expansível para 10) produtos por unidades vendidas, com badge `⚠ est. baixo` quando `estoque_atual <= estoque_minimo` — conecta performance de vendas com operação de reposição
- **Layout dual-column**: top revendedoras lado a lado com top produtos — o admin vê "quem vende" e "o que vende" simultaneamente, facilitando decisões de maleta (quais produtos enviar para quais revendedoras)
- **Correlação com comissões**: potencial para cruzar volume de vendas com tier de comissão (já existente no sistema) para identificar revendedoras próximas de upgrade
- **Link direto para ação**: cada alerta de prazo tem botão "Conferir →" que navega direto para a tela de conferência da maleta; cada produto com estoque baixo tem link para o catálogo

### Anti-Features
- **Não é um BI/Enterprise analytics**: não adicionar drill-down infinito, filtros ad-hoc complexos, ou painéis customizáveis — manter foco em decisões operacionais diárias
- **Não permitir edição de dados no painel**: analytics é somente leitura; qualquer ação (aprovar, conferir) redireciona para a tela específica
- **Não expor PII em CSVs exportados**: o CSV de maletas deve sanitizar dados sensíveis (CPF, dados bancários)
- **Não fazer query em tempo real a cada carregamento sem cache**: as queries de agregação são pesadas; usar cache com revalidação (já existe padrão `invalidateCache` no projeto)
- **Não mostrar dados de outras consultoras**: RBAC deve ser aplicado em todas as queries, inclusive nas agregações raw SQL

### Complexity
**Medium-High**

Razões:
- Queries de agregação complexas com `Prisma.sql` e filtros dinâmicos de RBAC (`scope.colaboradora_id`) — requer cuidado para evitar SQL injection e garantir performance
- Timezone `America/Asuncion` precisa ser aplicado consistentemente nas agregações por dia (`DATE(created_at AT TIME ZONE 'America/Asuncion')`)
- CSV export server-side: gerar arquivo a partir dos dados filtrados, com headers localizados e formatação de moeda (G$)
- Múltiplos fetchs paralelos (`Promise.all`) com tipagem correta para KPIs + séries temporais + tabelas
- Potencial de N+1: `topRevendedoras` precisa incluir nomes das revendedoras (requer `include` ou join adicional)
- Chart rendering com `recharts` já usado no projeto, mas o layout dual-column e múltiplos gráficos exige cuidado com responsividade

### Dependencies
- **Analytics operacional existente**: já há KPIs, gráficos e filtro de período construídos em v1.0 — esta feature expande/adiciona seções
- **Cron jobs** (`SPEC_CRON_JOBS.md`): cron `agrega-analytics-diario` já alimenta métricas agregadas; pode ser estendido para produtos mais vendidos
- **RBAC existente** (`getResellerScope`): já usado em todo o admin; deve ser aplicado em todas as queries do dashboard
- **Prisma + raw queries**: necessário para agregações complexas (ranking de produtos, séries temporais)
- **Recharts**: biblioteca de gráficos já utilizada no projeto (PWA `/app/desempeno` e admin)
- **Cache invalidation helper** (`invalidateCache`): já existe e deve ser usado após mutações que afetam analytics (fechamento de maleta, aprovação de documento)
- **AlertBell existente**: o sistema de alertas de devolução já está integrado ao layout admin; analytics deve coexistir sem conflito
