import { Skeleton } from "./skeleton";
import { cn } from "@/lib/utils";

interface SkeletonCardProps {
    className?: string;
}

export function SkeletonCard({ className }: SkeletonCardProps) {
    return (
        <div
            className={cn(
                "rounded-xl border bg-card p-4 flex flex-col gap-3",
                className
            )}
        >
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-8 w-full mt-2" />
        </div>
    );
}
