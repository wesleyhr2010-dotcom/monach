import Image from "next/image";
import Link from "next/link";

export default function HistoryCTA() {
    return (
        <section className="relative w-full h-[600px] md:h-[900px] flex flex-col items-center justify-end pb-16 md:pb-24 overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="/images/jooh-monarca-1025x1536.jpg"
                    alt="Conoce nuestra historia - Monarca Semijoyas"
                    fill
                    className="object-cover object-[center_20%]"
                    sizes="100vw"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-transparent" />
            </div>

            {/* Content */}
            <div className="container-monarca relative z-10 text-center text-white flex flex-col items-center gap-5">
                <p
                    className="text-xl md:text-2xl tracking-[19px] uppercase text-gold leading-9"
                    style={{ textShadow: "0px 0px 10px #000" }}
                >
                    Conoce
                </p>
                <h2
                    className="font-tt-ramillas text-2xl md:text-4xl tracking-[3px] uppercase font-light text-center leading-tight"
                    style={{ textShadow: "0px 0px 10px #000" }}
                >
                    Nuestra Historia
                </h2>
                <Link
                    href="/nosotros"
                    className="group inline-flex flex-col items-start text-left"
                >
                    <span className="font-bold text-base leading-7" style={{ textShadow: "0px 4px 8px #000" }}>
                        Explorar
                    </span>
                    <span className="w-full h-px bg-white group-hover:bg-gold transition-colors duration-300" />
                </Link>
            </div>
        </section>
    );
}
