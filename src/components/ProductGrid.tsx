import ProductCard from "./ProductCard";
import CategoryBanner from "./CategoryBanner";
import { getRelatedProducts } from "@/app/actions";

const products = [
    { name: "Aro rodio blanco hilo de zirconias 7…", price: "₲ 156.000", image: "/images/products/product-1.svg" },
    { name: "Aro corazón fino con zirconias pink …", price: "₲ 165.000", image: "/images/products/product-2.svg" },
    { name: "Aro redondo g perla 7801", price: "₲ 165.000", image: "/images/products/product-3.svg" },
    { name: "Aro gota vazada M con zirconias 7781", price: "₲ 168.000", image: "/images/products/product-4.svg" },
    { name: "Argollita fina delicada RB 7777", price: "₲ 156.000", image: "/images/products/product-5.svg" },
    { name: "Argolla de click tachonada 7792", price: "₲ 185.000", image: "/images/products/product-6.svg" },
    { name: "Argolla orgánica con tapita RB 7776", price: "₲ 152.000", image: "/images/products/product-7.svg" },
    { name: "Aro gotita con punto de luz 7791", price: "₲ 157.000", image: "/images/products/product-8.svg" },
    { name: "Aro aercuff 4 corazóncitos 7797", price: "₲ 175.000", image: "/images/products/product-9.svg" },
    { name: "Aro triângulo vazado RB micro 7779", price: "₲ 165.000", image: "/images/products/product-10.svg" },
];

const categoryBanners = [
    { title: "Aros", subtitle: "Pequeños", image: "/images/categories/aros-pequenos.svg" },
    { title: "Aros", subtitle: "Medianos", image: "/images/categories/aros-medianos.svg" },
    { title: "Aros", subtitle: "Grandes", image: "/images/categories/aros-grandes.svg" },
];

export default async function ProductGrid() {
    const products = await getRelatedProducts(10);

    return (
        <section className="py-5">
            <div className="container-monarca flex flex-col gap-5">
                {/* Row 1: 4 products */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                    {products.slice(0, 4).map((p) => (
                        <ProductCard
                            key={p.id}
                            id={p.id}
                            name={p.name}
                            price={`₲ ${p.price?.toLocaleString("es-PY") || "0"}`}
                            image={p.images?.[0] || "/placeholder.svg"}
                        />
                    ))}
                </div>

                {/* Row 2: Category banner (2 cols) + 2 products */}
                <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-5">
                    <CategoryBanner {...categoryBanners[0]} />
                    {products.slice(4, 6).map((p) => (
                        <ProductCard
                            key={p.id}
                            id={p.id}
                            name={p.name}
                            price={`₲ ${p.price?.toLocaleString("es-PY") || "0"}`}
                            image={p.images?.[0] || "/placeholder.svg"}
                        />
                    ))}
                </div>

                {/* Row 3: 2 products + Category banner (2 cols) */}
                <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_2fr] gap-5">
                    {products.slice(6, 8).map((p) => (
                        <ProductCard
                            key={p.id}
                            id={p.id}
                            name={p.name}
                            price={`₲ ${p.price?.toLocaleString("es-PY") || "0"}`}
                            image={p.images?.[0] || "/placeholder.svg"}
                        />
                    ))}
                    <CategoryBanner {...categoryBanners[1]} />
                </div>

                {/* Row 4: Category banner (2 cols) + 2 products */}
                <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-5">
                    <CategoryBanner {...categoryBanners[2]} />
                    {products.slice(8, 10).map((p) => (
                        <ProductCard
                            key={p.id}
                            id={p.id}
                            name={p.name}
                            price={`₲ ${p.price?.toLocaleString("es-PY") || "0"}`}
                            image={p.images?.[0] || "/placeholder.svg"}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
