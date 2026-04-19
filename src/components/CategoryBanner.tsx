import Image from "next/image";

interface CategoryBannerProps {
    title: string;
    subtitle: string;
    image: string;
}

export default function CategoryBanner({ title, subtitle, image }: CategoryBannerProps) {
    return (
        <article className="relative overflow-hidden cursor-pointer group aspect-[546/383] w-full">
            <Image
                src={image}
                alt={`${title} ${subtitle}`}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 546px"
            />
            {/* Bottom gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            {/* Content */}
            <div className="absolute bottom-5 left-5 z-10 text-white">
                <h3 className="font-inter text-3xl md:text-4xl uppercase leading-10 font-light">
                    {title}
                </h3>
                <p className="text-base capitalize">
                    {subtitle}
                </p>
            </div>
        </article>
    );
}
