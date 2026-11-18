import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-10">
      <section className="marquee max-w-3xl mx-auto">
        <div className="relative rounded-xl bg-card/90 px-5 pt-8 pb-9 sm:px-10 sm:pt-10 text-center">
          <Image
            src="/logo.png"
            alt="Fast Saturday Invitational 2027"
            width={792}
            height={739}
            priority
            className="mx-auto w-64 sm:w-80 h-auto drop-shadow-[0_0_28px_rgb(255_231_163/0.3)]"
          />
          <p className="mt-6 font-display text-2xl sm:text-3xl text-ink">Laughlin, Nevada</p>
          <p className="mt-1 text-muted">The 7th annual, January 2027</p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
            <Link
              href="/leaderboard"
              className="px-6 py-3 rounded-lg bg-gold text-card font-bold text-lg hover:brightness-110"
            >
              Live leaderboard
            </Link>
            <Link
              href="/scores"
              className="px-6 py-3 rounded-lg border-2 border-gold text-gold font-bold text-lg hover:bg-gold/10"
            >
              Enter scores
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
