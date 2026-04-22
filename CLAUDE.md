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

## 4. Antes de concluir qualquer entrega

Checklist mínimo:

1. Código segue a SPEC relevante em `docs/`.
2. `npm run lint` e `npm test` passam.
3. `docs/next_steps.md` atualizado (itens marcados, novos itens criados se houver).
4. `docs/project_overview.md` atualizado se o estado do sistema mudou.
5. `docs/CHANGELOG.md` tem entrada datada se a mudança é relevante.
6. Commit message no padrão convencional (`feat:`, `fix:`, `docs:`, `chore:`).

---

**Estas regras funcionam quando:** o próximo desenvolvedor (ou sessão de IA) consegue retomar o contexto lendo apenas `project_overview.md` + `next_steps.md` + a SPEC relevante.
