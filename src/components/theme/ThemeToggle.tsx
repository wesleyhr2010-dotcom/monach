"use client";

import { Sun, Moon } from "lucide-react";
import { useThemeContext } from "@/components/theme/useTheme";

interface ThemeToggleProps {
  variant?: "app" | "admin";
}

export function ThemeToggle({ variant = "app" }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme } = useThemeContext();

  const isDark = resolvedTheme === "dark";
  const nextTheme = isDark ? "light" : "dark";
  const label = isDark ? "Modo claro" : "Modo oscuro";

  const handleToggle = () => {
    setTheme(nextTheme);
  };

  const appStyles = {
    backgroundColor: "var(--app-card-bg)",
    color: "var(--app-text)",
    borderColor: "var(--app-border)",
  };

  const adminStyles = {
    backgroundColor: "var(--admin-card-bg)",
    color: "var(--admin-text)",
    borderColor: "var(--admin-border)",
  };

  const iconColor = variant === "app" ? "var(--app-accent-brown)" : "var(--admin-primary)";
  const styles = variant === "app" ? appStyles : adminStyles;

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
      {isDark ? (
        <Sun className="w-4 h-4" style={{ color: iconColor }} />
      ) : (
        <Moon className="w-4 h-4" style={{ color: iconColor }} />
      )}
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}
