import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-6 pb-4">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="flex flex-col gap-2 flex-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>

      {/* Stats */}
      <section className="px-5 py-4">
        <Skeleton className="h-4 w-24 mb-3" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl bg-white p-4 flex flex-col gap-3" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              <Skeleton className="w-8 h-8" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-24" />
            </div>
          ))}
        </div>
      </section>

      {/* Maleta card */}
      <section className="px-5 py-4">
        <Skeleton className="h-4 w-36 mb-3" />
        <div className="rounded-2xl bg-white p-5 flex flex-col gap-4" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <div className="flex justify-between">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
          <Skeleton className="h-3 w-40" />
        </div>
      </section>
    </div>
  );
}
