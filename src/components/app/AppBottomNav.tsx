"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, LayoutGrid, Store, ShoppingBag, MoreHorizontal } from "lucide-react";

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
    <nav className="md:hidden absolute bottom-0 left-0 right-0 z-[100] px-4"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="flex items-center justify-around bg-white rounded-full h-[59px] shadow-[0_-2px_16px_rgba(0,0,0,0.06)]">
        {NAV_ITEMS.map(({ href, label, Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1 min-w-[52px] py-2"
            >
              <Icon
                size={24}
                strokeWidth={1.5}
                stroke={active ? "#35605A" : "#B4ABA2"}
              />
              <span
                className="text-[10px] font-medium leading-3 tracking-[0.2px]"
                style={{
                  fontFamily: "var(--font-raleway)",
                  color: active ? "#35605A" : "#B4ABA2",
                }}
              >
                {label}
              </span>
              {active && (
                <div className="w-1 h-1 rounded-full bg-[#35605A]" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
