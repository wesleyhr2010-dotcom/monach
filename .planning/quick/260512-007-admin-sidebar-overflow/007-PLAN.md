---
quick_id: "007"
slug: admin-sidebar-overflow
date: 2026-05-12
description: "Fix admin sidebar — itens de menu desaparecendo por overflow"
---

# Quick Task 007 — Fix admin sidebar overflow

## Goal

Corrigir a sidebar do admin onde os últimos itens de menu ficam invisíveis quando há muitos elementos.

## Root Cause

`.admin-sidebar-nav` tem `flex: 1` mas não tem `overflow-y: auto`. Em flex containers com `position: fixed` e `bottom: 0`, os filhos overflow sem scroll.

## Tasks

### Task 1: Adicionar overflow-y scroll à nav

**File:** `src/app/admin/admin.css`
**Action:** Adicionar `overflow-y: auto` e `min-height: 0` ao `.admin-sidebar-nav`.
**Verify:** Nav scrollável quando itens excedem a altura da tela.
**Done:** CSS aplicado sem quebrar layout.

### Task 2: Scrollbar customizada (opcional — mesmo arquivo)

**File:** `src/app/admin/admin.css`
**Action:** Adicionar scrollbar fina e discreta para `.admin-sidebar-nav` via webkit pseudo-elements.
**Verify:** Visual limpo e consistente com o tema dark do admin.
**Done:** Scrollbar estilizada.
