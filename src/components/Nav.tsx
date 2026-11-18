"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/scores", label: "Scores" },
  { href: "/admin", label: "Admin" },
];

export default function Nav() {
  return <NavBar path={usePathname()} />;
}

/** Static version used while the current page is loading. */
export function NavBar({ path }: { path: string | null }) {
  return (
    <header className="bg-pine text-sand">
      <div className="max-w-5xl mx-auto px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <Link href="/" className="leading-tight">
          <span className="font-display text-lg font-bold block">Fast Saturday</span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-gold">7th Annual Invitational</span>
        </Link>
        <nav className="flex gap-1 text-sm overflow-x-auto -mx-1">
          {LINKS.map((l) => {
            const active = path !== null && (l.href === "/" ? path === "/" : path.startsWith(l.href));
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`px-3 py-1.5 rounded-full whitespace-nowrap ${
                  active ? "bg-gold text-pine font-semibold" : "hover:bg-pine-2"
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
