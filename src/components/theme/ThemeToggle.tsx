"use client";

import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";
import { useThemeContext } from "@/components/theme/useTheme";

interface ThemeToggleProps {
  variant?: "app" | "admin";
}

export function ThemeToggle({ variant = "app" }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useThemeContext();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === "dark";
  const nextTheme = isDark ? "light" : "dark";
  const label = isDark ? "Modo claro" : "Modo oscuro";

  const handleToggle = () => {
    setTheme(nextTheme);
  };

  const appStyles = {
    backgroundColor: "var(--color-app-card-bg)",
    color: "var(--color-app-text)",
    borderColor: "var(--color-app-border)",
  };

  const adminStyles = {
    backgroundColor: "var(--admin-surface)",
    color: "var(--admin-text)",
    borderColor: "var(--admin-border)",
  };

  const iconColor = variant === "app" ? "var(--color-app-accent-brown)" : "var(--admin-primary)";
  const styles = variant === "app" ? appStyles : adminStyles;

  // Prevent hydration mismatch: server always renders Moon + "Modo oscuro"
  // Client re-renders after mount with actual resolvedTheme
  const showSun = mounted && isDark;

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label="Cambiar tema"
      className="inline-flex items-center gap-2 h-10 px-4 rounded-full border transition-colors hover:opacity-80"
      style={{
        ...styles,
        borderColor: styles.borderColor,
      }}
    >
      {showSun ? (
        <Sun className="w-4 h-4" style={{ color: iconColor }} />
      ) : (
        <Moon className="w-4 h-4" style={{ color: iconColor }} />
      )}
      <span className="text-sm font-medium">{mounted ? label : "Modo oscuro"}</span>
    </button>
  );
}
