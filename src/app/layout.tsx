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
  themeColor: "#F5F2EF",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning style={{ overscrollBehavior: "none", overflow: "hidden", height: "100%" }}>
      <body className="antialiased" style={{ backgroundColor: "#F5F2EF", overscrollBehavior: "none", overflow: "hidden", height: "100%" }}>
        {children}
      </body>
    </html>
  );
}
