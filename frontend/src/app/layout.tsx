import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Providers from "@/components/Providers";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TurnoGO — Encuentra trabajo o contrata ayuda cerca de ti",
  description:
    "TurnoGO conecta trabajadores con negocios locales. Encuentra trabajo por horas o contrata ayuda confiable cerca de ti. Pagos seguros en USDT.",
  manifest: "/manifest.json",
  keywords: ["trabajo", "empleo", "turnos", "Venezuela", "USDT", "freelance", "trabajo por horas", "contratar ayuda"],
  authors: [{ name: "TurnoGO" }],
  appleWebApp: {
    capable: true,
    title: "TurnoGO",
    statusBarStyle: "default",
  },
  other: {
    "theme-color": "#2563EB",
  },
  openGraph: {
    title: "TurnoGO — Trabajo local, sin complicaciones",
    description:
      "Conectamos trabajadores con negocios en Venezuela. Rápido, seguro y sin papeleo.",
    type: "website",
    locale: "es_VE",
    siteName: "TurnoGO",
  },
  twitter: {
    card: "summary_large_image",
    title: "TurnoGO — Trabajo local, sin complicaciones",
    description: "Conectamos trabajadores con negocios en Venezuela. Rápido, seguro y sin papeleo.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} h-full`}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-512.svg" />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
