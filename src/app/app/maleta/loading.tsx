import { Skeleton } from "@/components/ui/skeleton";

export default function MaletaLoading() {
  return (
    <div className="flex flex-col min-h-full bg-[#F5F2EF]">
      {/* Header */}
      <div className="flex items-center gap-4 pt-6 pb-4 px-5">
        <Skeleton className="w-6 h-6" />
        <Skeleton className="h-4 w-40" />
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-3 px-5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl bg-white p-4 flex flex-col gap-3"
            style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
          >
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
