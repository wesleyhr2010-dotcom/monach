"use client";

import { usePathname } from "next/navigation";
import { Compass, LayoutGrid, Store, ShoppingBag, MoreHorizontal } from "lucide-react";
import { TransitionLink } from "@/components/app/transitions/TransitionLink";

const NAV_ITEMS = [
  { href: "/app", label: "Início", Icon: Compass, exact: true },
  { href: "/app/catalogo", label: "Catálogo", Icon: LayoutGrid, exact: false },
  { href: "/app/vendas", label: "Consig.", Icon: Store, exact: false },
  { href: "/app/maleta", label: "Maleta", Icon: ShoppingBag, exact: false },
  { href: "/app/mais", label: "Más", Icon: MoreHorizontal, exact: false },
] as const;

export function AppBottomNav() {
  const pathname = usePathname() ?? "";

  return (
    <nav className="md:hidden absolute bottom-0 left-0 right-0 z-[100] px-4 vt-nav">
      <div className="flex items-center justify-around bg-white rounded-full h-[59px] shadow-[0_-2px_16px_rgba(0,0,0,0.06)]">
        {NAV_ITEMS.map(({ href, label, Icon, exact }) => {
          let active: boolean;
          if (href === "/app/mais") {
            active = pathname.startsWith("/app/mais") || pathname.startsWith("/app/perfil") || pathname.startsWith("/app/notificaciones");
          } else {
            active = exact ? pathname === href : pathname.startsWith(href);
          }
          return (
            <TransitionLink
              key={href}
              href={href}
              pattern="crossfade"
              className="flex flex-col items-center gap-1 min-w-[52px] py-2 select-none"
            >
              <Icon
                size={24}
                strokeWidth={1.5}
                className="transition-all duration-200 ease-out"
                style={{
                  color: active ? "#35605A" : "#B4ABA2",
                  transform: active ? "translateY(-2px)" : "translateY(0)",
                }}
              />
              <span
                className="text-[10px] font-medium leading-3 tracking-[0.2px] transition-colors duration-200"
                style={{
                  fontFamily: "var(--font-raleway)",
                  color: active ? "#35605A" : "#B4ABA2",
                }}
              >
                {label}
              </span>
              {/* Dot sempre presente — evita layout shift e permite animar */}
              <div
                className="rounded-full bg-[#35605A] transition-all duration-200 ease-out"
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
