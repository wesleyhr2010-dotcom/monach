"use client";

import { useState } from "react";

interface PasswordFieldProps {
    id: string;
    name?: string;
    label: string;
    placeholder?: string;
    autoComplete?: string;
    required?: boolean;
    disabled?: boolean;
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    className?: string;
}

export function PasswordField({
    id,
    name,
    label,
    placeholder,
    autoComplete,
    required,
    disabled,
    value,
    onChange,
    className = "",
}: PasswordFieldProps) {
    const [show, setShow] = useState(false);

    return (
        <div className={`flex flex-col gap-2 ${className}`}>
            <label className="font-medium text-[14px] text-[#1A1A1A]" htmlFor={id}>
                {label}
            </label>
            <div className="relative">
                <input
                    id={id}
                    name={name ?? id}
                    type={show ? "text" : "password"}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    required={required}
                    disabled={disabled}
                    className="w-full bg-[#EBEBEB] border border-[#D9D6D2] text-[#1A1A1A] placeholder:text-[#AAAAAA] px-5 py-4 rounded-2xl text-[14px] focus:outline-none focus:ring-2 focus:ring-[#35605A]/30 transition-all disabled:opacity-60 pr-12"
                />
                <button
                    type="button"
                    onClick={() => setShow(!show)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#777777] hover:text-[#35605A] transition-colors"
                    title={show ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                    {show ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                            <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                            <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                            <line x1="2" y1="2" x2="22" y2="22" />
                        </svg>
                    ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                            <circle cx="12" cy="12" r="3" />
                        </svg>
                    )}
                </button>
            </div>
        </div>
    );
}
