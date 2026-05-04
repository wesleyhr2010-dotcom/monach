import { SkeletonCard } from "@/components/ui/skeleton-card";

export default function AnalyticsLoading() {
    return (
        <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 24 }}>
            {/* KPI cards row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px" }}>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
            </div>

            {/* Charts row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
                <SkeletonCard />
                <SkeletonCard />
            </div>

            {/* Tables row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
                <SkeletonCard />
                <SkeletonCard />
            </div>

            {/* Products card */}
            <SkeletonCard />
        </div>
    );
}
