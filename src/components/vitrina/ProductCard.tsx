import Image from "next/image";
import Link from "next/link";
import { formatGs } from "@/lib/format";

interface ProductCardProps {
  variantId: string;
  name: string;
  price: number | null;
  image: string;
  slug: string;
}

export default function ProductCard({ variantId, name, price, image, slug }: ProductCardProps) {
  return (
    <Link
      href={`/vitrina/${slug}/${variantId}`}
      className="group cursor-pointer flex flex-col"
    >
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
          {price && price > 0 && (
            <p className="text-sm font-medium leading-6 text-darkslategray-200">
              {formatGs(price)}
            </p>
          )}
        </div>
      </article>
    </Link>
  );
}
