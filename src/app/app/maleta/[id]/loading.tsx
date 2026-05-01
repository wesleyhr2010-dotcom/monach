export default function MaletaDetailLoading() {
  return (
    <div className="flex flex-col min-h-full bg-[#F5F2EF]">
      {/* Header skeleton */}
      <div className="flex items-center gap-4 pt-6 pb-4 px-5">
        <div className="w-6 h-6 rounded bg-[#E8E2D6] animate-pulse" />
        <div className="h-4 w-32 rounded bg-[#E8E2D6] animate-pulse" />
      </div>

      {/* Status card skeleton */}
      <div className="mx-5 rounded-2xl bg-white p-5 flex flex-col gap-4" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
        <div className="flex justify-between items-center">
          <div className="h-5 w-36 rounded bg-[#E8E2D6] animate-pulse" />
          <div className="h-6 w-20 rounded-full bg-[#E8E2D6] animate-pulse" />
        </div>
        <div className="h-3 w-48 rounded bg-[#E8E2D6] animate-pulse" />
        <div className="h-2 w-full rounded-full bg-[#E8E2D6] animate-pulse" />
      </div>

      {/* Items skeleton */}
      <div className="flex flex-col gap-3 px-5 mt-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex gap-3 rounded-xl bg-white p-3" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <div className="w-16 h-16 rounded-lg bg-[#E8E2D6] animate-pulse flex-shrink-0" />
            <div className="flex flex-col gap-2 flex-1">
              <div className="h-3 w-3/4 rounded bg-[#E8E2D6] animate-pulse" />
              <div className="h-3 w-1/2 rounded bg-[#E8E2D6] animate-pulse" />
              <div className="h-3 w-1/3 rounded bg-[#E8E2D6] animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
