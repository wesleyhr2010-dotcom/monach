"use client";

import { ChevronLeft } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { TransitionLink } from "./transitions/TransitionLink";
import type { VtPattern } from "./transitions/viewTransition";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  badgeDetail?: string;
  backHref?: string;
  backPattern?: VtPattern;
}

export function AppPageHeader({
  title,
  subtitle,
  badge,
  badgeDetail,
  backHref,
  backPattern = "pop",
}: PageHeaderProps) {
  return (
    <div className="flex items-center pt-6 pb-4 gap-4 bg-[#F5F2EF] px-5 sticky top-0 z-10">
      {backHref && (
        <TransitionLink href={backHref} pattern={backPattern} className="shrink-0">
          <ChevronLeft size={24} stroke="#1A1A1A" strokeWidth={1.5} />
        </TransitionLink>
      )}
      <div className="flex flex-col grow min-w-0">
        <span
          className="tracking-[0.5px] uppercase text-[#1A1A1A] font-bold text-sm leading-[18px] m-0 truncate"
          style={{ fontFamily: "var(--font-raleway)" }}
        >
          {title}
        </span>
        {subtitle && (
          <span
            className="mt-0.5 text-[#777777] font-medium text-xs leading-4"
            style={{ fontFamily: "var(--font-raleway)" }}
          >
            {subtitle}
          </span>
        )}
      </div>
      {badge && <StatusBadge status={badge} detail={badgeDetail} />}
    </div>
  );
}

interface SectionTitleProps {
  children: React.ReactNode;
}

export function SectionTitle({ children }: SectionTitleProps) {
  return (
    <span
      className="text-[#1A1A1A] text-lg leading-[22px]"
      style={{ fontFamily: "var(--font-playfair)", fontWeight: 600 }}
    >
      {children}
    </span>
  );
}

interface SummaryCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

export function SummaryCard({ icon, label, value }: SummaryCardProps) {
  return (
    <div className="flex items-center justify-between mb-5 rounded-2xl bg-[#EBEBEB] p-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center rounded-full bg-[#D9D6D2] shrink-0 w-10 h-10">
          {icon}
        </div>
        <div className="flex flex-col">
          <span
            className="text-[#777777] font-semibold text-[13px] leading-4"
            style={{ fontFamily: "var(--font-raleway)" }}
          >
            {label}
          </span>
          <span
            className="text-[#1A1A1A] text-xl leading-6"
            style={{ fontFamily: "var(--font-playfair)", fontWeight: 600 }}
          >
            {value}
          </span>
        </div>
      </div>
    </div>
  );
}

interface CommissionCardProps {
  percent: string;
  label: string;
  value: string;
}

export function CommissionCard({ percent, label, value }: CommissionCardProps) {
  return (
    <div className="flex justify-between items-center rounded-xl bg-[#35605A] p-4">
      <div className="flex flex-col">
        <span
          className="text-white/80 font-medium text-[13px] leading-4"
          style={{ fontFamily: "var(--font-raleway)" }}
        >
          {label} ({percent})
        </span>
        <span
          className="text-white text-xl leading-6"
          style={{ fontFamily: "var(--font-playfair)", fontWeight: 600 }}
        >
          {value}
        </span>
      </div>
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.8 }}>
        <path d="M12 2v20" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    </div>
  );
}

interface AlertBannerProps {
  icon: React.ReactNode;
  children: React.ReactNode;
  variant?: "warning" | "info" | "success";
}

export function AlertBanner({ icon, children, variant = "warning" }: AlertBannerProps) {
  const colors = {
    warning: { bg: "#FFF4E5", text: "#B26A00", border: "transparent" },
    info: { bg: "#E8F2FD", text: "#1E40AF", border: "transparent" },
    success: { bg: "#E2F2E9", text: "#1F7A4A", border: "transparent" },
  };
  const c = colors[variant];

  return (
    <div
      className="flex rounded-xl gap-3 p-4"
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      <div className="shrink-0">{icon}</div>
      <span
        className="text-[13px] leading-[150%] font-medium"
        style={{ fontFamily: "var(--font-raleway)", color: c.text }}
      >
        {children}
      </span>
    </div>
  );
}

interface SummaryRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueColor?: string;
}

export function SummaryRow({ icon, label, value, valueColor }: SummaryRowProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5">
        {icon}
        <span
          className="font-semibold text-sm leading-[18px]"
          style={{ fontFamily: "var(--font-raleway)", color: valueColor ?? "#1A1A1A" }}
        >
          {label}
        </span>
      </div>
      <span
        className="pl-[22px] text-lg leading-[22px]"
        style={{ fontFamily: "var(--font-playfair)", fontWeight: 600, color: valueColor ?? "#1A1A1A" }}
      >
        {value}
      </span>
    </div>
  );
}

interface BottomActionProps {
  children: React.ReactNode;
}

export function BottomAction({ children }: BottomActionProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 flex rounded-t-[20px] pt-4 pb-5 bg-white border-b border-[#EBEBEB] shadow-[0_-4px_16px_rgba(0,0,0,0.06)] px-5 z-20">
      {children}
    </div>
  );
}
