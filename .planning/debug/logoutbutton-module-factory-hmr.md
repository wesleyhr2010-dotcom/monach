---
slug: logoutbutton-module-factory-hmr
status: resolved
trigger: "ao clicar em mas no menu aparece erro em /app"
created: 2026-05-05
updated: 2026-05-05
---

## Symptoms

- **Expected:** Navegar para /app/mas sem erros
- **Actual:** Runtime Error no browser — module factory not available após HMR update
- **Error message:** "Module [project]/Documents/next-monarca/src/lib/actions/data:ddec00 [app-client] (ecmascript) was instantiated because it was required from module [project]/Documents/next-monarca/src/components/app/LogoutButton.tsx [app-client] (ecmascript), but the module factory is not available. It might have been deleted in an HMR update."
- **Timeline:** Não sabe quando começou
- **Reproduction:** 100% reproduzível ao clicar em "mas" no menu em /app

## Call Stack

1. module evaluation — src/components/app/LogoutButton.tsx (5:1)
2. MaisPage — src/app/app/mas/page.tsx (104:9)

## Key Observation

LogoutButton.tsx linha 5: `import { logoutApp } from "@/lib/actions/auth";`
O módulo interno `data:ddec00` é referenciado pela action, mas factory não está disponível no cliente (Turbopack/HMR issue).

## Current Focus

hypothesis: "Client Component importando Server Action diretamente causa Turbopack/HMR module factory error"
test: "typecheck passa sem erros nos arquivos de produção"
expecting: "erro desaparece ao carregar /app/mas"
next_action: "RESOLVED — fix aplicado"

## Evidence

- timestamp: 2026-05-05T00:00:00Z
  file: src/components/app/LogoutButton.tsx
  finding: "use client" component importing logoutApp directly from @/lib/actions/auth ("use server")
  significance: Turbopack cria módulo sintético data:ddec00 para Server Actions cruzando a boundary; em HMR o factory desse módulo sintético pode ser purgado e a referência no cliente fica stale

- timestamp: 2026-05-05T00:00:00Z
  file: src/components/app/AppShell.tsx
  finding: mesmo padrão — "use client" importando logoutApp diretamente
  significance: mesmo risco de HMR factory error no sidebar desktop

## Eliminated

- Bug de rota ou auth — não é; o erro ocorre antes de qualquer lógica de negócio
- Versão do Next.js — confirmado comportamento do Turbopack com Server Actions em Client Components

## Resolution

root_cause: "Client Components (LogoutButton.tsx, AppShell.tsx) importavam Server Action (logoutApp) diretamente, violando a boundary Client→Server. Turbopack cria um módulo proxy sintético (data:ddec00) para essa crossing; em HMR o factory desse proxy é purgado mas a referência no bundle do cliente persiste, causando o erro 'module factory is not available'."
fix: "Removido import direto de logoutApp dos Client Components. A ação é agora recebida como prop logoutAction: () => Promise<void> injetada pelo Server Component pai (AppLayout para AppShell, MaisPage para LogoutButton). Imports de logoutApp ficam exclusivamente em Server Components (layout.tsx, mas/page.tsx, perfil/page.tsx)."
verification: "npx tsc --noEmit sem erros nos arquivos de produção. Padrão já usado corretamente em perfil/page.tsx (Server Component) validado."
files_changed:
  - src/components/app/LogoutButton.tsx
  - src/components/app/AppShell.tsx
  - src/app/app/layout.tsx
  - src/app/app/mas/page.tsx
