export default function DashboardLoading() {
  return (
    <div className="flex flex-col">
      {/* Header skeleton */}
      <div className="flex items-center gap-3 px-5 pt-6 pb-4">
        <div className="w-12 h-12 rounded-full bg-[#E8E2D6] animate-pulse" />
        <div className="flex flex-col gap-2 flex-1">
          <div className="h-4 w-32 rounded bg-[#E8E2D6] animate-pulse" />
          <div className="h-3 w-20 rounded bg-[#E8E2D6] animate-pulse" />
        </div>
      </div>

      {/* Stats skeleton */}
      <section className="px-5 py-4">
        <div className="h-4 w-24 rounded bg-[#E8E2D6] animate-pulse mb-3" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl bg-white p-4 flex flex-col gap-3" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              <div className="w-8 h-8 rounded bg-[#E8E2D6] animate-pulse" />
              <div className="h-3 w-16 rounded bg-[#E8E2D6] animate-pulse" />
              <div className="h-5 w-24 rounded bg-[#E8E2D6] animate-pulse" />
            </div>
          ))}
        </div>
      </section>

      {/* Maleta card skeleton */}
      <section className="px-5 py-4">
        <div className="h-4 w-36 rounded bg-[#E8E2D6] animate-pulse mb-3" />
        <div className="rounded-2xl bg-white p-5 flex flex-col gap-4" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <div className="flex justify-between">
            <div className="h-5 w-32 rounded bg-[#E8E2D6] animate-pulse" />
            <div className="h-5 w-16 rounded-full bg-[#E8E2D6] animate-pulse" />
          </div>
          <div className="h-2 w-full rounded-full bg-[#E8E2D6] animate-pulse" />
          <div className="h-3 w-40 rounded bg-[#E8E2D6] animate-pulse" />
        </div>
      </section>
    </div>
  );
}
