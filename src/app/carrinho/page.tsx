"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
    getCart,
    getCartTotal,
    getCartContext,
    updateQuantity,
    removeFromCart,
    clearCart,
    buildOrderMessage,
    CART_UPDATED_EVENT,
    type CartItem,
} from "@/lib/cart";
import { STORE_CONFIG, buildWhatsAppUrl } from "@/lib/config";
import AnalyticsTracker from "@/components/AnalyticsTracker";

export default function CarrinhoPage() {
    const [items, setItems] = useState<CartItem[]>(() => getCart());
    const [total, setTotal] = useState(() => getCartTotal());

    useEffect(() => {
        const handleCartUpdated = () => {
            setItems(getCart());
            setTotal(getCartTotal());
        };

        window.addEventListener(CART_UPDATED_EVENT, handleCartUpdated);
        return () => window.removeEventListener(CART_UPDATED_EVENT, handleCartUpdated);
    }, []);

    function handleCheckout() {
        if (items.length === 0) return;
        const ctx = getCartContext();
        const phone = ctx?.resellerWhatsapp || STORE_CONFIG.whatsapp;
        const message = buildOrderMessage(items, total, ctx?.resellerName);
        const url = buildWhatsAppUrl(phone, message);
        window.open(url, "_blank");
    }

    return (
        <div className="bg-white min-h-screen flex flex-col font-montserrat">
            <Header variant="dark" />
            <AnalyticsTracker tipoEvento="carrinho" pageUrl="/carrinho" />

            <main className="flex-1 mt-[120px] max-w-[1440px] mx-auto w-full px-6 md:px-12 lg:px-20 py-10">
                <h1 className="text-[28px] md:text-[34px] font-light text-darkslategray-200 mb-10">
                    Mi Joyero
                </h1>

                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-6 text-center">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1">
                            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                            <line x1="3" y1="6" x2="21" y2="6" />
                            <path d="M16 10a4 4 0 01-8 0" />
                        </svg>
                        <p className="text-gray-400 text-[16px]">Tu joyero está vacío</p>
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 text-[14px] text-[#35605a] border border-[#35605a] px-6 py-3 hover:bg-[#35605a] hover:text-white transition-all"
                        >
                            ← Seguir comprando
                        </Link>
                    </div>
                ) : (
                    <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">
                        {/* Items Table */}
                        <div className="flex-1">
                            {/* Header row (desktop) */}
                            <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 pb-3 border-b border-gray-200 text-[12px] uppercase tracking-wide text-gray-400">
                                <span>Producto</span>
                                <span className="text-center">Precio</span>
                                <span className="text-center">Cantidad</span>
                                <span className="text-right">Subtotal</span>
                                <span className="w-8" />
                            </div>

                            {items.map((item) => (
                                <div
                                    key={`${item.productId}-${item.variantLabel || ""}`}
                                    className="grid grid-cols-[auto_1fr] md:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 items-center py-5 border-b border-gray-100"
                                >
                                    {/* Product */}
                                    <div className="flex gap-4 items-center col-span-2 md:col-span-1">
                                        <div className="relative w-[80px] h-[100px] bg-gray-50 flex-shrink-0">
                                            <Image
                                                src={item.image || "/placeholder.svg"}
                                                alt={item.name}
                                                fill
                                                className="object-cover"
                                                sizes="80px"
                                            />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[14px] text-darkslategray-200 leading-snug">
                                                {item.name}
                                            </p>
                                            {item.variantLabel && (
                                                <p className="text-[12px] text-gray-400 mt-0.5">
                                                    {item.variantLabel}
                                                </p>
                                            )}
                                            {item.sku && (
                                                <p className="text-[11px] text-gray-300 mt-0.5">
                                                    SKU: {item.sku}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Price */}
                                    <div className="hidden md:block text-center text-[14px] text-darkslategray-200">
                                        ₲ {item.price.toLocaleString("es-PY")}
                                    </div>

                                    {/* Quantity */}
                                    <div className="flex items-center justify-center">
                                        <div className="flex items-center border border-gray-200">
                                            <button
                                                onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variantLabel)}
                                                className="w-9 h-9 flex items-center justify-center text-gray-500 hover:text-black transition-colors"
                                            >
                                                −
                                            </button>
                                            <span className="w-10 text-center text-[14px]">
                                                {item.quantity}
                                            </span>
                                            <button
                                                onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variantLabel)}
                                                className="w-9 h-9 flex items-center justify-center text-gray-500 hover:text-black transition-colors"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>

                                    {/* Subtotal */}
                                    <div className="text-right text-[14px] font-semibold text-darkslategray-200">
                                        ₲ {(item.price * item.quantity).toLocaleString("es-PY")}
                                    </div>

                                    {/* Remove */}
                                    <button
                                        onClick={() => removeFromCart(item.productId, item.variantLabel)}
                                        className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-red-500 transition-colors"
                                        aria-label="Eliminar"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <line x1="2" y1="2" x2="14" y2="14" />
                                            <line x1="14" y1="2" x2="2" y2="14" />
                                        </svg>
                                    </button>
                                </div>
                            ))}

                            {/* Clear cart */}
                            <div className="flex justify-between items-center mt-6">
                                <Link
                                    href="/"
                                    className="text-[13px] text-[#35605a] underline underline-offset-4 hover:text-[#2c514b] transition-colors"
                                >
                                    ← Seguir comprando
                                </Link>
                                <button
                                    onClick={clearCart}
                                    className="text-[13px] text-gray-400 underline underline-offset-4 hover:text-red-500 transition-colors"
                                >
                                    Vaciar joyero
                                </button>
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div className="w-full lg:w-[380px] flex-shrink-0">
                            <div className="bg-gray-50 p-6 lg:p-8 sticky top-[140px]">
                                <h2 className="text-[14px] font-inter uppercase tracking-wide text-darkslategray-200 mb-6">
                                    Resumen del Pedido
                                </h2>

                                <div className="flex flex-col gap-3 mb-6 pb-6 border-b border-gray-200">
                                    {items.map((item) => (
                                        <div
                                            key={`sum-${item.productId}-${item.variantLabel || ""}`}
                                            className="flex justify-between text-[13px] text-gray-500"
                                        >
                                            <span className="truncate mr-4">
                                                {item.name} x{item.quantity}
                                            </span>
                                            <span className="flex-shrink-0">
                                                ₲ {(item.price * item.quantity).toLocaleString("es-PY")}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex items-center justify-between mb-6">
                                    <span className="text-[16px] font-semibold text-darkslategray-200">
                                        Total
                                    </span>
                                    <span className="text-[22px] font-bold text-darkslategray-200">
                                        ₲ {total.toLocaleString("es-PY")}
                                    </span>
                                </div>

                                <button
                                    onClick={handleCheckout}
                                    className="w-full h-[54px] bg-[#25D366] hover:bg-[#20bd5a] text-white flex items-center justify-center gap-2 transition-colors mb-3"
                                >
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                    </svg>
                                    <b className="font-inter text-[15px]">Finalizar por WhatsApp</b>
                                </button>

                                <p className="text-[11px] text-gray-400 text-center leading-relaxed">
                                    Al finalizar, serás redirigido/a a WhatsApp para confirmar tu pedido con nuestro equipo.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <div data-scroll-to="footerContainer">
                <Footer />
            </div>
        </div>
    );
}
