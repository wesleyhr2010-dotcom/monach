import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton alinhado 1:1 com AppDashboardPage:
 * - AppHeader: avatar (48px round) + nome + pts + rank badge + bell
 * - SectionHeader "Análisis" + 4 StatCards (grid 2×2, bg #EBEBEB)
 * - SectionHeader "Mis Consignaciones" + MaletaCard (bg #EBEBEB)
 */
export default function DashboardLoading() {
  return (
    <div className="flex flex-col">
      {/* ── AppHeader ── */}
      <header className="flex items-center gap-3 px-5 pt-6 pb-4 sticky top-0 z-10 bg-[#F5F2EF]">
        {/* Avatar */}
        <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
        {/* Name + Pontos */}
        <div className="flex flex-col flex-1 min-w-0 gap-1">
          <Skeleton className="h-[16px] w-28" />
          <Skeleton className="h-[12px] w-16" />
        </div>
        {/* Rank badge */}
        <Skeleton className="h-[28px] w-[72px] rounded-full flex-shrink-0" />
        {/* Bell */}
        <Skeleton className="w-10 h-10 rounded-full -mr-2 flex-shrink-0" />
      </header>

      {/* ── Section: Análisis ── */}
      <section className="px-5 py-4">
        {/* SectionHeader */}
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-[20px] w-[80px]" />
          <Skeleton className="h-[13px] w-[52px]" />
        </div>
        {/* 4 StatCards — grid 2×2 */}
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex-1 bg-[#EBEBEB] rounded-2xl flex flex-col items-center py-5 px-5 min-w-0"
            >
              <Skeleton className="w-8 h-8" />
              <Skeleton className="h-[13px] w-[56px] mt-3" />
              <Skeleton className="h-[20px] w-[80px] mt-1" />
            </div>
          ))}
        </div>
      </section>

      {/* ── Section: Mis Consignaciones ── */}
      <section className="px-5 py-4">
        {/* SectionHeader */}
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-[20px] w-[160px]" />
          <Skeleton className="h-[13px] w-[52px]" />
        </div>
        {/* MaletaCard */}
        <div className="bg-[#EBEBEB] rounded-2xl px-5 py-5">
          <div className="flex items-center justify-between mb-1">
            <Skeleton className="h-[18px] w-[150px]" />
            <Skeleton className="h-[28px] w-[80px] rounded-full" />
          </div>
          <Skeleton className="h-[13px] w-[100px] mt-2" />
          {/* Commission tiers placeholder */}
          <div className="flex justify-between mt-4 gap-1">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[6px] flex-1 rounded-full" />
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[10px] w-[40px]" />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
