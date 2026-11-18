import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import Nav, { NavBar } from "@/components/Nav";
import "@fontsource/bungee/400.css";
import "@fontsource/vt323/400.css";
import "@fontsource/barlow/400.css";
import "@fontsource/barlow/500.css";
import "@fontsource/barlow/600.css";
import "@fontsource/barlow/700.css";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Fast Saturday Invitational",
  description: "The 7th Annual Fast Saturday Invitational in Laughlin, Nevada: live pairings, scores and standings.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1a0a0f",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Suspense fallback={<NavBar path={null} />}>
          <Nav />
        </Suspense>
        <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-6">{children}</main>
        <footer className="text-center text-sm text-muted py-8 space-y-1">
          <div>The 7th Annual Fast Saturday Invitational, Laughlin, Nevada</div>
          <Link href="/admin" className="underline underline-offset-2 hover:text-gold">
            Commissioner login
          </Link>
        </footer>
      </body>
    </html>
  );
}
