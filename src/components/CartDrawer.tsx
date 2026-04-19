"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
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

interface CartDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [total, setTotal] = useState(0);

    // Sync cart state
    function syncCart() {
        setItems(getCart());
        setTotal(getCartTotal());
    }

    useEffect(() => {
        syncCart();
        window.addEventListener(CART_UPDATED_EVENT, syncCart);
        return () => window.removeEventListener(CART_UPDATED_EVENT, syncCart);
    }, []);

    // Also sync when drawer opens
    useEffect(() => {
        if (isOpen) syncCart();
    }, [isOpen]);

    function handleCheckout() {
        if (items.length === 0) return;
        const ctx = getCartContext();
        const phone = ctx?.resellerWhatsapp || STORE_CONFIG.whatsapp;
        const message = buildOrderMessage(items, total, ctx?.resellerName);
        const url = buildWhatsAppUrl(phone, message);
        window.open(url, "_blank");
    }

    return (
        <>
            {/* Overlay */}
            <div
                className={`fixed inset-0 bg-black/40 z-[60] transition-opacity duration-300 ${isOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
                    }`}
                onClick={onClose}
            />

            {/* Drawer */}
            <div
                className={`fixed top-0 right-0 h-full w-full max-w-[420px] bg-white z-[70] shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"
                    }`}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                    <h2 className="text-[16px] font-inter uppercase tracking-wide text-darkslategray-200">
                        Mi Joyero ({items.length})
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-black transition-colors"
                        aria-label="Cerrar"
                    >
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <line x1="1" y1="1" x2="17" y2="17" />
                            <line x1="17" y1="1" x2="1" y2="17" />
                        </svg>
                    </button>
                </div>

                {/* Items */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1">
                                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                                <line x1="3" y1="6" x2="21" y2="6" />
                                <path d="M16 10a4 4 0 01-8 0" />
                            </svg>
                            <p className="text-gray-400 text-[14px]">Tu joyero está vacío</p>
                            <button
                                onClick={onClose}
                                className="text-[13px] text-[#35605a] underline underline-offset-4 hover:text-[#2c514b] transition-colors"
                            >
                                Seguir comprando
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {items.map((item) => (
                                <div
                                    key={`${item.productId}-${item.variantLabel || ""}`}
                                    className="flex gap-4 pb-4 border-b border-gray-50"
                                >
                                    {/* Thumbnail */}
                                    <div className="relative w-[72px] h-[90px] bg-gray-50 flex-shrink-0">
                                        <Image
                                            src={item.image || "/placeholder.svg"}
                                            alt={item.name}
                                            fill
                                            className="object-cover"
                                            sizes="72px"
                                        />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 flex flex-col justify-between min-w-0">
                                        <div>
                                            <p className="text-[13px] text-darkslategray-200 leading-snug truncate">
                                                {item.name}
                                            </p>
                                            {item.variantLabel && (
                                                <p className="text-[11px] text-gray-400 mt-0.5">
                                                    {item.variantLabel}
                                                </p>
                                            )}
                                            <p className="text-[14px] font-semibold text-darkslategray-200 mt-1">
                                                ₲ {item.price.toLocaleString("es-PY")}
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between mt-2">
                                            {/* Qty controls */}
                                            <div className="flex items-center border border-gray-200">
                                                <button
                                                    onClick={() =>
                                                        updateQuantity(
                                                            item.productId,
                                                            item.quantity - 1,
                                                            item.variantLabel
                                                        )
                                                    }
                                                    className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-black transition-colors text-[14px]"
                                                >
                                                    −
                                                </button>
                                                <span className="w-8 text-center text-[13px]">
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    onClick={() =>
                                                        updateQuantity(
                                                            item.productId,
                                                            item.quantity + 1,
                                                            item.variantLabel
                                                        )
                                                    }
                                                    className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-black transition-colors text-[14px]"
                                                >
                                                    +
                                                </button>
                                            </div>

                                            {/* Remove */}
                                            <button
                                                onClick={() =>
                                                    removeFromCart(item.productId, item.variantLabel)
                                                }
                                                className="text-[11px] text-gray-400 underline hover:text-red-500 transition-colors"
                                            >
                                                Eliminar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {items.length > 0 && (
                    <div className="border-t border-gray-100 px-6 py-5 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[14px] text-gray-500 uppercase tracking-wide">
                                Subtotal
                            </span>
                            <span className="text-[18px] font-semibold text-darkslategray-200">
                                ₲ {total.toLocaleString("es-PY")}
                            </span>
                        </div>

                        <button
                            onClick={handleCheckout}
                            className="w-full h-[50px] bg-[#25D366] hover:bg-[#20bd5a] text-white flex items-center justify-center gap-2 transition-colors"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                            <b className="font-inter text-[14.5px]">Finalizar por WhatsApp</b>
                        </button>

                        <Link
                            href="/carrinho"
                            onClick={onClose}
                            className="w-full h-[44px] border border-gray-300 text-darkslategray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                        >
                            <span className="font-inter text-[13px]">Ver carrito completo</span>
                        </Link>
                    </div>
                )}
            </div>
        </>
    );
}
