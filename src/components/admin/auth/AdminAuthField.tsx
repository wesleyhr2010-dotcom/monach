"use client";

import { useState } from "react";

const FIELD_STYLES = {
  label: {
    fontFamily: "var(--font-raleway, 'Raleway', sans-serif)",
    fontSize: "11px",
    fontWeight: 600,
    letterSpacing: "0.5px",
    textTransform: "uppercase" as const,
    color: "#999999",
    display: "block",
    marginBottom: "7px",
  },
  inputWrapper: {
    position: "relative" as const,
    display: "flex",
    alignItems: "center",
  },
  input: {
    width: "100%",
    height: "48px",
    display: "flex",
    alignItems: "center",
    borderRadius: "8px",
    paddingLeft: "44px",
    paddingRight: "16px",
    backgroundColor: "#1A1A1A",
    border: "1px solid #2A2A2A",
    color: "#EDEDED",
    fontFamily: "var(--font-raleway, 'Raleway', sans-serif)",
    fontSize: "14px",
    outline: "none",
    transition: "border-color 0.15s ease",
  },
  iconWrapper: {
    position: "absolute" as const,
    left: "16px",
    top: "50%",
    transform: "translateY(-50%)",
    opacity: 0.4,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none" as const,
  },
  toggleWrapper: {
    position: "absolute" as const,
    right: "16px",
    top: "50%",
    transform: "translateY(-50%)",
    opacity: 0.4,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    background: "none",
    border: "none",
    padding: 0,
    color: "#EDEDED",
  },
} as const;

const EmailIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="#EDEDED" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <rect x="1" y="3" width="14" height="10" rx="2" />
    <path d="M1 5l7 5 7-5" />
  </svg>
);

const LockIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="#EDEDED" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <rect x="2" y="7" width="12" height="8" rx="2" />
    <path d="M5 7V5a3 3 0 016 0v2" />
  </svg>
);

const EyeIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5Z" />
    <circle cx="8" cy="8" r="2" />
  </svg>
);

const EyeOffIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <path d="M14.12 14.12L1.88 1.88M6.94 6.94a2 2 0 002.12 2.12M9.88 9.88C9.17 10.59 8.11 11 7 11c-4 0-6-3-6-3a11.34 11.34 0 012.56-2.94M5.17 5.17A10.85 10.85 0 017 5c4 0 6 3 6 3a11.34 11.34 0 01-1.88 2.22" />
  </svg>
);

interface AdminAuthFieldProps {
  id: string;
  name?: string;
  label: string;
  type?: "text" | "email" | "password";
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  autoComplete?: string;
  defaultValue?: string;
}

export function AdminAuthField({
  id,
  name,
  label,
  type = "text",
  placeholder,
  disabled,
  required,
  autoComplete,
  defaultValue,
}: AdminAuthFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div>
      <label htmlFor={id} style={FIELD_STYLES.label}>
        {label}
      </label>
      <div style={FIELD_STYLES.inputWrapper}>
        <input
          id={id}
          name={name ?? id}
          type={inputType}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          autoComplete={autoComplete}
          defaultValue={defaultValue}
          style={{
            ...FIELD_STYLES.input,
            paddingRight: isPassword ? "44px" : "16px",
            opacity: disabled ? 0.5 : 1,
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "#35605A"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "#2A2A2A"; }}
        />
        <span style={FIELD_STYLES.iconWrapper}>
          {isPassword ? <LockIcon /> : <EmailIcon />}
        </span>
        {isPassword && (
          <button
            type="button"
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            onClick={() => setShowPassword((v) => !v)}
            style={FIELD_STYLES.toggleWrapper}
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}
      </div>
    </div>
  );
}
