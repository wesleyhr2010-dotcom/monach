"use client";

import React, { useEffect } from "react";
import { ThemeContext, useTheme } from "@/components/theme/useTheme";
import type { Theme } from "@/components/theme/types";

interface ThemeProviderProps {
  children: React.ReactNode;
  storageKey: string;
  surface: "app" | "admin";
  defaultTheme?: Theme;
}

export function ThemeProvider({ children, storageKey, surface }: ThemeProviderProps) {
  const { theme, resolvedTheme, setTheme } = useTheme(storageKey);

  // Sync data-theme attribute on the DOM element whenever resolved theme changes
  useEffect(() => {
    const selector = surface === "app" ? ".app-shell" : ".admin-layout";
    const el = document.querySelector(selector);
    if (el) {
      el.setAttribute("data-theme", resolvedTheme);
    }
  }, [resolvedTheme, surface]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
