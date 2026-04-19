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

Como usar CSS Variables
- Carregar design-system/css/design-system.css para disponibilizar variáveis CSS, como --ds-color-primary, --ds-radius-md, etc.
- Em componentes, use as classes ds-btn, ds-input, ds-card, etc., que já utilizam as variáveis.

Exemplo rápido
```
<button className="ds-btn ds-btn--primary ds-btn--md">Clicar</button>
<input className="ds-input" placeholder="Pesquisar" />
```
