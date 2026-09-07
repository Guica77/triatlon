import { AuthenticatedWelcomeProvider } from '@/components/brand/authenticated-welcome';
import type { Metadata, Viewport } from "next";
import { Inter, Barlow_Condensed, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { CookieBanner } from "@/components/ui/cookie-banner";
import { IosInstallPrompt } from "@/components/ui/ios-install-prompt";
import { ServiceWorkerRegister } from "@/components/ui/service-worker-register";
import { AppLifecycleManager } from "@/components/ui/app-lifecycle-manager";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

/* Timing-board display face — condensed, used for numerals + eyebrows */
const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800", "900"],
});

/* Tabular data readout — TSS, HR, splits, timestamps */
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0B1117",
};

export const metadata: Metadata = {
  metadataBase: new URL('https://triatlonpro.com'),
  title: "TriWaveX - Plataforma de Entrenamiento de Alto Rendimiento",
  description: "Plataforma de entrenamiento de triatlón de alto rendimiento y telemetría universal. Periodización avanzada basada en FTP, ritmos y fatiga real.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "TriWaveX - Dashboard de Alto Rendimiento",
    description: "Plataforma de entrenamiento de triatlón de alto rendimiento y telemetría universal. Conecta Garmin y Strava.",
    url: "https://triatlonpro.com",
    siteName: "TriWaveX",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "TriWaveX Dashboard de Alto Rendimiento",
      },
    ],
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TriWaveX - Entrenamiento Inteligente",
    description: "Plataforma de entrenamiento de triatlón de alto rendimiento y telemetría universal",
    images: ["/og-image.png"],
  },
  appleWebApp: {
    capable: true,
    title: "TriWaveX",
    statusBarStyle: "black-translucent",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      style={{ backgroundColor: "#0B1117" }}
      className={`${inter.variable} ${barlowCondensed.variable} ${jetbrainsMono.variable} h-full antialiased dark overflow-x-hidden`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-surface-app text-text-primary flex flex-col font-sans selection:bg-accent/30 overflow-x-hidden w-full" suppressHydrationWarning>
        <AuthenticatedWelcomeProvider>
        {children}
        <CookieBanner />
        <IosInstallPrompt />
        <ServiceWorkerRegister />
        <AppLifecycleManager />
        </AuthenticatedWelcomeProvider>
      </body>
    </html>
  );
}
