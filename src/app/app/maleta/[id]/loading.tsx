import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton alinhado 1:1 com MaletaDetailClient:
 * - Header: voltar, título (Detalles + Vencimiento), StatusBadge
 * - Content: SummaryCard (Total Vendido), botão Registrar Venta, Artículos header, lista de itens
 * - BottomAction: Devolver Consignación
 */
export default function MaletaDetailLoading() {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#F5F2EF] relative">
      {/* ── Header ── */}
      <div className="flex items-center pt-6 pb-4 gap-4 bg-[#F5F2EF] px-5 sticky top-0 z-10">
        <Skeleton className="w-6 h-6 flex-shrink-0" />
        <div className="flex flex-col grow min-w-0 gap-1">
          <Skeleton className="h-[18px] w-[160px]" />
          <Skeleton className="h-[14px] w-[120px]" />
        </div>
        <Skeleton className="h-[28px] w-[72px] rounded-full flex-shrink-0" />
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex flex-col pb-[200px] px-5 gap-5">
        {/* Total Vendido summary card */}
        <div className="flex items-center justify-between rounded-2xl bg-[#EBEBEB] p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
            <div className="flex flex-col gap-1">
              <Skeleton className="h-[16px] w-[90px]" />
              <Skeleton className="h-[24px] w-[120px]" />
            </div>
          </div>
        </div>

        {/* Registrar Venta button */}
        <Skeleton className="h-[52px] w-full rounded-[100px]" />

        {/* Artículos header */}
        <div className="flex justify-between items-center">
          <Skeleton className="h-[22px] w-[100px]" />
        </div>

        {/* Items list */}
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center rounded-2xl gap-4 bg-[#EBEBEB] p-3">
              <Skeleton className="w-16 h-16 rounded-xl flex-shrink-0" />
              <div className="flex flex-col grow min-w-0 gap-1.5 mt-1">
                <Skeleton className="h-[18px] w-[140px]" />
                <Skeleton className="h-[14px] w-[100px]" />
                <Skeleton className="h-[14px] w-[50px] rounded-[100px] mt-1" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom Action ── */}
      <div className="fixed bottom-0 left-0 right-0 flex rounded-t-[20px] pt-4 pb-5 bg-white shadow-[0_-4px_16px_rgba(0,0,0,0.06)] px-5 z-20">
         <Skeleton className="h-[48px] w-full rounded-2xl" />
      </div>
    </div>
  );
}
