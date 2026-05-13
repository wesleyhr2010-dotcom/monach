---
quick_id: "008"
slug: analytics-date-range-fix
date: 2026-05-12
status: complete
commit: 85767fa
---

# Quick Task 008 — SUMMARY

## O que foi feito

Corrigido o `DatePickerWithRange` (`src/components/ui/date-range-picker.tsx`) onde o calendário fechava ao selecionar a primeira data.

## Root Cause

O `handleSelect` original chamava `onChange({ from: X, to: X })` quando somente `from` era selecionado. Isso alimentava um `selected = { from: X, to: X }` de volta ao `DayPicker` — um range "completo" com from = to.

Ao receber o segundo clique do usuário, o `DayPicker` interpretava "existe range completo → reset" e chamava `onSelect({ from: Y, to: undefined })`. O ciclo recomeçava: o usuário nunca conseguia ter `from ≠ to`.

## Correção

Adicionado `internalRange` (estado local) para rastrear a seleção parcial:
- O `DayPicker` recebe `internalRange` (pode ter só `from`)
- `onChange` para o pai só é chamado quando `range.from && range.to` estão ambos definidos
- O estado externo (`value`) sincroniza com `internalRange` via `useEffect` nos timestamps (para mudanças externas como limpeza ou troca de URL)

## Fluxo correto após fix

1. Clique data A → `internalRange = { from: A }` → calendário permanece aberto, highlight no dia A
2. Clique data B → `internalRange = { from: A, to: B }` → `onChange` chamado → calendário fecha → URL atualizada
