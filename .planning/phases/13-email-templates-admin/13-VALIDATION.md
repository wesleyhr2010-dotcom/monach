# Phase 13 Validation Strategy: Email Templates Admin

## Overview
This phase implements a database-driven override system for transactional emails. Validation focuses on ensuring the safety of user-provided HTML, the correctness of variable interpolation, and the reliability of the fallback mechanism.

## Verification Tiers

### 1. Unit Testing (Fallback & Logic)
- **File**: `src/lib/email-logic.test.ts` (to be created if needed, or included in integration)
- **Scope**: 
  - `getEmailContent` returns `null` when no DB record exists.
  - `getEmailContent` correctly interpolates variables for both HTML and Plain Text.
  - `getEmailContent` generates auto-plain-text if `body_text` is missing (D-11).
  - Sanitizer correctly allows `<table>` tags but strips `<script>` or `onclick`.

### 2. Integration Testing (Override Flow)
- **File**: `tests/integration/email-override.test.ts`
- **Scope**:
  - Full loop: Create DB record -> Call template function -> Verify mocked `sendEmail` received the DB content.
  - Deactivation: Toggle `ativo: false` -> Call template function -> Verify mocked `sendEmail` received the TypeScript fallback content.
  - Deletion: Delete DB record -> Call template function -> Verify fallback.
  - **Strict Error Handling (D-16)**: Mock a corrupt template (e.g., malformed variable braces) and verify the system logs the error and aborts sending.

### 3. Security Validation (Sanitization)
- **Action**: Manual and automated checks of `sanitizeEmailHtml`.
- **Scope**:
  - Verify that complex HTML layouts (tables, nested divs) are preserved.
  - Verify that potentially dangerous tags/attributes are removed even when stored in the DB.

### 4. UAT (Admin UI)
- **Action**: Human verification via the browser.
- **Scope**:
  - List view shows correct status badges ("Estándar (Código)" vs "Personalizado (BD)").
  - Template Editor correctly inserts variables via chips.
  - "Restablecer a estándar" successfully deletes the DB record and updates the UI.
  - Plain Text body can be edited and saved independently.

## Success Criteria
- [ ] 100% of integration tests in `tests/integration/email-override.test.ts` pass.
- [ ] No "broken" emails (missing variables or raw HTML) are sent when an override is present.
- [ ] The system never fails to send an email if the DB is unreachable (falls back to TS in dev/prod as per logic).
