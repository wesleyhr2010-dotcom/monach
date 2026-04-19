"use client";

import { useState, useEffect } from "react";
import { addToCart, CART_UPDATED_EVENT } from "@/lib/cart";

interface AddToCartButtonProps {
    productId: string;
    name: string;
    price: number;
    image: string;
    sku?: string;
    variantLabel?: string;
    className?: string;
    label?: string;
}

export default function AddToCartButton({
    productId,
    name,
    price,
    image,
    sku,
    variantLabel,
    className,
    label = "Agregar a mi joyero",
}: AddToCartButtonProps) {
    const [added, setAdded] = useState(false);

    function handleAdd() {
        addToCart({ productId, name, price, image, sku, variantLabel });
        setAdded(true);
        setTimeout(() => setAdded(false), 1500);
    }

    return (
        <button
            onClick={handleAdd}
            className={
                className ||
                "w-full h-[50px] bg-[#35605a] hover:bg-[#2c514b] text-white flex items-center justify-center transition-all duration-300"
            }
        >
            <b className="font-inter text-[14.5px]">
                {added ? "✓ Agregado" : label}
            </b>
        </button>
    );
}
