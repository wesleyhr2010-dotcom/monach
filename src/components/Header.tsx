"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getCartCount, CART_UPDATED_EVENT } from "@/lib/cart";
import CartDrawer from "./CartDrawer";
import { getCategoryHierarchy, type CategoryNode } from "@/app/actions";

interface HeaderProps {
    variant?: "light" | "dark";
}

export default function Header({ variant = "light" }: HeaderProps) {
    const [isScrolled, setIsScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [cartOpen, setCartOpen] = useState(false);
    const [cartCount, setCartCount] = useState(0);
    const [categories, setCategories] = useState<CategoryNode[]>([]);
    const [activeCategory, setActiveCategory] = useState<CategoryNode | null>(null);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 40);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        getCategoryHierarchy().then(setCategories);
    }, []);

    function closeMenu() {
        setMenuOpen(false);
        setActiveCategory(null);
    }

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
                        onClick={() => { setMenuOpen(!menuOpen); if (menuOpen) setActiveCategory(null); }}
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
                className={`fixed inset-0 bg-black/95 z-40 overflow-hidden transition-all duration-500 ${menuOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"}`}
            >
                {/* Two-panel container */}
                <div
                    className="flex h-full transition-transform duration-400 ease-in-out"
                    style={{ transform: activeCategory ? "translateX(-100%)" : "translateX(0)" }}
                >
                    {/* ── Panel 1: main categories ── */}
                    <div className="w-full flex-shrink-0 overflow-y-auto flex flex-col">
                        <div className="flex flex-col px-10 pt-28 pb-16 gap-0">
                            {/* Primary links */}
                            <Link href="/" onClick={closeMenu}
                                className="text-white text-xl font-inter uppercase tracking-[5px] py-4 border-b border-white/10 hover:text-white/70 transition-colors">
                                Tienda
                            </Link>
                            <Link href="/carrinho" onClick={closeMenu}
                                className="text-white text-xl font-inter uppercase tracking-[5px] py-4 border-b border-white/10 hover:text-white/70 transition-colors">
                                Mi Joyero
                            </Link>

                            {/* Category label */}
                            <p className="text-white/30 text-[10px] uppercase tracking-[4px] font-inter mt-8 mb-2">
                                Categorías
                            </p>

                            {/* Category rows */}
                            {categories.map((cat) =>
                                cat.children.length > 0 ? (
                                    <button
                                        key={cat.name}
                                        onClick={() => setActiveCategory(cat)}
                                        className="flex items-center justify-between text-white text-base font-inter uppercase tracking-[3px] py-3.5 border-b border-white/10 hover:text-white/70 transition-colors text-left w-full"
                                    >
                                        {cat.name}
                                        <svg className="w-4 h-4 opacity-40 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                            <path d="m9 18 6-6-6-6" />
                                        </svg>
                                    </button>
                                ) : (
                                    <Link
                                        key={cat.name}
                                        href={`/catalogo?category=${encodeURIComponent(cat.name)}`}
                                        onClick={closeMenu}
                                        className="text-white text-base font-inter uppercase tracking-[3px] py-3.5 border-b border-white/10 hover:text-white/70 transition-colors block"
                                    >
                                        {cat.name}
                                    </Link>
                                )
                            )}

                            {/* Footer links */}
                            <div className="flex gap-8 mt-10">
                                <Link href="/nosotros" onClick={closeMenu}
                                    className="text-white/40 text-xs font-inter uppercase tracking-[3px] hover:text-white/70 transition-colors">
                                    Nosotros
                                </Link>
                                <Link href="/contacto" onClick={closeMenu}
                                    className="text-white/40 text-xs font-inter uppercase tracking-[3px] hover:text-white/70 transition-colors">
                                    Contacto
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* ── Panel 2: subcategories ── */}
                    <div className="w-full flex-shrink-0 overflow-y-auto flex flex-col">
                        {activeCategory && (
                            <div className="flex flex-col px-10 pt-28 pb-16 gap-0">
                                {/* Back */}
                                <button
                                    onClick={() => setActiveCategory(null)}
                                    className="flex items-center gap-2 text-white/50 text-xs uppercase tracking-[3px] font-inter mb-6 hover:text-white transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                        <path d="m15 18-6-6 6-6" />
                                    </svg>
                                    Volver
                                </button>

                                {/* Category title + ver todos */}
                                <div className="flex items-baseline justify-between border-b border-white/10 pb-4 mb-2">
                                    <h2 className="text-white text-xl font-inter uppercase tracking-[5px]">
                                        {activeCategory.name}
                                    </h2>
                                    <Link
                                        href={`/catalogo?category=${encodeURIComponent(activeCategory.name)}`}
                                        onClick={closeMenu}
                                        className="text-white/40 text-[11px] uppercase tracking-[2px] hover:text-white transition-colors"
                                    >
                                        Ver todos
                                    </Link>
                                </div>

                                {/* Subcategory links */}
                                {activeCategory.children.map((child) => (
                                    <Link
                                        key={child}
                                        href={`/catalogo?category=${encodeURIComponent(child)}`}
                                        onClick={closeMenu}
                                        className="text-white/80 text-base font-inter uppercase tracking-[3px] py-3.5 border-b border-white/10 hover:text-white transition-colors block"
                                    >
                                        {child}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
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
