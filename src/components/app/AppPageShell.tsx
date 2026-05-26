"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
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
    <div className="flex items-center pt-6 pb-4 gap-4 bg-app-bg px-5 sticky top-0 z-10">
      {backHref && (
        <TransitionLink href={backHref} pattern={backPattern} className="shrink-0 text-app-text">
          <ChevronLeft size={24} stroke="currentColor" strokeWidth={1.5} />
        </TransitionLink>
      )}
      <div className="flex flex-col grow min-w-0">
        <span
          className="tracking-[0.5px] uppercase text-app-text font-bold text-sm leading-[18px] m-0 truncate"
          style={{ fontFamily: "var(--font-raleway)" }}
        >
          {title}
        </span>
        {subtitle && (
          <span
            className="mt-0.5 text-app-text-secondary font-medium text-xs leading-4"
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
      className="text-app-text text-lg leading-[22px]"
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
    <div className="flex items-center justify-between mb-5 rounded-2xl bg-app-surface p-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center rounded-full bg-app-border-strong shrink-0 w-10 h-10">
          {icon}
        </div>
        <div className="flex flex-col">
          <span
            className="text-app-text-secondary font-semibold text-[13px] leading-4"
            style={{ fontFamily: "var(--font-raleway)" }}
          >
            {label}
          </span>
          <span
            className="text-app-text text-xl leading-6"
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
    <div className="flex justify-between items-center rounded-xl bg-app-primary p-4">
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
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/80">
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
  const variantClasses = {
    warning: "bg-app-warning-bg text-app-accent-brown",
    info: "bg-app-surface text-app-primary",
    success: "bg-app-accent-green-bg text-app-accent-green",
  };

  return (
    <div
      className={`flex rounded-xl gap-3 p-4 ${variantClasses[variant]}`}
    >
      <div className="shrink-0">{icon}</div>
      <span
        className="text-[13px] leading-[150%] font-medium"
        style={{ fontFamily: "var(--font-raleway)" }}
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
          style={{ fontFamily: "var(--font-raleway)", color: valueColor ?? "var(--color-app-text)" }}
        >
          {label}
        </span>
      </div>
      <span
        className="pl-[22px] text-lg leading-[22px]"
        style={{ fontFamily: "var(--font-playfair)", fontWeight: 600, color: valueColor ?? "var(--color-app-text)" }}
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
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const panel = (
    <div className="fixed bottom-0 left-0 right-0 md:left-[260px] flex rounded-t-[20px] pt-4 pb-5 bg-app-card-bg shadow-[0_-4px_16px_rgba(0,0,0,0.12)] px-5 z-[110]">
      {children}
    </div>
  );

  if (!mounted) return null;

  const target = document.getElementById("bottom-action-portal");
  return target ? createPortal(panel, target) : panel;
}
