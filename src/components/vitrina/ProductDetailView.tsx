"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { addToVitrinaCart } from "@/lib/cart-vitrina";
import { formatGs } from "@/lib/format";

interface ProductDetailViewProps {
  variant: {
    id: string;
    product_id: string;
    price: import("@/generated/prisma/client").Prisma.Decimal | null;
    image_url: string;
    product: {
      name: string;
      description: string;
      images: string[];
    };
  };
  resellerSlug: string;
  resellerWhatsapp: string;
  resellerName: string;
  resellerId: string;
}

export default function ProductDetailView({
  variant,
  resellerSlug,
}: ProductDetailViewProps) {
  const [added, setAdded] = useState(false);

  const imageSrc =
    variant.image_url ||
    variant.product.images[0] ||
    "/placeholder.svg";

  const handleAdd = () => {
    addToVitrinaCart(
      {
        product_variant_id: variant.id,
        product_id: variant.product_id,
        name: variant.product.name,
        price: Number(variant.price) || 0,
        image_url: imageSrc,
      },
      resellerSlug
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="bg-white min-h-screen flex flex-col">
      <main className="flex-1 max-w-[1200px] mx-auto w-full px-6 md:px-12 py-6">
        <Link
          href={`/vitrina/${resellerSlug}`}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-800 mb-4"
        >
          ← Volver
        </Link>

        <div className="relative aspect-square bg-gray-100 overflow-hidden rounded-lg max-w-md mx-auto">
          <Image
            src={imageSrc}
            alt={variant.product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 600px"
            priority
          />
        </div>

        <h1 className="text-2xl font-semibold mt-4">{variant.product.name}</h1>

        {variant.price && Number(variant.price) > 0 && (
          <p className="text-xl text-[#35605a] font-medium mt-2">
            {formatGs(Number(variant.price))}
          </p>
        )}

        <p className="text-gray-600 mt-4 whitespace-pre-wrap">
          {variant.product.description}
        </p>

        <button
          onClick={handleAdd}
          className="w-full mt-6 py-3 bg-[#35605a] text-white rounded-lg font-medium hover:bg-[#2a4d47] transition active:scale-95"
        >
          {added ? "¡Agregado!" : "📦 Agregar al carrito"}
        </button>
      </main>
    </div>
  );
}
