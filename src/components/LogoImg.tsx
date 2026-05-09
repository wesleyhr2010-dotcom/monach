import Image from "next/image";

const ASPECT_RATIO = 300 / 76.65; // viewBox do logo-primary.svg

interface LogoImgProps {
    variant?: "black" | "white";
    height?: number;
    className?: string;
}

export function LogoImg({ variant = "black", height = 36, className }: LogoImgProps) {
    const width = Math.round(height * ASPECT_RATIO);
    return (
        <Image
            src="/images/logo-primary.svg"
            alt="Monarca Semijoyas"
            width={width}
            height={height}
            className={[variant === "white" ? "brightness-0 invert" : "", className].filter(Boolean).join(" ")}
        />
    );
}
