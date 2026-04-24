"use client";

import OneSignal from "react-onesignal";
import { LogOut } from "lucide-react";
import { logoutApp } from "@/lib/actions/auth";

export function LogoutButton() {
  const handleLogout = async () => {
    try {
      await OneSignal.logout();
    } catch {
      // Best-effort: não falhar o logout se OneSignal não estiver disponível
    }
    await logoutApp();
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="mt-1 w-full rounded-2xl py-[15px] px-5 flex items-center justify-center gap-2.5 bg-app-danger-bg border border-app-danger-border active:opacity-80 transition-opacity"
      aria-label="Cerrar sesión"
    >
      <LogOut size={18} strokeWidth={1.5} className="text-app-danger" />
      <span
        className="font-bold text-[15px] text-app-danger"
        style={{ fontFamily: "var(--font-raleway)" }}
      >
        Cerrar Sesión
      </span>
    </button>
  );
}
