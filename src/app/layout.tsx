import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Monarca Semijoias | Elegância com Qualidade",
  description:
    "Semijoias elegantes e versáteis para o seu dia a dia ou para um evento especial. Qualidade garantida com 1 ano de garantia.",
  keywords: ["semijoias", "joias", "brincos", "colares", "pulseiras", "anéis"],
  openGraph: {
    title: "Monarca Semijoias | Elegância com Qualidade",
    description:
      "Semijoias elegantes e versáteis para o seu dia a dia ou para um evento especial.",
    type: "website",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Monarca",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5F2EF" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1816" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="antialiased bg-app-bg">
        {children}
      </body>
    </html>
  );
}
