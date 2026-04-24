"use client";

import Link from "next/link";
import { ChevronLeft, type LucideIcon } from "lucide-react";

interface MenuHeaderProps {
  title: string;
  backHref?: string;
  rightIcon?: LucideIcon;
  onRightClick?: () => void;
}

export function MenuHeader({ title, backHref, rightIcon: RightIcon, onRightClick }: MenuHeaderProps) {
  return (
    <div className="flex items-center pt-6 pb-4 px-5 bg-app-bg sticky top-0 z-10">
      {backHref ? (
        <Link
          href={backHref}
          className="shrink-0 w-9 h-9 flex items-center justify-start"
          aria-label="Volver"
        >
          <ChevronLeft size={24} strokeWidth={1.5} className="text-app-text" />
        </Link>
      ) : (
        <div className="w-9" />
      )}

      <h1
        className="flex-1 text-center tracking-[0.5px] uppercase text-app-text font-bold text-sm leading-[18px] truncate"
        style={{ fontFamily: "var(--font-raleway)" }}
      >
        {title}
      </h1>

      {RightIcon && onRightClick ? (
        <button
          type="button"
          onClick={onRightClick}
          className="shrink-0 w-9 h-9 rounded-full bg-[#EBEBEB] flex items-center justify-center"
          aria-label="Ajustes"
        >
          <RightIcon size={18} strokeWidth={1.5} className="text-app-text" />
        </button>
      ) : (
        <div className="w-9" />
      )}
    </div>
  );
}
