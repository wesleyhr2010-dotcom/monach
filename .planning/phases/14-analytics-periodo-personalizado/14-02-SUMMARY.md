---
phase: 14
plan: 02
subsystem: admin-analytics-ui
status: complete
type: execute
---

## Plan 14-02: DateRangePicker UI e integração com URL State

**Objetivo:** Implementar a interface de seleção de período personalizado e integrá-la ao dashboard de admin.

### Tarefas Executadas

1. **Task 1 — Implementar DateRangePicker (Shadcn style)**
   - Instaladas dependências `react-day-picker@9.14.0` e `date-fns`.
   - Criado `src/components/ui/date-range-picker.tsx` com suporte a range selection.
   - Criado `src/components/ui/date-range-picker.css` com overrides de tema escuro (tokens `--admin-*`).
   - Componente suporta seleção de range, limpeza e formatação em espanhol (`es` locale).

2. **Task 2 — Integrar Filtros na Página de Analytics**
   - Criado `DateRangeSelect` (client component) que gerencia navegação via `router.push` e preserva `reseller`.
   - `page.tsx` atualizado para:
     - Extrair `from`/`to` de `searchParams`.
     - Usar `getRangeFromParams` para obter objetos Date.
     - Validar diff de dias > 366 e renderizar mensagem de erro estilizada sem carregar dados.
     - Passar `from`/`to` para todas as Server Actions.
   - `ResellerSelect` atualizado para propagar `from`/`to` como inputs hidden.
   - Presets (7d, 30d, etc.) limpam `from`/`to` da URL automaticamente.
   - URL reflete o período selecionado (`?from=YYYY-MM-DD&to=YYYY-MM-DD`).

### Deviations

Nenhuma.

### Self-Check: PASSED

- [x] TypeScript compila sem erros em arquivos de produção
- [x] Selecionar range atualiza URL e recarrega dados
- [x] Clicar em preset limpa range customizado
- [x] Trocar revendedora mantém o range customizado
- [x] Range > 366 dias exibe erro e bloqueia query
