"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/scores", label: "Scores" },
];

export default function Nav() {
  return <NavBar path={usePathname()} />;
}

/** Static version used while the current page is loading. */
export function NavBar({ path }: { path: string | null }) {
  return (
    <header className="bg-card border-b-2 border-gold shadow-[0_6px_24px_rgb(0_0_0/0.45)]">
      <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2.5 shrink-0" aria-label="Fast Saturday Invitational home">
          <Image src="/logo-sm.png" alt="" width={48} height={45} priority />
          <span className="hidden sm:block font-display text-gold text-lg leading-none">Fast Saturday</span>
        </Link>
        <nav className="flex gap-1 text-[15px] overflow-x-auto">
          {LINKS.map((l) => {
            const active = path !== null && (l.href === "/" ? path === "/" : path.startsWith(l.href));
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`px-3 py-1.5 rounded-md whitespace-nowrap font-semibold ${
                  active ? "bg-gold text-card" : "text-ink/85 hover:text-gold"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
