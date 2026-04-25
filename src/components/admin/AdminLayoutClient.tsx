"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { QueryProvider } from "@/lib/query-provider";
import { logout } from "@/lib/actions/auth";
import { BottomNav } from "@/components/admin/BottomNav";
import { BrindesBadge } from "@/components/admin/BrindesBadge";
import { AdminAlertBell } from "@/components/admin/AdminAlertBell";
import type { Role } from "@/lib/user";
import {
    AlignJustify,
    ArrowLeft,
    Bell,
    Briefcase,
    CircleDollarSign,
    Gift,
    Grid2x2,
    LayoutDashboard,
    LineChart,
    LogOut,
    Star,
    User,
    Users,
} from "lucide-react";
import "@/app/admin/admin.css";

type NavItem = {
    type?: never;
    href: string;
    label: string;
    icon: React.ReactNode;
    exact?: boolean;
    badge?: { text: string; variant: "count" | "role" };
    customBadge?: React.ReactNode;
    roles?: Role[];
};

type NavSection = {
    type: "section";
    label: string;
    roles?: Role[];
};

const allNavEntries: (NavItem | NavSection)[] = [
    {
        href: "/admin",
        label: "Dashboard",
        icon: <LayoutDashboard size={16} strokeWidth={1.5} />,
        exact: true,
        roles: ["ADMIN", "COLABORADORA"],
    },
    {
        href: "/admin/analytics",
        label: "Analytics",
        icon: <LineChart size={16} strokeWidth={1.5} />,
        roles: ["ADMIN", "COLABORADORA"],
    },
    {
        href: "/admin/maleta",
        label: "Maletas",
        icon: <Briefcase size={16} strokeWidth={1.5} />,
        roles: ["ADMIN", "COLABORADORA"],
    },
    {
        href: "/admin/revendedoras",
        label: "Revendedoras",
        icon: <Users size={16} strokeWidth={1.5} />,
        roles: ["ADMIN", "COLABORADORA"],
    },
    {
        href: "/admin/leads",
        label: "Candidaturas",
        icon: <Bell size={16} strokeWidth={1.5} />,
        badge: { text: "SA", variant: "role" },
        roles: ["ADMIN"],
    },
    {
        href: "/admin/consultoras",
        label: "Consultoras",
        icon: <User size={16} strokeWidth={1.5} />,
        roles: ["ADMIN"],
    },
    { type: "section", label: "Catálogo", roles: ["ADMIN"] },
    {
        href: "/admin/produtos",
        label: "Produtos",
        icon: <Grid2x2 size={16} strokeWidth={1.5} />,
        roles: ["ADMIN"],
    },
    {
        href: "/admin/categorias",
        label: "Categorias",
        icon: <AlignJustify size={16} strokeWidth={1.5} />,
        roles: ["ADMIN"],
    },
    { type: "section", label: "Configurações", roles: ["ADMIN"] },
    {
        href: "/admin/gamificacao",
        label: "Gamificação",
        icon: <Star size={16} strokeWidth={1.5} />,
        roles: ["ADMIN"],
    },
    {
        href: "/admin/comissoes",
        label: "Comissões",
        icon: <CircleDollarSign size={16} strokeWidth={1.5} />,
        roles: ["ADMIN"],
    },
    {
        href: "/admin/config/notif-push",
        label: "Notif. Push",
        icon: <Bell size={16} strokeWidth={1.5} />,
        badge: { text: "SA", variant: "role" },
        roles: ["ADMIN"],
    },
    {
        href: "/admin/brindes",
        label: "Brindes",
        icon: <Gift size={16} strokeWidth={1.5} />,
        customBadge: <BrindesBadge />,
        roles: ["ADMIN"],
    },
    { type: "section", label: "Minha Conta", roles: ["COLABORADORA"] },
    {
        href: "/admin/minha-conta",
        label: "Perfil",
        icon: <User size={16} strokeWidth={1.5} />,
        roles: ["COLABORADORA"],
    },
    {
        href: "/admin/minha-conta/comissoes",
        label: "Comissões",
        icon: <CircleDollarSign size={16} strokeWidth={1.5} />,
        roles: ["COLABORADORA"],
    },
];

interface AdminLayoutClientProps {
    children: React.ReactNode;
    userRole: Role;
    alertCount: number;
}

export default function AdminLayoutClient({ children, userRole, alertCount }: AdminLayoutClientProps) {
    const pathname = usePathname();

    if (pathname?.startsWith("/admin/login")) {
        return <>{children}</>;
    }

    const navEntries = allNavEntries.filter((entry) => {
        if (!entry.roles) return true;
        return entry.roles.includes(userRole);
    });

    return (
        <div className="admin-layout">
            <aside className="admin-sidebar md:flex">
                <div className="admin-sidebar-logo">
                    🦋 Monarca <span>Admin</span>
                </div>

                <nav className="admin-sidebar-nav">
                    {navEntries.map((entry, i) => {
                        if (entry.type === "section") {
                            return (
                                <div key={`section-${i}`} style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 5,
                                    padding: "10px 14px 4px",
                                }}>
                                    <div style={{ height: 1, background: "#1D1D1D", flexShrink: 0 }} />
                                    <span style={{
                                        color: "#333333",
                                        fontFamily: "Raleway, sans-serif",
                                        fontWeight: 700,
                                        fontSize: 9,
                                        letterSpacing: "1.5px",
                                        textTransform: "uppercase",
                                        lineHeight: "16px",
                                    }}>
                                        {entry.label}
                                    </span>
                                </div>
                            );
                        }

                        const isActive = entry.exact
                            ? pathname === entry.href
                            : pathname?.startsWith(entry.href) ?? false;

                        return (
                            <Link
                                key={entry.href}
                                href={entry.href}
                                className={`admin-nav-link ${isActive ? "active" : ""}`}
                            >
                                {entry.icon}
                                <span style={{ flex: 1 }}>{entry.label}</span>
                                {entry.customBadge}
                                {entry.badge?.variant === "count" && (
                                    <span style={{
                                        background: "#8B1C1C",
                                        color: "#fff",
                                        borderRadius: "50%",
                                        width: 18,
                                        height: 18,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontFamily: "Raleway, sans-serif",
                                        fontWeight: 700,
                                        fontSize: 9,
                                        flexShrink: 0,
                                    }}>
                                        {entry.badge.text}
                                    </span>
                                )}
                                {entry.badge?.variant === "role" && (
                                    <span style={{
                                        background: "#1C3A35",
                                        color: "#35605A",
                                        borderRadius: 4,
                                        padding: "2px 5px",
                                        fontFamily: "Raleway, sans-serif",
                                        fontWeight: 700,
                                        fontSize: 8,
                                        letterSpacing: "0.5px",
                                        lineHeight: "16px",
                                        flexShrink: 0,
                                    }}>
                                        {entry.badge.text}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div style={{ padding: "16px 20px", borderTop: "1px solid var(--admin-border)", display: "flex", flexDirection: "column", gap: 12 }}>
                    <Link href="/" className="admin-nav-link" style={{ fontSize: 13 }}>
                        <ArrowLeft size={16} strokeWidth={1.5} />
                        Voltar ao site
                    </Link>
                    <form action={logout}>
                        <button
                            type="submit"
                            className="admin-nav-link"
                            style={{ fontSize: 13, background: "transparent", border: "none", cursor: "pointer", width: "100%", padding: 0, color: "var(--admin-danger)" }}
                        >
                            <LogOut size={16} strokeWidth={1.5} />
                            Sair do sistema
                        </button>
                    </form>
                </div>
            </aside>

            <main className="admin-main" style={{ position: "relative" }}>
                {/* AlertBell fixo no topo direito — visível em todas as telas admin */}
                <div
                    style={{
                        position: "sticky",
                        top: 0,
                        zIndex: 40,
                        display: "flex",
                        justifyContent: "flex-end",
                        padding: "12px 24px",
                        pointerEvents: "none",
                    }}
                >
                    <div style={{ pointerEvents: "auto" }}>
                        <AdminAlertBell initialCount={alertCount} userRole={userRole} />
                    </div>
                </div>
                <QueryProvider>
                    {children}
                </QueryProvider>
            </main>

            <BottomNav userRole={userRole} />
        </div>
    );
}
