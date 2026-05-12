import type { ReactNode } from "react";

interface AdminSectionCardProps {
  title: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  noPadContent?: boolean;
}

export function AdminSectionCard({ title, icon, action, children, noPadContent = false }: AdminSectionCardProps) {
  return (
    <div style={{
      background: "var(--admin-surface)",
      border: "1px solid var(--admin-surface-hover)",
      borderRadius: 12,
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "20px 22px",
        ...(noPadContent && { borderBottom: "1px solid var(--admin-border)" }),
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {icon}
          <span style={{
            color: "var(--admin-text-muted)",
            fontFamily: "Raleway, sans-serif",
            fontWeight: 600,
            fontSize: 13,
          }}>
            {title}
          </span>
        </div>
        {action}
      </div>
      {noPadContent ? (
        <div style={{ overflowX: "auto" }}>{children}</div>
      ) : (
        <div style={{ padding: "0 22px 20px" }}>{children}</div>
      )}
    </div>
  );
}
