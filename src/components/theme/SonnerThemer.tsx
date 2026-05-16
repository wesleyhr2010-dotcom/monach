"use client";

import { Toaster } from "sonner";
import { useTheme } from "@/components/theme/useTheme";
import { MONARCA_APP_THEME_KEY, MONARCA_ADMIN_THEME_KEY } from "@/components/theme/types";

interface SonnerThemerProps {
  surface: "app" | "admin";
}

export function SonnerThemer({ surface }: SonnerThemerProps) {
  const storageKey = surface === "app" ? MONARCA_APP_THEME_KEY : MONARCA_ADMIN_THEME_KEY;
  const { resolvedTheme } = useTheme(storageKey);

  const position = surface === "app" ? "top-center" : "top-right";

  return <Toaster theme={resolvedTheme} position={position} richColors />;
}
