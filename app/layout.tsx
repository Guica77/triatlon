import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { MobileBottomNav } from "@/components/ui/mobile-bottom-nav";

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
  title: "Triatlon Pro",
  description: "Plataforma de entrenamiento de triatlón de alto rendimiento y telemetría universal",
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
        <div className="relative flex min-h-screen flex-col pb-16 sm:pb-0">
          <main className="flex-1 overflow-x-hidden">{children}</main>
          <MobileBottomNav />
        </div>
      </body>
    </html>
  );
}
