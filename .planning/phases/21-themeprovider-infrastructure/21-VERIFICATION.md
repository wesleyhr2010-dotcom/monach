---
phase: 21-themeprovider-infrastructure
verified: 2026-05-16T00:25:00Z
status: human_needed
score: 9/9 truths verified
overrides_applied: 0
re_verification:
  previous_status: null
  previous_score: null
  gaps_closed: []
  gaps_remaining: []
  regressions: []
gaps: []
deferred: []
human_verification:
  - test: "Recarregar /app com OS em dark mode e sem preferência salva"
    expected: "PWA carrega diretamente no tema escuro, sem flash do fundo claro"
    why_human: "Anti-flash é visual — precisa verificar se não há FOCT (flash of unthemed content) antes do script síncrono executar"
  - test: "Recarregar /admin com OS em light mode e sem preferência salva"
    expected: "Admin carrega no tema claro, sem flash"
    why_human: "Mesmo motivo — verificação visual do anti-flash no surface admin"
  - test: "localStorage.setItem('monarca-app-theme', 'dark') + reload /app"
    expected: "/app carrega em dark mode, independente do OS"
    why_human: "Persistência real só é verificável com reload completo do navegador"
  - test: "localStorage.setItem('monarca-admin-theme', 'light') + reload /admin"
    expected: "/admin carrega em light mode; /app não é afetado"
    why_human: "Independência entre surfaces só é verificável com reload em ambas as abas"
  - test: "Disparar toast no /app com tema dark ativo"
    expected: "Toast aparece com fundo escuro (não branco)"
    why_human: "Sonner theming é visual — precisa confirmar que o background do toast respeita resolvedTheme"
---

# Phase 21: ThemeProvider Infrastructure Verification Report

**Phase Goal:** Providers escopados, anti-flash e Sonner funcionando em ambas as surfaces
**Verified:** 2026-05-16T00:25:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #   | Truth | Status | Evidence |
| --- | ----- | ------ | -------- |
| 1 | AppThemeProvider wraps /app e lê OS preference ou localStorage | ✓ VERIFIED | `src/components/app/AppShell.tsx:39` importa e envolve todo o conteúdo; `AppThemeProvider.tsx:13` passa `MONARCA_APP_THEME_KEY` e `surface="app"` |
| 2 | AdminThemeProvider wraps /admin e lê OS preference ou localStorage | ✓ VERIFIED | `src/components/admin/AdminLayoutClient.tsx:207` importa e envolve todo o conteúdo; `AdminThemeProvider.tsx:13` passa `MONARCA_ADMIN_THEME_KEY` e `surface="admin"` |
| 3 | Anti-flash inline script seta data-theme antes do first paint em ambas surfaces | ✓ VERIFIED | `ThemeScript.tsx` rendera `<script dangerouslySetInnerHTML>`; `app/layout.tsx:9` e `admin/layout.tsx:72` colocam `<ThemeScript>` antes dos shells; script usa `MutationObserver` para encontrar o elemento mesmo quando client-rendered |
| 4 | Admin não hardcoded data-theme="dark" | ✓ VERIFIED | `grep -n 'data-theme="dark"' src/components/admin/AdminLayoutClient.tsx` retorna vazio; root div tem `data-theme="light"` como fallback (`AdminLayoutClient.tsx:208`) |
| 5 | Sonner Toaster em /app segue o tema ativo | ✓ VERIFIED | `src/app/app/layout.tsx:11` usa `<SonnerThemer surface="app" />`; `SonnerThemer.tsx:17` passa `theme={resolvedTheme}` para `<Toaster>` |
| 6 | Sonner Toaster em /admin segue o tema ativo | ✓ VERIFIED | `src/app/admin/layout.tsx:76` usa `<SonnerThemer surface="admin" />` |
| 7 | Sonner nunca recebe "system" como theme prop | ✓ VERIFIED | `SonnerThemer.tsx` passa `resolvedTheme` (tipo `"light" \| "dark"`); `useTheme.ts` resolve `"system"` via `matchMedia` antes de retornar; `grep 'theme="system"' SonnerThemer.tsx` retorna vazio |
| 8 | Preferência de tema persiste entre reloads em ambas surfaces | ✓ VERIFIED | `useTheme.ts:27-35` lê localStorage na inicialização lazy; `useTheme.ts:87-95` escreve no localStorage no `setTheme`; chaves separadas confirmadas |
| 9 | OS preference é respeitada quando não há valor no localStorage | ✓ VERIFIED | `useTheme.ts:28` default é `"system"`; `useTheme.ts:18-21` detecta via `matchMedia("(prefers-color-scheme: dark)")`; `useEffect` em `useTheme.ts:53-66` escuta mudanças do OS quando em modo system |

**Score:** 9/9 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `src/components/theme/types.ts` | Tipos e constantes de tema | ✓ VERIFIED | Exporta `Theme`, `ThemeContextType`, `MONARCA_APP_THEME_KEY`, `MONARCA_ADMIN_THEME_KEY` |
| `src/components/theme/useTheme.ts` | Hook com localStorage e OS detection | ✓ VERIFIED | 117 linhas, lazy init, cross-tab sync, matchMedia listener, `useThemeContext()` exportado para Phase 22 |
| `src/components/theme/ThemeScript.tsx` | Script anti-flash inline | ✓ VERIFIED | 47 linhas, `MutationObserver`, try/catch, self-executing IIFE |
| `src/components/theme/ThemeProvider.tsx` | Provider base | ✓ VERIFIED | 31 linhas, sincroniza `data-theme` via useEffect, expõe contexto |
| `src/components/theme/AppThemeProvider.tsx` | Provider scoped /app | ✓ VERIFIED | 17 linhas, thin wrapper com `MONARCA_APP_THEME_KEY` |
| `src/components/theme/AdminThemeProvider.tsx` | Provider scoped /admin | ✓ VERIFIED | 17 linhas, thin wrapper com `MONARCA_ADMIN_THEME_KEY` |
| `src/components/theme/SonnerThemer.tsx` | Wrapper do Toaster com tema | ✓ VERIFIED | 18 linhas, chama `useTheme(storageKey)` diretamente (fora da árvore do provider), passa `resolvedTheme` |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | --- | --- | ------ | ------- |
| `AppShell.tsx` | `AppThemeProvider` | import + wrapper | ✓ WIRED | Linha 10 (import), linhas 39–106 (wrapper) |
| `AdminLayoutClient.tsx` | `AdminThemeProvider` | import + wrapper | ✓ WIRED | Linha 11 (import), linhas 207–335 (wrapper) |
| `src/app/app/layout.tsx` | `ThemeScript` | render before AppShell | ✓ WIRED | Linha 9, antes de `<AppShell>` |
| `src/app/admin/layout.tsx` | `ThemeScript` | render before AdminLayoutClient | ✓ WIRED | Linha 72, antes de `<AdminLayoutClient>` |
| `SonnerThemer.tsx` | `useTheme` | import + chamada | ✓ WIRED | Linha 4 (import), linha 13 (chamada com storageKey) |
| `SonnerThemer.tsx` | `<Toaster>` | theme prop | ✓ WIRED | Linha 17: `theme={resolvedTheme}` |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| `SonnerThemer.tsx` | `resolvedTheme` | `useTheme(storageKey)` → `localStorage.getItem()` ou `matchMedia()` | Sim — lê do browser | ✓ FLOWING |
| `ThemeScript.tsx` | `resolved` | `localStorage.getItem(key)` ou `window.matchMedia()` | Sim — lê do browser | ✓ FLOWING |
| `ThemeProvider.tsx` | `resolvedTheme` | `useTheme(storageKey)` → mesmas fontes | Sim — mesmas fontes | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| Build passa | `npm run build` | Build completo sem erros | ✓ PASS |
| TypeScript compila | `npx tsc --noEmit` | Erros apenas em arquivos de teste pré-existentes, nenhum em `src/components/theme/` | ✓ PASS |
| Sem hardcoded dark no admin | `grep 'data-theme="dark"' src/components/admin/AdminLayoutClient.tsx` | Sem matches | ✓ PASS |
| MutationObserver presente | `grep MutationObserver src/components/theme/ThemeScript.tsx` | Match na linha 33 | ✓ PASS |
| Sonner sem "system" | `grep 'theme="system"' src/components/theme/SonnerThemer.tsx` | Sem matches | ✓ PASS |
| Sem raw Toaster nos layouts | `grep 'import.*Toaster' src/app/app/layout.tsx src/app/admin/layout.tsx` | Sem matches | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ----------- | ----------- | ------ | -------- |
| INFRA-01 | 21-01 | Providers escopados (app vs admin) | ✓ SATISFIED | `AppThemeProvider.tsx` e `AdminThemeProvider.tsx` com chaves separadas |
| INFRA-02 | 21-01 | localStorage persistence per surface | ✓ SATISFIED | `MONARCA_APP_THEME_KEY` e `MONARCA_ADMIN_THEME_KEY` em `types.ts`; `useTheme.ts` lê/escribe localStorage |
| INFRA-03 | 21-01 | OS preference como default | ✓ SATISFIED | `useTheme.ts:28` default `"system"`; `useTheme.ts:18-21` detecta via `matchMedia` |
| INFRA-04 | 21-01 | Anti-flash | ✓ SATISFIED | `ThemeScript.tsx` com script síncrono + `MutationObserver` |
| INFRA-05 | 21-02 | Sonner segue o tema | ✓ SATISFIED | `SonnerThemer.tsx` passa `resolvedTheme` ao `<Toaster>` |
| INFRA-06 | 21-02 | Sem regressões visuais | ? NEEDS HUMAN | Código verificado, mas confirmação visual do admin em dark mode necessária |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| `useTheme.ts` | 5–14 | Duplicação de tipos/constantes que já existem em `types.ts` | ⚠️ Warning | Código redundante; ambos exportam os mesmos valores. Não afeta runtime, mas aumenta manutenção |
| `ThemeProvider.tsx` | 12 | `defaultTheme?: Theme` declarado na interface mas nunca usado no corpo da função | ⚠️ Warning | Dead code; prop aceita mas ignorada. Não afeta funcionalidade |
| `useTheme.ts` | 105 | `theme` no dependency array de `setTheme` pode causar stale `oldValue` no `StorageEvent` | ⚠️ Warning | `oldValue` no evento de same-tab sync pode estar desatualizado. `newValue` está correto, então sync funciona |

### Human Verification Required

1. **Anti-flash /app**
   - **Test:** Limpar localStorage do site, deixar OS em dark mode, recarregar `/app`
   - **Expected:** Página carrega já em dark mode sem flash de fundo claro
   - **Why human:** FOCT é um fenômeno visual que só é detectável observando o carregamento

2. **Anti-flash /admin**
   - **Test:** Limpar localStorage, deixar OS em light mode, recarregar `/admin`
   - **Expected:** Página carrega em light mode sem flash
   - **Why human:** Mesmo motivo — verificação visual

3. **Persistência /app**
   - **Test:** Console → `localStorage.setItem('monarca-app-theme', 'dark')`, reload `/app`
   - **Expected:** Carrega em dark mode independente do OS
   - **Why human:** Requer reload completo para verificar persistência real

4. **Persistência /admin (independência)**
   - **Test:** Console → `localStorage.setItem('monarca-admin-theme', 'light')`, reload `/admin`
   - **Expected:** Admin carrega em light; `/app` continua no seu próprio tema
   - **Why human:** Verificar independência entre as duas chaves de localStorage

5. **Sonner theming em dark mode**
   - **Test:** Em `/app` com tema dark ativo, disparar um toast (ex: `toast.success('Test')`)
   - **Expected:** Toast aparece com fundo escuro, texto claro
   - **Why human:** Aparência visual do toast só é verificável olhando a tela

### Gaps Summary

Nenhum gap bloqueante encontrado. Toda a infraestrutura de código está implementada, wired e compilando. Os 9 must-have truths do código estão 100% verificados. A fase aguarda confirmação humana dos 5 itens visuais/behaviorais listados acima.

**Nota ao executor:** Os 3 anti-patterns marcados como Warning são de qualidade de código, não de funcionalidade. Recomenda-se limpar a duplicação entre `useTheme.ts` e `types.ts` em uma refatoração futura (ex: `useTheme.ts` importar de `types.ts` em vez de redefinir).

---

_Verified: 2026-05-16T00:25:00Z_
_Verifier: gsd-verifier_
