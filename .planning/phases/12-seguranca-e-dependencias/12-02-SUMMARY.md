---
plan: 12-02
phase: 12
status: complete
completed: 2026-05-07
---

# Plan 12-02 Summary: Dependency Security Updates (SEC-02, SEC-03)

## What was built

Updated 4 packages to close known CVEs:

| Package | Before | After | CVEs Closed |
|---------|--------|-------|-------------|
| next | 16.1.6 | 16.2.5 | 6 (HTTP smuggling, CSRF, WebSocket origin, DoS) |
| eslint-config-next | 16.1.6 | 16.2.5 | peer dependency alignment |
| @serwist/next | 9.5.6 | 9.5.11 | brace-expansion CVSS 8.7 (via glob@13→minimatch→brace-expansion@5) |
| serwist | 9.5.6 | 9.5.11 | same as above (dev dependency) |

## Key files modified

| File | Action | Description |
|------|--------|-------------|
| `package.json` | Modified | Updated 4 dependency versions |
| `package-lock.json` | Modified | Lockfile regenerated with new versions |

## Self-Check: PASSED

- [x] `npm ls next` → 16.2.5
- [x] `npm ls @serwist/next` → 9.5.11
- [x] `npm ls serwist` → 9.5.11
- [x] `npm run build` completes without errors
- [x] Next.js core CVEs closed (6 CVEs in 16.2.5)
- [x] Serwist tree uses brace-expansion@5.0.5 (fixed version)

## Notes

- `brace-expansion@1.1.12` still exists via `eslint → minimatch@3` (dev-only, not production risk)
- `next` audit flag is about `postcss` transitive dependency, not a Next.js framework CVE
- No breaking changes encountered — update was clean
