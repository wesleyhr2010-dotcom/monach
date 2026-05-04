import { AlertTriangle, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
    title?: string;
    description?: string;
    onRetry?: () => void;
    className?: string;
}

export function ErrorState({
    title = "Algo salió mal",
    description = "No pudimos cargar los datos. Intentá de nuevo.",
    onRetry,
    className,
}: ErrorStateProps) {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center text-center px-6 py-12",
                className
            )}
        >
            <div className="mb-4 text-destructive">
                <AlertTriangle className="w-12 h-12" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                {description}
            </p>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                >
                    <RotateCcw className="w-4 h-4" />
                    Intentar de nuevo
                </button>
            )}
        </div>
    );
}
