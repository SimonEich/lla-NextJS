import type { Metadata, Viewport } from "next";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import "./globals.css";

export const metadata: Metadata = {
  title: "lla — Lerne Spanisch",
  description:
    "Karteikarten-App zum Spanischlernen mit Spaced Repetition. Funktioniert offline.",
  applicationName: "lla",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "lla",
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0F6E56",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className="h-full antialiased">
      <body className="min-h-dvh-safe flex flex-col bg-app-bg">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col bg-app-bg shadow-[0_0_40px_rgba(0,0,0,0.06)]">
          <OfflineIndicator />
          {children}
        </div>
      </body>
    </html>
  );
}
