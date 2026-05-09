import Link from "next/link";
import type { ReactNode } from "react";

interface AdminTopHeaderProps {
  breadcrumb?: string;
  /** Quando informado, o breadcrumb vira um link de volta */
  backHref?: string;
  title: string;
  action?: ReactNode;
}

export function AdminTopHeader({ breadcrumb, backHref, title, action }: AdminTopHeaderProps) {
  return (
    <div className="admin-top-header">
      <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {breadcrumb && (
          backHref ? (
            <Link href={backHref} style={{
              color: "var(--admin-text-muted)",
              fontFamily: "Raleway, sans-serif",
              fontSize: 10,
              letterSpacing: 1,
              textTransform: "uppercase",
              textDecoration: "none",
            }}>
              ← {breadcrumb}
            </Link>
          ) : (
            <span style={{
              color: "var(--admin-text-dim)",
              fontFamily: "Raleway, sans-serif",
              fontSize: 10,
              letterSpacing: 1,
              textTransform: "uppercase",
            }}>
              {breadcrumb}
            </span>
          )
        )}
        <span style={{
          color: "var(--admin-text)",
          fontFamily: "'Playfair Display', serif",
          fontSize: 20,
          lineHeight: "24px",
          fontWeight: 600,
        }}>
          {title}
        </span>
      </div>
      {action && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          {action}
        </div>
      )}
    </div>
  );
}
