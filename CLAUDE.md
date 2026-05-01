# CLAUDE.md — NEXT-MONARCA

Guia obrigatório de comportamento do assistente neste repositório. Leia antes de qualquer ação.

---

## 0. Contexto e fonte de verdade

**Antes de qualquer implementação, análise ou resposta substantiva, sempre leia:**

1. [`docs/project_overview.md`](./docs/project_overview.md) — estado atual, stack, arquitetura, o que já existe.
2. [`docs/next_steps.md`](./docs/next_steps.md) — o que está pendente e em que ordem.

**Fonte única de verdade das regras de negócio:** a pasta [`docs/`](./docs/) (SPECs em `admin/`, `revendedoras/`, `sistema/`, `prd/`).

- Não invente funcionalidades que não estejam nas SPECs.
- Se uma funcionalidade solicitada não existir nas SPECs, pare e pergunte; proponha criar/atualizar a SPEC antes do código.
- Divergências entre código e SPEC exigem atualização da SPEC **antes** do merge (ver [`docs/README.md`](./docs/README.md) §Convenções).

## 1. Manutenção da base de contexto

Após qualquer mudança significativa, atualize os arquivos de contexto na mesma PR da mudança:

| Quando | Atualizar |
|---|---|
| Ao concluir uma tarefa listada | Marcar `[x]` em `docs/next_steps.md` e, se relevante, adicionar entrada em `docs/CHANGELOG.md`. |
| Ao adicionar ou alterar funcionalidade | `docs/project_overview.md` (§6 "O que já foi desenvolvido" e §7 "Status atual"). |
| Ao mudar stack, arquitetura ou módulo | `docs/project_overview.md` §2–4. |
| Ao criar nova SPEC | Indexar em `docs/README.md` e referenciar em `docs/next_steps.md`. |

Regras:

- **Evitar duplicação.** Se a informação já existe em uma SPEC, referencie por link; não replique.
- **Evitar inconsistência.** Nunca registrar um item como concluído em `next_steps.md` se o código ou as SPECs não refletirem a mudança.
- Nada de arquivos soltos de "plano", "notas", "análise" na raiz do projeto ou em `docs/`. Usar os três arquivos canônicos: `project_overview.md`, `next_steps.md`, `CHANGELOG.md`.

## 2. Estilo de trabalho

**Pensar como arquiteto de software.** Priorizar consistência e manutenção a longo prazo sobre atalhos.

### 2.1 Think Before Coding

- Tornar suposições explícitas. Se houver ambiguidade, perguntar.
- Se existem múltiplas interpretações, apresentar as opções — não escolher em silêncio.
- Se há um caminho mais simples, dizer. Contrapor quando fizer sentido.

### 2.2 Simplicity First

- Código mínimo que resolve o problema. Nada especulativo.
- Sem abstrações para uso único, sem "flexibilidade" não pedida, sem tratamento de erro para cenários impossíveis.
- Se 200 linhas podiam ser 50, reescrever.

### 2.3 Surgical Changes

- Tocar apenas no que o pedido exige. Não "melhorar" código adjacente.
- Manter o estilo existente, mesmo que você preferisse outro.
- Remover imports/variáveis que **suas** mudanças tornaram órfãos; não apagar código morto pré-existente sem pedir.
- Teste: toda linha alterada deve rastrear diretamente ao pedido.

### 2.4 Goal-Driven Execution

- Traduzir tarefas em critérios verificáveis ("implemente X" → "teste Y passa").
- Para multi-step, declarar plano curto com verificação em cada passo.

## 3. Convenções do projeto

- **Idioma da UI:** espanhol paraguaio em todas as interfaces (`/app`, `/admin`, `/vitrina`).
- **Idioma da documentação:** português nas seções funcionais.
- **Rotas / identificadores:** em inglês/espanhol conforme já presente no código.
- **Stack:** Next.js 16 (App Router), React 19, TypeScript estrito, Tailwind v4, Prisma + Supabase, Cloudflare R2, Brevo, OneSignal, Serwist PWA, Vitest.
- **Defesa em profundidade:** middleware + guard de Server Action + RLS Supabase. Nunca confiar em apenas uma camada.
- **Valores de maleta fechada são imutáveis** (snapshots). Nunca recalcular depois do fechamento.
- **Nunca vazar PII em logs.** Usar helper de sanitização.

## 3.1 Front-end: Paper-first, modular e com design system

Estas regras são **obrigatórias** para qualquer criação ou alteração de UI no projeto.

### Paper é a fonte visual de verdade
- **Sempre consultar o MCP do Paper antes de implementar qualquer tela, componente ou ajuste visual.** Antes de escrever JSX/CSS, use as tools `mcp__plugin_paper-desktop_paper__*` para abrir o artboard relevante, extrair `get_jsx`, `get_computed_styles`, `get_screenshot` e tokens.
- Se o usuário passar um link do Paper (`app.paper.design/file/.../{pageId}/{nodeId}`), inspecionar o node antes de propor implementação.
- Se o design **não existir no Paper**, pausar e perguntar antes de "inventar" layout. Nunca criar tela sem referência visual aprovada.
- Cores e medidas extraídas do Paper **nunca** entram hard-coded no código de produção: convertem-se em tokens (ver §Design system).

### Modularidade obrigatória
- **Toda tela é composta por módulos React reutilizáveis.** Nada de componentes monolíticos de uso único.
- Antes de criar um componente, procurar em `src/components/app/*` e `src/components/admin/*` algo reaproveitável. Se algo similar existir, estender em vez de duplicar.
- Novas moléculas/organismos vão para `src/components/{scope}/` com props bem definidas e exemplos de uso na SPEC correspondente.
- Átomos visuais (badge, pill, row, card) devem ser genéricos o suficiente para 2+ telas antes de serem promovidos.

### Design system primeiro
- Usar sempre tokens definidos em [`docs/design-system/tokens.md`](./docs/design-system/tokens.md) e CSS variables do projeto (`--app-*`, `--admin-*`). Se precisar de um valor que ainda não existe, **adicionar o token antes de usá-lo** — não hard-codear hex/px.
- Tipografia, espaçamentos, radii, sombras e cores seguem o DS. Raleway é a família padrão do PWA.
- Se um novo padrão visual surgir do Paper (ex.: variante de card), registrar em [`docs/sistema/SPEC_DESIGN_MODULES.md`](./docs/sistema/SPEC_DESIGN_MODULES.md) na mesma PR.

### Checklist obrigatório antes de commitar front-end
1. Conferi o artboard correspondente no Paper via MCP.
2. Reaproveitei componentes existentes (ou justifiquei no PR por que criei novos).
3. Usei tokens do design system (zero hex/px mágicos no JSX).
4. SPEC da feature referencia o artboard do Paper e lista os componentes tocados.

## 3.2 Git — remote padrão

- **`git push` padrão vai para o remote `client`** (`https://github.com/monarcasemijoyas/monarca.git`). É o repositório oficial do cliente Monarca.
- Usar `git push client <branch>` explicitamente. O remote `origin` (fork pessoal do dev) só é usado quando o próprio desenvolvedor pedir, nunca por default.
- `main` → deploy Vercel em produção. Não forçar push em `main` sem autorização explícita.

## 3.3 Performance — Regras obrigatórias

Estas regras existem para evitar os gargalos de performance que detectamos e corrigimos. **Não reintroduzir.**

### `getCurrentUser()` é cached via `React.cache()`
- Sempre importar de `@/lib/user`. Nunca criar wrapper alternativo ou chamar `supabase.auth.getUser()` diretamente em server components.
- Chamadas múltiplas no mesmo request (layout + page + server actions) executam **1 única query real**.
- `requireAuth()` chama `getCurrentUser()` — não precisa ser antecedido por outra verificação.

### Middleware NÃO faz query ao banco
- O middleware (`middleware-auth.ts`) apenas refresca o token JWT e redireciona não-autenticados.
- Verificação de `role` e `is_active` é feita nos **layouts** e **server actions** via `getCurrentUser()`.
- Nunca adicionar `prisma.xxx` ou `supabase.from('xxx')` no middleware.

### `force-dynamic` só para páginas autenticadas
- Páginas públicas (`/`, `/catalogo`, `/produto/[slug]`, `/vitrina/[slug]`) usam `export const revalidate = 60`.
- Páginas do `/app/*` e `/admin/*` usam `force-dynamic` — precisam de dados em tempo real.
- Se build falhar por dado dinâmico em página ISR, verificar se há `headers()` ou `cookies()` sendo chamado desnecessariamente.

### Pool Prisma com limites
- `max`, `idleTimeoutMillis`, `connectionTimeoutMillis` devem estar configurados em `src/lib/prisma.ts`.
- Em ambiente serverless (Vercel), cada instância tem seu próprio pool — manter `max: 10`.

### Referências
- Tabela completa de TTL e tags: [`SPEC_CACHING_STRATEGY.md`](./docs/sistema/SPEC_CACHING_STRATEGY.md)

## 4. Antes de concluir qualquer entrega

Checklist mínimo:

1. Código segue a SPEC relevante em `docs/`.
2. Se houve mudança de UI: Paper MCP consultado + componentes reaproveitados + tokens do design system (ver §3.1).
3. `npm run lint` e `npm test` passam.
4. `docs/next_steps.md` atualizado (itens marcados, novos itens criados se houver).
5. `docs/project_overview.md` atualizado se o estado do sistema mudou.
6. `docs/CHANGELOG.md` tem entrada datada se a mudança é relevante.
7. Commit message no padrão convencional (`feat:`, `fix:`, `docs:`, `chore:`).
8. `git push client <branch>` (remote `client` = repo Monarca).

---

**Estas regras funcionam quando:** o próximo desenvolvedor (ou sessão de IA) consegue retomar o contexto lendo apenas `project_overview.md` + `next_steps.md` + a SPEC relevante.
