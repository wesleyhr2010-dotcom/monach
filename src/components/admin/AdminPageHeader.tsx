"use client";

import Link from "next/link";

type AdminPageHeaderProps = {
  title: string;
  description?: string;
  breadcrumb?: string;
  backHref?: string;
  action?: React.ReactNode;
};

export function AdminPageHeader({ title, description, breadcrumb, backHref, action }: AdminPageHeaderProps) {
  return (
    <div className="admin-page-header">
      <div>
        {breadcrumb && (
          <div
            className="tracking-[1px] uppercase text-[10px] mb-0.5"
            style={{ color: "var(--admin-text-dim)", fontFamily: "Raleway, system-ui, sans-serif" }}
          >
            {backHref ? (
              <Link href={backHref} style={{ color: "var(--admin-text-muted)" }}>
                {breadcrumb}
              </Link>
            ) : (
              breadcrumb
            )}
          </div>
        )}
        <h1
          className="admin-page-title"
          style={{ fontFamily: "'Playfair Display', system-ui, sans-serif" }}
        >
          {title}
        </h1>
        {description && (
          <p className="text-sm mt-1" style={{ color: "var(--admin-text-muted)" }}>{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}