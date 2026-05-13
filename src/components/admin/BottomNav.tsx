"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@/lib/user";
import { logout } from "@/lib/actions/auth";
import {
    AlignJustify,
    ArrowLeft,
    Award,
    BarChart3,
    Bell,
    Briefcase,
    CircleDollarSign,
    FileText,
    Gift,
    Grid2x2,
    LayoutDashboard,
    LogOut,
    Mail,
    MoreHorizontal,
    Package,
    Receipt,
    Star,
    User,
    UserCheck,
    X,
} from "lucide-react";
import React from "react";

// ── Tipos ──────────────────────────────────────────────────────
type NavItem = {
    type?: never;
    href: string;
    label: string;
    icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
    exact?: boolean;
    roles: Role[];
};

type NavSection = {
    type: "section";
    label: string;
    roles: Role[];
};

// ── 4 itens fixos na barra ─────────────────────────────────────
const primaryItems: NavItem[] = [
    { href: "/admin",              label: "Inicio",    icon: LayoutDashboard, exact: true, roles: ["ADMIN", "COLABORADORA"] },
    { href: "/admin/maleta",       label: "Maleta",    icon: Briefcase,                   roles: ["ADMIN", "COLABORADORA"] },
    { href: "/admin/revendedoras", label: "Revend.",   icon: UserCheck,                   roles: ["ADMIN", "COLABORADORA"] },
    { href: "/admin/analytics",    label: "Analytics", icon: BarChart3,                   roles: ["ADMIN", "COLABORADORA"] },
];

// ── Sheet: espelha a sidebar completa (sem os 4 primários) ─────
const sheetEntries: (NavItem | NavSection)[] = [
    // Operações diárias
    { href: "/admin/ventas",    label: "Ventas", icon: Receipt,          roles: ["ADMIN", "COLABORADORA"] },
    { href: "/admin/pdv",       label: "PDV",    icon: CircleDollarSign, roles: ["ADMIN", "COLABORADORA"] },

    // Gestão (ADMIN)
    { href: "/admin/leads",       label: "Candidaturas", icon: Bell, roles: ["ADMIN"] },
    { href: "/admin/consultoras", label: "Consultoras",  icon: User, roles: ["ADMIN"] },

    // Catálogo
    { type: "section", label: "Catálogo", roles: ["ADMIN"] },
    { href: "/admin/produtos",            label: "Productos",  icon: Grid2x2,       roles: ["ADMIN"] },
    { href: "/admin/categorias",          label: "Categorías", icon: AlignJustify,  roles: ["ADMIN"] },
    { href: "/admin/estoque/sincronizar", label: "Stock",      icon: Package,       roles: ["ADMIN"] },

    // Configuraciones
    { type: "section", label: "Configuraciones", roles: ["ADMIN"] },
    { href: "/admin/gamificacao",        label: "Gamificación", icon: Star,            roles: ["ADMIN"] },
    { href: "/admin/config/comissoes",   label: "Comisiones",   icon: CircleDollarSign,roles: ["ADMIN"] },
    { href: "/admin/config/cotizacion",  label: "Cotización",   icon: FileText,        roles: ["ADMIN"] },
    { href: "/admin/config/niveis",      label: "Niveles",      icon: Award,           roles: ["ADMIN"] },
    { href: "/admin/config/contratos",   label: "Contratos",    icon: FileText,        roles: ["ADMIN"] },
    { href: "/admin/config/notif-push",  label: "Notif. Push",  icon: Bell,            roles: ["ADMIN"] },
    { href: "/admin/config/emails",      label: "Correos",      icon: Mail,            roles: ["ADMIN"] },
    { href: "/admin/brindes",            label: "Regalos",      icon: Gift,            roles: ["ADMIN"] },

    // Mi Cuenta (COLABORADORA)
    { type: "section", label: "Mi Cuenta", roles: ["COLABORADORA"] },
    { href: "/admin/minha-conta",           label: "Perfil",    icon: User,            roles: ["COLABORADORA"] },
    { href: "/admin/minha-conta/comissoes", label: "Comisiones",icon: CircleDollarSign,roles: ["COLABORADORA"] },
];

// ── Componente ─────────────────────────────────────────────────
interface BottomNavProps {
    userRole: Role;
}

export function BottomNav({ userRole }: BottomNavProps) {
    const pathname = usePathname() ?? "";
    const [moreOpen, setMoreOpen] = React.useState(false);

    // Filtra itens visíveis para o role atual
    const visiblePrimary = primaryItems.filter((i) => i.roles.includes(userRole));

    const visibleSheet = sheetEntries.filter((entry) => {
        if (!entry.roles) return true;
        return entry.roles.includes(userRole);
    });

    // Remove seções que ficaram sem itens abaixo delas
    const cleanedSheet = visibleSheet.filter((entry, idx) => {
        if (entry.type !== "section") return true;
        const next = visibleSheet[idx + 1];
        return next && next.type !== "section";
    });

    // Botão Más fica ativo quando rota atual é de um item do sheet
    const isMoreActive = visibleSheet.some(
        (e) => e.type !== "section" && (e.exact ? pathname === e.href : pathname.startsWith(e.href))
    );

    // Fecha sheet ao navegar
    React.useEffect(() => { setMoreOpen(false); }, [pathname]);

    return (
        <>
            {/* Overlay */}
            {moreOpen && (
                <div className="admin-bottom-more-overlay" onClick={() => setMoreOpen(false)} />
            )}

            {/* Bottom sheet */}
            <div className={`admin-bottom-more-sheet ${moreOpen ? "open" : ""}`}>
                <div className="admin-bottom-more-sheet-header">
                    <span>Más opciones</span>
                    <button type="button" className="admin-bottom-more-close" onClick={() => setMoreOpen(false)}>
                        <X size={18} strokeWidth={2} />
                    </button>
                </div>

                <div className="admin-bottom-more-scroll">
                    {cleanedSheet.map((entry, idx) => {
                        if (entry.type === "section") {
                            return (
                                <div key={`section-${idx}`} className="admin-bottom-more-section-label">
                                    {entry.label}
                                </div>
                            );
                        }
                        const isActive = entry.exact
                            ? pathname === entry.href
                            : pathname.startsWith(entry.href);
                        const Icon = entry.icon;
                        return (
                            <Link
                                key={entry.href}
                                href={entry.href}
                                className={`admin-bottom-more-item ${isActive ? "active" : ""}`}
                                onClick={() => setMoreOpen(false)}
                            >
                                <Icon size={20} strokeWidth={1.75} />
                                <span>{entry.label}</span>
                            </Link>
                        );
                    })}

                    {/* Footer fixo */}
                    <div className="admin-bottom-more-footer">
                        <Link href="/" className="admin-bottom-more-item" onClick={() => setMoreOpen(false)}>
                            <ArrowLeft size={20} strokeWidth={1.75} />
                            <span>Volver al sitio</span>
                        </Link>
                        <form action={logout}>
                            <button type="submit" className="admin-bottom-more-item admin-bottom-more-item--danger">
                                <LogOut size={20} strokeWidth={1.75} />
                                <span>Salir del sistema</span>
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Barra */}
            <nav className="admin-bottom-nav">
                <div className="admin-bottom-nav-inner">
                    {visiblePrimary.map((item) => {
                        const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                        const Icon = item.icon;
                        return (
                            <Link key={item.href} href={item.href} className={`admin-bottom-nav-item ${isActive ? "active" : ""}`}>
                                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.75} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}

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
