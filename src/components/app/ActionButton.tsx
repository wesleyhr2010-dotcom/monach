"use client";

interface ActionButtonProps {
  label: string;
  variant?: "primary" | "outline";
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  type?: "submit" | "button";
  className?: string;
}

export function ActionButton({
  label,
  variant = "primary",
  icon,
  onClick,
  disabled,
  loading = false,
  type = "button",
  className = "",
}: ActionButtonProps) {
  const isPrimary = variant === "primary";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled ?? loading}
      className={`flex items-center justify-center rounded-[100px] py-4 gap-2 h-[52px] text-sm font-bold tracking-[0.5px] uppercase transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed ${
        isPrimary
          ? "bg-app-primary text-white shadow-[0_4px_12px_rgba(53,96,90,0.2)] hover:bg-app-primary"
          : "border-2 border-solid border-app-border-strong text-app-text-secondary hover:bg-app-surface"
      } ${className}`}
      style={{ fontFamily: "var(--font-raleway)" }}
    >
      {loading ? (
        <svg className="animate-spin shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      ) : icon ? (
        icon
      ) : null}
      {loading ? label : label}
    </button>
  );
}

interface SuccessButtonProps {
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export function SuccessButton({ label, icon, onClick, disabled, className = "" }: SuccessButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center justify-center rounded-[100px] py-4 gap-2 h-[52px] bg-app-accent-green text-white font-bold text-sm tracking-[0.5px] uppercase shadow-[0_4px_12px_rgba(31,122,74,0.2)] hover:bg-app-accent-green transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed ${className}`}
      style={{ fontFamily: "var(--font-raleway)" }}
    >
      {icon}
      {label}
    </button>
  );
}