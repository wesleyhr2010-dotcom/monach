"use client";

import { usePathname } from "next/navigation";
import { LayoutGrid, Store, Briefcase, LayoutTemplate, LogOut } from "lucide-react";
import { logoutApp } from "@/lib/actions/auth";
import OneSignalWrapper from "@/components/onesignal/OneSignalWrapper";
import { AppBottomNav } from "@/components/app/AppBottomNav";
import { LogoMonarca } from "@/components/LogoMonarca";
import { AppTransitionProvider } from "@/components/app/transitions/AppTransitionProvider";
import { TransitionLink } from "@/components/app/transitions/TransitionLink";

const navItems = [
    { href: "/app", label: "Início", icon: <LayoutGrid className="w-5 h-5 sm:w-6 sm:h-6" />, exact: true },
    { href: "/app/catalogo", label: "Catálogo", icon: <Store className="w-5 h-5 sm:w-6 sm:h-6" />, exact: false },
    { href: "/app/vendas", label: "Consig.", icon: <Store className="w-5 h-5 sm:w-6 sm:h-6" />, exact: false },
    { href: "/app/maleta", label: "Maleta", icon: <Briefcase className="w-5 h-5 sm:w-6 sm:h-6" />, exact: false },
    { href: "/app/mais", label: "Más", icon: <LayoutTemplate className="w-5 h-5 sm:w-6 sm:h-6" />, exact: false },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname() ?? "";

    if (pathname.startsWith("/app/login") || pathname.startsWith("/app/bienvenida")) {
        return <>{children}</>;
    }

    return (
        <AppTransitionProvider>
        <div className="flex bg-[#F5F2EF] text-[#1A1A1A] font-sans"
            style={{ position: "fixed", inset: 0, overflow: "hidden", paddingTop: "env(safe-area-inset-top)", overscrollBehavior: "none" }}>
            <OneSignalWrapper />
            {/* Sidebar (Desktop) */}
            <aside className="hidden md:flex w-[260px] bg-white border-r border-[#E8E2D6] flex-col fixed top-0 left-0 bottom-0 z-50">
                <div className="px-6 py-4 border-b border-[#E8E2D6] flex flex-col items-center gap-1">
                    <LogoMonarca wordmarkOnly />
                    <span
                        className="text-[10px] font-medium text-[#917961] uppercase tracking-widest"
                        style={{ fontFamily: "var(--font-raleway)" }}
                    >
                        Revendedora
                    </span>
                </div>
                <nav className="flex-1 p-4 flex flex-col gap-1">
                    {navItems.map((item) => {
                        let isActive: boolean;
                        if (item.href === "/app/mais") {
                            isActive = pathname.startsWith("/app/mais") || pathname.startsWith("/app/perfil") || pathname.startsWith("/app/notificaciones");
                        } else {
                            isActive = item.exact
                                ? pathname === item.href
                                : pathname.startsWith(item.href);
                        }
                        return (
                            <TransitionLink
                                key={item.href}
                                href={item.href}
                                pattern="crossfade"
                                className={`flex items-center gap-3 px-3 py-3 rounded-lg text-[15px] font-medium transition-colors ${isActive
                                    ? "bg-[#2E5A4C]/10 text-[#2E5A4C]"
                                    : "text-[#6b7280] hover:bg-[#F5F0E8] hover:text-[#1f2937]"
                                    }`}
                            >
                                {item.icon}
                                <span>{item.label}</span>
                            </TransitionLink>
                        );
                    })}
                </nav>
                <div className="p-4 border-t border-[#E8E2D6]">
                    <form action={logoutApp}>
                        <button type="submit" className="flex items-center gap-3 px-3 py-3 rounded-lg text-[15px] font-medium w-full text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors bg-transparent border-none cursor-pointer">
                            <LogOut className="w-5 h-5 flex-shrink-0" />
                            <span>Sair</span>
                        </button>
                    </form>
                </div>
            </aside>

            {/* Main — vt-page aplica view-transition-name: page via CSS */}
            <main
                className="flex-1 md:ml-[260px] overflow-y-auto vt-page"
                style={{ WebkitOverflowScrolling: "touch", overscrollBehavior: "none" }}
            >
                {children}
                {/* Spacer so content clears the floating bottom nav */}
                <div
                    className="md:hidden flex-shrink-0"
                    style={{ height: "calc(59px + env(safe-area-inset-bottom))" }}
                />
            </main>

            {/* Bottom nav (mobile) — floating pill; view-transition-name garante estabilidade */}
            <AppBottomNav />
        </div>
    </AppTransitionProvider>
    );
}
