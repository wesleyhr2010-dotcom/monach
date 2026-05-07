# Phase 15: Admin UI Consistência Visual — Audit Report

**Generated:** 2026-05-07
**Scope:** `src/app/admin/*` e `src/components/admin/*`

## Resumo

Execução de auditoria completa das rotas admin e componentes. Foram identificados valores hex hardcoded em múltiplos arquivos. A maioria foi substituída por tokens CSS `var(--admin-*)`. Alguns valores permanecem por não terem equivalentes no design system.

## Tokens Admin Adicionados

Foram adicionados os seguintes tokens a `src/app/admin/admin.css`:

| Token | Valor | Uso |
|-------|-------|-----|
| `--admin-success-10` | `rgba(74, 222, 128, 0.1)` | Background com opacidade para status sucesso |
| `--admin-success-15` | `rgba(74, 222, 128, 0.15)` | Background com opacidade para status sucesso |
| `--admin-warning-10` | `rgba(250, 204, 21, 0.1)` | Background com opacidade para status aviso |
| `--admin-warning-15` | `rgba(250, 204, 21, 0.15)` | Background com opacidade para status aviso |
| `--admin-danger-10` | `rgba(224, 92, 92, 0.1)` | Background com opacidade para status perigo |
| `--admin-danger-15` | `rgba(224, 92, 92, 0.15)` | Background com opacidade para status perigo |
| `--admin-muted-10` | `rgba(136, 136, 136, 0.1)` | Background com opacidade para status neutro |
| `--admin-muted-15` | `rgba(136, 136, 136, 0.15)` | Background com opacidade para status neutro |
| `--admin-info` | `#6677dd` | Cor azul informativa |
| `--admin-info-light` | `#60a5fa` | Cor azul clara |
| `--admin-brown` | `#917961` | Cor marrom/bege (ícones secundários) |
| `--admin-beige` | `#b4aba2` | Cor bege (ícones terciários) |
| `--admin-purple` | `#8b5cf6` | Cor roxa (ranking) |
| `--admin-purple-light` | `#a855f7` | Cor roxa clara (avatars) |
| `--admin-orange` | `#f59e0b` | Cor laranja (alertas) |
| `--admin-green-alt` | `#22c55e` | Verde alternativo |
| `--admin-blue-alt` | `#3b82f6` | Azul alternativo |
| `--admin-emerald` | `#10b981` | Verde esmeralda (leads) |
| `--admin-bg-success` | `#0f3d1c` | Background verde escuro |
| `--admin-border-success` | `#1a5a2a` | Borda verde escuro |
| `--admin-bg-info` | `#1a1a2e` | Background azul escuro |

## Arquivos Modificados (Plan 15-01)

### Componentes
- `src/components/admin/AdminStatusBadge.tsx` — Refatorado para usar tokens CSS, zero hex
- `src/components/admin/AdminStatCard.tsx` — Hex substituídos por tokens
- `src/components/admin/AdminStepIndicator.tsx` — Hex substituídos por tokens
- `src/components/admin/AdminAlertBell.tsx` — Hex substituídos por tokens
- `src/components/admin/AdminLayoutClient.tsx` — Hex substituídos por tokens
- `src/components/admin/ConferirComprovante.tsx` — Hex substituídos por tokens
- `src/components/admin/ConferirItemRow.tsx` — Hex substituídos por tokens
- `src/components/admin/ConferirRevendedoraDeclarou.tsx` — Hex substituídos por tokens
- `src/components/admin/dashboard/AlertasCard.tsx` — Hex substituídos por tokens
- `src/components/admin/dashboard/DocsCard.tsx` — Hex substituídos por tokens
- `src/components/admin/dashboard/MetricCard.tsx` — Hex substituídos por tokens
- `src/components/admin/dashboard/RankingTable.tsx` — Hex substituídos por tokens
- `src/components/admin/auth/AdminAuthButton.tsx` — Hex substituídos por tokens
- `src/components/admin/auth/AdminAuthField.tsx` — Hex substituídos por tokens
- `src/components/admin/auth/AdminSplitLayout.tsx` — Hex substituídos por tokens

### Rotas Admin
- `src/app/admin/page.tsx` — Hex mapeáveis substituídos
- `src/app/admin/analytics/page.tsx` — Hex mapeáveis substituídos
- `src/app/admin/login/reset-password/page.tsx` — Hex mapeáveis substituídos
- `src/app/admin/maleta/page.tsx` — Zero hex (limpo)
- `src/app/admin/maleta/nova/page.tsx` — Hex substituídos
- `src/app/admin/maleta/[id]/page.tsx` — Hex mapeáveis substituídos
- `src/app/admin/maleta/[id]/conferir/page.tsx` — Hex mapeáveis substituídos
- `src/app/admin/maleta/[id]/editar/page.tsx` — Hex substituídos
- `src/app/admin/revendedoras/page.tsx` — Hex mapeáveis substituídos
- `src/app/admin/revendedoras/[id]/page.tsx` — Hex mapeáveis substituídos
- `src/app/admin/revendedoras/[id]/documentos/page.tsx` — Hex mapeáveis substituídos
- `src/app/admin/leads/page.tsx` — Hex mapeáveis substituídos
- `src/app/admin/brindes/page.tsx` — Hex mapeáveis substituídos
- `src/app/admin/brindes/nuevo/page.tsx` — Hex mapeáveis substituídos
- `src/app/admin/brindes/solicitudes/page.tsx` — Hex mapeáveis substituídos
- `src/app/admin/consultoras/page.tsx` — Hex mapeáveis substituídos
- `src/app/admin/consultoras/[id]/page.tsx` — Hex mapeáveis substituídos
- `src/app/admin/equipe/page.tsx` — Hex mapeáveis substituídos
- `src/app/admin/gamificacao/page.tsx` — Hex mapeáveis substituídos
- `src/app/admin/minha-conta/comissoes/page.tsx` — Hex mapeáveis substituídos
- `src/app/admin/relatorios/page.tsx` — Hex mapeáveis substituídos

## Hex Remanescentes (Não Substitufveis)

Os seguintes hex values permanecem em arquivos admin por não terem tokens equivalentes no design system:

### Cores de Visualização de Dados (Dataviz)
- `#60A5FA` / `#60a5fa` — Azul claro para gráficos (devoluções)
- `#8b5cf6` — Roxo para ranking top 3
- `#a855f7` — Roxo claro para avatares

### Cores de Avatar (Array Dinâmico)
- `#7C3A2D`, `#2D5A7C`, `#5A2D7C`, `#7C5A2D`, `#2D7C5A`, `#3A2D7C`, `#7C2D5A`

### Cores de Status Customizados
- `#3A1C1C` — Background específico para maleta atrasada em revendedora perfil
- `#3A3A1C` — Background específico para maleta aguardando revisão
- `#1A2A20` — Background específico para maleta concluída/aprovada
- `#2A1F0A` — Background específico para status pendente
- `#3A2A0A` — Borda específica para status pendente
- `#3A1515` — Borda específica para status rejeitado
- `#2A3A30` — Background específico para status ativo

### Cores de Gradientes
- `#5a3e2b`, `#8b6f47` — Gradiente de avatar
- `#35605a`, `#2a4d48` — Gradiente de avatar consultora
- `#a855f7`, `#7c3aed` — Gradiente de avatar consultora

### SVG Stroke (Cores sem token)
- `#666666` em alguns SVGs (ícone de ação)

### Cores Puras Intencionais
- `#fff` / `#000` — Branco e preto puros usados para contraste máximo

## Verificação

- Build: PASS (`npm run build` sem erros)
- Lint: Sem erros novos (erros pré-existentes não relacionados)
- AdminStatusBadge: Zero hex (verificado via grep)

## Próximos Passos

- Wave 2: Padronização de `AdminStatusBadge` e `AdminEmptyState`
- Wave 3: Gates de verificação e documentação
