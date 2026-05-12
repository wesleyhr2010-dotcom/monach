---
slug: patch-fast-xml-builder
date: 2026-05-12
status: in-progress
---

# Quick Task: Patch fast-xml-builder via npm overrides

Corrige CVE-2026-44665 (XXE, CVSS 6.1) e CVE-2026-44664 (XML Injection, CVSS 5.3)
em `fast-xml-builder@1.1.5`, dependência transitiva de `@aws-sdk/client-s3`.

Caminho: `@aws-sdk/client-s3 → @aws-sdk/xml-builder → fast-xml-parser → fast-xml-builder`

Como não há upgrade direto disponível, usa `npm overrides` para forçar `fast-xml-builder@^1.1.7`.
