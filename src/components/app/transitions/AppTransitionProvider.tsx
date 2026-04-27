"use client";

import { useEffect, useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import { clearVtPattern, notifyAppRouteCommit, setVtPattern } from "./viewTransition";
import { isModalRoute } from "./useTransitionRouter";

export function AppTransitionProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Sinaliza que o App Router já commitou a nova árvere no DOM.
  // Isso libera o snapshot "new" do startViewTransition.
  useLayoutEffect(() => {
    notifyAppRouteCommit();
  });

  // Ao concluir cada navegação: limpa a classe VT e emite telemetria DEV
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      try {
        const meta = (window as Window & { __vtMeta?: { pattern: string; href: string } }).__vtMeta;
        if (meta && performance.getEntriesByName("vt:start", "mark").length) {
          const m = performance.measure("vt:duration", "vt:start");
          console.debug(`[VT] ${meta.pattern} → ${meta.href} — ${m.duration.toFixed(0)}ms`);
          performance.clearMarks("vt:start");
          performance.clearMeasures("vt:duration");
          delete (window as Window & { __vtMeta?: unknown }).__vtMeta;
        }
      } catch { /* ignore */ }
    }

    const timer = setTimeout(clearVtPattern, 400);
    return () => clearTimeout(timer);
  }, [pathname]);

  // DEV: loga cada transição disparada pelo browser via @view-transition: auto
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    if (typeof window === "undefined" || !("navigation" in window)) {
      console.debug("[VT] Navigation API não disponível neste browser (Firefox/Safari < 18.2).");
      return;
    }

    type NavigateEvent = Event & {
      destination: { url: string };
      viewTransition: { finished: Promise<void> } | null;
    };

    function handleNavigate(e: Event) {
      const event = e as NavigateEvent;
      if (!event.viewTransition) {
        console.debug("[VT] navegação sem transição:", event.destination?.url);
        return;
      }
      const destUrl = event.destination?.url ?? "?";
      const vtClass = document.documentElement.className.match(/vt-[\w-]+/)?.[0] ?? "(sem classe)";
      console.debug(`[VT] ✓ transição iniciada — classe: ${vtClass} — destino: ${destUrl}`);
      event.viewTransition.finished
        .then(() => console.debug(`[VT] ✓ transição concluída — ${destUrl}`))
        .catch(() => console.debug(`[VT] transição cancelada — ${destUrl}`));
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).navigation.addEventListener("navigate", handleNavigate);
    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).navigation.removeEventListener("navigate", handleNavigate);
    };
  }, []);

  // Trata botão voltar do browser/Android — seta direção antes da transição
  useEffect(() => {
    function handlePopState() {
      if (process.env.NEXT_PUBLIC_VIEW_TRANSITIONS === "off") return;
      if (typeof document === "undefined") return;

      const pattern = isModalRoute(window.location.pathname) ? "modal-close" : "pop";
      setVtPattern(pattern);
      setTimeout(clearVtPattern, 400);
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return <>{children}</>;
}
