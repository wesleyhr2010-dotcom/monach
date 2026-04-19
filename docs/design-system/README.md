# Design System (Starting Point)

Este repositório contém um esqueleto de Design System para padronizar novas telas.

- Tokens de cores, tipografia, espaçamento, radii e sombras (design-tokens.json).
- Folha de estilos base (design-system/css/design-system.css) com componentes UI simples.
- Componente de exemplo (Button) em React (design-system/components/Button.tsx).
- Guia rápido para adoção em novos componentes (docs/design-system/tokens.md).

Como usar
- Importar CSS global do design system: `import 'design-system/css/design-system.css'`.
- Reutilizar tokens via CSS custom properties ou via design-system/tokens.json na build de tooling.
- Construir componentes em TypeScript/React que usem as classes prefixadas (ds-*) para consistência.

Próximos passos sugeridos
- Expandir a biblioteca de componentes (Card, Input, Select, Navbar, Modal, Drawer, etc.).
- Criar utilitários de layout baseados no grid 12x e breakpoints já definidos.
- Adicionar testes visuais/regressão de estilo simples.
- Integrar com a pipeline de build para gerar CSS/tokens consumíveis em código.
