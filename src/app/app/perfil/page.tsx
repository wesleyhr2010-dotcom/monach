import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { ChevronRight, User, FileText, Landmark, Bell, HelpCircle, LogOut } from "lucide-react";
import { getPerfilCompleto } from "./actions";
import { logoutApp } from "@/lib/actions/auth";

export default async function PerfilPage() {
    const result = await getPerfilCompleto();
    if (!result.success) {
        redirect("/app/login");
    }
    const perfil = result.data;

    const menuItems = [
        { href: "/app/perfil/datos", label: "Mis Datos", icon: <User className="w-5 h-5" /> },
        { href: "/app/perfil/documentos", label: "Documentos y Contratos", icon: <FileText className="w-5 h-5" /> },
        { href: "/app/perfil/bancario", label: "Datos Bancarios", icon: <Landmark className="w-5 h-5" /> },
        { href: "/app/perfil/notificaciones", label: "Notificaciones", icon: <Bell className="w-5 h-5" /> },
        { href: "/app/perfil/soporte", label: "Soporte y Ayuda", icon: <HelpCircle className="w-5 h-5" /> },
    ];

    return (
        <div className="flex flex-col min-h-full bg-app-bg">
            {/* Header */}
            <div className="bg-app-card-bg px-5 pt-8 pb-6 text-center border-b border-app-border">
                <h1 className="text-lg font-bold text-app-text mb-4">Mi Perfil</h1>
                <div className="relative w-20 h-20 mx-auto mb-3 rounded-full overflow-hidden bg-app-surface-warm">
                    {perfil.avatar_url ? (
                        <Image src={perfil.avatar_url} alt={perfil.name} fill className="object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <User className="w-8 h-8 text-app-accent-brown" />
                        </div>
                    )}
                </div>
                <h2 className="text-base font-semibold text-app-text">{perfil.name}</h2>
                <p className="text-xs text-app-accent-brown mt-1">🏅 {perfil.pontos} pts</p>
                <p className="text-xs text-app-text-secondary mt-1">{perfil.email}</p>
                <p className="text-xs text-app-text-secondary">{perfil.whatsapp || "Sin WhatsApp"}</p>

                <div className="flex gap-3 mt-4 justify-center">
                    <div className="bg-app-surface-warm rounded-xl px-4 py-2 text-center min-w-[100px]">
                        <p className="text-xs text-app-text-secondary">Tasa Comisión</p>
                        <p className="text-sm font-bold text-app-text">{perfil.taxa_comissao}%</p>
                    </div>
                    <div className="bg-app-surface-warm rounded-xl px-4 py-2 text-center min-w-[100px]">
                        <p className="text-xs text-app-text-secondary">Consultora</p>
                        <p className="text-sm font-bold text-app-text">
                            {perfil.colaboradora?.name || "Sin consultora"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Menu */}
            <div className="flex-1 px-4 py-4 space-y-1">
                {menuItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center gap-3 px-4 py-3.5 bg-app-card-bg rounded-xl text-app-text hover:bg-app-surface-warm transition-colors"
                    >
                        <span className="text-app-accent-brown">{item.icon}</span>
                        <span className="flex-1 text-sm font-medium">{item.label}</span>
                        <ChevronRight className="w-4 h-4 text-app-text-secondary" />
                    </Link>
                ))}
            </div>

            {/* Logout */}
            <div className="px-4 pb-8 pt-2">
                <form action={logoutApp}>
                    <button
                        type="submit"
                        className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-app-card-bg rounded-xl text-red-500 hover:bg-red-50 transition-colors text-sm font-medium"
                    >
                        <LogOut className="w-5 h-5" />
                        Cerrar Sesión
                    </button>
                </form>
            </div>
        </div>
    );
}
