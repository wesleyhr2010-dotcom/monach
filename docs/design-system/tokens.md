# Tokens do Design System

Este documento descreve os tokens usados pelo Design System criado para padronizar futuras telas.

Colors
- primary: #4F46E5
- primaryDark: #4338CA
- secondary: #10B981
- surface: #FFFFFF
- background: #F7F7FB
- text: #1F2937
- textMuted: #6B7280
- border: #E5E7EB
- success: #10B981
- warning: #F59E0B
- error: #EF4444

App PWA (monarca)
- appBg: #F5F2EF
- appCardBg: #FFFFFF
- appCardBorder: #EBEBEB
- appDivider: #F5F2EF
- appIconBg: #F5F2EF
- appPrimary: #35605A
- appText: #1A1A1A
- appMuted: #B4ABA2
- appAccentGreenBg: #E8F5E9
- appAccentGreen: #1F7A4A
- appDangerBg: #FFF5F5
- appDangerBorder: #FFCDD2
- appDanger: #D32F2F

Typography
- Font family: Raleway, System Sans-Serif
- Font sizes: h1 32px, h2 28px, h3 22px, body 16px, caption 12px
- Font weights: normal 400, bold 700

Spacing
- Escala de espaçamento baseada em unidades: 0, 4, 8, 12, 16, 20, 24, 28, 32, 40, 48 (px)

Radii (bordas)
- sm: 4px, md: 8px, lg: 12px, xl: 16px

Shadows
- sm: 0 1px 2px rgba(0,0,0,0.05)
- md: 0 4px 12px rgba(0,0,0,0.08)
- lg: 0 12px 24px rgba(0,0,0,0.12)

Breakpoints
- xs: 0px
- sm: 600px
- md: 1024px
- xl: 1440px

Admin Tokens (Dark Theme)

| Token | Valor | Uso |
|-------|-------|-----|
| `--admin-bg` | `#0a0a0a` | Background geral do painel |
| `--admin-surface` | `#171717` | Cards, tabelas, modais |
| `--admin-surface-hover` | `#222222` | Hover em cards |
| `--admin-surface-row-atrasada` | `#1a1010` | Linha de maleta atrasada |
| `--admin-surface-row-aguardando` | `#1a1a10` | Linha de maleta aguardando revisão |
| `--admin-border` | `#2a2a2a` | Bordas, divisores |
| `--admin-border-focus` | `#35605a` | Borda em foco |
| `--admin-text` | `#ededed` | Texto principal |
| `--admin-text-muted` | `#888888` | Texto secundário |
| `--admin-text-dim` | `#444444` | Texto terciário, placeholders |
| `--admin-accent` | `#35605a` | Botões primários, CTAs |
| `--admin-accent-hover` | `#2a4d48` | Hover em CTAs |
| `--admin-danger` | `#e05c5c` | Erros, deleções |
| `--admin-danger-hover` | `#c44545` | Hover em ações de perigo |
| `--admin-success` | `#4ade80` | Sucesso, status ativo |
| `--admin-success-10` | `rgba(74,222,128,0.1)` | Background sucesso com opacidade |
| `--admin-success-15` | `rgba(74,222,128,0.15)` | Background sucesso com opacidade |
| `--admin-warning` | `#facc15` | Avisos, status pendente |
| `--admin-warning-10` | `rgba(250,204,21,0.1)` | Background aviso com opacidade |
| `--admin-warning-15` | `rgba(250,204,21,0.15)` | Background aviso com opacidade |
| `--admin-danger-10` | `rgba(224,92,92,0.1)` | Background perigo com opacidade |
| `--admin-danger-15` | `rgba(224,92,92,0.15)` | Background perigo com opacidade |
| `--admin-muted-10` | `rgba(136,136,136,0.1)` | Background neutro com opacidade |
| `--admin-muted-15` | `rgba(136,136,136,0.15)` | Background neutro com opacidade |
| `--admin-info` | `#6677dd` | Cor informativa |
| `--admin-info-light` | `#60a5fa` | Cor informativa clara |
| `--admin-brown` | `#917961` | Cor marrom/bege |
| `--admin-beige` | `#b4aba2` | Cor bege |
| `--admin-purple` | `#8b5cf6` | Cor roxa |
| `--admin-purple-light` | `#a855f7` | Cor roxa clara |
| `--admin-orange` | `#f59e0b` | Cor laranja |
| `--admin-green-alt` | `#22c55e` | Verde alternativo |
| `--admin-blue-alt` | `#3b82f6` | Azul alternativo |
| `--admin-emerald` | `#10b981` | Verde esmeralda |
| `--admin-bg-success` | `#0f3d1c` | Background verde escuro |
| `--admin-border-success` | `#1a5a2a` | Borda verde escuro |
| `--admin-bg-info` | `#1a1a2e` | Background azul escuro |
| `--admin-radius` | `8px` | Border-radius padrão |
| `--admin-radius-sm` | `4px` | Border-radius pequeno |
| `--admin-radius-lg` | `12px` | Border-radius grande |
| `--admin-radius-pill` | `9px` | Pills e badges |

**Regra:** Nunca usar hex hardcoded em arquivos de rota admin. Sempre usar `var(--admin-*)`.

Motion (transições entre telas — PWA `/app/*`)
> Ver [`sistema/SPEC_TRANSICOES_TELAS.md`](../sistema/SPEC_TRANSICOES_TELAS.md) para a aplicação de cada token.

- --motion-duration-fast: 180ms        (crossfade entre tabs do bottom nav, fade de logout)
- --motion-duration-base: 280ms        (push / pop horizontal padrão)
- --motion-duration-modal: 320ms       (modal sheet — subir/descer)
- --motion-duration-hero: 360ms        (shared element / hero transition)
- --motion-duration-reduced: 100ms     (fallback quando prefers-reduced-motion: reduce)
- --motion-ease-standard: cubic-bezier(0.32, 0.72, 0, 1)   (push/pop, modal sheet — curva iOS-like)
- --motion-ease-emphasized: cubic-bezier(0.2, 0, 0, 1)     (shared element, ênfase)
- --motion-ease-linear: linear                              (crossfade puro)
- --motion-sheet-dim: rgba(0, 0, 0, 0.16)                   (fundo dim atrás do modal sheet)
- --motion-sheet-handle-bg: var(--app-divider)              (handle do modal sheet)

Como usar CSS Variables
- Carregar design-system/css/design-system.css para disponibilizar variáveis CSS, como --ds-color-primary, --ds-radius-md, etc.
- Em componentes, use as classes ds-btn, ds-input, ds-card, etc., que já utilizam as variáveis.

Exemplo rápido
```
<button className="ds-btn ds-btn--primary ds-btn--md">Clicar</button>
<input className="ds-input" placeholder="Pesquisar" />
```
