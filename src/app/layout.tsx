import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import Nav, { NavBar } from "@/components/Nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Fast Saturday Invitational",
  description: "The 7th Annual Fast Saturday Invitational — live pairings, scores and standings.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#123524",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&family=Inter:wght@400;500;600;700&display=swap"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <Suspense fallback={<NavBar path={null} />}>
          <Nav />
        </Suspense>
        <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-6">{children}</main>
        <footer className="text-center text-xs text-muted py-6">
          The Fast Saturday Invitational · 7th Annual · 2027
        </footer>
      </body>
    </html>
  );
}
