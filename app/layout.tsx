import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CookieBanner } from "@/components/ui/cookie-banner";
import { IosInstallPrompt } from "@/components/ui/ios-install-prompt";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#09090b",
};

export const metadata: Metadata = {
  metadataBase: new URL('https://triatlonpro.com'),
  title: "Triatlon Pro - Plataforma de Entrenamiento de Alto Rendimiento",
  description: "Plataforma de entrenamiento de triatlón de alto rendimiento y telemetría universal. Periodización avanzada basada en FTP, ritmos y fatiga real.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Triatlon Pro - Dashboard de Alto Rendimiento",
    description: "Plataforma de entrenamiento de triatlón de alto rendimiento y telemetría universal. Conecta Garmin y Strava.",
    url: "https://triatlonpro.com",
    siteName: "Triatlon Pro",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Triatlon Pro Dashboard de Alto Rendimiento",
      },
    ],
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Triatlon Pro - Entrenamiento Inteligente",
    description: "Plataforma de entrenamiento de triatlón de alto rendimiento y telemetría universal",
    images: ["/og-image.png"],
  },
  appleWebApp: {
    capable: true,
    title: "Triatlon Pro",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full bg-background text-foreground flex flex-col font-sans selection:bg-primary/30">
        {children}
        <CookieBanner />
        <IosInstallPrompt />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(reg) {
                    console.log('SW registered:', reg.scope);
                  }).catch(function(err) {
                    console.error('SW registration failed:', err);
                  });
                });
              }
            `
          }}
        />
      </body>
    </html>
  );
}
