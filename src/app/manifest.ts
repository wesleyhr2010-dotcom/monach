import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "Monarca Semijoias — Revendedora",
        short_name: "Monarca",
        description:
            "Painel da Revendedora Monarca Semijoias. Acompanhe suas maletas, comissões e gamificação.",
        start_url: "/app",
        display: "standalone",
        background_color: "#09090b",
        theme_color: "#d4af37",
        orientation: "portrait-primary",
        icons: [
            {
                src: "/icons/icon-192.png",
                sizes: "192x192",
                type: "image/png",
            },
            {
                src: "/icons/icon-512.png",
                sizes: "512x512",
                type: "image/png",
            },
            {
                src: "/icons/icon-512.png",
                sizes: "512x512",
                type: "image/png",
                purpose: "maskable",
            },
        ],
    };
}
