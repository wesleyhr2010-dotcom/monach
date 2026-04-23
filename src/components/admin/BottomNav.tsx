"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@/lib/user";
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
} from "lucide-react";

const allNavItems = [
    {
        href: "/admin",
        label: "Inicio",
        icon: LayoutDashboard,
        exact: true,
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
        href: "/admin/revendedoras",
        label: "Revend.",
        icon: UserCheck,
        exact: false,
        roles: ["ADMIN", "COLABORADORA"] as Role[],
    },
    {
        href: "/admin/equipe",
        label: "Equipe",
        icon: Users,
        exact: false,
        roles: ["ADMIN"] as Role[],
    },
    {
        href: "/admin/maleta",
        label: "Maleta",
        icon: Briefcase,
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

interface BottomNavProps {
    userRole: Role;
}

export function BottomNav({ userRole }: BottomNavProps) {
    const pathname = usePathname() ?? "";

    const navItems = allNavItems.filter((item) => item.roles.includes(userRole));

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
