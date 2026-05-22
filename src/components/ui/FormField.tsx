"use client";

interface FormFieldProps {
    id: string;
    name?: string;
    label: string;
    type?: string;
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    disabled?: boolean;
    autoComplete?: string;
    inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
    required?: boolean;
    className?: string;
}

export function FormField({
    id,
    name,
    label,
    type = "text",
    value,
    onChange,
    placeholder,
    disabled,
    autoComplete,
    inputMode,
    required,
    className = "",
}: FormFieldProps) {
    return (
        <div className={`flex flex-col gap-2 ${className}`}>
            <label className="font-medium text-[14px] text-app-text" htmlFor={id}>
                {label}
            </label>
            <input
                id={id}
                name={name ?? id}
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                disabled={disabled}
                autoComplete={autoComplete}
                inputMode={inputMode}
                required={required}
                className="bg-app-surface border border-app-border-strong text-app-text placeholder:text-app-muted px-5 py-4 rounded-2xl text-[14px] focus:outline-none focus:ring-2 focus:ring-app-primary/30 transition-all disabled:opacity-60"
            />
        </div>
    );
}
