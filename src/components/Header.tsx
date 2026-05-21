"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
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

    // Sync cart count
    useEffect(() => {
        const sync = () => setCartCount(getCartCount());
        sync();
        window.addEventListener(CART_UPDATED_EVENT, sync);
        return () => window.removeEventListener(CART_UPDATED_EVENT, sync);
    }, []);

    function closeMenu() {
        setMenuOpen(false);
        setActiveCategory(null);
    }

    function toggleMenu() {
        if (menuOpen) {
            closeMenu();
        } else {
            setMenuOpen(true);
        }
    }

    const isDark = isScrolled || variant === "dark" || menuOpen;

    // All items to show in the 2-column grid
    const navExtras: CategoryNode[] = [
        { name: "Acerca de Nosotros", children: [] },
        { name: "Contacto", children: [] },
    ];
    const allItems = [...categories, ...navExtras];

    return (
        <header className="fixed top-0 left-0 w-full z-50">
            {/* Announcement Bar — hidden when menu open */}
            <div
                className={`bg-black text-white pt-2.5 pb-3.5 text-xs tracking-wide overflow-hidden min-h-10 flex items-center justify-center transition-all duration-300 ${
                    menuOpen ? "opacity-0 pointer-events-none h-0 min-h-0 py-0" : ""
                }`}
            >
                <div className="animate-marquee whitespace-nowrap flex gap-16">
                    <span>✨ Envío a todo Paraguay — Calidad Garantizada ✨</span>
                    <span>✨ 1 año de garantía en todas las semijoyas ✨</span>
                    <span>✨ Envío a todo Paraguay — Calidad Garantizada ✨</span>
                    <span>✨ 1 año de garantía en todas las semijoyas ✨</span>
                </div>
            </div>

            {/* Main Nav — always on top (z-[45] within header stacking context) */}
            <nav
                className={`relative z-[45] transition-all duration-300 ${
                    isScrolled && !menuOpen
                        ? "bg-white/95 backdrop-blur-md shadow-sm"
                        : !menuOpen && variant === "dark"
                        ? "bg-white"
                        : "bg-transparent"
                }`}
            >
                <div className="max-w-[1440px] min-w-96 mx-auto px-8 md:px-20 py-7 flex items-center justify-between relative">
                    {/* Hamburger / Close */}
                    <button
                        onClick={toggleMenu}
                        className="w-8 h-8 flex items-center justify-center cursor-pointer relative"
                        aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
                    >
                        {menuOpen && activeCategory ? (
                            <span className="text-sm leading-none text-black">
                                ✕
                            </span>
                        ) : (
                            /* Hamburger → X animation */
                            <span className="flex flex-col gap-1.5 w-6">
                                <span className={`h-px w-full transition-all duration-300 ${isDark ? "bg-black" : "bg-white"} ${menuOpen ? "rotate-45 translate-y-[7px]" : ""}`} />
                                <span className={`h-px w-full transition-all duration-300 ${isDark ? "bg-black" : "bg-white"} ${menuOpen ? "opacity-0 scale-x-0" : ""}`} />
                                <span className={`h-px w-full transition-all duration-300 ${isDark ? "bg-black" : "bg-white"} ${menuOpen ? "-rotate-45 -translate-y-[7px]" : ""}`} />
                            </span>
                        )}
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
                        <button aria-label="Buscar">
                            <img
                                src="/images/lupa.svg"
                                alt="Buscar"
                                width={20}
                                height={20}
                                style={{ filter: isDark ? "none" : "brightness(0) invert(1)" }}
                            />
                        </button>

                        <button aria-label="Carrito" className="relative" onClick={() => setCartOpen(true)}>
                            <img
                                src="/images/carrinho.svg"
                                alt="Carrito"
                                width={20}
                                height={20}
                                style={{ filter: isDark ? "none" : "brightness(0) invert(1)" }}
                            />
                            <span
                                suppressHydrationWarning
                                className={`absolute -top-2 -right-2 text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                                    cartCount > 0
                                        ? "bg-[#35605a] text-white"
                                        : isDark
                                        ? "bg-gray-200 text-gray-500"
                                        : "bg-white text-black"
                                }`}
                            >
                                {cartCount}
                            </span>
                        </button>
                    </div>
                </div>
            </nav>

            {/* ── Menu overlay ── */}
            <AnimatePresence>
                {menuOpen && (
                    <motion.div
                        key="menu-overlay"
                        className="fixed inset-0 z-40 overflow-hidden bg-white"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        {/* Panel 1 content — exits left when subcategory opens */}
                        <motion.div
                            className="absolute inset-0 overflow-y-auto"
                            animate={{ x: activeCategory ? "-100%" : "0%" }}
                            transition={{ duration: 0.42, ease: [0.25, 0.46, 0.45, 0.94] }}
                        >
                            <div className="px-8 md:px-24 pt-36 pb-20">
                                <div className="grid grid-cols-2 gap-y-10 gap-x-8">
                                    {allItems.map((item) => {
                                        const href =
                                            item.name === "Acerca de Nosotros"
                                                ? "/nosotros"
                                                : item.name === "Contacto"
                                                ? "/contacto"
                                                : `/catalogo?category=${encodeURIComponent(item.name)}`;

                                        if (item.children.length > 0) {
                                            return (
                                                <button
                                                    key={item.name}
                                                    onClick={() => setActiveCategory(item)}
                                                    className="text-left text-[#1a1a1a] text-2xl md:text-[26px] font-light uppercase tracking-[0.08em] hover:opacity-50 transition-opacity"
                                                >
                                                    {item.name}
                                                </button>
                                            );
                                        }
                                        return (
                                            <Link
                                                key={item.name}
                                                href={href}
                                                onClick={closeMenu}
                                                className="text-[#1a1a1a] text-2xl md:text-[26px] font-light uppercase tracking-[0.08em] hover:opacity-50 transition-opacity"
                                            >
                                                {item.name}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        </motion.div>

                        {/* Panel 2 — 83% from right, slides over white bg strip */}
                        <AnimatePresence>
                            {activeCategory && (
                                <motion.div
                                    key={activeCategory.name}
                                    className="absolute top-0 right-0 h-full overflow-y-auto"
                                    style={{ width: "83%", backgroundColor: "#E8E2D9" }}
                                    initial={{ x: "100%" }}
                                    animate={{ x: 0 }}
                                    exit={{ x: "100%" }}
                                    transition={{ duration: 0.42, ease: [0.25, 0.46, 0.45, 0.94] }}
                                >
                                    <div className="px-8 md:px-16 pt-36 pb-20">
                                        <button
                                            onClick={() => setActiveCategory(null)}
                                            className="text-[#1a1a1a]/50 text-sm underline underline-offset-4 mb-12 block hover:text-[#1a1a1a] transition-colors"
                                        >
                                            Volver
                                        </button>

                                        <div className="flex flex-col gap-8">
                                            {activeCategory.children.map((child) => (
                                                <Link
                                                    key={child}
                                                    href={`/catalogo?category=${encodeURIComponent(child)}`}
                                                    onClick={closeMenu}
                                                    className="text-[#1a1a1a] text-2xl md:text-[26px] font-light uppercase tracking-[0.08em] hover:opacity-50 transition-opacity"
                                                >
                                                    {child}
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>

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
