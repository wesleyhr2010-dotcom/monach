"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

export type Theme = "light" | "dark" | "system";

export const MONARCA_APP_THEME_KEY = "monarca-app-theme";
export const MONARCA_ADMIN_THEME_KEY = "monarca-admin-theme";

export interface ThemeContextType {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
}

export const ThemeContext = createContext<ThemeContextType | null>(null);

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveTheme(theme: Theme): "light" | "dark" {
  return theme === "system" ? getSystemTheme() : theme;
}

function getInitialTheme(storageKey: string): Theme {
  if (typeof window === "undefined") return "system";
  try {
    const stored = localStorage.getItem(storageKey);
    return stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
  } catch {
    return "system";
  }
}

function getInitialResolvedTheme(storageKey: string): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  try {
    const stored = localStorage.getItem(storageKey);
    const initialTheme = stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
    return resolveTheme(initialTheme);
  } catch {
    return getSystemTheme();
  }
}

export function useTheme(storageKey: string): ThemeContextType {
  const [theme, setThemeState] = useState<Theme>(() => getInitialTheme(storageKey));
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() => getInitialResolvedTheme(storageKey));

  // Watch system preference changes when in "system" mode
  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = () => {
      if (theme === "system") {
        setResolvedTheme(getSystemTheme());
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  // Cross-tab sync: listen for storage events
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleStorage = (event: StorageEvent) => {
      if (event.key === storageKey && event.newValue) {
        const newTheme: Theme =
          event.newValue === "light" || event.newValue === "dark" || event.newValue === "system"
            ? event.newValue
            : "system";
        setThemeState(newTheme);
        setResolvedTheme(resolveTheme(newTheme));
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [storageKey]);

  const setTheme = useCallback(
    (newTheme: Theme) => {
      const resolved = resolveTheme(newTheme);
      setThemeState(newTheme);
      setResolvedTheme(resolved);
      // Keep color-scheme in sync so iOS updates safe-area colors immediately.
      if (typeof document !== "undefined") {
        document.documentElement.style.colorScheme = resolved;
      }
      try {
        localStorage.setItem(storageKey, newTheme);
      } catch {
        // localStorage may be unavailable
      }
      // Dispatch storage event for same-tab sync
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: storageKey,
          newValue: newTheme,
          oldValue: theme,
        })
      );
    },
    [storageKey, theme]
  );

  return { theme, resolvedTheme, setTheme };
}

export function useThemeContext(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeContext must be used within a ThemeProvider");
  }
  return context;
}
