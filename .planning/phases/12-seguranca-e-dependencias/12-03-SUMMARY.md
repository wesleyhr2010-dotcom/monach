---
plan: 12-03
phase: 12
status: complete
completed: 2026-05-07
---

# Plan 12-03 Summary: Email HTML Sanitizer (SEC-04)

## What was built

Replaced regex-based HTML sanitization with `sanitize-html` library using an explicit allowlist approach. This closes XSS vectors that regex cannot handle (encoding, nested tags, encoded attributes).

## Key files created/modified

| File | Action | Description |
|------|--------|-------------|
| `src/lib/email-sanitizer.ts` | Created | Helper with canonical allowlist (13 tags, style + href attrs) |
| `src/lib/emails.ts` | Modified | Applied `sanitizeEmailHtml()` to htmlContent before sending |
| `src/__tests__/security/email-sanitizer.test.ts` | Created | 14 unit tests documenting allowlist contract |

## Allowlist (D-01..D-04)

- **Tags (13):** p, br, strong, em, ul, ol, li, a, h1, h2, h3, span, div
- **Attributes:** `style` on all tags, `href` only on `<a>`
- **Schemes:** http, https only (blocks javascript:, data:, file:)
- **Protocol relative:** blocked (`//evil.com`)

## Self-Check: PASSED

- [x] `sanitizeEmailHtml` exported from `src/lib/email-sanitizer.ts`
- [x] `EMAIL_ALLOWED_TAGS` has 13 tags
- [x] `EMAIL_ALLOWED_ATTRS` configured correctly
- [x] `emails.ts` calls `sanitizeEmailHtml(params.htmlContent)` before sending
- [x] All 14 tests pass
- [x] TypeScript compiles without errors

## Notable decisions

- Helper is distinct from `escapeHtml()` in `email-base.ts` — they coexist for different purposes
- Allowlist is canonical for Phase 13 (admin email template editor)
- Tests serve as executable documentation of the allowlist contract
