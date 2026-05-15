# Plan 19-02 Summary

## Objective
Invert admin.css theme architecture: move current dark `--admin-*` values from `:root` to `.admin-layout[data-theme="dark"]`, and set light values as `:root` defaults per D-19-02.

## Tasks Completed

### Task 1: Move dark --admin-* values from :root to .admin-layout[data-theme="dark"]
- Changed selector from `:root` to `.admin-layout[data-theme="dark"]` for the block containing all 34+ dark `--admin-*` token declarations.
- Preserved ALL existing token declarations and values exactly as-is.
- Tokens preserved:
  - `--admin-bg: #0a0a0a`
  - `--admin-surface: #171717`
  - `--admin-surface-hover: #222222`
  - `--admin-surface-row-atrasada: #1a1010`
  - `--admin-surface-row-aguardando: #1a1a10`
  - `--admin-border: #2a2a2a`
  - `--admin-border-focus: #35605a`
  - `--admin-text: #ededed`
  - `--admin-text-muted: #888888`
  - `--admin-text-dim: #444444`
  - `--admin-accent: #35605a`
  - `--admin-accent-hover: #2a4d48`
  - `--admin-danger: #e05c5c`
  - `--admin-danger-hover: #c44545`
  - `--admin-success: #4ade80`
  - `--admin-success-10: rgba(74, 222, 128, 0.1)`
  - `--admin-success-15: rgba(74, 222, 128, 0.15)`
  - `--admin-warning: #facc15`
  - `--admin-warning-10: rgba(250, 204, 21, 0.1)`
  - `--admin-warning-15: rgba(250, 204, 21, 0.15)`
  - `--admin-danger-10: rgba(224, 92, 92, 0.1)`
  - `--admin-danger-15: rgba(224, 92, 92, 0.15)`
  - `--admin-muted-10: rgba(136, 136, 136, 0.1)`
  - `--admin-muted-15: rgba(136, 136, 136, 0.15)`
  - `--admin-info: #6677dd`
  - `--admin-info-light: #60a5fa`
  - `--admin-brown: #917961`
  - `--admin-beige: #b4aba2`
  - `--admin-purple: #8b5cf6`
  - `--admin-purple-light: #a855f7`
  - `--admin-orange: #f59e0b`
  - `--admin-green-alt: #22c55e`
  - `--admin-blue-alt: #3b82f6`
  - `--admin-emerald: #10b981`
  - `--admin-bg-success: #0f3d1c`
  - `--admin-border-success: #1a5a2a`
  - `--admin-bg-info: #1a1a2e`
  - `--admin-radius: 8px`
  - `--admin-radius-sm: 4px`
  - `--admin-radius-lg: 12px`
  - `--admin-radius-pill: 9px`
  - `--admin-sidebar-width: 240px`
  - `--admin-header-height: 80px`
- Build verified: passes.

### Task 2: Add light :root defaults for all --admin-* tokens
- Inserted new `:root` block at the top of admin.css (before `.admin-layout[data-theme="dark"]`).
- Contains light-mode defaults for all 34+ `--admin-*` tokens:
  - `--admin-bg: #ffffff`
  - `--admin-surface: #f5f5f5`
  - `--admin-surface-hover: #e5e5e5`
  - `--admin-surface-row-atrasada: #fef2f2`
  - `--admin-surface-row-aguardando: #fefce8`
  - `--admin-border: #e5e7eb`
  - `--admin-border-focus: #35605a`
  - `--admin-text: #1a1a1a`
  - `--admin-text-muted: #6b7280`
  - `--admin-text-dim: #9ca3af`
  - `--admin-accent: #35605a`
  - `--admin-accent-hover: #2a4d48`
  - `--admin-danger: #dc2626`
  - `--admin-danger-hover: #b91c1c`
  - `--admin-success: #16a34a`
  - `--admin-success-10: rgba(22, 163, 74, 0.1)`
  - `--admin-success-15: rgba(22, 163, 74, 0.15)`
  - `--admin-warning: #ca8a04`
  - `--admin-warning-10: rgba(202, 138, 4, 0.1)`
  - `--admin-warning-15: rgba(202, 138, 4, 0.15)`
  - `--admin-danger-10: rgba(220, 38, 38, 0.1)`
  - `--admin-danger-15: rgba(220, 38, 38, 0.15)`
  - `--admin-muted-10: rgba(107, 114, 128, 0.1)`
  - `--admin-muted-15: rgba(107, 114, 128, 0.15)`
  - `--admin-info: #4f6dd4`
  - `--admin-info-light: #3b82f6`
  - `--admin-brown: #917961`
  - `--admin-beige: #b4aba2`
  - `--admin-purple: #8b5cf6`
  - `--admin-purple-light: #a855f7`
  - `--admin-orange: #f59e0b`
  - `--admin-green-alt: #22c55e`
  - `--admin-blue-alt: #3b82f6`
  - `--admin-emerald: #10b981`
  - `--admin-bg-success: #dcfce7`
  - `--admin-border-success: #bbf7d0`
  - `--admin-bg-info: #eff6ff`
  - Radius, sidebar, and header dimension tokens unchanged.
- Also included alias tokens in the new `:root` block:
  - `--admin-primary: var(--admin-accent)`
  - `--admin-text-primary: var(--admin-text)`
  - `--admin-text-secondary: var(--admin-text-muted)`
  - `--admin-bg-secondary: var(--admin-surface-hover)`
  - `--admin-row-atrasada: var(--admin-surface-row-atrasada)`
  - `--admin-row-aguardando: var(--admin-surface-row-aguardando)`
- Removed duplicate alias `:root` block at end of file (lines 1018-1026 in original).
- Build verified: passes.

## Verification
- `npm run build`: PASS (no new errors)
- `npm run lint`: PASS (no new errors in modified files; pre-existing errors unchanged)
- `grep -c ':root {' src/app/admin/admin.css`: 1 (single :root block)
- `grep -c '\-\-admin-bg: #ffffff' src/app/admin/admin.css`: 1 (light default present)
- `grep -c '\-\-admin-bg: #0a0a0a' src/app/admin/admin.css`: 1 (dark value under .admin-layout[data-theme="dark"])
- `grep -c '.admin-layout\[data-theme="dark"\]' src/app/admin/admin.css`: 1

## Files Modified
- `src/app/admin/admin.css`

## Commit
- 19-02-task-1: refactor: move dark --admin-* values from :root to .admin-layout[data-theme="dark"] [Phase 19]
- 19-02-task-2: feat: add light :root defaults for all --admin-* tokens [Phase 19]

## Decisions
- D-19-02: Light values (`#ffffff`, `#f5f5f5`, `#e5e7eb`) are the `:root` defaults. Dark values stay in `.admin-layout[data-theme="dark"]`.
- D-19-02a: Alias tokens merged into the single `:root` block to eliminate duplicate `:root` declarations.

## Notes
- No visual change in production: admin stays dark because `data-theme="dark"` is hardcoded on `.admin-layout` in `AdminLayoutClient.tsx` (Plan 01).
- Phase 21 ThemeProvider will replace the hardcoded `data-theme="dark"` with dynamic theme switching.
- Admin-specific tokens (`--admin-*`) are handled in admin.css; shadcn/ui tokens for admin are handled in globals.css (Plan 01 Task 3).
