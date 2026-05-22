export default function ContactHero() {
    return (
        <section className="pt-32 md:pt-36 pb-16 md:pb-20 bg-white">
            <div className="container-monarca">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-start">
                    {/* Left: Text content */}
                    <div>
                        <p className="text-xs tracking-[0.2em] uppercase text-dark/50 mb-3">
                            Contáctanos
                        </p>
                        <h1 className="font-tt-ramillas text-3xl md:text-4xl uppercase font-bold text-dark leading-tight mb-6">
                            ¡Estamos aquí para vos!
                        </h1>
                        <p className="text-sm md:text-base leading-7 text-dark/70 mb-8">
                            En Monarca Semijoyas, creemos en el poder de los accesorios para
                            transformar y empoderar. Queremos escucharte, ya sea para aclarar
                            dudas, recibir sugerencias o conocer más acerca de nuestros
                            productos. Nuestro equipo está listo para ofrecerte una atención
                            individual y personalizada, con la misma calidad que encontrás en
                            nuestras piezas. Monarca Semijoyas - Santa Rita, Alto Paraná,
                            Paraguay.
                        </p>

                        {/* Contact info */}
                        <div className="flex flex-col gap-5">
                            <div className="flex items-center gap-3">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0 text-dark">
                                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                                    <circle cx="12" cy="9" r="2.5" />
                                </svg>
                                <span className="text-sm text-dark">
                                    Monarca Semijoyas Santa Rita, Alto Paraná, Paraguay.
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0 text-dark">
                                    <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.11-.21 11.36 11.36 0 003.54.89 1 1 0 011 1v3.5a1 1 0 01-1 1A17 17 0 013 5a1 1 0 011-1h3.5a1 1 0 011 1 11.36 11.36 0 00.89 3.54 1 1 0 01-.21 1.1l-2.56 2.15z" />
                                </svg>
                                <span className="text-sm text-dark">(986)336858</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0 text-dark">
                                    <rect x="2" y="4" width="20" height="16" rx="2" />
                                    <path d="M2 7l10 7 10-7" />
                                </svg>
                                <span className="text-sm text-dark">monarcasemijoyas@gmail.com</span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Google Maps */}
                    <div className="w-full h-[300px] md:h-[380px]">
                        <iframe
                            src="https://maps.google.com/maps?q=Monarca+Semijoyas+Santa+Rita+Paraguay&output=embed&hl=es&z=15"
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title="Localización de Monarca Semijoyas"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}
