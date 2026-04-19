const features = [
    {
        icon: "/images/validado.svg",
        title: "Elegancia con calidad",
        description: "Calidad garantizada. 1 año de garantía.",
    },
    {
        icon: "/images/sol.svg",
        title: "Hechas para vos",
        description: "Duraderas y antialérgicas, para tu día a día.",
    },
    {
        icon: "/images/maos.svg",
        title: "Atención que te mereces",
        description: "Atención única, pensada para vos.",
    },
];

export default function ValueProps() {
    return (
        <section className="py-10 md:py-14 bg-white">
            <div className="container-monarca">
                <div className="flex flex-col md:flex-row items-start justify-center gap-8 md:gap-5">
                    {features.map((feature, i) => (
                        <div
                            key={i}
                            className="flex items-start gap-3 flex-1 max-w-sm"
                        >
                            <div className="w-11 h-12 shrink-0 relative overflow-hidden flex items-center justify-center">
                                <img
                                    src={feature.icon}
                                    alt={feature.title}
                                    width={44}
                                    height={44}
                                    className="object-contain"
                                />
                            </div>
                            <div>
                                <h3 className="font-inter text-base md:text-lg uppercase leading-7 text-dark font-medium">
                                    {feature.title}
                                </h3>
                                <p className="text-xs md:text-sm leading-6 text-dark/70 -mt-0.5">
                                    {feature.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
