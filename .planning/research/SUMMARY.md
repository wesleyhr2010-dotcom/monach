# Research Summary — NEXT-MONARCA v1.5 Dark Mode & Temas

**Synthesized from:** STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md
**Date:** 2026-05-15
**Confidence:** HIGH

---

## Executive Summary

Adiciona dark/light/system theme support a dois surfaces independentes: PWA (`/app`, hoje light-only) e admin (`/admin`, hoje dark-only). Os surfaces compartilham um `<html>` mas exigem preferências independentes, localStorage keys separadas e token sets separados. O risco dominante não é arquitetura — são valores hex hardcoded espalhados em `AppShell.tsx` e todas as páginas `/app/*` que vão quebrar silenciosamente no dark mode se não forem migrados para tokens CSS antes. A migração de tokens é a maior parte do esforço.

---

## Stack Additions

**Zero novos pacotes npm.** `next-themes` é REJEITADO — ambos os route groups compartilham um `<html>`, dois ThemeProvider instances targeting `<html>` conflitam. Solução: React Context customizado com `data-theme` no shell div de cada surface.

**Uma linha CSS a adicionar em `globals.css` logo após `@import "tailwindcss"`:**

```css
@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));
```

Isso faz todas as utilities `dark:` do Tailwind v4 responderem ao atributo `data-theme="dark"` em qualquer ancestral, em vez da media query do OS.

---

## Key Architecture Decision

Dois providers escopados, `data-theme` nos shell divs — sem estado compartilhado, sem envolvimento do `<html>`.

```
AppShell outer div [data-theme="dark"|absent]      ← monarca-app-theme (localStorage)
  └─ AppThemeProvider (Client Component, React Context)
       └─ <script> anti-flash (1º filho do div, síncrono)

div.admin-layout [data-theme="light"|absent]       ← monarca-admin-theme (localStorage)
  └─ AdminThemeProvider (Client Component, React Context)
       └─ <script> anti-flash (1º filho do div, lógica INVERTIDA)
```

**Anti-flash:** Script síncrono como primeiro filho do shell div, usa `document.currentScript.parentElement`. Roda antes de qualquer paint CSS. **suppressHydrationWarning** obrigatório em ambos os shell divs.

**Seletores CSS de override:**
```css
.app-shell[data-theme="dark"]   { --color-app-bg: #1C1C1C; /* ... */ }
.admin-layout[data-theme="light"] { --admin-bg: #F0F0F0; /* ... */ }
```

**Atenção ao `@theme inline`:** Tokens declarados em `@theme inline` compilam estáticos no Tailwind v4 — dark overrides devem estar em blocos CSS regulares fora do `@theme`, não dentro dele. Validar ao início da implementação.

---

## Token Work Required

**PWA (`/app`) — Esforço ALTO:**

1. Definir valores dark para todos `--color-app-*` em `.app-shell[data-theme="dark"]`
2. Auditar e migrar hex hardcoded — locais confirmados:
   - `AppShell.tsx`: `bg-[#F5F2EF]`, `text-[#1A1A1A]`, `border-[#E8E2D6]` — 6+ ocorrências
   - `src/app/layout.tsx`: `<body style={{ backgroundColor: "#F5F2EF" }}>` — **bloqueia todos os tokens; deve ser removido**
   - `/app/perfil/page.tsx` e demais pages: ~8 hex por página

Grep antes de começar: `bg-\[#`, `text-\[#`, `border-\[#`, `style={{`

**Admin (`/admin`) — Esforço MÉDIO:**

Admin já usa `var(--admin-*)` nos componentes — sem migração de componentes. Trabalho é limitado a:
1. Definir `.admin-layout[data-theme="light"]` com valores light para todos `--admin-*` tokens
2. Corrigir ~5 hardcoded em `admin.css` (`#141414` em thead, etc.)

---

## Feature Design

**Toggle de 3 estados: Claro / Sistema / Oscuro** — padrão da indústria. Toggle binário omite "Sistema" e força o usuário a reajustar manualmente ao mudar o OS.

**API de contexto (ambos os providers):**
```tsx
type ThemePreference = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';
interface ThemeContextValue {
  theme: ResolvedTheme;
  preference: ThemePreference;
  setPreference: (t: ThemePreference) => void;
}
```

**Posicionamento do toggle:**
- `/app/perfil` → row "Apariencia" com ícone `Palette`, segmented pill 3 opções
- `/admin/minha-conta` → card "APARIENCIA" com ícone `Monitor`, mesmo controle

**Sonner `<Toaster>` — mudança necessária:** mover para dentro de cada ThemeProvider Client Component e passar `theme={resolvedTheme}`. Sem isso, toasts seguem OS independente da preferência localStorage.

---

## Watch Out For

| Pitfall | Prevenção |
|---------|-----------|
| `<body style={{ backgroundColor: "#F5F2EF" }}>` anula tokens CSS | Remover na Phase 20 — é o primeiro bloqueador |
| `@theme inline` compila estático — override `[data-theme]` não muda nada | Validar no DevTools ao início da Phase 19 |
| Sonner segue OS, não localStorage | Mover `<Toaster>` para dentro do ThemeProvider client wrapper |
| Dois `ThemeProvider` do `next-themes` conflitam no `<html>` | Não instalar `next-themes` — usar Context customizado |
| Anti-flash no `<head>` não funciona (elemento ainda não existe) | Script como primeiro filho do shell div via `currentScript.parentElement` |

---

## Suggested Phase Order

| Phase | Nome | Esforço | Entregável |
|-------|------|---------|-----------|
| 19 | CSS Token Foundation | Baixo | Tokens dark/light no CSS; sem mudança visual; build passa |
| 20 | Hardcoded Color Migration /app | Alto | PWA testável em dark mode via DevTools |
| 21 | ThemeProvider Infrastructure | Médio | Anti-flash funcional, providers wired, Sonner corrigido |
| 22 | Toggle UI + QA | Baixo | Toggle visível em /app/perfil e /admin/minha-conta |

---

*Research completed: 2026-05-15*
*Ready for roadmap: yes*
