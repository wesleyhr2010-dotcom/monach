import Image from "next/image";

const ASPECT_RATIO = 300 / 76.65; // viewBox do logo-primary.svg

interface LogoImgProps {
    variant?: "black" | "white" | "auto";
    height?: number;
    className?: string;
}

export function LogoImg({ variant = "black", height = 36, className }: LogoImgProps) {
    const width = Math.round(height * ASPECT_RATIO);
    const filterClass =
        variant === "white" ? "brightness-0 invert" :
        variant === "auto"  ? "dark:brightness-0 dark:invert" :
        "";
    return (
        <Image
            src="/images/logo-primary.svg"
            alt="Monarca Semijoyas"
            width={width}
            height={height}
            className={[filterClass, className].filter(Boolean).join(" ")}
        />
    );
}
