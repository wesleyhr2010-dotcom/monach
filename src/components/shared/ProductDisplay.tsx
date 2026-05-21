import Image from "next/image";
import Link from "next/link";
import { formatGs } from "@/lib/format";

export interface ProductDisplayData {
  id: string;
  name: string;
  price: number | null;
  description?: string;
  short_description?: string;
  images: string[];
  sku?: string | null;
}

interface ProductDisplayProps {
  product: ProductDisplayData;
  actionButton: React.ReactNode;
  backLink?: { href: string; label: string };
  relatedProducts?: ProductDisplayData[];
  relatedTitle?: string;
}

export default function ProductDisplay({
  product,
  actionButton,
  backLink,
  relatedProducts,
  relatedTitle = "PRODUCTOS PARA EXPLORAR",
}: ProductDisplayProps) {
  const mainImage = product.images?.[0] || "/placeholder.svg";
  const displayDescription = product.short_description || product.description;

  return (
    <div className="bg-white min-h-screen flex flex-col">
      <main className="flex-1">
        {/* Back link */}
        {backLink && (
          <div className="max-w-[1440px] mx-auto w-full px-6 md:px-12 lg:px-20 pt-6">
            <Link
              href={backLink.href}
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-800"
            >
              ← {backLink.label}
            </Link>
          </div>
        )}

        {/* Product Detail Section */}
        <div className="max-w-[1440px] mx-auto w-full flex flex-col md:flex-row items-start justify-center gap-8 md:gap-12 lg:gap-20 px-6 md:px-12 lg:px-20 py-10">
          {/* Image Column */}
          <div className="w-full md:w-1/2 flex justify-center">
            <div className="relative w-full aspect-[4/5] max-w-[630px] bg-gray-50 overflow-hidden">
              <Image
                src={mainImage}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            </div>
          </div>

          {/* Info Column */}
          <div className="w-full md:w-1/2 flex flex-col items-start gap-8 max-w-[550px] py-4">
            <div className="flex flex-col gap-2">
              <h1 className="text-[20px] md:text-[24px] text-darkslategray-200 leading-snug">
                {product.name}
              </h1>
              <p className="text-[20px] md:text-[24px] text-darkslategray-200 leading-relaxed font-semibold">
                {formatGs(product.price)}
              </p>
            </div>

            {/* Action Button */}
            {actionButton}

            {/* Description */}
            <div className="flex flex-col gap-4 w-full">
              <h2 className="text-[15.8px] font-inter uppercase text-darkslategray-200 tracking-wide border-b border-gray-200 pb-2">
                Descripción
              </h2>
              {displayDescription ? (
                <p className="text-[16px] text-black leading-[27.2px] whitespace-pre-wrap">
                  {displayDescription}
                </p>
              ) : (
                <p className="text-[16px] text-gray-500 italic">
                  Sin descripción disponible.
                </p>
              )}

              {/* SKU */}
              {product.sku && (
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                  <span className="text-[16px] text-black font-semibold">
                    SKU:
                  </span>
                  <span className="text-[16px] text-gray-600">
                    {product.sku}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts && relatedProducts.length > 0 && (
          <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-20 pb-20">
            <div className="flex flex-col items-center mb-10 text-center">
              <span className="text-[12px] uppercase text-gray-500 tracking-[0.2em] mb-2">
                MÁS
              </span>
              <h3 className="text-[28px] md:text-[34px] font-light text-darkslategray-200">
                {relatedTitle}
              </h3>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {relatedProducts.map((rp) => (
                <Link
                  key={rp.id}
                  href={`/produto/${rp.id}`}
                  className="group cursor-pointer flex flex-col"
                >
                  <article>
                    <div className="relative overflow-hidden bg-gray-100 aspect-[260/340]">
                      <Image
                        src={rp.images?.[0] || "/placeholder.svg"}
                        alt={rp.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 50vw, 260px"
                      />
                    </div>
                    <div className="mt-1">
                      <h4 className="text-sm leading-5 text-darkslategray-200 truncate">
                        {rp.name}
                      </h4>
                      <p className="text-sm font-medium leading-6 text-darkslategray-200">
                        {formatGs(rp.price)}
                      </p>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
