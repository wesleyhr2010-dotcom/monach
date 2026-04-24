interface MenuSectionCardProps {
  label: string;
  children: React.ReactNode;
}

export function MenuSectionCard({ label, children }: MenuSectionCardProps) {
  return (
    <div className="flex flex-col gap-2">
      <span
        className="px-1 text-[11px] font-bold uppercase tracking-[1px] text-app-muted"
        style={{ fontFamily: "var(--font-raleway)" }}
      >
        {label}
      </span>
      <div className="rounded-2xl border border-app-card-border bg-app-card-bg overflow-hidden">
        {children}
      </div>
    </div>
  );
}
