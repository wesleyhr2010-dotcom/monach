---
plan: 12-05
phase: 12
status: complete
completed: 2026-05-07
---

# Plan 12-05 Summary: Accepted Risk Documentation (SEC-06)

## What was built

Investigated jspdf@4.2.1 and documented accepted risks for both xlsx and jspdf in `SPEC_SECURITY_API_ENDPOINTS.md`.

## Findings

| Package | Version | CVEs Fixed? | Decision |
|---------|---------|-------------|----------|
| xlsx | 0.18.5 | N/A (no upstream fix) | ACEITO |
| jspdf | 4.2.1 | No — CVEs still present | ACEITO |

## Key files modified

| File | Action | Description |
|------|--------|-------------|
| `docs/sistema/SPEC_SECURITY_API_ENDPOINTS.md` | Modified | Added "Riscos Aceitos" section with full documentation |

## Self-Check: PASSED

- [x] jspdf investigated at 4.2.1 — CVEs still present in npm audit
- [x] xlsx documented with write-only usage profile and mitigations
- [x] jspdf documented with CVE IDs and write-only usage profile
- [x] Both entries include: decision, usage profile, mitigations, review schedule
- [x] Section references SEC-01 auth protection as additional mitigation

## npm audit summary (Phase 12 final)

- **next**: 16.2.5 — core CVEs closed (flag is about transitive postcss, not framework)
- **@serwist/next**: 9.5.11 — brace-expansion tree updated to 5.0.5 (fixed)
- **sanitize-html**: installed — replaces regex sanitization
- **xlsx**: CVEs accepted (write-only, auth-protected)
- **jspdf**: CVEs accepted (write-only, auth-protected)
- **eslint → brace-expansion@1.1.12**: dev-only, not production risk
