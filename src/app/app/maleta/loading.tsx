export default function MaletaLoading() {
  return (
    <div className="flex flex-col min-h-full bg-[#F5F2EF]">
      {/* Header skeleton */}
      <div className="flex flex-col pt-6 pb-4 px-5">
        <div className="flex items-center gap-4">
          <div className="w-6 h-6 rounded bg-[#E8E2D6] animate-pulse" />
          <div className="h-4 w-40 rounded bg-[#E8E2D6] animate-pulse" />
        </div>
      </div>

      {/* Cards skeleton */}
      <div className="flex flex-col gap-3 px-5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl bg-white p-4 flex flex-col gap-3"
            style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
          >
            <div className="flex justify-between items-center">
              <div className="h-4 w-28 rounded bg-[#E8E2D6] animate-pulse" />
              <div className="h-5 w-16 rounded-full bg-[#E8E2D6] animate-pulse" />
            </div>
            <div className="flex justify-between">
              <div className="h-3 w-24 rounded bg-[#E8E2D6] animate-pulse" />
              <div className="h-3 w-20 rounded bg-[#E8E2D6] animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
