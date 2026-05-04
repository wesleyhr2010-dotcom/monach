import { SkeletonCard } from "@/components/ui/skeleton-card";

export default function AdminLoading() {
    return (
        <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 20 }}>
            {/* KPI Row */}
            <div style={{ display: "flex", gap: 16 }}>
                <div style={{ flex: 1 }}>
                    <SkeletonCard />
                </div>
                <div style={{ flex: 1 }}>
                    <SkeletonCard />
                </div>
                <div style={{ flex: 1 }}>
                    <SkeletonCard />
                </div>
                <div style={{ flex: 1 }}>
                    <SkeletonCard />
                </div>
                <div style={{ flex: 1 }}>
                    <SkeletonCard />
                </div>
            </div>

            {/* Middle Row: Alertas + Ranking */}
            <div style={{ display: "flex", gap: 16 }}>
                <div style={{ flex: "1.2 1 0" }}>
                    <SkeletonCard />
                </div>
                <div style={{ flex: "1 1 0" }}>
                    <SkeletonCard />
                </div>
            </div>

            {/* Docs Card */}
            <SkeletonCard />
        </div>
    );
}
