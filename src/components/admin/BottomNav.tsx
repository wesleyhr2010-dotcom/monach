"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@/lib/user";
import { logout } from "@/lib/actions/auth";
import {
    LayoutDashboard,
    Package,
    Briefcase,
    Users,
    UserCheck,
    BarChart3,
    FileDown,
    User,
    CircleDollarSign,
    MoreHorizontal,
    LogOut,
    ArrowLeft,
    X,
} from "lucide-react";
import React from "react";

const allNavItems = [
    {
        href: "/admin",
        label: "Inicio",
        icon: LayoutDashboard,
        exact: true,
        roles: ["ADMIN", "COLABORADORA"] as Role[],
    },
    {
        href: "/admin/maleta",
        label: "Maleta",
        icon: Briefcase,
        exact: false,
        roles: ["ADMIN", "COLABORADORA"] as Role[],
    },
    {
        href: "/admin/revendedoras",
        label: "Revend.",
        icon: UserCheck,
        exact: false,
        roles: ["ADMIN", "COLABORADORA"] as Role[],
    },
    {
        href: "/admin/analytics",
        label: "Analytics",
        icon: BarChart3,
        exact: false,
        roles: ["ADMIN", "COLABORADORA"] as Role[],
    },
    {
        href: "/admin/produtos",
        label: "Productos",
        icon: Package,
        exact: false,
        roles: ["ADMIN"] as Role[],
    },
    {
        href: "/admin/equipe",
        label: "Equipe",
        icon: Users,
        exact: false,
        roles: ["ADMIN"] as Role[],
    },
    {
        href: "/admin/relatorios",
        label: "Relatórios",
        icon: FileDown,
        exact: false,
        roles: ["ADMIN"] as Role[],
    },
    {
        href: "/admin/minha-conta",
        label: "Perfil",
        icon: User,
        exact: false,
        roles: ["COLABORADORA"] as Role[],
    },
    {
        href: "/admin/minha-conta/comissoes",
        label: "Comissões",
        icon: CircleDollarSign,
        exact: false,
        roles: ["COLABORADORA"] as Role[],
    },
];

const PRIMARY_COUNT = 4;

interface BottomNavProps {
    userRole: Role;
}

export function BottomNav({ userRole }: BottomNavProps) {
    const pathname = usePathname() ?? "";
    const [moreOpen, setMoreOpen] = React.useState(false);

    const navItems = allNavItems.filter((item) => item.roles.includes(userRole));
    const primaryItems = navItems.slice(0, PRIMARY_COUNT);
    const secondaryItems = navItems.slice(PRIMARY_COUNT);

    const isMoreActive = secondaryItems.some((item) =>
        item.exact ? pathname === item.href : pathname.startsWith(item.href)
    );

    // Fecha o sheet ao navegar
    React.useEffect(() => {
        setMoreOpen(false);
    }, [pathname]);

    return (
        <>
            {/* Sheet overlay */}
            {moreOpen && (
                <div
                    className="admin-bottom-more-overlay"
                    onClick={() => setMoreOpen(false)}
                />
            )}

            {/* Bottom sheet */}
            <div className={`admin-bottom-more-sheet ${moreOpen ? "open" : ""}`}>
                <div className="admin-bottom-more-sheet-header">
                    <span>Más opciones</span>
                    <button
                        type="button"
                        className="admin-bottom-more-close"
                        onClick={() => setMoreOpen(false)}
                    >
                        <X size={18} strokeWidth={2} />
                    </button>
                </div>

                {secondaryItems.length > 0 && (
                    <div className="admin-bottom-more-section">
                        {secondaryItems.map((item) => {
                            const isActive = item.exact
                                ? pathname === item.href
                                : pathname.startsWith(item.href);
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`admin-bottom-more-item ${isActive ? "active" : ""}`}
                                    onClick={() => setMoreOpen(false)}
                                >
                                    <Icon size={20} strokeWidth={1.75} />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                )}

                <div className="admin-bottom-more-section admin-bottom-more-section--footer">
                    <Link
                        href="/"
                        className="admin-bottom-more-item"
                        onClick={() => setMoreOpen(false)}
                    >
                        <ArrowLeft size={20} strokeWidth={1.75} />
                        <span>Volver al sitio</span>
                    </Link>
                    <form action={logout}>
                        <button
                            type="submit"
                            className="admin-bottom-more-item admin-bottom-more-item--danger"
                        >
                            <LogOut size={20} strokeWidth={1.75} />
                            <span>Salir del sistema</span>
                        </button>
                    </form>
                </div>
            </div>

            {/* Bottom nav bar */}
            <nav className="admin-bottom-nav">
                <div className="admin-bottom-nav-inner">
                    {primaryItems.map((item) => {
                        const isActive = item.exact
                            ? pathname === item.href
                            : pathname.startsWith(item.href);
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`admin-bottom-nav-item ${isActive ? "active" : ""}`}
                            >
                                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.75} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}

                    {/* Botão "Más" */}
                    <button
                        type="button"
                        className={`admin-bottom-nav-item ${isMoreActive || moreOpen ? "active" : ""}`}
                        onClick={() => setMoreOpen((v) => !v)}
                    >
                        <MoreHorizontal size={22} strokeWidth={isMoreActive || moreOpen ? 2.5 : 1.75} />
                        <span>Más</span>
                    </button>
                </div>
            </nav>
        </>
    );
}
