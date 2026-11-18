"use client";

import Link from "next/link";
import { SEGMENT_HOLES, FORMAT_LABELS, type MatchState, type Player, type Side, type Team } from "@/lib/scoring";
import type { StoredMatch } from "@/lib/data";

const SEG: Record<StoredMatch["segment"], string> = { front: "Front 9", back: "Back 9", full: "18" };

export function sideNames(m: StoredMatch, s: Side, players: Record<string, Player>) {
  return m.sides[s].playerIds.map((id) => players[id]?.name ?? "?").join(" & ");
}

export default function MatchCard({
  match,
  state,
  players,
  teams,
  href,
}: {
  match: StoredMatch;
  state: MatchState;
  players: Record<string, Player>;
  teams: Record<string, Team>;
  href?: string;
}) {
  const leader: Side | null = state.margin > 0 ? "A" : state.margin < 0 ? "B" : null;
  const live = state.thru > 0 && !state.final;

  const side = (s: Side) => (
    <div className={`flex-1 min-w-0 ${s === "B" ? "text-right" : ""}`}>
      <div className="text-[11px] uppercase tracking-wide text-muted truncate">{teams[match.sides[s].teamId]?.name}</div>
      <div className={`font-semibold truncate ${leader === s ? (s === "A" ? "text-teal" : "text-loss") : ""}`}>{sideNames(match, s, players)}</div>
    </div>
  );

  const body = (
    <div className="bg-card border border-line rounded-xl p-3 space-y-2 hover:border-gold transition-colors">
      <div className="flex items-center justify-between text-xs text-muted">
        <span>
          {FORMAT_LABELS[match.format]} · {SEG[match.segment]} · {match.points} pt{match.points === 1 ? "" : "s"}
        </span>
        <span
          className={`px-2 py-0.5 rounded-full font-semibold ${
            state.final ? "bg-pine text-ink" : live ? "bg-gold/30 text-ink" : "bg-sand-2"
          }`}
        >
          {state.final ? "Final" : live ? `Thru ${state.thru}` : "Not started"}
        </span>
      </div>
      <div className="flex items-center gap-3">
        {side("A")}
        <div className="text-center shrink-0 min-w-20">
          <div className="font-display text-base">{state.thru === 0 ? "—" : state.label}</div>
          {leader && !state.final && <div className="text-[11px] text-muted">{leader === "A" ? "◀ leads" : "leads ▶"}</div>}
        </div>
        {side("B")}
      </div>
      <div className="flex gap-0.5">
        {SEGMENT_HOLES[match.segment].map((n) => {
          const o = match.results?.[n];
          return (
            <div
              key={n}
              title={`Hole ${n}`}
              className={`flex-1 h-2 rounded-sm ${
                o === "A" ? "bg-teal" : o === "B" ? "bg-loss" : o === "push" ? "bg-muted/50" : "bg-sand-2"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}
