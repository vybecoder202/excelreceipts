import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";

import { PwaRegister } from "@/components/pwa-register";

import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  applicationName: "Construction Manager",
  title: {
    default: "Construction Manager — Home construction management",
    template: "%s — Construction Manager",
  },
  description: "Private, auditable management for a residential construction project.",
  manifest: "/manifest.webmanifest",
  icons: [{ rel: "icon", url: "/icon.svg", type: "image/svg+xml" }],
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Construction Manager",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#163d7a",
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={jakarta.variable}>
      <body className="font-sans antialiased">
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
