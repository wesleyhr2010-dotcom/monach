---
phase: quick
plan: 260525-rg8
subsystem: gamificacao
tags: [gamificacao, pontos, guarani, migration, admin-ui]
dependency_graph:
  requires: []
  provides: [pontos-proporcionais-guarani]
  affects: [gamificacao, vendas]
tech_stack:
  added: []
  patterns: [proportional-points, optional-param-backward-compat]
key_files:
  created:
    - prisma/migrations/20260525000000_add_pontos_por_guarani/migration.sql
  modified:
    - prisma/schema.prisma
    - src/lib/gamificacao.ts
    - src/app/app/actions-revendedora.ts
    - src/app/admin/actions-gamificacao.ts
    - src/app/admin/gamificacao/page.tsx
decisions:
  - Prisma migrate dev indisponivel (shadow DB sem uuid_generate_v4) — migration criada manualmente e aplicada via prisma db execute, registrada em _prisma_migrations manualmente (padrão já adotado no projeto)
  - 4o parametro valorVenda como opcional preserva retrocompatibilidade total em todas as chamadas existentes de awardPoints
  - Guarda relaxada para pontos_por_guarani: (regra.pontos <= 0 && regra.pontos_por_guarani == null) permite regras proporcionais com pontos=0 sem causar false nulls
metrics:
  duration: ~18min
  completed: 2026-05-25
  tasks_completed: 3
  files_changed: 5
---

# Quick Task 260525-rg8: Pontos Proporcionais ao Valor da Venda em Guaranis

**One-liner:** Campo `pontos_por_guarani Decimal?(10,6)` em `GamificacaoRegra` + calculo `Math.max(1, floor(valor * fator))` em `awardPoints` + UI admin inline para configurar o fator.

## Tasks Executadas

| Task | Nome | Commit | Arquivos |
|------|------|--------|---------|
| 1 | Schema migration + lib calculo proporcional | 6982979 | prisma/schema.prisma, src/lib/gamificacao.ts, prisma/migrations/20260525000000_add_pontos_por_guarani/ |
| 2 | Passar valorVenda na chamada de venda + atualizar actions admin | f0b1041 | src/app/app/actions-revendedora.ts, src/app/admin/actions-gamificacao.ts |
| 3 | UI admin — coluna Pts/Gs e edicao inline | 6687ea5 | src/app/admin/gamificacao/page.tsx |

## Success Criteria Check

- Regra com pontos_por_guarani=0.001 e venda de 100.000 Gs gera 100 pontos: implementado em `awardPoints` com `Math.floor(100000 * 0.001) = 100`
- Regra com pontos_por_guarani=null gera pontos fixos: implementado via branch `if (regra.pontos_por_guarani != null && valorVenda != null && valorVenda > 0)`
- Venda de 500 Gs com fator 0.001 gera minimo 1 ponto: implementado via `Math.max(1, ...)`
- Admin consegue configurar e limpar o fator via UI inline: implementado com estado `editingPtsGs` + input + botoes Guardar/Cancelar
- Zero breaking changes: 4o parametro opcional, todas chamadas existentes sem 4o arg continuam funcionando

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocker] Shadow database sem uuid_generate_v4() impedia prisma migrate dev**
- **Found during:** Task 1
- **Issue:** `npx prisma migrate dev --name add_pontos_por_guarani` falhou com P3006 — shadow DB nao tem extensao `uuid_generate_v4()`. O mesmo padrao ja existia em migrations anteriores do projeto (ex: 20260512000000_fix_variant_padrao_to_tipo).
- **Fix:** Migration SQL criada manualmente em `prisma/migrations/20260525000000_add_pontos_por_guarani/migration.sql`, aplicada via `npx prisma db execute --file`, e registrada em `_prisma_migrations` via INSERT manual com guard WHERE NOT EXISTS.
- **Files modified:** prisma/migrations/20260525000000_add_pontos_por_guarani/migration.sql
- **Commit:** 6982979

## Known Stubs

None — todos os campos estao conectados a dados reais do banco.

## Threat Flags

None — nenhum novo endpoint de rede, auth path, ou mudanca de schema em trust boundaries adicionados alem do campo nullable.

## Self-Check: PASSED

- [x] prisma/schema.prisma — campo pontos_por_guarani presente
- [x] prisma/migrations/20260525000000_add_pontos_por_guarani/migration.sql — arquivo criado
- [x] src/lib/gamificacao.ts — pontosEfetivos e 4o parametro presentes
- [x] src/app/app/actions-revendedora.ts — awardPoints com preco_fixado
- [x] src/app/admin/actions-gamificacao.ts — pontos_por_guarani no schema Zod e mapeamentos
- [x] src/app/admin/gamificacao/page.tsx — coluna Pts/Gs e edicao inline
- [x] Commits 6982979, f0b1041, 6687ea5 existem no historico git
