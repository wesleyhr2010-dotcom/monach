import Link from "next/link";

export default function Footer() {
    return (
        <footer className="bg-black text-white pt-16 md:pt-20 pb-5">
            <div className="container-monarca">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-5 pb-9">
                    {/* Links */}
                    <div>
                        <h4 className="font-inter text-lg uppercase leading-7 mb-2">
                            Enlaces:
                        </h4>
                        <nav className="flex flex-col gap-0.5">
                            <Link href="/" className="text-sm leading-7 hover:text-gold transition-colors">
                                Tienda
                            </Link>
                            <Link href="/nosotros" className="text-sm leading-7 hover:text-gold transition-colors">
                                Acerca de nosotros
                            </Link>
                            <Link href="/contacto" className="text-sm leading-7 hover:text-gold transition-colors">
                                Contacto
                            </Link>
                        </nav>
                    </div>

                    {/* Social */}
                    <div>
                        <h4 className="font-inter text-lg uppercase leading-7 mb-2">
                            Redes sociales:
                        </h4>
                        <div className="flex gap-5">
                            <a
                                href="https://instagram.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-gold transition-colors"
                                aria-label="Instagram"
                            >
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                                    <circle cx="12" cy="12" r="5" />
                                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                                </svg>
                            </a>
                            <a
                                href="https://facebook.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-gold transition-colors"
                                aria-label="Facebook"
                            >
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                                </svg>
                            </a>
                        </div>
                    </div>

                    {/* Logo & Copyright */}
                    <div>
                        <span className="font-inter text-2xl tracking-[8px] uppercase font-light block mb-2">
                            MONARCA
                        </span>
                        <p className="text-base leading-7 text-white/80 max-w-xs">
                            © 2024 Monarca Semijoyas Santa Rita, Alto Paraná, Paraguay.
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
