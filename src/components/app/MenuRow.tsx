"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface MenuRowProps {
  icon: React.ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: "default" | "accent-green";
  external?: boolean;
  dot?: boolean;
}

export function MenuRow({
  icon,
  label,
  href,
  onClick,
  variant = "default",
  external = false,
  dot = false,
}: MenuRowProps) {
  const isAccent = variant === "accent-green";

  const content = (
    <>
      <div
        className={`flex items-center justify-center w-[34px] h-[34px] rounded-[10px] shrink-0 ${
          isAccent ? "bg-app-accent-green-bg" : "bg-app-icon-bg"
        }`}
      >
        {icon}
      </div>
      <span
        className={`flex-1 text-sm leading-[18px] ${
          isAccent
            ? "font-bold text-app-accent-green"
            : "font-semibold text-app-text"
        }`}
        style={{ fontFamily: "var(--font-raleway)" }}
      >
        {label}
      </span>
      {dot && (
        <span
          className="w-2 h-2 rounded-full bg-app-danger shrink-0 mr-1"
          aria-hidden="true"
        />
      )}
      <ChevronRight
        size={16}
        strokeWidth={1.5}
        className="text-app-muted shrink-0"
      />
    </>
  );

  const className =
    "flex items-center gap-[14px] px-4 h-16 border-b border-app-divider last:border-b-0 cursor-pointer active:opacity-80 transition-opacity";

  if (href && !onClick) {
    if (external) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={className}
          aria-label={`${label}, abre en nueva pestaña`}
        >
          {content}
        </a>
      );
    }
    return (
      <Link href={href} className={className} aria-label={label}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className} aria-label={label}>
      {content}
    </button>
  );
}
