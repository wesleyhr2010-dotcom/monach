# Plan 05-02 — Security & RBAC Validation

**Objective:** Validate security posture for notification payloads (XSS prevention) and RBAC scope enforcement. Verify DOMPurify sanitization in email paths, enforce plain-text-only for OneSignal push, and confirm RLS policies match the live database state.

**Completed:** 2026-05-05

---

## What Was Built

1. **Push plain-text enforcement** — Updated `src/lib/notifications.ts` (`enviarPushSePermitido`) to strip HTML tags via `htmlToPlainText` before sending to OneSignal. Added a warning log when HTML is detected in push payloads.

2. **XSS validation tests** — Created `src/__tests__/security/xss-payload-validation.test.ts` with 12 tests covering:
   - `htmlToPlainText` strips tags (`<script>`, `<b>`, `<br>`, `<p>`)
   - `sanitizeTemplateVars` (DOMPurify) removes scripts and event handlers
   - `sanitizeTemplateVars` preserves allowed formatting tags (`<b>`, `<i>`, `<a>`)
   - `substituirVariaveis` whitelist prevents unexpected key injection
   - `enviarPushSePermitido` automatically strips HTML before calling OneSignal

3. **RBAC scope verification tests** — Created `src/__tests__/security/rbac-scope-verification.test.ts` with 8 tests covering:
   - `getResellerScope` returns correct scope for ADMIN (empty), COLABORADORA (`colaboradora_id`), REVENDEDORA (`id`)
   - `assertIsInGroup` returns `ActionResult<void>` (success/error)
   - RLS policy source file validation (10+ policies, covers `resellers` and `maletas`)

4. **RLS drift check** — Verified `scripts/rls-policies.sql` contains 10+ `CREATE POLICY` statements and covers core tables.

---

## Files Changed

| File | Change |
|------|--------|
| `src/lib/notifications.ts` | `enviarPushSePermitido` now strips HTML with `htmlToPlainText` before OneSignal push; warns if HTML detected |
| `src/__tests__/security/xss-payload-validation.test.ts` | New — 12 XSS/push validation tests |
| `src/__tests__/security/rbac-scope-verification.test.ts` | New — 8 RBAC scope and RLS verification tests |

---

## Verification

- [x] XSS tests pass (12/12)
- [x] RBAC scope verification tests pass (8/8)
- [x] Admin actions use `assertIsInGroup` or `getResellerScope` (10 occurrences across 4 files)
- [x] RLS source file validated (10+ `CREATE POLICY` statements)

---

## Deviations

- Direct database comparison for RLS drift was skipped because the test environment does not have live DB access. The verification validates the source-of-truth SQL file instead.
- Email path DOMPurify validation is covered by existing `notifications-server.ts` tests; no new test was needed since `sanitizeTemplateVars` is already exercised.

---

## Key Decisions

- **htmlToPlainText for push** — OneSignal push notifications should never contain HTML. Stripping at the sender level (`enviarPushSePermitido`) is the safest single point of enforcement.
- **Warning log for HTML detection** — Alerts operators if a template accidentally contains HTML, enabling proactive fixes without breaking the push delivery.
