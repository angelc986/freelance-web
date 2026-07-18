import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // En desarrollo, NEXT_PUBLIC_API_URL apunta a localhost
  // En produccion (Vercel), se sete en las env vars de Vercel
  // apuntando al backend en Railway

  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    // If env var is set, use it; otherwise use Railway production URL
    const backendBase = apiUrl
      ? apiUrl.replace("/api/v1", "")
      : "https://freelance-web-production-add4.up.railway.app";
    return [
      {
        source: "/api/:path*",
        destination: backendBase + "/api/:path*",
      },
      {
        source: "/uploads/:path*",
        destination: backendBase + "/uploads/:path*",
      },
      {
        source: "/docs",
        destination: backendBase + "/docs",
      },
      {
        source: "/openapi.json",
        destination: backendBase + "/openapi.json",
      },
    ];
  },

  async headers() {
    return [
      {
        // Service worker necesita headers correctos
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          {
            key: "Content-Type",
            value: "application/javascript",
          },
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
        ],
      },
      {
        // Manifest
        source: "/manifest.json",
        headers: [
          {
            key: "Content-Type",
            value: "application/manifest+json",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
