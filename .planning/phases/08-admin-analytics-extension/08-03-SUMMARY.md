# Plan 08-03 Summary — Dashboard Integration: Vitrina Section Wiring

**Phase:** 08-admin-analytics-extension  
**Plan:** 03  
**Wave:** 3  
**Status:** Complete  
**Executed:** 2026-05-06

---

## What Was Built

Integrated the vitrina analytics section into the existing `/admin/analytics` dashboard page.

### page.tsx Changes
1. **Imports:** Added all 5 vitrina server actions and 4 UI components
2. **Search params:** Extended type to include `reseller?: string`
3. **Reseller param:** Read from URL, passed as `selectedResellerId` to scoped actions
4. **Parallel data fetching:** Extended `Promise.all` to fetch vitrinaKPIs, vitrinaSeries, vitrinaRanking, resellersList, and csvData alongside existing operational metrics
5. **Reseller selector:** Native `<select>` with auto-submit on change, positioned next to period filter
6. **Period links:** Preserve `reseller` param when switching periods
7. **Vitrina section markup:** Added below operational section with:
   - Section heading "Vitrina Pública" + CSV export button
   - KPI cards grid (5 metrics)
   - Chart + Ranking side-by-side grid

### VitrinaCsvDownload.tsx (new)
- Client component that receives CSV string and filename as props
- Creates a Blob and triggers browser download on click
- Styled to match admin dark theme

---

## Key Decisions Applied

- **D-01 (mesma página):** Vitrina section renders below operational metrics on `/admin/analytics`
- **D-02 (filtro único):** Single period filter controls both operational and vitrina metrics
- **D-03..D-07 (seletor + RBAC):** Reseller selector filters KPIs and chart; ranking always shows full scope
- **D-13..D-15 (CSV sem PII):** Download button uses `exportVitrinaAnalyticsCSV` which exports only slug

---

## Self-Check

- [x] `/admin/analytics` renders both operational and vitrina sections
- [x] Reseller selector filters KPIs and chart (ranking unaffected per D-07)
- [x] Period filter affects both operational and vitrina metrics
- [x] CSV export downloads a file with correct columns and no PII
- [x] Empty states display when no vitrina data exists

---

## Files Changed

- `src/app/admin/analytics/page.tsx` (+142 lines, -16 lines)
  - Added imports, params, data fetching, reseller selector, vitrina section
- `src/app/admin/analytics/VitrinaCsvDownload.tsx` (new, 31 lines)
  - Client component for CSV download

## Key Links

- Upstream: Plan 08-01 provides server actions (`getVitrinaKPIs`, etc.)
- Upstream: Plan 08-02 provides UI components (`AnalyticsVitrinaKpiCards`, etc.)
