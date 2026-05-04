import { PackageOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: { label: string; onClick: () => void };
    className?: string;
}

export function EmptyState({
    icon,
    title,
    description,
    action,
    className,
}: EmptyStateProps) {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center text-center px-6 py-12",
                className
            )}
        >
            <div className="mb-4 text-muted-foreground">
                {icon ?? <PackageOpen className="w-12 h-12" />}
            </div>
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            {description && (
                <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                    {description}
                </p>
            )}
            {action && (
                <button
                    onClick={action.onClick}
                    className="mt-4 px-4 py-2 rounded-full text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                >
                    {action.label}
                </button>
            )}
        </div>
    );
}
