---
slug: upgrade-jspdf-security
date: 2026-05-12
status: in-progress
---

# Quick Task: Upgrade jspdf para 4.2.1 (patch de segurança)

Upgrade `jspdf@4.2.0` → `4.2.1` para corrigir 2 CVEs reportados pelo Snyk:

- **CVE-2026-31938** (XSS, CVSS 5.6) — valores controlados pelo usuário nas opções `pdfObjectUrl`, `pdfJsUrl`, `filename` incluídos sem sanitização no HTML gerado
- **CVE-2026-31898** (Improper Output Encoding, CVSS 5.3) — parâmetro `color` do `createAnnotation()` injetável com objetos script

## Steps

1. [ ] Atualizar `jspdf` para `^4.2.1` no `package.json`
2. [ ] Rodar `npm install` para atualizar o lock file
3. [ ] Verificar que o lock file aponta para `4.2.1`
4. [ ] Commitar com `fix: upgrade jspdf to 4.2.1 — patch CVE-2026-31938 and CVE-2026-31898`
5. [ ] Atualizar STATE.md com entrada na tabela Quick Tasks
