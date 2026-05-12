---
slug: patch-fast-xml-builder
date: 2026-05-12
status: complete
commit: a4322bf
---

# Summary: Patch fast-xml-builder via npm overrides

## O que foi feito

- `package.json`: adicionado bloco `"overrides": { "fast-xml-builder": "^1.1.7" }`
- `npm install` executado — lock file resolveu `fast-xml-builder@1.2.0`

## CVEs corrigidos

| CVE | Tipo | CVSS Snyk v4 | Fix |
|-----|------|-------------|-----|
| CVE-2026-44665 | XXE injection via atributos sem sanitização | 6.1 Medium | fast-xml-builder@1.1.7 |
| CVE-2026-44664 | XML Injection via comentários (bypass de sanitização) | 5.3 Medium | fast-xml-builder@1.1.6 |

## Abordagem

Snyk marcou "no supported fix" via upgrade direto do `@aws-sdk/client-s3`.
O caminho da vulnerabilidade é:
`@aws-sdk/client-s3 → @aws-sdk/xml-builder → fast-xml-parser@5.5.8 → fast-xml-builder@1.1.5`

`npm overrides` força `fast-xml-builder@^1.1.7` globalmente, resolvendo para `1.2.0`.

## Commit

`a4322bf` — `fix: override fast-xml-builder to ^1.1.7 to patch CVE-2026-44665 and CVE-2026-44664`
