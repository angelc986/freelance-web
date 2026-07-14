import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // En desarrollo, NEXT_PUBLIC_API_URL apunta a localhost
  // En produccion (Vercel), se sete en las env vars de Vercel
  // apuntando al backend en Railway

  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8003/api/v1";
    const backendBase = apiUrl.replace("/api/v1", "");
    return [
      {
        source: "/uploads/:path*",
        destination: backendBase + "/uploads/:path*",
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
