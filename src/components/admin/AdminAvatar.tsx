"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

type AdminAvatarProps = {
  src?: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeMap = { sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-12 h-12 text-base" };
const pxMap = { sm: 32, md: 40, lg: 48 };

export function AdminAvatar({ src, name, size = "md", className }: AdminAvatarProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={pxMap[size]}
        height={pxMap[size]}
        className={cn("rounded-full object-cover shrink-0", sizeMap[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center shrink-0 font-medium",
        sizeMap[size],
        className
      )}
      style={{ background: "var(--admin-border)", color: "var(--admin-text-muted)" }}
    >
      {initials}
    </div>
  );
}