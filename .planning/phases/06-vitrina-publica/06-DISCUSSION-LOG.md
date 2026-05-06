# Phase 6: Vitrina Pública - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-05
**Phase:** 06-vitrina-publica
**Areas discussed:** Estratégia de Renderização, Relação Vitrina ↔ Catálogo, Fonte de Produtos e Grid, Fluxo WhatsApp e Carrinho

---

## Estratégia de Renderização

| Option | Description | Selected |
|--------|-------------|----------|
| ISR + tracking client-side | Mantém revalidate=60, tracking via AnalyticsTracker no cliente | |
| Dynamic + cookies no Server Component | Remove ISR, usa cookies() para visitor_id, grava acesso no servidor | |
| Híbrida: ISR para conteúdo + API separada para tracking | ISR para conteúdo estático, tracking via chamada assíncrona a API | ✓ |

**User's choice:** Híbrida: ISR para conteúdo + API separada para tracking
**Notes:** Usuário priorizou performance (cache) + tracking preciso. Decidiu revalidate=300s (5 min) no passo seguinte.

| Option | Description | Selected |
|--------|-------------|----------|
| Reusar /api/track existente | Endpoint já existe, aceita eventos genéricos | |
| Criar /api/vitrina/track dedicado | Endpoint específico com validação strict para vitrina | ✓ |

**User's choice:** Criar /api/vitrina/track dedicado
**Notes:** Validação strict, whitelist de eventos, isolamento do tracking geral.

| Option | Description | Selected |
|--------|-------------|----------|
| 60s (igual ao catálogo) | Padrão estabelecido | |
| 300s (5 minutos) | Maior cache para picos de tráfego | ✓ |
| 0 (SSR sem cache) | Dados sempre atualizados | |

**User's choice:** 300s (5 minutos)
**Notes:** Balance para picos de tráfego via WhatsApp/Instagram.

| Option | Description | Selected |
|--------|-------------|----------|
| Middleware | Middleware verifica/gera cookie antes do render | |
| Cliente via /api/vitrina/track | Endpoint retorna visitor_id se não existir | |
| Ambos (defesa em profundidade) | Middleware garante base; endpoint valida/re-gera | ✓ |

**User's choice:** Ambos (defesa em profundidade)
**Notes:** Segue padrão de defesa em profundidade do projeto.

---

## Relação Vitrina ↔ Catálogo

| Option | Description | Selected |
|--------|-------------|----------|
| Design independente (Paper) | Página completamente nova com design próprio do Paper | |
| Reusar design do catálogo com adaptações | Reusa estrutura do catálogo existente, adapta conteúdo | ✓ |
| Vitrina substitui o catálogo | /catalogo/[slug] redireciona para /vitrina/[slug] | |

**User's choice:** Reusar design do catálogo com adaptações
**Notes:** Usuário esclareceu que /catalogo/[slug] é catálogo individual da revendedora (todos os produtos) e /vitrina/[slug] é vitrina da maleta ativa. Fase 6 foca na vitrina.

| Option | Description | Selected |
|--------|-------------|----------|
| Só perfil + "Próximamente" | SPEC original | |
| Perfil + mensagem simples | Mensagem customizada sem link para catálogo | ✓ |
| 404 | Página não encontrada | |

**User's choice:** Perfil + mensagem simples
**Notes:** "Esta revendedora no tiene artículos disponibles momentáneamente."

| Option | Description | Selected |
|--------|-------------|----------|
| Extrair componentes compartilhados | Criar src/components/vitrina/ para reuso | ✓ |
| Copiar/adaptar inline | Código próprio sem extração | |

**User's choice:** Extrair componentes compartilhados

| Option | Description | Selected |
|--------|-------------|----------|
| Manter ambas | Catálogo e vitrina coexistem | |
| Consolidar na vitrina | Futuro: /catalogo redireciona para /vitrina | ✓ |

**User's choice:** Consolidar na vitrina
**Notes:** Direção de longo prazo, fora do escopo da Fase 6.

---

## Fonte de Produtos e Grid

| Option | Description | Selected |
|--------|-------------|----------|
| Apenas maleta ativa (SPEC) | MaletaItem com saldo da maleta ativa | ✓ |
| Maleta ativa + catálogo completo | Maleta destacada + restante do catálogo | |

**User's choice:** Apenas maleta ativa (SPEC)

| Option | Description | Selected |
|--------|-------------|----------|
| preco_fixado da MaletaItem | Preço snapshot da maleta (imutável) | |
| Preço atual do ProductVariant | Preço mais recente do produto | ✓ |
| Ambos com fallback | Tenta snapshot, depois atual, depois oculta | |

**User's choice:** Preço atual do ProductVariant
**Notes:** Exceção à regra de imutabilidade para vitrina pública. Cliente vê preços atualizados.

| Option | Description | Selected |
|--------|-------------|----------|
| Query direta no Server Component | Prisma direto na página | |
| Função utilitária dedicada | getVitrinaData(slug) em src/lib/vitrina.ts | ✓ |

**User's choice:** Função utilitária dedicada

| Option | Description | Selected |
|--------|-------------|----------|
| Um card por variant | Cada MaletaItem é um card | ✓ |
| Um card por produto (agrupado) | Agrupa variants por produto | |

**User's choice:** Um card por variant
**Notes:** Usuário originalmente sugeriu página de detalhe com variants, que foi anotada como escopo expandido.

---

## Fluxo WhatsApp e Carrinho

**Nota importante:** Durante esta discussão, o usuário decidiu expandir o escopo da Fase 6 para incluir página de detalhe do produto e carrinho + checkout via WhatsApp. Isso alterou significativamente o fluxo original da SPEC.

| Option | Description | Selected |
|--------|-------------|----------|
| Link para página de detalhe | Card leva para /vitrina/{slug}/{produtoId} | ✓ |
| CTA WhatsApp direto no card | Botão "Consultar" abre WhatsApp imediatamente | |

**User's choice:** Link para página de detalhe
**Notes:** Escopo expandido — agora vitrina tem página de detalhe.

| Option | Description | Selected |
|--------|-------------|----------|
| Apenas na página de detalhe | CTA WhatsApp exclusivo da página de detalhe | |
| Ambos: grid e detalhe | Grid tem consulta rápida + link para detalhe | |
| Nenhum dos 2 | CTA WhatsApp só aparece após adicionar ao carrinho | ✓ |

**User's choice:** Nenhum dos 2 — só após adicionar ao carrinho
**Notes:** Decisão do usuário durante discussão: "em nenhum dos 2 lugares, soemnte ao finalizar depois de adiiconar ao carrinho, por isso precisamos implementar o carriho"

| Option | Description | Selected |
|--------|-------------|----------|
| localStorage do navegador | Carrinho no browser, sem backend | ✓ |
| Cookie no navegador | Serializado em cookie (~4KB) | |
| Sem persistência (sessão) | useState/context, perde ao recarregar | |

**User's choice:** localStorage do navegador

| Option | Description | Selected |
|--------|-------------|----------|
| Mensagem formatada com lista | Lista completa de produtos + total | ✓ |
| Mensagem resumida + link | Mensagem curta + link da vitrina | |
| Ambos: lista + link | Completa mas pode exceder limites | |

**User's choice:** Mensagem formatada com lista de produtos
**Notes:** Ex: "Hola [nombre], quiero consultar sobre: 1. Collar Elegance - G$ 1.250 2. Pulsera Boho - G$ 850 Total: G$ 2.100"

| Option | Description | Selected |
|--------|-------------|----------|
| Badge flutuante sticky | Contador flutuante em todas as páginas | ✓ |
| Página dedicada /carrinho | Só via página dedicada | |
| Ambos: badge + página | Badge rápido + página completa | |

**User's choice:** Badge flutuante sticky

---

## Escopo Expandido (Decisão do Usuário)

Durante a discussão do Fluxo WhatsApp, o usuário solicitou explicitamente incluir duas funcionalidades no escopo da Fase 6:

1. **Página de detalhe do produto** (`/vitrina/{slug}/{produtoId}`)
2. **Carrinho de compras + checkout via WhatsApp**

O usuário justificou: "vamos voltar e adionar aquelas duas funcionalidades no escopo do projeto, dr nao vamos ter retrabalho"

Decisão final do usuário: **Expandir Fase 6 atual** (não criar nova fase).

**Ações necessárias:**
- Atualizar `docs/revendedoras/SPEC_VITRINE_PUBLICA.md` para incluir novos requisitos (VITR-13+)
- Atualizar `.planning/ROADMAP.md` para refletir escopo expandido da Fase 6

---

## the agent's Discretion

- Layout exato do badge flutuante do carrinho (posição, animação)
- Estrutura da mensagem WhatsApp formatada (formatação exata, emojis)
- Componentização interna da página de detalhe do produto
- Estado vazio do carrinho (mensagem e CTA)
- Transições/loading states entre grid → detalhe → carrinho

## Deferred Ideas

- Checkout próprio com pagamento (PIX, cartão)
- Persistência do carrinho no servidor
- Compartilhamento do carrinho via link
- Notificações de estoque
- Reviews/avaliações de produtos

---

*Discussion completed: 2026-05-05*
