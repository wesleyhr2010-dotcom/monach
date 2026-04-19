interface PrimaryButtonProps {
    label: string;
    loadingLabel?: string;
    loading?: boolean;
    disabled?: boolean;
    type?: "submit" | "button" | "reset";
    onClick?: () => void;
    className?: string;
}

export function PrimaryButton({
    label,
    loadingLabel,
    loading = false,
    disabled,
    type = "submit",
    onClick,
    className = "",
}: PrimaryButtonProps) {
    return (
        <button
            type={type}
            disabled={disabled ?? loading}
            onClick={onClick}
            className={`mt-5 flex justify-center items-center py-4 rounded-full bg-[#35605A] text-white font-semibold text-base shadow-sm hover:bg-[#2b4c47] hover:shadow-md transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed ${className}`}
        >
            {loading ? (
                <>
                    <svg className="animate-spin mr-2 shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    {loadingLabel ?? label}
                </>
            ) : label}
        </button>
    );
}
