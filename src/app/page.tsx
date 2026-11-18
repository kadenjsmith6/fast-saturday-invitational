import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-pine text-sand px-6 py-14 sm:py-20 text-center relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 opacity-20"
          style={{ background: "radial-gradient(circle at 50% 120%, var(--gold), transparent 60%)" }}
        />
        <div className="relative space-y-3">
          <div className="text-xs uppercase tracking-[0.3em] text-gold">7th Annual · January 2027</div>
          <h1 className="font-display text-4xl sm:text-6xl font-bold leading-tight">
            The Fast Saturday
            <br />
            Invitational
          </h1>
          <p className="text-sand/80 max-w-md mx-auto">Seven years running. Same crew, new grudges.</p>
          <div className="flex justify-center gap-3 pt-4">
            <Link href="/leaderboard" className="px-5 py-2.5 rounded-full bg-gold text-pine font-semibold">
              Live Leaderboard
            </Link>
            <Link href="/scores" className="px-5 py-2.5 rounded-full border border-sand/40 font-semibold">
              Enter Scores
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
