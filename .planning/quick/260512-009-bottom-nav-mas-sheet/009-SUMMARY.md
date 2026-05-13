---
quick_id: "009"
slug: bottom-nav-mas-sheet
date: 2026-05-12
status: complete
commit: 2ad87c6
---

# Quick Task 009 — SUMMARY

## O que foi feito

Adicionado botão "Más" na barra de navegação mobile do admin com um bottom sheet para itens extras e logout.

## Arquivos alterados

- `src/components/admin/BottomNav.tsx`
- `src/app/admin/admin.css`

## Design

### Barra inferior (5 slots fixos)

| Slot | Item | Roles |
|------|------|-------|
| 1 | Inicio | ADMIN + COLABORADORA |
| 2 | Maleta | ADMIN + COLABORADORA |
| 3 | Revend. | ADMIN + COLABORADORA |
| 4 | Analytics | ADMIN + COLABORADORA |
| 5 | **Más** | sempre |

### Bottom sheet (ao tocar em "Más")

**ADMIN:** Productos, Equipe, Relatórios → Divider → Volver al sitio, Salir

**COLABORADORA:** Perfil, Comissões → Divider → Volver al sitio, Salir

## Comportamento

- Overlay escuro (rgba 55%) fecha o sheet ao clicar fora
- Sheet com `border-radius: 16px` e animação slide-up (`cubic-bezier(0.32, 0.72, 0, 1)`)
- Botão X no header fecha o sheet
- Navegação para qualquer item fecha o sheet automaticamente (`useEffect` no pathname)
- Botão "Más" fica ativo (cor accent) quando a rota atual está num item secundário
- Overlay e sheet só visíveis em `max-width: 768px`
