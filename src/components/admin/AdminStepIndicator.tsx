"use client";

import { cn } from "@/lib/utils";
import { CheckCircle } from "lucide-react";

type Step = { label: string };

type AdminStepIndicatorProps = {
  steps: Step[];
  currentStep: number;
  className?: string;
};

export function AdminStepIndicator({ steps, currentStep, className }: AdminStepIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-2 overflow-x-auto pb-2", className)}>
      {steps.map((step, idx) => (
        <div key={idx} className="flex items-center gap-2 shrink-0">
          <div
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
              idx === currentStep && "bg-[var(--admin-accent)] text-[#0f0f0f]",
              idx < currentStep && "bg-emerald-500/15 text-emerald-400",
              idx > currentStep && "bg-[var(--admin-surface)] text-[var(--admin-text-muted)]"
            )}
          >
            {idx < currentStep ? (
              <CheckCircle className="w-3 h-3" />
            ) : (
              <span className="w-4 h-4 rounded-full border text-[10px] flex items-center justify-center" style={{ borderColor: idx === currentStep ? "transparent" : "var(--admin-border)" }}>
                {idx + 1}
              </span>
            )}
            {step.label}
          </div>
          {idx < steps.length - 1 && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--admin-text-muted)" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
          )}
        </div>
      ))}
    </div>
  );
}