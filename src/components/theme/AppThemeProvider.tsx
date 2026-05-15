"use client";

import React from "react";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { MONARCA_APP_THEME_KEY } from "@/components/theme/types";

interface AppThemeProviderProps {
  children: React.ReactNode;
}

export default function AppThemeProvider({ children }: AppThemeProviderProps) {
  return (
    <ThemeProvider storageKey={MONARCA_APP_THEME_KEY} surface="app">
      {children}
    </ThemeProvider>
  );
}
