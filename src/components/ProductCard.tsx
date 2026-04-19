import Image from "next/image";
import Link from "next/link";

interface ProductCardProps {
    id?: string;
    name: string;
    price: string;
    image: string;
}

export default function ProductCard({ id, name, price, image }: ProductCardProps) {
    return (
        <Link href={`/produto/${id || "#"}`} className="group cursor-pointer flex flex-col">
            <article>
                <div className="relative overflow-hidden bg-gray-100 aspect-[260/340]">
                    <Image
                        src={image}
                        alt={name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 50vw, 260px"
                    />
                </div>
                <div className="mt-1">
                    <h4 className="text-sm leading-5 text-darkslategray-200 truncate">
                        {name}
                    </h4>
                    <p className="text-sm font-medium leading-6 text-darkslategray-200">
                        {price}
                    </p>
                </div>
            </article>
        </Link>
    );
}
