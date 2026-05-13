---
quick_id: "007"
slug: admin-sidebar-overflow
date: 2026-05-12
status: complete
commit: 8cf5b4b
---

# Quick Task 007 — SUMMARY

## O que foi feito

Corrigido o `overflow` da sidebar do admin (`src/app/admin/admin.css`).

**Root cause:** `.admin-sidebar-nav` usava `flex: 1` sem `overflow-y: auto` nem `min-height: 0`. Em flex containers com `position: fixed` e altura fechada (top + bottom: 0), os filhos transbordam para fora da área visível sem criar scroll.

## Mudanças

**Arquivo:** `src/app/admin/admin.css`

```css
.admin-sidebar-nav {
    flex: 1;
    min-height: 0;          /* ← permite que o flex item encolha abaixo do conteúdo */
    overflow-y: auto;       /* ← scroll quando há muitos itens */
    scrollbar-width: thin;
    scrollbar-color: var(--admin-border) transparent;
}

/* + scrollbar webkit customizada (4px, transparente, com hover) */
```

## Resultado

- Todos os itens de menu ficam acessíveis via scroll na sidebar.
- Scrollbar fina e discreta (4px) consistente com o tema dark do admin.
- Nenhuma quebra de layout — o bottom bar (Voltar / Sair) continua fixo no rodapé da sidebar.
