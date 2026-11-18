import type { Course, HandicapRules, Hole, Match, Player, Segment } from "./types";

export const SEGMENT_HOLES: Record<Segment, number[]> = {
  front: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  back: [10, 11, 12, 13, 14, 15, 16, 17, 18],
  full: Array.from({ length: 18 }, (_, i) => i + 1),
};

export function isTeamFormat(format: Match["format"]): boolean {
  return format === "altShot" || format === "scramble";
}

function roundStrokes(value: number, rules: HandicapRules): number {
  const v = rules.rounding === "half" ? Math.round(value * 2) / 2 : Math.round(value);
  return Math.max(0, v);
}

export interface StrokeResult {
  /** Strokes received in this match, keyed by player id (individual formats) or side (team formats). */
  strokes: Record<string, number>;
  /** Players with no course handicap set for this course. */
  missing: string[];
}

/**
 * Strokes each player (or side) gets in a match, played off the low man.
 * Nine-hole matches get half the 18-hole allowance.
 */
export function matchStrokes(
  match: Match,
  players: Record<string, Player>,
  rules: HandicapRules,
): StrokeResult {
  const missing: string[] = [];
  const ch = (id: string): number => {
    const v = players[id]?.courseHandicaps?.[match.courseId];
    if (v === undefined || v === null) {
      missing.push(id);
      return 0;
    }
    return v;
  };
  const seg = match.segment === "full" ? 1 : 0.5;
  const allIds = [...match.sides.A.playerIds, ...match.sides.B.playerIds];

  if (!isTeamFormat(match.format)) {
    const pct =
      match.format === "singles"
        ? rules.singlesPct
        : match.format === "bestBall"
          ? rules.bestBallPct
          : rules.shamblePct;
    const playing = Object.fromEntries(allIds.map((id) => [id, ch(id) * pct]));
    const low = Math.min(...Object.values(playing));
    const strokes = Object.fromEntries(
      allIds.map((id) => [id, roundStrokes((playing[id] - low) * seg, rules)]),
    );
    return { strokes, missing };
  }

  const teamHandicap = (ids: string[]): number => {
    const hs = ids.map(ch).sort((a, b) => a - b);
    if (match.format === "altShot") return hs.reduce((s, h) => s + h, 0);
    const weights = rules.scrambleWeights[hs.length] ?? hs.map(() => 1 / hs.length / 2);
    return hs.reduce((s, h, i) => s + h * (weights[i] ?? 0), 0);
  };
  const a = teamHandicap(match.sides.A.playerIds);
  const b = teamHandicap(match.sides.B.playerIds);
  const pct = match.format === "altShot" ? rules.altShotPct : 1;
  const diff = Math.abs(a - b) * pct * seg;
  return {
    strokes: {
      A: a > b ? roundStrokes(diff, rules) : 0,
      B: b > a ? roundStrokes(diff, rules) : 0,
    },
    missing,
  };
}

/**
 * Spread a stroke allowance over the holes of a segment, hardest hole first.
 * A leftover half stroke goes on the next hardest hole.
 */
export function strokesByHole(total: number, course: Course, segment: Segment): Record<number, number> {
  const holes: Hole[] = course.holes
    .filter((h) => SEGMENT_HOLES[segment].includes(h.number))
    .sort((x, y) => x.hcp - y.hcp);
  const out: Record<number, number> = Object.fromEntries(holes.map((h) => [h.number, 0]));
  if (holes.length === 0 || total <= 0) return out;
  let remaining = total;
  let i = 0;
  while (remaining > 0) {
    const give = remaining >= 1 ? 1 : remaining;
    out[holes[i % holes.length].number] += give;
    remaining -= give;
    i++;
  }
  return out;
}
