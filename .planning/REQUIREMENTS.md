# Requirements: NEXT-MONARCA v1.4

**Defined:** 2026-05-08
**Core Value:** Revendedoras conseguem receber, registrar vendas e devolver maletas com comprovante — e receber a comissão calculada automaticamente.

## v1 Requirements

### Clientes

- [ ] **CLI-01**: Admin pode cadastrar um cliente com nome, RUC, cidade e telefone
- [ ] **CLI-02**: Admin pode editar dados de um cliente existente
- [ ] **CLI-03**: Sistema impede duplicação de clientes pelo RUC — busca verifica se RUC já existe antes de criar
- [ ] **CLI-04**: Admin vê lista unificada de todos os clientes: cadastrados pelo PDV (com RUC) e das vendas de maleta das revendedoras (nome + telefone)
- [ ] **CLI-05**: Lista de clientes tem filtro por origem: Loja (PDV) / Revendedoras (maletas)

### PDV — Punto de Venta

- [ ] **PDV-01**: Admin busca e seleciona um cliente por RUC para iniciar uma venda de loja
- [ ] **PDV-02**: Admin adiciona produtos do catálogo existente à venda, com quantidade e preço unitário editável
- [ ] **PDV-03**: Admin seleciona a moeda da venda: Guaraní, Dólar ou Real
- [ ] **PDV-04**: PDV exibe o total da venda convertido para Guaraní usando a cotação configurada do dia
- [ ] **PDV-05**: Admin confirma a venda (contado) — cria registro de venda e gera `estoqueMovimento` tipo `venda_loja` decrementando o estoque de cada produto vendido
- [ ] **PDV-06**: Campos reservados para factura futura (talonario, número de factura, tipo de operação) são persistidos no banco na criação da venda, sem UI de emissão

### Cotação do Dia

- [ ] **COT-01**: Admin configura taxa de câmbio BRL→PYG e USD→PYG em `/admin/config/cotizacion`
- [ ] **COT-02**: PDV exibe a data e hora da última atualização da cotação junto ao total convertido

### Histórico de Ventas de Loja

- [ ] **VLJ-01**: Admin vê lista de todas as vendas de loja com: cliente, itens vendidos, valor total, moeda, data e responsável (quem registrou)
- [ ] **VLJ-02**: Admin pode filtrar o histórico de vendas por período (data início e data fim)

### Visual — Design System

- [ ] **VIS-01**: Todas as telas novas (`/admin/clientes`, `/admin/pdv`, `/admin/config/cotizacion`, `/admin/ventas-loja`) usam exclusivamente tokens `--admin-*` do design system — zero valores hex/px hardcoded no JSX
- [ ] **VIS-02**: Paper MCP consultado antes de implementar cada rota nova — nenhuma tela criada sem referência visual aprovada

## v2 Requirements (deferred)

### Segurança da Gamificação (deferred from v1.3)

- **GAM-SEC-01**: `awardPoints` removida do export público — wrapper validado como único caller autorizado
- **GAM-SEC-02**: `registrarPuntosCompartirCatalogo` exige evidência de compartilhamento ou rate limit rigoroso
- **GAM-SEC-03**: Ownership check em `awardPoints` — caller deve ser o próprio resellerId ou ADMIN com assertIsInGroup
- **GAM-SEC-04**: Rate limiting via Upstash nas Server Actions de gamificação
- **GAM-SEC-05**: Suite de testes de segurança para gamificação

### Factura e CRM Completo (deferred to v1.5+)

- **FAC-01**: Emissão de factura paraguaia com talonario e numeração sequencial
- **FAC-02**: Geração de PDF da factura com dados do cliente e itens
- **CRM-01**: Condição de venda crédito com cuotas (parcelas)
- **CRM-02**: Desconto percentual por venda
- **CRM-03**: Histórico de compras por cliente

### Infraestrutura Mobile (deferred)

- **INFRA-01**: Migração para domínio `monarcasemijoyas.com.py`
- **INFRA-02**: Migração PWA → Capacitor (iOS + Android)
- **INFRA-03**: Modo offline com outbox e sync idempotente

## Out of Scope

| Feature | Motivo |
|---------|--------|
| Emissão de factura paraguaia | Requer numeração sequencial controlada, talonario e regras legais — base de dados pronta em v1.4, UI na v1.5 |
| Crédito / cuotas (parcelas) | Fora do escopo contado-only deste milestone |
| Desconto por venda | Junto com CRM completo na v1.5 |
| Integração com sistema AVATI via API | AVATI não tem API/webhook disponível |
| Lista de preços diferenciada | Preço unitário editável no PDV é suficiente para v1.4 |
| Cadastro de clientes pelo PWA da revendedora | Revendedoras registram nome+telefone na venda de maleta; cadastro completo via PDV é para a loja |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CLI-01 | Phase 16 | Pending |
| CLI-02 | Phase 16 | Pending |
| CLI-03 | Phase 16 | Pending |
| CLI-04 | Phase 16 | Pending |
| CLI-05 | Phase 16 | Pending |
| PDV-01 | Phase 17 | Pending |
| PDV-02 | Phase 17 | Pending |
| PDV-03 | Phase 17 | Pending |
| PDV-04 | Phase 17 | Pending |
| PDV-05 | Phase 17 | Pending |
| PDV-06 | Phase 17 | Pending |
| COT-01 | Phase 17 | Pending |
| COT-02 | Phase 17 | Pending |
| VLJ-01 | Phase 18 | Pending |
| VLJ-02 | Phase 18 | Pending |
| VIS-01 | Phase 16 | Pending |
| VIS-02 | Phase 16 | Pending |

**Coverage:**
- v1 requirements: 17 total
- Mapped to phases: 17
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-08*
*Last updated: 2026-05-08 after initial definition*
