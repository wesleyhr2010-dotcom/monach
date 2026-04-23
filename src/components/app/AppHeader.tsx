import Link from "next/link";
import { User } from "lucide-react";

interface Rank {
  nome: string;
  cor: string;
}

interface AppHeaderProps {
  name: string;
  avatarUrl?: string | null;
  rank: Rank;
  pontos: number;
  notificacoes?: number;
}

export function AppHeader({ name, avatarUrl, rank, pontos, notificacoes = 0 }: AppHeaderProps) {
  const firstName = name.split(" ")[0];

  return (
    <header className="flex items-center gap-3 px-5 pt-6 pb-4 sticky top-0 z-10 bg-[#F5F2EF]">
      {/* Avatar */}
      <div
        className="w-12 h-12 rounded-full bg-[#EBEBEB] flex items-center justify-center flex-shrink-0 overflow-hidden"
        style={{ border: "2px solid #35605A" }}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt={firstName} className="w-full h-full object-cover" />
        ) : (
          <User size={24} stroke="#1A1A1A" strokeWidth={1.5} />
        )}
      </div>

      {/* Name + Pontos */}
      <div className="flex flex-col flex-1 min-w-0">
        <span
          className="text-[16px] text-[#1A1A1A] leading-5"
          style={{ fontFamily: "var(--font-raleway)", fontWeight: 600 }}
        >
          Hola, {firstName}
        </span>
        <span
          className="text-[12px] text-[#777777] leading-4"
          style={{ fontFamily: "var(--font-raleway)", fontWeight: 500 }}
        >
          {pontos.toLocaleString("es-PY")} pts
        </span>
      </div>

      {/* Rank badge */}
      <div
        className="rounded-full px-[14px] py-[6px] flex-shrink-0"
        style={{ backgroundColor: rank.cor }}
      >
        <span
          className="text-white text-[12px] leading-4 tracking-[0.3px]"
          style={{ fontFamily: "var(--font-raleway)", fontWeight: 500 }}
        >
          {rank.nome}
        </span>
      </div>

      {/* Bell */}
      <Link
        href="/app/notificacoes"
        className="relative w-10 h-10 flex items-center justify-center flex-shrink-0 -mr-2"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {notificacoes > 0 && (
          <div
            className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] rounded-full bg-[#35605A] flex items-center justify-center px-1"
            style={{ border: "2px solid #F5F2EF" }}
          >
            <span
              className="text-white text-[10px] leading-3"
              style={{ fontFamily: "var(--font-raleway)", fontWeight: 700 }}
            >
              {notificacoes > 9 ? "9+" : notificacoes}
            </span>
          </div>
        )}
      </Link>
    </header>
  );
}
