import ProductCard from "./ProductCard";
import type { VitrinaItem } from "@/lib/vitrina";

interface ProductGridProps {
  items: VitrinaItem[];
  slug: string;
}

export default function ProductGrid({ items, slug }: ProductGridProps) {
  return (
    <div>
      <p className="text-[13px] text-gray-400 mb-6">
        {items.length} {items.length === 1 ? "artículo" : "artículos"}
      </p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
        {items.map((item) => (
          <ProductCard
            key={item.variantId}
            variantId={item.variantId}
            name={item.name}
            price={item.price}
            image={item.image}
            slug={slug}
          />
        ))}
      </div>
    </div>
  );
}
