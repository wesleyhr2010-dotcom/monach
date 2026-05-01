import { Skeleton } from "@/components/ui/skeleton";

export default function MaletaDetailLoading() {
  return (
    <div className="flex flex-col min-h-full bg-[#F5F2EF]">
      {/* Header */}
      <div className="flex items-center gap-4 pt-6 pb-4 px-5">
        <Skeleton className="w-6 h-6" />
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Status card */}
      <div className="mx-5 rounded-2xl bg-white p-5 flex flex-col gap-4" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
        <div className="flex justify-between items-center">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="h-3 w-48" />
        <Skeleton className="h-2 w-full rounded-full" />
      </div>

      {/* Items */}
      <div className="flex flex-col gap-3 px-5 mt-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex gap-3 rounded-xl bg-white p-3" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <Skeleton className="w-16 h-16 rounded-lg flex-shrink-0" />
            <div className="flex flex-col gap-2 flex-1">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
