# 19-DISCUSSION-LOG.md — CSS Token Foundation

**Phase:** 19 — CSS Token Foundation
**Date:** 2026-05-15
**Mode:** discuss (interactive)

---

## Discussion Summary

### Area 1: Variant Directive Placement

**Question:** Where to put `@custom-variant dark` and how it interacts with existing `.admin-layout` dark overrides?

**Options presented:**
1. Migrate everything to `data-theme` selectors
2. Keep both approaches (custom-variant + .admin-layout block)
3. Hybrid approach

**User selection:** Migrate everything to `data-theme` (Recommended)

**Decision (D-19-01):** Replace `.admin-layout` block (globals.css lines 119-141) with `.admin-layout[data-theme="dark"]` selectors. Single mechanism, clean and consistent.

---

### Area 2: Admin Light-Mode Colors

**Question:** What should be the default in admin.css `:root` — light or dark?

**Options presented:**
1. Light as default in `:root` (Recommended)
2. Dark continues as default

**User selection:** Light as default in `:root` (Recommended)

**Decision (D-19-02):** Invert admin.css `:root` to light values (#ffffff, #f5f5f5, #e5e7eb). Dark values move to `.admin-layout[data-theme="dark"]`.

---

### Area 3: App Dark-Mode Palette

**Question:** What dark color palette to use for the app PWA?

**Options presented:**
1. Warm palette derived from brand colors (Recommended)
2. Neutral/gray dark mode
3. User has a specific palette in mind

**User selection:** "usar a palheta de cores que ja estamos usando da marca"

**Decision (D-19-03):** Derive dark values from existing brand colors (`--color-gold`, `--color-dark`, `--color-snow`, `--color-black`, `--color-white`, `--color-app-primary`). Maintain Monarca's warm visual identity.

---

### Area 4: Shadcn/UI Dual-Theme Mapping

**Question:** How to handle shadcn/ui tokens (`--color-card`, `--color-border`, etc.) for dark/light?

**Options presented:**
1. Dual-theme in globals.css (Recommended)
2. Each surface manages its own
3. Shadcn follows surface theme

**User selection:** Dual-theme in globals.css (Recommended)

**Decision (D-19-04):** Shadcn/ui tokens get dark/light variants in globals.css via `.app-shell[data-theme="dark"]` and `.admin-layout[data-theme="dark"]` selectors. Centralized in one file.

---

## Deferred Ideas

- INFRA-EXT-01: 3-state toggle (Light / System / Dark) — deferred to v1.6+
- INFRA-EXT-02: Cross-device theme sync via DB — v1.6+
- INFRA-EXT-03: Theme for public vitrina `/vitrina/[slug]` — v1.6+

---

*Discussion log: 2026-05-15*
