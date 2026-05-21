"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getCartCount, CART_UPDATED_EVENT } from "@/lib/cart";
import CartDrawer from "./CartDrawer";
import { getAllCategories } from "@/app/actions";

// Categorias internas/de tamanho que não devem aparecer no menu
const HIDDEN_CATEGORIES = new Set([
    "Grandes", "Medianos", "Pequeños", "Produtos",
    "Con dije", "Sin dije",
]);

function isMainCategory(name: string) {
    return !name.includes("(") && !HIDDEN_CATEGORIES.has(name);
}

interface HeaderProps {
    variant?: "light" | "dark";
}

export default function Header({ variant = "light" }: HeaderProps) {
    const [isScrolled, setIsScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [cartOpen, setCartOpen] = useState(false);
    const [cartCount, setCartCount] = useState(0);
    const [categories, setCategories] = useState<string[]>([]);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 40);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        getAllCategories().then((all) =>
            setCategories(all.filter(isMainCategory))
        );
    }, []);

    // Sync cart count
    useEffect(() => {
        const sync = () => setCartCount(getCartCount());
        sync();
        window.addEventListener(CART_UPDATED_EVENT, sync);
        return () => window.removeEventListener(CART_UPDATED_EVENT, sync);
    }, []);

    const isDark = isScrolled || variant === "dark";

    return (
        <header className="fixed top-0 left-0 w-full z-50">
            {/* Announcement Bar */}
            <div className="bg-black text-white pt-2.5 pb-3.5 text-xs tracking-wide overflow-hidden min-h-10 flex items-center justify-center">
                <div className="animate-marquee whitespace-nowrap flex gap-16">
                    <span>✨ Envío a todo Paraguay — Calidad Garantizada ✨</span>
                    <span>✨ 1 año de garantía en todas las semijoyas ✨</span>
                    <span>✨ Envío a todo Paraguay — Calidad Garantizada ✨</span>
                    <span>✨ 1 año de garantía en todas las semijoyas ✨</span>
                </div>
            </div>

            {/* Main Nav */}
            <nav
                className={`transition-all duration-300 ${isScrolled
                    ? "bg-white/95 backdrop-blur-md shadow-sm"
                    : variant === "dark" ? "bg-white" : "bg-transparent"
                    }`}
            >
                <div className="max-w-[1440px] min-w-96 mx-auto px-20 py-7 flex items-center justify-between relative">
                    {/* Hamburger */}
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="flex flex-col gap-1.5 w-8 cursor-pointer z-50"
                        aria-label="Abrir menú"
                    >
                        <span
                            className={`h-0.5 w-full transition-all duration-300 ${isDark ? "bg-black" : "bg-white"
                                } ${menuOpen ? "rotate-45 translate-y-2" : ""}`}
                        />
                        <span
                            className={`h-0.5 w-full transition-all duration-300 ${isDark ? "bg-black" : "bg-white"
                                } ${menuOpen ? "opacity-0" : ""}`}
                        />
                        <span
                            className={`h-0.5 w-full transition-all duration-300 ${isDark ? "bg-black" : "bg-white"
                                } ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`}
                        />
                    </button>

                    {/* Logo */}
                    <Link href="/" className="absolute left-1/2 -translate-x-1/2">
                        <img
                            src="/images/logo-primary.svg"
                            alt="Monarca Semijoyas"
                            width={176}
                            height={44}
                            className="transition-all duration-300"
                            style={{ filter: isDark ? "none" : "brightness(0) invert(1)" }}
                        />
                    </Link>

                    {/* Icons */}
                    <div className="flex items-center gap-4">
                        {/* Search */}
                        <button aria-label="Buscar">
                            <img
                                src="/images/lupa.svg"
                                alt="Buscar"
                                width={20}
                                height={20}
                                className="transition-all duration-300"
                                style={{ filter: isDark ? "none" : "brightness(0) invert(1)" }}
                            />
                        </button>

                        {/* Cart */}
                        <button
                            aria-label="Carrito"
                            className="relative"
                            onClick={() => setCartOpen(true)}
                        >
                            <img
                                src="/images/carrinho.svg"
                                alt="Carrito"
                                width={20}
                                height={20}
                                className="transition-all duration-300"
                                style={{ filter: isDark ? "none" : "brightness(0) invert(1)" }}
                            />
                            <span suppressHydrationWarning className={`absolute -top-2 -right-2 text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center transition-all ${cartCount > 0
                                    ? "bg-[#35605a] text-white"
                                    : isDark ? "bg-gray-200 text-gray-500" : "bg-white text-black"
                                }`}>
                                {cartCount}
                            </span>
                        </button>
                    </div>
                </div>
            </nav>

            {/* Menu Overlay */}
            <div
                className={`fixed inset-0 bg-black/95 z-40 flex flex-col transition-all duration-500 overflow-y-auto ${menuOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
                    }`}
            >
                {/* Top nav links */}
                <div className="flex flex-col items-center gap-6 pt-32 pb-8">
                    <Link
                        href="/"
                        onClick={() => setMenuOpen(false)}
                        className="text-white text-2xl font-inter uppercase tracking-[6px] hover:text-gold transition-colors"
                    >
                        Tienda
                    </Link>
                    <Link
                        href="/carrinho"
                        onClick={() => setMenuOpen(false)}
                        className="text-white text-2xl font-inter uppercase tracking-[6px] hover:text-gold transition-colors"
                    >
                        Mi Joyero
                    </Link>
                </div>

                {/* Divider */}
                <div className="w-full max-w-xs mx-auto border-t border-white/20" />

                {/* Categories */}
                <div className="flex flex-col items-center gap-4 py-8 px-8">
                    <p className="text-white/40 text-[11px] uppercase tracking-[4px] font-inter">
                        Categorías
                    </p>
                    <div className="flex flex-wrap justify-center gap-3 max-w-sm">
                        {categories.map((cat) => (
                            <Link
                                key={cat}
                                href={`/catalogo?category=${encodeURIComponent(cat)}`}
                                onClick={() => setMenuOpen(false)}
                                className="text-white/80 text-sm font-inter uppercase tracking-[2px] hover:text-white transition-colors border border-white/20 hover:border-white/60 rounded-full px-4 py-1.5"
                            >
                                {cat}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Divider */}
                <div className="w-full max-w-xs mx-auto border-t border-white/20" />

                {/* Bottom links */}
                <div className="flex flex-col items-center gap-6 py-8 pb-16">
                    <Link
                        href="/nosotros"
                        onClick={() => setMenuOpen(false)}
                        className="text-white/60 text-base font-inter uppercase tracking-[4px] hover:text-white transition-colors"
                    >
                        Nosotros
                    </Link>
                    <Link
                        href="/contacto"
                        onClick={() => setMenuOpen(false)}
                        className="text-white/60 text-base font-inter uppercase tracking-[4px] hover:text-white transition-colors"
                    >
                        Contacto
                    </Link>
                </div>
            </div>

            {/* Cart Drawer */}
            <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />

            <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
      `}</style>
        </header>
    );
}
