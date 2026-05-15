"use client";

import React from "react";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { MONARCA_ADMIN_THEME_KEY } from "@/components/theme/types";

interface AdminThemeProviderProps {
  children: React.ReactNode;
}

export default function AdminThemeProvider({ children }: AdminThemeProviderProps) {
  return (
    <ThemeProvider storageKey={MONARCA_ADMIN_THEME_KEY} surface="admin">
      {children}
    </ThemeProvider>
  );
}
