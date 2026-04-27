"use client";

import { useRouter } from "next/navigation";
import { clearVtPattern, runViewTransition, type VtPattern } from "./viewTransition";

export const MODAL_ROUTE_PATTERNS = [
  /\/registrar-venta$/,
  /\/devolver(\/|$)/,
  /\/catalogo\/compartir$/,
] as const;

export function isModalRoute(path: string) {
  return MODAL_ROUTE_PATTERNS.some((re) => re.test(path));
}

/**
 * Executa a navegação dentro de startViewTransition e espera o commit
 * real da rota antes do browser capturar o snapshot "new".
 */
function withTransition(pattern: VtPattern, fn: () => void) {
  runViewTransition(pattern, fn);
}

/**
 * Hook de roteamento com View Transitions.
 * Todas as navegações passam por withTransition(), que coordena
 * startViewTransition + React startTransition + commit real do App Router.
 */
export function useTransitionRouter() {
  const router = useRouter();

  return {
    push(href: string, pattern?: VtPattern) {
      const resolved = pattern ?? (isModalRoute(href) ? "modal" : "push");
      withTransition(resolved, () => router.push(href));
    },
    back(currentPath?: string) {
      const pattern =
        currentPath && isModalRoute(currentPath) ? "modal-close" : "pop";
      withTransition(pattern, () => router.back());
    },
    pushSheet(href: string) {
      withTransition("modal", () => router.push(href));
    },
    pushHero(href: string) {
      withTransition("hero", () => router.push(href));
    },
    clearVtPattern,
  };
}
