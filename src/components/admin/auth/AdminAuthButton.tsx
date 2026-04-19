"use client";

interface AdminAuthButtonProps {
  children: React.ReactNode;
  type?: "submit" | "button" | "reset";
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "outline";
  onClick?: () => void;
  className?: string;
}

const ArrowIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="#FFFFFF"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0 }}
  >
    <path d="M3 8h10M9 4l4 4-4 4" />
  </svg>
);

const SpinnerIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
    style={{ flexShrink: 0, animation: "admin-spin 0.8s linear infinite" }}
  >
    <circle cx="9" cy="9" r="7" stroke="rgba(255,255,255,0.25)" strokeWidth="2" />
    <path d="M9 2A7 7 0 0 1 16 9" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export function AdminAuthButton({
  children,
  type = "submit",
  disabled,
  loading,
  variant = "primary",
  onClick,
}: AdminAuthButtonProps) {
  const isPrimary = variant === "primary";

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      style={{
        width: "100%",
        height: "52px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
        borderRadius: "10px",
        border: isPrimary ? "none" : "1px solid #2A3D36",
        backgroundColor: isPrimary
          ? disabled || loading
            ? "#2E5E53"
            : "#35605A"
          : "transparent",
        cursor: disabled || loading ? "not-allowed" : "pointer",
        transition: "background-color 0.15s ease, opacity 0.15s ease",
        fontFamily: "var(--font-raleway, 'Raleway', sans-serif)",
        fontSize: "15px",
        fontWeight: isPrimary ? 700 : 500,
        letterSpacing: "0.03em",
        color: isPrimary
          ? disabled || loading
            ? "rgba(255,255,255,0.5)"
            : "#FFFFFF"
          : "#6A9A8A",
        opacity: disabled && !loading ? 0.6 : 1,
      }}
      onMouseEnter={(e) => {
        if (!disabled && !loading && isPrimary) {
          e.currentTarget.style.backgroundColor = "#3D7A6A";
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !loading && isPrimary) {
          e.currentTarget.style.backgroundColor = "#35605A";
        }
      }}
    >
      {loading ? <SpinnerIcon /> : null}
      <span>{children}</span>
      {!loading && isPrimary ? <ArrowIcon /> : null}
    </button>
  );
}
