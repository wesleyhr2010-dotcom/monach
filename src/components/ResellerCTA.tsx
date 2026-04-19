import Image from "next/image";
import Link from "next/link";

export default function ResellerCTA() {
    return (
        <section className="relative w-full h-[500px] md:h-[700px] flex flex-col items-center justify-end overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="/images/reseller-bg.svg"
                    alt="Sé una revendedora autorizada de Monarca Semijoyas"
                    fill
                    className="object-cover"
                    sizes="100vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
            </div>

            {/* Content */}
            <div className="container-monarca relative z-10 text-center text-white pb-10 flex flex-col items-center gap-5">
                <p className="text-lg md:text-4xl tracking-[19px] uppercase text-gold leading-tight">
                    Sé una Revendedora
                </p>
                <h2 className="text-2xl md:text-3xl tracking-[3px] uppercase font-light">
                    Autorizada
                </h2>
                <Link
                    href="/revendedora"
                    className="group inline-flex flex-col items-start text-left"
                >
                    <span className="font-bold text-base leading-7" style={{ textShadow: "0px 4px 8px #000" }}>
                        Rellenar formulario
                    </span>
                    <span className="w-full h-px bg-white group-hover:bg-gold transition-colors duration-300" />
                </Link>
            </div>
        </section>
    );
}
