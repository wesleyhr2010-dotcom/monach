import Link from "next/link";

interface SectionHeaderProps {
  title: string;
  href?: string;
  linkText?: string;
}

export function SectionHeader({ title, href, linkText = "Ver más" }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2
        className="text-[20px] text-[#1A1A1A] leading-6 m-0"
        style={{ fontFamily: "var(--font-playfair)", fontWeight: 600 }}
      >
        {title}
      </h2>
      {href && (
        <Link
          href={href}
          className="text-[13px] leading-4 text-[#917961] hover:opacity-75 transition-opacity"
          style={{ fontFamily: "var(--font-raleway)" }}
        >
          {linkText}
        </Link>
      )}
    </div>
  );
}
