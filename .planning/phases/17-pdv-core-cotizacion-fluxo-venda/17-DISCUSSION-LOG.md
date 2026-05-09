# Discussion Log — Phase 17: PDV Core

**Date:** 2026-05-08
**Facilitator:** Claude (gsd-discuss-phase)

## Areas Discussed

### 1. Cliente não encontrado no PDV

| Question | Options | Decision |
|----------|---------|----------|
| Admin busca RUC e não encontra — o que acontece? | Mini-form inline / Redirecionar / Bloquear | **Mini-form inline** |
| RUC é obrigatório para iniciar a venda? | RUC obrigatório / RUC opcional | **RUC opcional** — venda sem RUC = "consumidor final" |

### 2. Adicionar produtos

| Question | Options | Decision |
|----------|---------|----------|
| Como admin adiciona produtos? | Busca por nome / Navegação por categoria / Os dois | **Os dois** — busca + navegação |
| PDV exibe estoque disponível? | Sim / Não | **Sim** — quantidade livre exibida por produto |

### 3. Pós-confirmação

| Question | Options | Decision |
|----------|---------|----------|
| Venda confirmada — o que acontece? | Splash + PDV limpo / Redireciona para histórico | **Splash de sucesso + PDV limpo** para próxima venda |

### 4. Estoque insuficiente

| Question | Options | Decision |
|----------|---------|----------|
| Quando bloquear estoque insuficiente? | Ao adicionar ao carrinho / Só ao confirmar | **Bloquear ao adicionar** — erro imediato; validação no server como segunda linha de defesa |

## Deferred Ideas

- Impressão de recibo / envio por WhatsApp → v1.5
- Desconto percentual → v1.5 CRM
- Busca por código de barras → v1.5

---
*Log generated: 2026-05-08*
