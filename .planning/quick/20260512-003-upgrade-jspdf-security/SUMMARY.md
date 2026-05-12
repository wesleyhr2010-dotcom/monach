---
slug: upgrade-jspdf-security
date: 2026-05-12
status: complete
commit: b5041fb
---

# Summary: Upgrade jspdf 4.2.0 → 4.2.1

## O que foi feito

- `package.json`: `"jspdf": "^4.2.0"` → `"^4.2.1"`
- `npm install` executado — `package-lock.json` atualizado para `jspdf@4.2.1`

## CVEs corrigidos

| CVE | Tipo | CVSS Snyk v4 | Fix |
|-----|------|-------------|-----|
| CVE-2026-31938 | XSS em opções `pdfObjectUrl`, `pdfJsUrl`, `filename` | 5.6 Medium | jspdf@4.2.1 |
| CVE-2026-31898 | Improper Output Encoding em `createAnnotation()` | 5.3 Medium | jspdf@4.2.1 |

## Commit

`b5041fb` — `fix: upgrade jspdf to 4.2.1 to patch CVE-2026-31938 and CVE-2026-31898`
