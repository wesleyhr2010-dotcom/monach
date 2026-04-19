import Image from "next/image";

export default function HeroBanner() {
    return (
        <section className="relative w-full h-[500px] md:h-[630px] flex items-center overflow-hidden">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="/images/banner01.jpg"
                    alt="Monarca Semijoyas - Colección de semijoyas elegantes"
                    fill
                    className="object-cover"
                    priority
                    sizes="100vw"
                />
                {/* Top gradient — preto forte descendo até 50%, efeito do WordPress original */}
                <div className="absolute inset-0 bg-[linear-gradient(180deg,_#000,_rgba(0,0,0,0)_50%)] z-[1]" />
                {/* Left gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent z-[2]" />
            </div>

            {/* Content */}
            <div className="container-monarca relative z-10 text-white">
                <div className="max-w-md">
                    <p className="text-sm md:text-base tracking-[19px] uppercase mb-1 text-shadow">
                        Semijoyas
                    </p>
                    <h1 className="font-inter text-3xl md:text-4xl tracking-[4px] uppercase font-light leading-tight mb-5">
                        Esenciales
                    </h1>
                    <p className="text-base leading-7 max-w-[250px]" style={{ textShadow: "0px 4px 8px #000" }}>
                        Semijoyas elegantes y versátiles para tu día a día o para un evento especial las encontrás aquí
                    </p>
                </div>
            </div>

            {/* Dot indicator */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
                <div className="flex gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-white" />
                    <span className="w-2.5 h-2.5 rounded-full bg-white/40" />
                    <span className="w-2.5 h-2.5 rounded-full bg-white/40" />
                </div>
            </div>
        </section>
    );
}
