"use client";

import { useState } from "react";
import { addToVitrinaCart } from "@/lib/cart-vitrina";

interface VitrinaAddToCartButtonProps {
  variant: {
    id: string;
    product_id: string;
    price: number | null;
    image_url: string;
    product: {
      name: string;
      description: string;
      images: string[];
    };
  };
  resellerSlug: string;
}

export default function VitrinaAddToCartButton({
  variant,
  resellerSlug,
}: VitrinaAddToCartButtonProps) {
  const [added, setAdded] = useState(false);

  const imageSrc =
    variant.image_url || variant.product.images[0] || "/placeholder.svg";

  function handleAdd() {
    addToVitrinaCart(
      {
        product_variant_id: variant.id,
        product_id: variant.product_id,
        name: variant.product.name,
        price: variant.price ?? 0,
        image_url: imageSrc,
      },
      resellerSlug
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <button
      onClick={handleAdd}
      className="w-full h-[50px] bg-[#35605a] hover:bg-[#2c514b] text-white flex items-center justify-center transition-all duration-300"
    >
      <b className="font-inter text-[14.5px]">
        {added ? "✓ Agregado" : "Agregar al carrito"}
      </b>
    </button>
  );
}
