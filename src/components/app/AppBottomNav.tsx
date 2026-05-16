"use client";

import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { Compass, LayoutGrid, ShoppingBag, MoreHorizontal } from "lucide-react";
import { TransitionLink } from "@/components/app/transitions/TransitionLink";
import { useThemeContext } from "@/components/theme/useTheme";

const NAV_ITEMS = [
  { href: "/app", label: "Início", Icon: Compass, exact: true },
  { href: "/app/catalogo", label: "Catálogo", Icon: LayoutGrid, exact: false },
  { href: "/app/maleta", label: "Maleta", Icon: ShoppingBag, exact: false },
  { href: "/app/mas", label: "Más", Icon: MoreHorizontal, exact: false },
] as const;

function isActive(pathname: string, href: string, exact: boolean) {
  if (href === "/app/mas") {
    return (
      pathname.startsWith("/app/mas") ||
      pathname.startsWith("/app/perfil") ||
      pathname.startsWith("/app/notificaciones") ||
      pathname.startsWith("/app/desempeno") ||
      pathname.startsWith("/app/progreso")
    );
  }
  return exact ? pathname === href : pathname.startsWith(href);
}

export function AppBottomNav() {
  const pathname = usePathname() ?? "";
  const { resolvedTheme } = useThemeContext();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  // Set data-theme directly on the nav so iOS WebKit doesn't rely on distant
  // ancestor cascade (known WebKit bug with absolute-positioned elements and
  // dynamically changed CSS custom properties on ancestor).
  const theme = mounted ? resolvedTheme : undefined;

  // Light: use warm beige (#F5F2EF = --color-app-bg) so the pill blends with the
  // app's warm background instead of showing pure white. Dark: slightly lighter
  // than the dark page (#242220 vs #1a1816) to create subtle elevation.
  const pillBg = mounted
    ? resolvedTheme === "dark" ? "#242220" : "#F5F2EF"
    : "#F5F2EF";
  const pageBg = mounted
    ? resolvedTheme === "dark" ? "#1a1816" : "#F5F2EF"
    : "#F5F2EF";

  return (
    <nav
      className="md:hidden absolute bottom-0 left-0 right-0 z-[100] px-4 vt-nav"
      data-theme={theme}
      style={{
        backgroundColor: pageBg,
      }}
    >
      <div
        className="flex items-center justify-around rounded-full h-[59px] shadow-[0_-2px_16px_rgba(0,0,0,0.08)] select-none"
        style={{ backgroundColor: pillBg, position: "relative" }}
      >
        {NAV_ITEMS.map(({ href, label, Icon, exact }) => {
          const active = mounted ? isActive(pathname, href, exact) : false;
          return (
            <TransitionLink
              key={href}
              href={href}
              pattern="crossfade"
              className="flex flex-col items-center gap-1 min-w-[52px] py-2"
            >
              <Icon
                size={24}
                strokeWidth={1.5}
                className={`transition-all duration-200 ease-out ${active ? "text-app-primary" : "text-app-muted"}`}
                style={{
                  transform: active ? "translateY(-2px)" : "translateY(0)",
                }}
              />
              <span
                className={`text-[10px] font-medium leading-3 tracking-[0.2px] transition-colors duration-200 ${active ? "text-app-primary" : "text-app-muted"}`}
                style={{
                  fontFamily: "var(--font-raleway)",
                }}
              >
                {label}
              </span>
              {/* Dot sempre presente — evita layout shift e permite animar */}
              <div
                className={`rounded-full transition-all duration-200 ease-out ${active ? "bg-app-primary" : "bg-app-muted"}`}
                style={{
                  width: active ? 4 : 0,
                  height: active ? 4 : 0,
                  opacity: active ? 1 : 0,
                  transform: active ? "scale(1)" : "scale(0)",
                }}
              />
            </TransitionLink>
          );
        })}
      </div>
    </nav>
  );
}
