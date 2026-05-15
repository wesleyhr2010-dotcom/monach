# Requirements: NEXT-MONARCA v1.5

**Defined:** 2026-05-15
**Core Value:** Revendedoras conseguem receber, registrar vendas e devolver maletas com comprovante — e receber a comissão calculada automaticamente.

## v1 Requirements

### INFRA — Infraestrutura de Tema

- [ ] **INFRA-01**: Na ausência de preferência salva, `/app` aplica o tema de acordo com `prefers-color-scheme` do sistema operacional do dispositivo
- [ ] **INFRA-02**: Na ausência de preferência salva, `/admin` aplica o tema de acordo com `prefers-color-scheme` do sistema operacional
- [ ] **INFRA-03**: Preferência de tema do `/app` persiste em `localStorage` (chave `monarca-app-theme`) entre sessões e reloads
- [ ] **INFRA-04**: Preferência de tema do `/admin` persiste em `localStorage` (chave `monarca-admin-theme`) — independente da preferência do `/app`
- [ ] **INFRA-05**: Sem flash de tema incorreto ao carregar `/app` — anti-FOCT via inline script síncrono como primeiro filho do AppShell div
- [ ] **INFRA-06**: Sem flash de tema incorreto ao carregar `/admin` — anti-FOCT via inline script síncrono como primeiro filho do admin-layout div

### TKN — CSS Tokens

- [ ] **TKN-01**: `@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *))` configurado em `globals.css` — utilities Tailwind v4 `dark:` respondem ao atributo `data-theme`, não à media query do OS
- [ ] **TKN-02**: Todos os tokens `--color-app-*` têm variantes dark definidas sob `.app-shell[data-theme="dark"]` em `globals.css`
- [ ] **TKN-03**: Todos os tokens `--admin-*` têm variantes light definidas sob `.admin-layout[data-theme="light"]` em `admin.css`

### APM — Migração de Tokens /app

- [ ] **APM-01**: `AppShell.tsx` não contém valores hex hardcoded — todos substituídos por tokens `--color-app-*`
- [ ] **APM-02**: `src/app/layout.tsx` — `<body style={{ backgroundColor: "..." }}>` removido; cor controlada exclusivamente por CSS variable
- [ ] **APM-03**: Todas as páginas e componentes de `/app/*` auditados e valores hex hardcoded substituídos por tokens `--color-app-*`

### TOG — Toggle UI

- [ ] **TOG-01**: Revendedora pode alternar entre dark e light mode em `/app/perfil` (seção "Apariencia") com toggle sun/moon binário
- [ ] **TOG-02**: Admin/Colaboradora pode alternar entre dark e light mode em `/admin/minha-conta` (seção "Apariencia") com toggle sun/moon binário
- [ ] **TOG-03**: `<Toaster>` Sonner em ambos os layouts recebe `theme={resolvedTheme}` e segue preferência localStorage — não `prefers-color-scheme` do OS

## v2 Requirements (deferred)

### Experiência Avançada (deferred to v1.6+)

- **INFRA-EXT-01**: Opção "Sistema" explícita no toggle (3 estados: Claro / Sistema / Oscuro) — atualmente deferred a pedido do usuário; binário preferido para v1.5
- **INFRA-EXT-02**: Sincronização de preferência de tema entre dispositivos via banco de dados (per-user, não per-device)
- **INFRA-EXT-03**: Tema para vitrina pública `/vitrina/[slug]`

## Out of Scope

| Feature | Motivo |
|---------|--------|
| `next-themes` package | Incompatível com a arquitetura: dois route groups compartilham `<html>`, dois ThemeProvider instances conflitam |
| Sincronização entre dispositivos | localStorage é por dispositivo; DB sync é out-of-scope para v1.5 |
| Tema na vitrina pública `/vitrina/[slug]` | Vitrina é pública/ISR; tema requer client state — deferred |
| Emissão de factura paraguaia | v1.5+ (base no banco desde v1.4) |
| Migração PWA → Capacitor | v1.5+ |
| Modo offline PWA | v1.5+ |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| TKN-01 | Phase 19 | Pending |
| TKN-02 | Phase 19 | Pending |
| TKN-03 | Phase 19 | Pending |
| APM-01 | Phase 20 | Pending |
| APM-02 | Phase 20 | Pending |
| APM-03 | Phase 20 | Pending |
| INFRA-01 | Phase 21 | Pending |
| INFRA-02 | Phase 21 | Pending |
| INFRA-03 | Phase 21 | Pending |
| INFRA-04 | Phase 21 | Pending |
| INFRA-05 | Phase 21 | Pending |
| INFRA-06 | Phase 21 | Pending |
| TOG-01 | Phase 22 | Pending |
| TOG-02 | Phase 22 | Pending |
| TOG-03 | Phase 22 | Pending |

**Coverage:**
- v1 requirements: 15 total
- Mapped to phases: 15
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-15*
