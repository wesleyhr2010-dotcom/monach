import Link from "next/link";
import Image from "next/image";
import { LogoImg } from "@/components/LogoImg";

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
                                href="https://www.instagram.com/monarcasemijoyas/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:opacity-80 transition-opacity"
                                aria-label="Instagram"
                            >
                                <Image 
                                    src="/images/logo-insta.svg" 
                                    alt="Instagram" 
                                    width={32} 
                                    height={32} 
                                    className="brightness-0 invert"
                                />
                            </a>
                            <a
                                href="https://wa.me/595986336858"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:opacity-80 transition-opacity"
                                aria-label="WhatsApp"
                            >
                                <Image 
                                    src="/images/logo-whats.svg" 
                                    alt="WhatsApp" 
                                    width={32} 
                                    height={32} 
                                    className="brightness-0 invert"
                                />
                            </a>
                        </div>
                    </div>

                    {/* Logo & Copyright */}
                    <div>
                        <LogoImg variant="white" height={46} className="mb-4" />
                        <p className="text-base leading-7 text-white/80 max-w-xs">
                            © 2024 Monarca Semijoyas Santa Rita, Alto Paraná, Paraguay.
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
