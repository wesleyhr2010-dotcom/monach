---
quick_id: "008"
slug: analytics-date-range-fix
date: 2026-05-12
status: complete
commit: e071250
---

# Quick Task 008 — SUMMARY

## Objetivo

Corrigir o `DatePickerWithRange` no analytics admin: o calendário fechava ao selecionar a primeira data, impedindo a seleção de um intervalo.

## Arquivos alterados

- `src/components/ui/date-range-picker.tsx`
- `src/components/ui/date-range-picker.css`

---

## Bugs encontrados (3 causas distintas)

### Bug 1 — Causa raiz: `addToRange` retorna `{ from: X, to: X }` no 1º clique

**Arquivo:** `node_modules/react-day-picker/dist/esm/utils/addToRange.js:21`

```js
// Quando selected=undefined e min=0 (padrão):
range = { from: date, to: min > 0 ? undefined : date };
//                         ↑ min=0 → to = from (mesma data)
```

O DayPicker v9 seta `to = from` no primeiro clique quando nenhuma seleção existe. Nossa condição `range?.from && range?.to` era verdadeira → `setOpen(false)` disparava imediatamente.

**Fix:** verificar se `from` e `to` são dias distintos antes de fechar:
```tsx
const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

if (range?.from && range?.to && !isSameDay(range.from, range.to)) {
    onChange({ from: range.from, to: range.to });
    setOpen(false);
}
```

---

### Bug 2 — `classNames` prop com hífens vs underscores do v9

O componente tinha:
```tsx
classNames={{ range_start: "rdp-range-start", day_button: "rdp-day-button", ... }}
```

Mas o CSS usava `.rdp-range_start`, `.rdp-day_button` (underscores — nomes padrão do v9).
Os estilos de highlight nunca batiam → range sem visual.

**Fix:** remover o `classNames` prop completamente. O v9 usa underscores por padrão.

---

### Bug 3 — CSS padrão `react-day-picker/style.css` conflitava com override

O CSS padrão define:
- `flex-wrap: wrap` + `max-width: fit-content` → meses empilhados verticalmente
- `--rdp-accent-background-color: #f0f0ff` → fundo branco no range (visível no dark theme)
- `opacity: 0.75` nos weekdays → layout dos dias da semana quebrado

**Fix:** remover `import "react-day-picker/style.css"` e escrever CSS próprio completo:
- `flex-direction: row; flex-wrap: nowrap` — meses lado a lado
- `table-layout: fixed` — colunas dos dias com largura igual
- Todas as variáveis de cor sobrescritas com tokens do design system admin

---

### Bug 4 — Fechamento no 1º clique com range existente

Quando já havia um value (ex: "01/04 — 01/08"), o `internalRange` era sincronizado com `value`. O DayPicker via um range completo e no 1º clique chamava `onSelect` com `{ from, to }` (ajuste do range) → `setOpen(false)`.

**Fix:** resetar `internalRange = undefined` ao abrir o calendário:
```tsx
const handleToggle = () => {
    if (!open) setInternalRange(undefined);
    setOpen((v) => !v);
};
```

---

## Fluxo correto após todos os fixes

1. Abrir calendário → `internalRange = undefined` (sempre fresh)
2. Clicar data A → `onSelect({ from: A, to: A })` → `isSameDay` = true → **calendário permanece aberto**, A destacado
3. Clicar data B → `onSelect({ from: A, to: B })` → dias distintos → `onChange(...)` → calendário fecha → URL atualizada

## Commits

| Hash | Descrição |
|------|-----------|
| `85767fa` | internalRange state inicial |
| `b49f6d7` | classNames mismatch (hífens vs underscores) |
| `6def67a` | CSS completo, reset ao abrir |
| `e071250` | causa raiz: isSameDay guard no addToRange |
