import Image from "next/image";
import Link from "next/link";

interface VitrinaHeaderProps {
  name: string;
  avatar_url: string;
  bio?: string;
  whatsapp: string;
}

export default function VitrinaHeader({ name, avatar_url, bio, whatsapp }: VitrinaHeaderProps) {
  const waLink = `https://wa.me/${whatsapp.replace(/\D/g, "")}`;

  return (
    <header className="bg-[#35605a] text-white py-12 px-6 md:px-12">
      <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center gap-6">
        {avatar_url ? (
          <Image
            src={avatar_url}
            alt={name}
            width={80}
            height={80}
            className="rounded-full object-cover w-20 h-20 border-2 border-white/30"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-white/15 flex items-center justify-center text-3xl">
            🦋
          </div>
        )}
        <div className="text-center md:text-left">
          <p className="text-[12px] uppercase tracking-[0.15em] opacity-70 mb-1">
            Vitrina de
          </p>
          <h1 className="text-[28px] md:text-[36px] font-light tracking-[0.02em]">
            {name}
          </h1>
          {bio && (
            <p className="text-[14px] opacity-80 mt-2 max-w-[500px]">{bio}</p>
          )}
          <a
            href={waLink}
            className="inline-block mt-4 px-4 py-2 bg-white/15 rounded-full text-sm hover:bg-white/25 transition"
          >
            Consultar por WhatsApp
          </a>
        </div>
        <div className="md:ml-auto">
          <Link
            href="/"
            className="text-[12px] uppercase tracking-[0.1em] opacity-60 hover:opacity-100 transition-opacity"
          >
            Monarca Semijoyas
          </Link>
        </div>
      </div>
    </header>
  );
}
