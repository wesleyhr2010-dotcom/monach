import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton alinhado 1:1 com MaletaPage:
 * - Header: seta voltar + "MIS CONSIGNACIONES"
 * - 3 MaletaListItemCards (bg #EBEBEB, border, título + badge + data + valor)
 */
export default function MaletaLoading() {
  return (
    <div className="flex flex-col min-h-full bg-[#F5F2EF]">
      {/* ── Header ── */}
      <div className="flex flex-col pt-6 pb-4 bg-[#F5F2EF] px-5">
        <div className="flex justify-between items-center">
          <Skeleton className="w-6 h-6 flex-shrink-0" />
          <Skeleton className="h-[14px] w-[160px] flex-1 ml-4" />
        </div>
      </div>

      {/* ── MaletaListItemCards ── */}
      <div className="flex flex-col pb-[140px] gap-3 px-5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex flex-col rounded-2xl gap-3 bg-[#EBEBEB] p-4 border-2 border-solid"
            style={{ borderColor: i === 1 ? "#35605A" : "transparent" }}
          >
            {/* Row 1: título + badge */}
            <div className="flex justify-between items-center">
              <Skeleton className="h-[18px] w-[160px]" />
              <Skeleton className="h-[28px] w-[80px] rounded-full" />
            </div>
            {/* Row 2: data + valor */}
            <div className="flex justify-between items-center">
              <Skeleton className="h-[13px] w-[110px]" />
              <Skeleton className="h-[13px] w-[90px]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
