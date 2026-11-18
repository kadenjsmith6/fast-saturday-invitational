import { matchStrokes, SEGMENT_HOLES, strokesByHole } from "./handicap";
import type { Course, HandicapRules, HoleOutcome, Match, MatchResults, Player, Side } from "./types";

export interface HoleResult {
  number: number;
  outcome: HoleOutcome;
  /** Running margin after this hole: positive = side A up. */
  margin: number;
}

export interface MatchState {
  /** Total strokes in the match, per player (individual formats) or side (team formats). */
  strokes: Record<string, number>;
  /** Strokes received on each hole, so players know where they get them. */
  holeStrokes: Record<string, Record<number, number>>;
  holes: HoleResult[];
  thru: number;
  holesInMatch: number;
  margin: number; // positive = A up
  final: boolean;
  result: Side | "halved" | null;
  /** e.g. "2 UP", "3 & 2", "All Square", "Halved" */
  label: string;
  /** Points earned once the match is final. */
  points: Record<Side, number>;
  /** Points each side would earn if the match ended now. */
  projected: Record<Side, number>;
  missing: string[];
}

function award(match: Match, result: Side | "halved" | null): Record<Side, number> {
  if (result === "A") return { A: match.points, B: 0 };
  if (result === "B") return { A: 0, B: match.points };
  if (result === "halved") return { A: match.points / 2, B: match.points / 2 };
  return { A: 0, B: 0 };
}

export function computeMatch(
  match: Match,
  course: Course,
  players: Record<string, Player>,
  rules: HandicapRules,
  results: MatchResults,
): MatchState {
  const { strokes, missing } = matchStrokes(match, players, rules);
  const holeStrokes = Object.fromEntries(
    Object.entries(strokes).map(([unit, s]) => [unit, strokesByHole(s, course, match.segment)]),
  );
  const order = SEGMENT_HOLES[match.segment];
  const holes: HoleResult[] = [];
  let margin = 0;
  let closedOut = false;

  for (let i = 0; i < order.length; i++) {
    const outcome = results[order[i]];
    if (!outcome) break; // stop at the first hole without a result
    margin += outcome === "A" ? 1 : outcome === "B" ? -1 : 0;
    holes.push({ number: order[i], outcome, margin });
    if (Math.abs(margin) > order.length - (i + 1)) {
      closedOut = true;
      break;
    }
  }

  const thru = holes.length;
  const remaining = order.length - thru;
  const final = closedOut || thru === order.length;
  const leader: Side | null = margin > 0 ? "A" : margin < 0 ? "B" : null;
  const result: MatchState["result"] = final ? (leader ?? "halved") : null;
  const up = Math.abs(margin);

  let label: string;
  if (thru === 0) label = "Not started";
  else if (final && result === "halved") label = "Halved";
  else if (final && remaining > 0) label = `${up} & ${remaining}`;
  else if (final) label = `${up} UP`;
  else if (up === 0) label = "All Square";
  else if (up === remaining) label = `${up} UP (dormie)`;
  else label = `${up} UP`;

  return {
    strokes,
    holeStrokes,
    holes,
    thru,
    holesInMatch: order.length,
    margin,
    final,
    result,
    label,
    points: award(match, result),
    projected: thru === 0 ? { A: 0, B: 0 } : award(match, leader ?? "halved"),
    missing,
  };
}
