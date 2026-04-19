# Product Requirements Document (PRD): Portal Revendedoras & Gamificação

## Visão Geral do Produto
O Next-Monarca evoluirá para uma plataforma de gestão B2B2C focada no ecossistema de revendedoras de semijoyas (Paraguay).
O objetivo é fornecer uma ferramenta centralizada onde a loja monta maletas de joias em consignação, e as revendedoras acompanham métricas, metas gamificadas e compartilham o catálogo. Tudo operado financeiramente em *efetivo*.

## Perfis de Usuários (Jornadas)
1. **Loja (Super Admin)**: Controle irrestrito do negócio, cadastro de consultoras.
2. **Consultoras (Líderes de Equipe)**: Gerem um "guarda-chuva" de revendedoras. Expedem maletas e analisam resultados do seu grupo.
3. **Revendedoras**: Acessam via interface isolada mobile. Conferem o inventário atual (maleta), as metas de vendas para subir de comissão, trocam pontos por prêmios e geram compartilhamentos de WhatsApp.
4. **Clientes Finais**: Visualizam o catálogo via links que receberem.

## Escopo Funcional (In Scope)
- **Portal Mobile (Revendedoras)**: Dashboard customizado (`/app`).
- **Gestão de Maletas**: Envio de N produtos do estoque matriz para o inventário transitório de uma revendedora com prazo final.
- **Motor de Gamificação**:
  - *Pontos*: Ganhos de pontos via Gatilhos (ex: prazo cumprido, metas semanais) -> Troca por brindes físicos.
  - *Comissão %*: Faixas de venda que alteram a comissão base (ex: vender X sobe o cut para 40%).
- **Catálogo Partilhável**: Produtos e vitrine on-line para compartilhamento automático.

## Fora de Escopo
- Gateways para checkouts de pagamentos online. O Supabase apenas registra que foi pago em "efetivo".
- Integração de ERP terceiro de logística ou relatórios fiscais.
