"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Package,
    Tags,
    Briefcase,
    Users,
    UserCheck,
    BarChart3,
    FileDown
} from "lucide-react";

const navItems = [
    {
        href: "/admin",
        label: "Inicio",
        icon: LayoutDashboard,
        exact: true,
    },
    {
        href: "/admin/produtos",
        label: "Productos",
        icon: Package,
        exact: false,
    },
    {
        href: "/admin/revendedoras",
        label: "Revend.",
        icon: UserCheck,
        exact: false,
    },
    {
        href: "/admin/equipe",
        label: "Equipe",
        icon: Users,
        exact: false,
    },
    {
        href: "/admin/maleta",
        label: "Maleta",
        icon: Briefcase,
        exact: false,
    },
    {
        href: "/admin/analytics",
        label: "Analytics",
        icon: BarChart3,
        exact: false,
    },
    {
        href: "/admin/relatorios",
        label: "Relatórios",
        icon: FileDown,
        exact: false,
    },
];

export function BottomNav() {
    const pathname = usePathname() ?? "";

    return (
        <nav className="admin-bottom-nav">
            <div className="admin-bottom-nav-inner">
                {navItems.map((item) => {
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
                            <Icon className="w-6 h-6 mb-1" strokeWidth={isActive ? 2.5 : 2} />
                            <span className="text-[10px] sm:text-xs font-medium tracking-wide">
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
