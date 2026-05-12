import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

// ---------------------------------------------------------------------------
// Security headers aplicados em todas as rotas.
// Atualizar esta lista ao adicionar novos serviços externos.
// Última revisão: 2026-05-11
// ---------------------------------------------------------------------------
const isDev = process.env.NODE_ENV === "development";
const supabaseHost = "amlwwakxpungeqpiyxwr.supabase.co";
const cdnHosts = [
  "cdn.monarcasemijoyas.com.py",
  "images.monarcasemijoyas.com.py",
  "pub-933b2a69d9e34d719dd55ee2dcfa0a35.r2.dev",
].join(" ");

// Em dev: 'unsafe-eval' necessário para React hot-reload e reconstrução de callstacks.
// Em produção: removido — React nunca usa eval() fora do modo dev.
const scriptSrc = isDev
  ? `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.onesignal.com https://onesignal.com`
  : `script-src 'self' 'unsafe-inline' https://cdn.onesignal.com https://onesignal.com`;

const securityHeaders = [
  // Impede clickjacking — página não pode ser embedded em iframe de outros domínios
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  // Impede MIME-type sniffing
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  // Força HTTPS por 2 anos, incluindo subdomínios
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Envia apenas origem (sem path/query) em requisições cross-origin
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  // Desabilita APIs de hardware desnecessárias
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  // Content-Security-Policy principal
  // 'unsafe-inline' em style-src é necessário para Tailwind/Next.js inline styles
  // 'unsafe-eval' em script-src: apenas em dev (React hot-reload). Em prod: bloqueado.
  {
    key: "Content-Security-Policy",
    value: [
      `default-src 'self'`,
      scriptSrc,
      // Estilos: self + inline (Next.js/Tailwind) + Google Fonts
      `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
      // Fontes: self + Google Fonts
      `font-src 'self' https://fonts.gstatic.com`,
      // Imagens: self + CDN R2 + Supabase storage + data URIs (canvas/blob preview)
      `img-src 'self' data: blob: ${cdnHosts} https://${supabaseHost}`,
      // Fetch/XHR: self + Supabase (auth + storage) + Sentry
      `connect-src 'self' https://${supabaseHost} wss://${supabaseHost} https://*.sentry.io https://onesignal.com`,
      // Workers: self + blob (Service Worker do PWA)
      `worker-src 'self' blob:`,
      // Frames: apenas self (admin embeds nada externo)
      `frame-src 'self'`,
      // Manifests PWA
      `manifest-src 'self'`,
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  turbopack: {},
  async headers() {
    return [
      {
        // Aplicar em todas as rotas
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.monarcasemijoyas.com.py",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.monarcasemijoyas.com.py",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "pub-933b2a69d9e34d719dd55ee2dcfa0a35.r2.dev",
        pathname: "/**",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG || "monarca",
  project: process.env.SENTRY_PROJECT || "next-monarca",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
  disableLogger: true,
  automaticVercelMonitors: true,
});
