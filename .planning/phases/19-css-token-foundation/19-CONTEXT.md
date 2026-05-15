# 19-CONTEXT.md — CSS Token Foundation

**Phase:** 19 — CSS Token Foundation
**Milestone:** v1.5 Dark Mode & Temas
**Date:** 2026-05-15

---

## Domain

CSS tokens `--color-app-*` e `--admin-*` com variantes dark/light declaradas no CSS. `@custom-variant dark` configurado. Sem mudança visual — build e lint continuam passando.

## Requirements (from REQUIREMENTS.md)

- **TKN-01**: `@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *))` configurado em `globals.css`
- **TKN-02**: Todos os tokens `--color-app-*` têm variantes dark definidas sob `.app-shell[data-theme="dark"]` em `globals.css`
- **TKN-03**: Todos os tokens `--admin-*` têm variantes light definidas sob `.admin-layout[data-theme="light"]` em `admin.css`

## Canonical Refs

- `docs/design-system/tokens.md` — Token spec (documentação de referência)
- `src/app/globals.css` — CSS global com `@theme inline` e tokens app/shadcn
- `src/app/admin/admin.css` — CSS do admin com tokens `--admin-*`
- `.planning/REQUIREMENTS.md` — Requirements TKN-01, TKN-02, TKN-03
- `.planning/ROADMAP.md` — Phase 19 goal e success criteria

## Decisions

### Theme Architecture

- **D-19-01**: Migrar tudo para seletores `data-theme`. O bloco `.admin-layout` atual (globals.css linhas 119-141) será substituído por `.admin-layout[data-theme="dark"]`. Um único mecanismo — sem coexistência de abordagens.
- **D-19-02**: Light-mode como default no `:root` do admin.css. Tokens `--admin-*` atuais (dark: #0a0a0a, #171717, etc.) serão movidos para `.admin-layout[data-theme="dark"]`. Valores light (#ffffff, #f5f5f5, #e5e7eb) entram no `:root`.
- **D-19-03**: Paleta dark do app PWA deriva das cores de marca existentes (`--color-gold`, `--color-dark`, `--color-snow`, `--color-black`, `--color-white`, `--color-app-primary`). Não usar cinza neutro genérico — manter identidade visual Monarca (tons quentes).
- **D-19-04**: Tokens shadcn/ui (`--color-card`, `--color-border`, etc.) terão variantes dark/light no globals.css via seletores `.app-shell[data-theme="dark"]` e `.admin-layout[data-theme="dark"]`. Centralizado em um arquivo.

### Code Context

**Reusáveis existentes:**
- `@theme inline` em globals.css já define tokens light para app e shadcn — base para derivar dark
- `admin.css` já tem estrutura de tokens `--admin-*` — apenas inverter default (dark→light) e adicionar dark variant
- Design system tokens documentados em `docs/design-system/tokens.md`

**Integrações a considerar:**
- Admin já usa tokens `--admin-*` em ~50+ classes CSS (sidebar, cards, tables, buttons, forms)
- App usa tokens `--color-app-*` em componentes React via Tailwind classes
- Shadcn/ui components (dialogs, selects, popovers) usam tokens `--color-*` do `@theme inline`

## Prior Decisions (Carried Forward)

- **D-15-xx** (Phase 15): Admin UI já usa tokens CSS em vez de hex hardcoded — base para esta fase
- **D-07-01**: Template engine híbrida para emails — não afeta esta fase

## Deferred Ideas

- **INFRA-EXT-01**: Toggle com 3 estados (Claro / Sistema / Oscuro) — deferred a pedido do usuário; binário preferido para v1.5
- **INFRA-EXT-02**: Sincronização de preferência de tema entre dispositivos via DB — v1.6+
- **INFRA-EXT-03**: Tema para vitrina pública `/vitrina/[slug]` — v1.6+

---

*Context captured: 2026-05-15*
