---
plan: 02-01
phase: 02-core-business-notifications-leads-config
status: complete
completed: 2026-05-04
---

# Plan 02-01 Summary: Notification Template System

## What Was Built

A complete notification template engine with safe variable substitution, HTML sanitization, and an enhanced admin editor with variable hints.

### Key Files Created/Modified

| File | Action | Description |
|------|--------|-------------|
| `src/lib/notifications.ts` | Modified | Added `substituirVariaveis`, `VARIAVEIS_POR_TIPO`, `sanitizeTemplateVars`, `htmlToPlainText`, `mapTipoParaWhitelist` |
| `src/__tests__/lib/notifications.test.ts` | Created | 28 Vitest tests covering variable substitution, whitelist, sanitization, plain-text conversion, and tipo mapping |
| `src/app/admin/config/notif-push/TemplateEditor.tsx` | Created | Template editor with "Variables disponibles" hint section, clickable variable chips, and unknown variable warnings |
| `src/app/admin/config/notif-push/NotifPushClient.tsx` | Modified | Integrated TemplateEditor component replacing inline modal |
| `package.json` | Modified | Added `isomorphic-dompurify` dependency |

### Technical Decisions

- **isomorphic-dompurify**: Chosen for server-side HTML sanitization. Allows basic formatting tags (`b`, `i`, `strong`, `em`, `br`, `p`, `a[href]`) while stripping scripts and event handlers.
- **Dot notation support**: `substituirVariaveis` supports nested object access like `{maleta.id}` via `contexto.maleta.id`.
- **Whitelist hardcoding**: `VARIAVEIS_POR_TIPO` is hardcoded in source (not runtime-configurable) as a security measure against tampering.
- **Tipo mapping**: `mapTipoParaWhitelist` normalizes DB tipo values (e.g., `prazo_proximo_d3`, `pontos_concedidos`) to whitelist keys.

### Test Results

- **28/28 tests passing** (17ms)
- No lint errors in modified files
- Pre-existing TypeScript errors in unrelated test files (not caused by this plan)

### Deviations

- None. All tasks completed as specified.

### Self-Check

- [x] `substituirVariaveis()` correctly replaces whitelisted variables and ignores unknown ones
- [x] Template editor displays variable hints and allows insertion via click
- [x] HTML sanitization and plain-text utilities are available for downstream plans
- [x] All tests pass
