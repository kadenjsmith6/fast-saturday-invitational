"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, Status, strokeLabel } from "@/components/ui";
import { setHoleResult, useEventData } from "@/lib/data";
import { computeMatch, FORMAT_LABELS, isTeamFormat, SEGMENT_HOLES, type HoleOutcome, type Side } from "@/lib/scoring";

const first = (name?: string) => (name ?? "?").split(" ")[0];

export default function EnterMatch() {
  const { id } = useParams<{ id: string }>();
  const d = useEventData();
  const match = d.matches.find((m) => m.id === id);
  const course = match ? d.coursesById[match.courseId] : undefined;

  if (d.loading) return <Status loading />;
  if (!match || !course)
    return (
      <div className="space-y-3">
        <Status error={d.error} />
        <p>That match isn&apos;t set up (it may have been deleted).</p>
        <Link href="/scores" className="underline">
          Back to matches
        </Link>
      </div>
    );

  const state = computeMatch(match, course, d.playersById, d.rules, match.results ?? {});
  const team = isTeamFormat(match.format);
  const ids = (s: Side) => match.sides[s].playerIds;
  const short = (s: Side) => ids(s).map((pid) => first(d.playersById[pid]?.name)).join(" & ");
  const decidedAfter = state.final ? state.holes[state.holes.length - 1]?.number : undefined;
  const holes = SEGMENT_HOLES[match.segment].map((n) => course.holes.find((h) => h.number === n)!);

  const tap = (hole: number, outcome: HoleOutcome) => {
    const current = match.results?.[hole];
    setHoleResult(match.id, hole, current === outcome ? null : outcome);
  };

  const strokesOnHole = (n: number) => {
    const units = team ? (["A", "B"] as const) : [...ids("A"), ...ids("B")];
    return units
      .map((u) => ({ u, s: state.holeStrokes[u]?.[n] ?? 0 }))
      .filter((x) => x.s > 0)
      .map(({ u, s }) => `${team ? short(u as Side) : first(d.playersById[u]?.name)} ${strokeLabel(s)}`);
  };

  return (
    <div className="space-y-4 max-w-xl mx-auto">
      <Link href="/scores" className="text-sm text-muted">
        ← All matches
      </Link>
      <Card className="space-y-3">
        <div className="text-xs text-muted">
          {FORMAT_LABELS[match.format]} · {course.name} · {match.points} pt{match.points === 1 ? "" : "s"}
        </div>
        <div className="flex items-center gap-3">
          {(["A", "B"] as Side[]).map((s, i) => (
            <div key={s} className={`flex-1 ${i === 1 ? "text-right order-3" : ""}`}>
              <div className="text-[11px] uppercase tracking-wide text-muted">{d.teamsById[match.sides[s].teamId]?.name}</div>
              <div className="font-semibold">{ids(s).map((pid) => d.playersById[pid]?.name).join(" & ")}</div>
            </div>
          ))}
          <div className="order-2 text-center min-w-20">
            <div className="font-display text-2xl font-bold">{state.label}</div>
            {!state.final && state.thru > 0 && <div className="text-xs text-muted">thru {state.thru}</div>}
          </div>
        </div>
        <div className="text-sm bg-sand-2/60 rounded-lg px-3 py-2">
          <span className="font-semibold">Strokes: </span>
          {team
            ? (["A", "B"] as Side[]).map((s) => `${short(s)} ${strokeLabel(state.strokes[s])}`).join(" · ")
            : [...ids("A"), ...ids("B")]
                .map((pid) => `${first(d.playersById[pid]?.name)} ${strokeLabel(state.strokes[pid])}`)
                .join(" · ")}
          {state.missing.length > 0 && (
            <div className="text-loss text-xs mt-1">
              Missing course handicap for {state.missing.map((pid) => d.playersById[pid]?.name).join(", ")} — tell the
              commissioner.
            </div>
          )}
        </div>
      </Card>

      <Status error={d.error} pending={d.pending} />

      <div className="space-y-2">
        {holes.map((h) => {
          const o = match.results?.[h.number];
          const over = decidedAfter !== undefined && h.number > decidedAfter;
          const strokes = strokesOnHole(h.number);
          const btn = (outcome: HoleOutcome, label: string) => {
            const on = o === outcome;
            const color = outcome === "push" ? "bg-ink text-sand" : "bg-win text-white";
            return (
              <button
                onClick={() => tap(h.number, outcome)}
                className={`flex-1 rounded-lg py-3 text-sm font-semibold border transition-colors ${
                  on ? `${color} border-transparent` : "bg-white border-line active:bg-sand-2"
                }`}
              >
                {label}
              </button>
            );
          };
          return (
            <Card key={h.number} className={`p-3 ${over ? "opacity-40" : ""}`}>
              <div className="flex items-baseline justify-between mb-2">
                <div>
                  <span className="font-display text-xl font-bold">Hole {h.number}</span>
                  <span className="text-xs text-muted ml-2">
                    Par {h.par} · Hcp {h.hcp}
                  </span>
                </div>
                <div className="text-xs text-right">
                  {strokes.length ? (
                    <span className="text-pine font-semibold">Strokes: {strokes.join(", ")}</span>
                  ) : (
                    <span className="text-muted">No strokes</span>
                  )}
                </div>
              </div>
              {over ? (
                <div className="text-sm text-muted">Match decided</div>
              ) : (
                <div className="flex gap-2">
                  {btn("A", short("A"))}
                  {btn("push", "Push")}
                  {btn("B", short("B"))}
                </div>
              )}
            </Card>
          );
        })}
      </div>
      <p className="text-xs text-muted text-center">Tap a hole again to clear it.</p>
    </div>
  );
}
