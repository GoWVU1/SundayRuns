import type { Metadata, Viewport } from "next";
import { Archivo, Bebas_Neue } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  weight: ["400", "500", "600", "700", "800"],
});

const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  variable: "--font-bebas",
  weight: "400",
});

export const metadata: Metadata = {
  title: "Sunday Runs",
  description: "Pickup basketball roster, RSVPs, and waitlist for the Sunday Runs crew.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Sunday Runs",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#041e42",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${archivo.variable} ${bebasNeue.variable}`}>
      <body className="h-dvh bg-navy font-sans antialiased">
        <div className="mx-auto flex h-dvh w-full max-w-[440px] flex-col overflow-hidden bg-cream md:my-6 md:h-[calc(100dvh-3rem)] md:rounded-[28px] md:shadow-2xl md:shadow-navy/30">
          {children}
        </div>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
