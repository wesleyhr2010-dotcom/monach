import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "Monarca Semijoias — Revendedora",
        short_name: "Monarca",
        description:
            "Painel da Revendedora Monarca Semijoias. Acompanhe suas maletas, comissões e gamificação.",
        start_url: "/app",
        display: "standalone",
        background_color: "#F5F2EF",
        theme_color: "#F5F2EF",
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
